import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createFreeSubscription } from '@/lib/pricing/plans';
import type { AuthState, AuthUser, UserRole } from './types';
import { useEducationStore } from '@/lib/education';
import type { UserSubscription } from '@/lib/pricing/types';
import { ENABLE_AUTH } from '@/lib/env/features';

interface AuthActions {
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  getCurrentUser: () => AuthUser | null;
  updateSubscription: (subscription: UserSubscription) => void;
}

type AuthStore = AuthState & {
  users: AuthUser[];
} & AuthActions;

const STORAGE_KEY = 'metapet-auth';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return toHex(digest);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function setSessionModeForRole(role: UserRole): void {
  const setSessionMode = useEducationStore.getState().setSessionMode;
  if (role === 'student') {
    setSessionMode('student');
    return;
  }
  setSessionMode('teacher');
}

export const useAuthStore = create<AuthStore>()(
  (ENABLE_AUTH
    ? persist(
      (set, get) => ({
        users: [],
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,

        register: async (email, password, displayName, role) => {
          const normalizedEmail = normalizeEmail(email);
          if (!normalizedEmail || !password.trim() || !displayName.trim()) {
            return { ok: false, error: 'Email, password, and display name are required.' };
          }

          const existing = get().users.find((user) => user.email === normalizedEmail);
          if (existing) {
            return { ok: false, error: 'An account with this email already exists.' };
          }

          const now = Date.now();
          const newUser: AuthUser = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            displayName: displayName.trim().slice(0, 64),
            role,
            passwordHash: await hashPassword(password),
            subscription: createFreeSubscription(),
            createdAt: now,
            lastLoginAt: now,
          };

          set((state) => ({
            users: [...state.users, newUser],
            currentUser: newUser,
            isAuthenticated: true,
            isLoading: false,
          }));

          setSessionModeForRole(role);
          return { ok: true };
        },

        login: async (email, password) => {
          const normalizedEmail = normalizeEmail(email);
          const user = get().users.find((item) => item.email === normalizedEmail);
          if (!user) {
            return { ok: false, error: 'Invalid email or password.' };
          }

          const passwordHash = await hashPassword(password);
          if (passwordHash !== user.passwordHash) {
            return { ok: false, error: 'Invalid email or password.' };
          }

          const updatedUser: AuthUser = {
            ...user,
            lastLoginAt: Date.now(),
          };

          set((state) => ({
            users: state.users.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
            currentUser: updatedUser,
            isAuthenticated: true,
            isLoading: false,
          }));

          setSessionModeForRole(updatedUser.role);
          return { ok: true };
        },

        logout: () => set({
          currentUser: null,
          isAuthenticated: false,
        }),

        getCurrentUser: () => get().currentUser,

        updateSubscription: (subscription) => set((state) => {
          if (!state.currentUser) return state;

          const updatedCurrentUser = {
            ...state.currentUser,
            subscription,
          };

          return {
            currentUser: updatedCurrentUser,
            users: state.users.map((user) =>
              user.id === updatedCurrentUser.id
                ? updatedCurrentUser
                : user,
            ),
          };
        }),
      }),
      {
        name: STORAGE_KEY,
      },
    )
    : (set, get) => ({
      users: [],
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,

      register: async () => {
        return { ok: false, error: 'Account mode is disabled for this deployment.' };
      },

      login: async () => {
        return { ok: false, error: 'Account mode is disabled for this deployment.' };
      },

      logout: () => set({
        currentUser: null,
        isAuthenticated: false,
      }),

      getCurrentUser: () => get().currentUser,

      updateSubscription: (subscription) => set((state) => {
        if (!state.currentUser) return state;

        const updatedCurrentUser = {
          ...state.currentUser,
          subscription,
        };

        return {
          currentUser: updatedCurrentUser,
          users: state.users.map((user) =>
            user.id === updatedCurrentUser.id
              ? updatedCurrentUser
              : user
          ),
        };
      }),
    }))
);

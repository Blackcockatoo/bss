import type { UserSubscription } from '@/lib/pricing/types';

export type UserRole = 'teacher' | 'student' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  subscription: UserSubscription;
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

import { create } from 'zustand';

export interface IdentityProfile {
  email: string;
  username: string;
  avatarDataUrl: string;
  updatedAt: number | null;
}

const STORAGE_KEY = 'metapet-identity-profile';

export const MAX_AVATAR_BYTES = 512 * 1024;
export const MIN_USERNAME_LENGTH = 2;
export const MAX_USERNAME_LENGTH = 24;

export const defaultIdentityProfile: IdentityProfile = {
  email: '',
  username: '',
  avatarDataUrl: '',
  updatedAt: null,
};

function normalizeIdentityProfile(profile?: Partial<IdentityProfile>): IdentityProfile {
  return {
    ...defaultIdentityProfile,
    ...profile,
  };
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getEmailError(value: string): string | null {
  if (!value.trim()) return null;
  return isValidEmail(value) ? null : 'Enter a valid email address.';
}

export function isValidUsername(value: string): boolean {
  if (!value.trim()) return true;
  const trimmed = value.trim();
  return trimmed.length >= MIN_USERNAME_LENGTH && trimmed.length <= MAX_USERNAME_LENGTH;
}

export function getUsernameError(value: string): string | null {
  if (!value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return `Username must be at least ${MIN_USERNAME_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`;
  }
  return null;
}

export function getAvatarSizeError(bytes: number): string | null {
  if (bytes > MAX_AVATAR_BYTES) {
    return `Avatar must be ${Math.round(MAX_AVATAR_BYTES / 1024)} KB or smaller.`;
  }
  return null;
}

export function loadIdentityProfile(): IdentityProfile {
  if (typeof window === 'undefined') {
    return defaultIdentityProfile;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultIdentityProfile;
    const parsed = JSON.parse(stored) as Partial<IdentityProfile>;
    return normalizeIdentityProfile(parsed);
  } catch (error) {
    console.warn('Failed to load identity profile:', error);
    return defaultIdentityProfile;
  }
}

export function saveIdentityProfile(profile: IdentityProfile): IdentityProfile {
  const normalized = {
    ...normalizeIdentityProfile(profile),
    updatedAt: Date.now(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.warn('Failed to persist identity profile:', error);
    }
  }

  return normalized;
}

export function getPreferredIdentity(profile: IdentityProfile): string {
  const email = profile.email.trim();
  if (email) return email;
  return profile.username.trim();
}

interface IdentityProfileStore {
  profile: IdentityProfile;
  lastSavedAt: number | null;
  status: 'idle' | 'saved';
  setProfile: (profile: IdentityProfile) => void;
  saveProfile: (profile: IdentityProfile) => IdentityProfile;
  refreshProfile: () => void;
}

const initialProfile = loadIdentityProfile();

export const useIdentityProfileStore = create<IdentityProfileStore>((set) => ({
  profile: initialProfile,
  lastSavedAt: initialProfile.updatedAt,
  status: 'idle',
  setProfile: (profile) => set({ profile }),
  saveProfile: (profile) => {
    const saved = saveIdentityProfile(profile);
    set({ profile: saved, lastSavedAt: saved.updatedAt, status: 'saved' });
    return saved;
  },
  refreshProfile: () => {
    const loaded = loadIdentityProfile();
    set({ profile: loaded, lastSavedAt: loaded.updatedAt, status: 'idle' });
  },
}));

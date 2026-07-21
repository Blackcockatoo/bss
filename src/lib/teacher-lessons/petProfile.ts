"use client";

/**
 * Meta-Pet Teacher Lesson System — pet profile overlay (Pass 3).
 *
 * A small, local-first preference overlay that holds ONLY display/preference
 * fields the lessons may set on the student's real pet — a safe alias and a
 * preferred DNA visualisation mode. It deliberately holds no genome, vitals or
 * body data, so it is a preference layer, NOT a competing pet store. The
 * authoritative pet lives in the main Meta-Pet store and the Body Forge.
 */

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PreferredDnaView = "sigil" | "cascade" | "fourD" | "vortex";

export const PET_PROFILE_STORAGE_KEY = "metapet-teacher-pet-profile";
const PET_PROFILE_VERSION = 1;

/** Alias length bounds (mirrors the identity profile conventions). */
export const MIN_ALIAS_LENGTH = 1;
export const MAX_ALIAS_LENGTH = 24;

export interface PetProfileState {
  version: number;
  /** Safe display alias for the pet (never a real student name). */
  alias: string;
  /** Preferred DNA visualisation starting mode, or null for the default. */
  preferredDnaView: PreferredDnaView | null;
  updatedAt: number | null;
}

function createDefaultProfile(): PetProfileState {
  return {
    version: PET_PROFILE_VERSION,
    alias: "",
    preferredDnaView: null,
    updatedAt: null,
  };
}

const VALID_VIEWS: PreferredDnaView[] = ["sigil", "cascade", "fourD", "vortex"];

export function isPreferredDnaView(value: unknown): value is PreferredDnaView {
  return typeof value === "string" && (VALID_VIEWS as string[]).includes(value);
}

/** Matches ASCII control characters, which are stripped from aliases. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const IDENTIFIER_LIKE = /@|https?:\/\/|www\./i;

/**
 * Validate + normalise an alias. Trims, strips control characters, enforces
 * length, and rejects values that look like an email/URL (to discourage real
 * personal identifiers). Returns null when invalid.
 */
export function normaliseAlias(raw: string): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
  if (cleaned.length < MIN_ALIAS_LENGTH || cleaned.length > MAX_ALIAS_LENGTH) {
    return null;
  }
  if (IDENTIFIER_LIKE.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function getAliasError(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (trimmed.length === 0) return "Add a short alias first.";
  if (trimmed.length > MAX_ALIAS_LENGTH) {
    return `Keep the alias to ${MAX_ALIAS_LENGTH} characters or fewer.`;
  }
  if (IDENTIFIER_LIKE.test(trimmed)) {
    return "Use a made-up name, not an email or web address.";
  }
  return null;
}

/** Repair a persisted profile from unknown/corrupted input. */
export function sanitizePetProfile(raw: unknown): PetProfileState {
  const base = createDefaultProfile();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<PetProfileState>;
  const alias =
    typeof value.alias === "string" ? (normaliseAlias(value.alias) ?? "") : "";
  return {
    version: PET_PROFILE_VERSION,
    alias,
    preferredDnaView: isPreferredDnaView(value.preferredDnaView)
      ? value.preferredDnaView
      : null,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : null,
  };
}

interface PetProfileActions {
  /** Set the alias (an already-normalised value is expected). */
  setAlias: (alias: string) => void;
  setPreferredDnaView: (view: PreferredDnaView | null) => void;
  reset: () => void;
}

export type PetProfileStore = PetProfileState & PetProfileActions;

export const usePetProfileStore = create<PetProfileStore>()(
  persist(
    (set) => ({
      ...createDefaultProfile(),
      setAlias: (alias) => set(() => ({ alias, updatedAt: Date.now() })),
      setPreferredDnaView: (view) =>
        set(() => ({
          preferredDnaView: isPreferredDnaView(view) ? view : null,
          updatedAt: Date.now(),
        })),
      reset: () => set(() => ({ ...createDefaultProfile() })),
    }),
    {
      name: PET_PROFILE_STORAGE_KEY,
      version: PET_PROFILE_VERSION,
      migrate: (persisted) => sanitizePetProfile(persisted) as PetProfileStore,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePetProfile(persisted),
      }),
    },
  ),
);

/** SSR-safe hydration flag for the pet profile store. */
export function usePetProfileHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => usePetProfileStore.persist.onFinishHydration(onChange),
    () => usePetProfileStore.persist.hasHydrated(),
    () => false,
  );
}

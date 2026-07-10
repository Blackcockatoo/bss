"use client";

/**
 * App mode — the Explorer / Teacher toggle.
 *
 * Explorer mode is the full companion experience; Teacher mode surfaces the
 * classroom, parent, and safety material first. The choice persists locally.
 * Dedicated schools builds (IS_SCHOOLS_PROFILE) are always Teacher mode and
 * cannot toggle — the child-safe route gates stay untouched either way.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

export type AppMode = "explorer" | "teacher";

const STORAGE_KEY = "bss-app-mode";
const DEFAULT_MODE: AppMode = IS_SCHOOLS_PROFILE ? "teacher" : "explorer";

let cachedMode: AppMode | null = null;
const listeners = new Set<() => void>();

function readStoredMode(): AppMode {
  if (IS_SCHOOLS_PROFILE || typeof window === "undefined") return DEFAULT_MODE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "teacher" || stored === "explorer" ? stored : DEFAULT_MODE;
}

function getSnapshot(): AppMode {
  if (cachedMode === null) {
    cachedMode = readStoredMode();
  }
  return cachedMode;
}

function getServerSnapshot(): AppMode {
  return DEFAULT_MODE;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeMode(next: AppMode): void {
  if (IS_SCHOOLS_PROFILE) return;
  cachedMode = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  for (const listener of listeners) listener();
}

export interface AppModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  /** False on dedicated schools builds, where Teacher mode is locked on. */
  canToggle: boolean;
}

export function useAppMode(): AppModeState {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: AppMode) => writeMode(next), []);
  const toggleMode = useCallback(() => {
    writeMode(getSnapshot() === "explorer" ? "teacher" : "explorer");
  }, []);

  return useMemo(
    () => ({
      mode: IS_SCHOOLS_PROFILE ? "teacher" : mode,
      setMode,
      toggleMode,
      canToggle: !IS_SCHOOLS_PROFILE,
    }),
    [mode, setMode, toggleMode],
  );
}

"use client";

/**
 * User-selectable app mode: "normal" (family/play surface) vs "school"
 * (teacher-led marketing + classroom chrome). Persisted per browser.
 *
 * Deployment rules still win: IS_SCHOOLS_PROFILE builds are always school
 * mode, and /schools* routes always render with school chrome. This mode
 * only controls the flexible deployment's default experience — most
 * visibly, which home page you get.
 */

import { useSyncExternalStore } from "react";

export type AppMode = "normal" | "school";

const STORAGE_KEY = "bss-app-mode";
const CHANGE_EVENT = "bss:app-mode-change";
const DEFAULT_MODE: AppMode = "normal";

function isAppMode(value: unknown): value is AppMode {
  return value === "normal" || value === "school";
}

export function getAppMode(): AppMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isAppMode(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function setAppMode(mode: AppMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private browsing / storage denied: mode still applies for this page.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerSnapshot(): AppMode {
  return DEFAULT_MODE;
}

/** SSR-safe subscription to the persisted app mode. */
export function useAppMode(): AppMode {
  return useSyncExternalStore(subscribe, getAppMode, getServerSnapshot);
}

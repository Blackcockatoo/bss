"use client";

/**
 * Meta-Pet Teacher Lesson System — Classroom Focus signal (Pass 4).
 *
 * A tiny ephemeral (non-persisted) signal that tells the rest of the app when
 * a lesson is running in Classroom Focus Mode. Classroom Focus Mode owns the
 * bottom of the screen (via the lesson guide bar), so the global Meta-Pet
 * bottom navigation must step aside while it is active — and reappear the
 * instant focus mode ends, a route changes, or the lesson unmounts.
 *
 * It is deliberately lifecycle-driven, not persisted: the wrapper component
 * sets it true while mounted+active and false on cleanup, so refresh/route
 * changes naturally restore the global bar.
 */

import { useSyncExternalStore } from "react";

let active = false;
const listeners = new Set<() => void>();

/**
 * Set whether Classroom Focus Mode is currently active. Also mirrors the state
 * onto the document element so CSS can act as a defence-in-depth backup
 * (blocking pointer events) even before React re-renders.
 */
export function setClassroomFocusActive(next: boolean): void {
  if (active === next) return;
  active = next;
  if (typeof document !== "undefined") {
    if (next) {
      document.documentElement.setAttribute("data-classroom-focus", "on");
    } else {
      document.documentElement.removeAttribute("data-classroom-focus");
    }
  }
  for (const listener of listeners) listener();
}

/** Non-reactive read (for tests and one-off checks). */
export function isClassroomFocusActive(): boolean {
  return active;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Reactive subscription to Classroom Focus Mode activation. */
export function useClassroomFocusActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => false,
  );
}

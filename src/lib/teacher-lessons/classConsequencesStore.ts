"use client";

/**
 * Meta-Pet Teacher Lesson System — class-level consequences store.
 *
 * Local-first, namespaced, versioned localStorage state (Zustand + persist),
 * following the same corruption-safety pattern as lessonProgressStore. Holds
 * ONLY class-level, non-sensitive state — no individual student data.
 *
 * Storage key: "metapet-field-class-state" (v1). Reset via
 * {@link useClassConsequencesStore}'s `resetAll` action, which a teacher can
 * trigger from the Field Mode UI at any time.
 */

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  createDefaultClassConsequenceState,
  recordClassConsequenceAction,
  sanitizeClassConsequenceState,
  type ClassConsequenceActionId,
  type ClassConsequenceState,
} from "./classConsequences";

export const CLASS_CONSEQUENCE_STORAGE_KEY = "metapet-field-class-state";
const STORE_VERSION = 1;

interface ClassConsequenceActions {
  /** Record one deterministic action against the shared class state. */
  recordAction: (actionId: ClassConsequenceActionId) => void;
  /** Teacher-triggered reset back to a neutral, explainable default. */
  resetAll: () => void;
}

export type ClassConsequenceStore = ClassConsequenceState &
  ClassConsequenceActions;

export const useClassConsequencesStore = create<ClassConsequenceStore>()(
  persist(
    (set) => ({
      ...createDefaultClassConsequenceState(),
      recordAction: (actionId) =>
        set((state) => recordClassConsequenceAction(state, actionId)),
      resetAll: () => set(() => ({ ...createDefaultClassConsequenceState() })),
    }),
    {
      name: CLASS_CONSEQUENCE_STORAGE_KEY,
      version: STORE_VERSION,
      migrate: (persisted) =>
        sanitizeClassConsequenceState(persisted) as ClassConsequenceStore,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeClassConsequenceState(persisted),
      }),
    },
  ),
);

/** SSR-safe hydration flag for the class consequences store. */
export function useClassConsequencesHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useClassConsequencesStore.persist.onFinishHydration(onChange),
    () => useClassConsequencesStore.persist.hasHydrated(),
    () => false,
  );
}

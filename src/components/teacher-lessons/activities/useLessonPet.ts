"use client";

import { useMemo } from "react";

import { useStore } from "@/lib/store";
import {
  DEMO_PET_CONFIG,
  cloneLessonPetConfig,
  type LessonDefinition,
  type LessonPetConfig,
} from "@/lib/teacher-lessons";

export interface LessonPetContext {
  /** The starting configuration an activity should clone into working state. */
  startingConfig: LessonPetConfig;
  /** True when this is the shared, deterministic demonstration pet. */
  isDemo: boolean;
  /**
   * True when a real pet was expected (usesStudentRealPet) but none was found,
   * so a safe demonstration pet is used instead.
   */
  isFallback: boolean;
  /** Whether the lesson definition permits committing changes. */
  canPersist: boolean;
}

/**
 * Provide a safe lesson pet context. Demonstration lessons always get the
 * deterministic demo pet. Lessons flagged `usesStudentRealPet` read the main
 * pet store to confirm a real pet exists; if it is missing, they fall back to
 * the demonstration pet rather than breaking.
 *
 * IMPORTANT: this never overwrites the real pet. Temporary lesson experiments
 * live entirely in the activity's local working state and (optionally) in typed
 * lesson evidence — never in the main pet store.
 */
export function useLessonPet(
  lesson: Pick<
    LessonDefinition,
    "usesStudentRealPet" | "usesDemonstrationPet" | "persistChanges"
  >,
): LessonPetContext {
  const hasRealPet = useStore((state) => state.genome !== null);

  return useMemo(() => {
    if (lesson.usesStudentRealPet) {
      if (hasRealPet) {
        return {
          startingConfig: {
            ...cloneLessonPetConfig(DEMO_PET_CONFIG),
            alias: "Your Meta-Pet",
          },
          isDemo: false,
          isFallback: false,
          canPersist: lesson.persistChanges,
        };
      }
      // Real pet expected but missing — safe fallback to the demonstration pet.
      return {
        startingConfig: cloneLessonPetConfig(DEMO_PET_CONFIG),
        isDemo: false,
        isFallback: true,
        canPersist: false,
      };
    }

    return {
      startingConfig: cloneLessonPetConfig(DEMO_PET_CONFIG),
      isDemo: true,
      isFallback: false,
      canPersist: lesson.persistChanges,
    };
  }, [
    lesson.usesStudentRealPet,
    lesson.persistChanges,
    hasRealPet,
  ]);
}

"use client";

import { useEffect } from "react";

import { resetSchoolLessonMemory } from "@/lib/fieldMode/resetLocalState";
import { purgeExpiredSchoolsLocalState } from "@/lib/schools/storage";

/** Keeps the existing 35-day school retention contract active in Field Mode. */
export function FieldStorageGuard() {
  useEffect(() => {
    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch {
      // Classroom activities can still run when the browser blocks storage.
      return;
    }
    if (purgeExpiredSchoolsLocalState(storage)) {
      resetSchoolLessonMemory();
    }
  }, []);

  return null;
}

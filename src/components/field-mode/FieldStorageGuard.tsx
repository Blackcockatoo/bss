"use client";

import { useEffect } from "react";

import { resetSchoolLessonMemory } from "@/lib/fieldMode/resetLocalState";
import { purgeExpiredSchoolsLocalState } from "@/lib/schools/storage";

/** Keeps the existing 35-day school retention contract active in Field Mode. */
export function FieldStorageGuard() {
  useEffect(() => {
    if (purgeExpiredSchoolsLocalState(window.localStorage)) {
      resetSchoolLessonMemory();
    }
  }, []);

  return null;
}

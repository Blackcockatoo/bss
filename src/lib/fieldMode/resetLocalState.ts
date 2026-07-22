import {
  useLessonProgressStore,
  usePetProfileStore,
  usePetUpdateStore,
  usePilotStore,
} from "@/lib/teacher-lessons";

/** Reset school lesson stores after their persisted records are removed. */
export function resetSchoolLessonMemory(): void {
  useLessonProgressStore.getState().resetAllProgress();
  usePetProfileStore.getState().reset();
  usePetUpdateStore.getState().reset();
  usePilotStore.getState().reset();
}

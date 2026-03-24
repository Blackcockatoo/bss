import { SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY } from "@/lib/schools/storage";

const LEGACY_STORAGE_KEY = "metapet-teacher-onboarding";
const STORAGE_KEYS = [
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
] as const;

interface TeacherOnboardingState {
  completedAt: number | null;
}

function load(): TeacherOnboardingState {
  if (typeof window === "undefined") return { completedAt: null };
  try {
    for (const key of STORAGE_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as TeacherOnboardingState;
      if (parsed.completedAt !== null) {
        return parsed;
      }
    }

    return { completedAt: null };
  } catch {
    return { completedAt: null };
  }
}

export function hasCompletedTeacherOnboarding(): boolean {
  return load().completedAt !== null;
}

export function completeTeacherOnboarding(): void {
  if (typeof window === "undefined") return;
  const state: TeacherOnboardingState = { completedAt: Date.now() };
  window.localStorage.setItem(
    SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
    JSON.stringify(state),
  );
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function resetTeacherOnboarding(): void {
  if (typeof window === "undefined") return;
  for (const key of STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

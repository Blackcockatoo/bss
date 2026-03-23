const STORAGE_KEY = "metapet-teacher-onboarding";

interface TeacherOnboardingState {
  completedAt: number | null;
}

function load(): TeacherOnboardingState {
  if (typeof window === "undefined") return { completedAt: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedAt: null };
    return JSON.parse(raw) as TeacherOnboardingState;
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetTeacherOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

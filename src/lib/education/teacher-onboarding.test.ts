import { beforeEach, describe, expect, it } from "vitest";

import {
  completeTeacherOnboarding,
  hasCompletedTeacherOnboarding,
  resetTeacherOnboarding,
} from "@/lib/education/teacher-onboarding";
import { SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY } from "@/lib/schools/storage";

describe("teacher onboarding storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("writes the onboarding state to the school-namespaced key", () => {
    completeTeacherOnboarding();

    expect(
      window.localStorage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY),
    ).toContain("completedAt");
    expect(window.localStorage.getItem("metapet-teacher-onboarding")).toBeNull();
    expect(hasCompletedTeacherOnboarding()).toBe(true);
  });

  it("still recognises the legacy key and clears it on reset", () => {
    window.localStorage.setItem(
      "metapet-teacher-onboarding",
      JSON.stringify({ completedAt: 1234 }),
    );

    expect(hasCompletedTeacherOnboarding()).toBe(true);

    resetTeacherOnboarding();

    expect(window.localStorage.getItem("metapet-teacher-onboarding")).toBeNull();
    expect(
      window.localStorage.getItem(SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY),
    ).toBeNull();
    expect(hasCompletedTeacherOnboarding()).toBe(false);
  });
});

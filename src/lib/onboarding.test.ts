import { beforeEach, describe, expect, it } from "vitest";

import {
  completeOnboarding,
  getOnboardingStorageKey,
  hasCompletedOnboarding,
  resetOnboarding,
} from "@/lib/onboarding";

describe("onboarding storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("tracks completion per route scope", () => {
    expect(hasCompletedOnboarding("pet")).toBe(false);
    expect(hasCompletedOnboarding("dna")).toBe(false);

    completeOnboarding("pet");

    expect(hasCompletedOnboarding("pet")).toBe(true);
    expect(hasCompletedOnboarding("dna")).toBe(false);
    expect(window.localStorage.getItem(getOnboardingStorageKey("pet"))).toBe(
      "true",
    );
  });

  it("can reset a single scope without affecting the others", () => {
    completeOnboarding("school");
    completeOnboarding("identity");

    resetOnboarding("school");

    expect(hasCompletedOnboarding("school")).toBe(false);
    expect(hasCompletedOnboarding("identity")).toBe(true);
  });
});

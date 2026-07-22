import { afterEach, describe, expect, it } from "vitest";

import {
  isFeatureAvailable,
  resolveLessonAvailability,
  setFeatureAvailabilityOverrides,
} from "./featureFlags";
import { getLessonById } from "./lessonDefinitions";

afterEach(() => {
  setFeatureAvailabilityOverrides({});
});

describe("feature availability", () => {
  it("treats classroom-emulated systems as available", () => {
    expect(isFeatureAvailable("body-forge").available).toBe(true);
    expect(isFeatureAvailable("vitals").available).toBe(true);
    expect(isFeatureAvailable("emotions").available).toBe(true);
  });

  it("honours overrides with a teacher-friendly reason", () => {
    setFeatureAvailabilityOverrides({ "advanced-visualisation": false });
    const result = isFeatureAvailable("advanced-visualisation");
    expect(result.available).toBe(false);
    expect(result.reason).toBeTruthy();
    expect(result.reason).not.toMatch(/error|exception|stack/i);
  });

  it("resolves whole-lesson availability from required flags", () => {
    const patterns = getLessonById("patterns-behind-the-pet")!;
    expect(resolveLessonAvailability(patterns).available).toBe(true);

    setFeatureAvailabilityOverrides({ "advanced-visualisation": false });
    const blocked = resolveLessonAvailability(patterns);
    expect(blocked.available).toBe(false);
    expect(blocked.reason).toContain("simplified");
  });

  it("keeps lessons without required flags available", () => {
    const meet = getLessonById("meet-your-metapet")!;
    expect(resolveLessonAvailability(meet).available).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENGAGEMENT_CATEGORY,
  ENGAGEMENT_CATEGORY_DEFINITIONS,
  ENGAGEMENT_CATEGORY_ORDER,
  getEngagementCategoryDefinition,
  normalizeEngagementCategory,
} from "./engagement";

describe("education engagement taxonomy", () => {
  it("normalizes unknown values to the learning default", () => {
    expect(normalizeEngagementCategory(undefined)).toBe(
      DEFAULT_ENGAGEMENT_CATEGORY,
    );
    expect(normalizeEngagementCategory("unknown-category")).toBe(
      DEFAULT_ENGAGEMENT_CATEGORY,
    );
  });

  it("defines the six teacher-facing categories", () => {
    expect(ENGAGEMENT_CATEGORY_ORDER).toHaveLength(6);
    expect(ENGAGEMENT_CATEGORY_DEFINITIONS.learning.label).toBe("Learning");
    expect(
      getEngagementCategoryDefinition("mindfulness-regulation").shortLabel,
    ).toBe("Mindfulness");
  });
});

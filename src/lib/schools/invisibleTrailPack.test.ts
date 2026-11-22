import { describe, expect, it } from "vitest";

import { INVISIBLE_TRAIL_STATED_CODES } from "@/lib/schools/stateLessonMaps";
import {
  INVISIBLE_TRAIL_DURATION_MINUTES,
  INVISIBLE_TRAIL_PACK_CODES,
  INVISIBLE_TRAIL_STATED_CURRICULUM,
  INVISIBLE_TRAIL_TIMINGS,
  invisibleTrailTimingTotal,
} from "@/lib/schools/invisibleTrailPack";

describe("Invisible Trail planner pack", () => {
  it("uses timings that add to the stated 30 minutes", () => {
    expect(invisibleTrailTimingTotal()).toBe(INVISIBLE_TRAIL_DURATION_MINUTES);
    expect(invisibleTrailTimingTotal()).toBe(30);
    expect(INVISIBLE_TRAIL_TIMINGS.some((step) => step.id === "missions" && step.minutes === 15)).toBe(
      true,
    );
  });

  it("lists only curriculum codes already stated on the lab", () => {
    expect(INVISIBLE_TRAIL_PACK_CODES).toEqual([...INVISIBLE_TRAIL_STATED_CODES]);
    for (const item of INVISIBLE_TRAIL_STATED_CURRICULUM) {
      expect(INVISIBLE_TRAIL_STATED_CODES).toContain(item.code);
      expect(item.wording.length).toBeGreaterThan(10);
    }
  });
});

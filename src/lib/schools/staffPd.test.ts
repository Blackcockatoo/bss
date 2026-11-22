import { describe, expect, it } from "vitest";

import { LEADERSHIP_ONE_PAGER, VERIFICATION_ITEMS } from "@/lib/schools/classroomPack";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import { STAFF_PD_SLIDES, staffPdTotalMinutes } from "./staffPd";

describe("staff PD deck", () => {
  it("uses a 15-minute run sheet and names every lesson", () => {
    expect(staffPdTotalMinutes()).toBe(15);
    expect(STAFF_PD_SLIDES[0]?.title).toMatch(/15-minute staff briefing/i);
    const text = STAFF_PD_SLIDES.flatMap((slide) => [
      slide.title,
      slide.body ?? "",
      ...(slide.bullets ?? []),
      slide.notes ?? "",
    ]).join("\n");
    for (const lesson of LESSON_DEFINITIONS) {
      expect(text).toContain(lesson.title);
    }
    expect(text).toContain(LEADERSHIP_ONE_PAGER.whatItIs);
    for (const item of VERIFICATION_ITEMS) {
      expect(text).toContain(item.title);
    }
    expect(text).not.toMatch(/low-data|retention pressure|endorsed by ACARA|offline-first/i);
  });
});

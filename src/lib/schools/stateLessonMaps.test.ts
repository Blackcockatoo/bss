import { describe, expect, it } from "vitest";

import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import {
  ALL_STATE_CURRICULUM_SOURCES,
} from "@/lib/schools/stateCurriculumSources";
import {
  INVISIBLE_TRAIL_STATED_CODES,
  LESSON_STATE_MAPS,
  OFFICIAL_NSW_OUTCOMES,
  OFFICIAL_VC2_DIGITAL_TECHNOLOGIES,
  stateMapForId,
} from "@/lib/schools/stateLessonMaps";

describe("state curriculum maps", () => {
  it("records official sources with HTTP 200 only", () => {
    expect(ALL_STATE_CURRICULUM_SOURCES.length).toBeGreaterThan(0);
    for (const source of ALL_STATE_CURRICULUM_SOURCES) {
      expect(source.httpStatus).toBe(200);
      expect(source.href.startsWith("https://")).toBe(true);
      expect(source.notes).toMatch(/HTTP 200/);
    }
  });

  it("has a map row for every published lesson and The Invisible Trail", () => {
    const ids = LESSON_STATE_MAPS.map((item) => item.id);
    for (const lesson of ALL_LESSON_DEFINITIONS) {
      expect(ids).toContain(lesson.id);
    }
    expect(ids).toContain("invisible-trail");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("quotes only official Victorian and NSW codes from the allow-lists", () => {
    const vicCodes = new Set(Object.keys(OFFICIAL_VC2_DIGITAL_TECHNOLOGIES));
    const nswCodes = new Set(Object.keys(OFFICIAL_NSW_OUTCOMES));
    for (const item of LESSON_STATE_MAPS) {
      if (item.victorian.status === "mapped") {
        for (const entry of item.victorian.codes) {
          expect(vicCodes.has(entry.code)).toBe(true);
          expect(entry.wording.length).toBeGreaterThan(10);
          expect(entry.code.startsWith("VC2TDI")).toBe(true);
        }
      } else {
        expect(item.victorian.reason.length).toBeGreaterThan(20);
      }
      if (item.nsw.status === "mapped") {
        for (const entry of item.nsw.codes) {
          expect(nswCodes.has(entry.code)).toBe(true);
          expect(entry.wording.length).toBeGreaterThan(10);
        }
      } else {
        expect(item.nsw.reason.length).toBeGreaterThan(20);
      }
    }
  });

  it("uses only the Invisible Trail lab’s already stated Victorian codes", () => {
    const trail = stateMapForId("invisible-trail");
    expect(trail?.victorian.status).toBe("mapped");
    if (trail?.victorian.status === "mapped") {
      for (const entry of trail.victorian.codes) {
        expect(INVISIBLE_TRAIL_STATED_CODES).toContain(entry.code);
      }
    }
    expect(trail?.australianCodes).toEqual(["AC9TDI4P09", "AC9TDI6P10"]);
  });

  it("does not invent school-account password codes for the F–2 personal-data lesson", () => {
    const lesson = stateMapForId("what-is-mine-to-keep");
    expect(lesson?.victorian.status).toBe("not-mapped-yet");
    expect(lesson?.victorian.status === "not-mapped-yet" && lesson.victorian.reason).toMatch(
      /school accounts/i,
    );
  });
});

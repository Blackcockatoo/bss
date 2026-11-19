import { describe, expect, it } from "vitest";

import { plannerExtrasFor } from "@/lib/schools/classroomPack";
import { curriculumAlignmentForSession } from "@/lib/schools/curriculumAlignment";
import {
  ALL_LESSON_DEFINITIONS,
  LESSON_DEFINITIONS,
} from "@/lib/teacher-lessons/lessonDefinitions";

import {
  EMPTY_LESSON_FILTERS,
  filterLessons,
  hasActiveLessonFilters,
  isPaperFriendlyLesson,
  lessonFilterSearchString,
  parseLessonSearchParams,
  publishedCurriculumCodes,
  yearBandsInPublishedCode,
} from "./lessonFilters";

describe("lesson search filters", () => {
  it("returns every lesson when no filters are set", () => {
    expect(filterLessons(LESSON_DEFINITIONS, EMPTY_LESSON_FILTERS)).toEqual(
      LESSON_DEFINITIONS,
    );
    expect(hasActiveLessonFilters(EMPTY_LESSON_FILTERS)).toBe(false);
  });

  it("filters by the lesson's planned time, not a teacher setting", () => {
    const fifteen = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      minutes: 15,
    });
    const twenty = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      minutes: 20,
    });
    expect(fifteen.map((lesson) => lesson.number)).toEqual([1, 2]);
    expect(twenty.every((lesson) => lesson.durationMinutes === 20)).toBe(true);
    expect(fifteen.length + twenty.length).toBe(LESSON_DEFINITIONS.length);
  });

  it("treats paper-friendly as works-well or can-be-run on paper", () => {
    const matches = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      paperFriendly: true,
    });
    expect(matches.map((lesson) => lesson.id)).toEqual([
      "one-identity-many-representations",
      "privacy-and-responsible-design",
      "design-a-better-feature",
    ]);
    for (const lesson of matches) {
      expect(isPaperFriendlyLesson(lesson)).toBe(true);
    }
    expect(plannerExtrasFor("privacy-and-responsible-design").paper.kind).toBe(
      "works-on-paper",
    );
  });

  it("filters by a published AC v9 code only", () => {
    const code = "AC9TDI6P05";
    const matches = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      code,
    });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThan(LESSON_DEFINITIONS.length);
    for (const lesson of matches) {
      expect(curriculumAlignmentForSession(lesson.number).codes).toContain(code);
    }
    expect(
      parseLessonSearchParams({ code: "AC9FAKE000" }).code,
    ).toBeNull();
  });

  it("reads year bands only from the year identifier already in a published code", () => {
    expect(yearBandsInPublishedCode("AC9TDI4K01")).toEqual(["3-4"]);
    expect(yearBandsInPublishedCode("AC9HP6P08")).toEqual(["5-6"]);
    expect(yearBandsInPublishedCode("AC9TDI10K01")).toEqual([]);
  });

  it("finds lessons by title, intention or code text", () => {
    const byTitle = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      query: "better feature",
    });
    expect(byTitle.map((lesson) => lesson.id)).toEqual([
      "design-a-better-feature",
    ]);
    const byCode = filterLessons(LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      query: "ac9tdi4k01",
    });
    expect(byCode.every((lesson) => [1, 2, 4].includes(lesson.number))).toBe(
      true,
    );
  });

  it("parses shareable query params and ignores unknown values", () => {
    const filters = parseLessonSearchParams({
      q: "  signals ",
      years: "5-6",
      minutes: "15",
      code: "AC9HP4P05",
      paper: "yes",
    });
    expect(filters).toEqual({
      query: "signals",
      yearBand: "5-6",
      minutes: 15,
      code: "AC9HP4P05",
      paperFriendly: true,
    });
    expect(lessonFilterSearchString(filters)).toBe(
      "?q=signals&years=5-6&minutes=15&code=AC9HP4P05&paper=yes",
    );
    expect(
      parseLessonSearchParams({
        years: "7-8",
        minutes: "45",
        code: "AC9NOTREAL",
        paper: "maybe",
      }),
    ).toEqual(EMPTY_LESSON_FILTERS);
    expect(publishedCurriculumCodes()).toContain("AC9HP4P05");
    expect(publishedCurriculumCodes()).toContain("AC9TDIFK01");
    expect(publishedCurriculumCodes()).toContain("AC9TDI2P01");
  });

  it("distinguishes F–2 lessons from Years 3–6 lessons", () => {
    const foundation = filterLessons(ALL_LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      yearBand: "f",
    });
    const years12 = filterLessons(ALL_LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      yearBand: "1-2",
    });
    const years34 = filterLessons(ALL_LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      yearBand: "3-4",
    });
    expect(foundation.map((lesson) => lesson.id)).toEqual([
      "meet-a-system",
      "show-it-two-ways",
      "what-is-mine-to-keep",
    ]);
    expect(years12).toHaveLength(4);
    expect(years12.every((lesson) => lesson.yearBand === "years-1-2")).toBe(true);
    expect(years34).toHaveLength(7);
    expect(years34.every((lesson) => lesson.yearBand === "years-3-6")).toBe(true);
    const unplugged = filterLessons(ALL_LESSON_DEFINITIONS, {
      ...EMPTY_LESSON_FILTERS,
      query: "unplugged",
    });
    expect(unplugged).toHaveLength(7);
    expect(unplugged.every((lesson) => lesson.yearBand !== "years-3-6")).toBe(true);
  });
});

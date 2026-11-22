import { describe, expect, it } from "vitest";

import {
  curriculumAlignmentForSession,
  curriculumCodesForSession,
  learningOutcomes,
  sessionNumbersFromLessonsLabel,
} from "@/lib/schools/curriculumAlignment";

describe("curriculum alignment (existing /schools mapping)", () => {
  it("parses the published session labels", () => {
    expect(sessionNumbersFromLessonsLabel("Sessions 1, 2 and 4")).toEqual([
      1, 2, 4,
    ]);
    expect(sessionNumbersFromLessonsLabel("Sessions 4 and 7")).toEqual([4, 7]);
  });

  it("assigns only codes already listed on /schools", () => {
    const published = new Set(learningOutcomes.flatMap((outcome) => outcome.codes));
    for (const sessionNumber of [1, 2, 3, 4, 5, 6, 7]) {
      for (const code of curriculumCodesForSession(sessionNumber)) {
        expect(published.has(code), code).toBe(true);
      }
    }
  });

  it("inverts the published session lists without adding codes", () => {
    const sessionOne = curriculumAlignmentForSession(1);
    expect(sessionOne.codes).toEqual([
      "AC9TDI4K01",
      "AC9TDI4P02",
      "AC9TDI6P02",
      "AC9TDI4K03",
      "AC9TDI4P04",
      "AC9TDI6K03",
    ]);
    expect(sessionOne.learningAreas).toEqual(["Digital Technologies"]);

    const sessionFive = curriculumAlignmentForSession(5);
    expect(sessionFive.codes).toEqual([
      "AC9HP4P05",
      "AC9HP6P05",
      "AC9HP4P08",
      "AC9HP4P03",
      "AC9HP6P03",
      "AC9HP6P08",
    ]);
    expect(sessionFive.learningAreas).toEqual([
      "Health and Physical Education",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SCRIPTED_LESSONS } from "@/lib/education/lesson-cards";
import { lessonCards } from "@/app/schools/content";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import {
  FIELD_CONTRIBUTIONS,
  FIELD_GOVERNING_LINE,
  METAPET_PRODUCT,
} from "./product";

const TITLES = [
  "Meet the System",
  "Read the Signals",
  "One Identity, Many Representations",
  "Choices and Algorithms",
  "Privacy and Responsible Design",
  "Design a Better Feature",
  "Test, Reflect and Improve",
];

describe("MetaPet School product constitution", () => {
  it("keeps one canonical lesson sequence across public adapters", () => {
    expect(LESSON_DEFINITIONS.map((lesson) => lesson.title)).toEqual(TITLES);
    expect(SCRIPTED_LESSONS.map((lesson) => lesson.title)).toEqual(TITLES);
    expect(lessonCards.map((lesson) => lesson.title)).toEqual(TITLES);
  });

  it("keeps the downloadable lesson document on the canonical sequence", () => {
    const source = readFileSync(
      join(process.cwd(), "docs/schools-au/02-lesson-cards.md"),
      "utf8",
    );
    const published = readFileSync(
      join(process.cwd(), "public/docs/schools-au/02-lesson-cards.md"),
      "utf8",
    );

    expect(published).toBe(source);
    for (const title of TITLES) expect(source).toContain(title);
    expect(source).not.toMatch(/Meet the Digital Companion|Feelings, Signals and Regulation/);
  });

  it("gives every lesson the required classroom and fallback contract", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.durationMinutes).toBeGreaterThanOrEqual(15);
      expect(lesson.durationMinutes).toBeLessThanOrEqual(20);
      expect(lesson.curriculumLinks.length).toBeGreaterThan(0);
      expect(lesson.materials.length).toBeGreaterThan(0);
      expect(lesson.participationChoices).toHaveLength(9);
      expect(lesson.offlineFallback.length).toBeGreaterThan(0);
      expect(lesson.safeStopCondition.length).toBeGreaterThan(0);
      expect(lesson.usesStudentRealPet).toBe(false);
      expect(lesson.persistChanges).toBe(false);
    }
  });

  it("defines complete $0 access without legacy licence pricing", () => {
    expect(FIELD_CONTRIBUTIONS[0]).toEqual({
      amount: "$0",
      meaning: "Use MetaPet School. No explanation required.",
    });
    expect(FIELD_GOVERNING_LINE).toMatch(/No school is too poor/i);
    expect(METAPET_PRODUCT.school).toBe("MetaPet School");
    expect(JSON.stringify(FIELD_CONTRIBUTIONS)).not.toMatch(/990|1,490|1,990/);
  });
});

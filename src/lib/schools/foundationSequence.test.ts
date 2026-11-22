import { describe, expect, it } from "vitest";

import { estimatedStepMinutes, plannerExtrasFor } from "@/lib/schools/classroomPack";
import {
  ALLOWED_F2_CURRICULUM_CODES,
  FOUNDATION_CURRICULUM_SOURCES,
  OFFICIAL_F2_CONTENT_DESCRIPTIONS,
} from "@/lib/schools/foundationCurriculum";
import {
  FOUNDATION_SESSION_COUNT,
  FOUNDATION_SESSIONS,
  FOUNDATION_ALIGNMENT_CAVEAT,
} from "@/lib/schools/foundationSequence";
import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { yearBandsInPublishedCode } from "@/lib/schools/lessonFilters";
import {
  ALL_LESSON_DEFINITIONS,
  FOUNDATION_LESSON_DEFINITIONS,
  LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";

const EXPECTED_IDS = [
  "meet-a-system",
  "show-it-two-ways",
  "what-is-mine-to-keep",
  "parts-of-a-system",
  "the-same-data-many-ways",
  "follow-the-steps",
  "a-problem-for-someone-we-know",
] as const;

const EXPECTED_CODES: Record<(typeof EXPECTED_IDS)[number], readonly string[]> = {
  "meet-a-system": ["AC9TDIFK01"],
  "show-it-two-ways": ["AC9TDIFK02"],
  "what-is-mine-to-keep": ["AC9TDIFP01"],
  "parts-of-a-system": ["AC9TDI2K01"],
  "the-same-data-many-ways": ["AC9TDI2K02"],
  "follow-the-steps": ["AC9TDI2P02"],
  "a-problem-for-someone-we-know": ["AC9TDI2P01", "AC9TDI2P03"],
};

describe("F–2 unplugged starter set", () => {
  it("defines exactly seven sessions on the verified codes", () => {
    expect(FOUNDATION_SESSION_COUNT).toBe(7);
    expect(FOUNDATION_SESSIONS.map((session) => session.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(FOUNDATION_LESSON_DEFINITIONS.map((lesson) => lesson.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(LESSON_DEFINITIONS).toHaveLength(7);
    expect(ALL_LESSON_DEFINITIONS).toHaveLength(24);
  });

  it("quotes only official AC v9 wording and does not invent codes", () => {
    const used = new Set<string>();
    for (const lesson of FOUNDATION_LESSON_DEFINITIONS) {
      const alignment = curriculumAlignmentForLesson(lesson);
      expect(alignment.codes).toEqual([...EXPECTED_CODES[lesson.id]]);
      for (const code of alignment.codes) {
        expect(ALLOWED_F2_CURRICULUM_CODES).toContain(code);
        used.add(code);
        const official =
          OFFICIAL_F2_CONTENT_DESCRIPTIONS[
            code as keyof typeof OFFICIAL_F2_CONTENT_DESCRIPTIONS
          ];
        expect(official).toBeDefined();
        expect(alignment.outcomes.some((outcome) => outcome.statement.includes(official.wording))).toBe(
          true,
        );
      }
      expect(getLessonBySlug(lesson.slug)?.id).toBe(lesson.id);
    }
    expect([...used].sort()).toEqual([...ALLOWED_F2_CURRICULUM_CODES].sort());
    expect(FOUNDATION_ALIGNMENT_CAVEAT).toMatch(/not an official ACARA endorsement/i);
    expect(FOUNDATION_CURRICULUM_SOURCES.length).toBeGreaterThanOrEqual(2);
    for (const source of FOUNDATION_CURRICULUM_SOURCES) {
      expect(source.href).toMatch(/^https:\/\/www\.australiancurriculum\.edu\.au\//);
    }
  });

  it("keeps every lesson unplugged, timed, and free of student data collection", () => {
    const banned = /student accounts to create|please sign in|write your real name|take a photo of (yourself|the class)/i;
    for (const lesson of FOUNDATION_LESSON_DEFINITIONS) {
      expect(lesson.activityType).toBe("unplugged");
      expect(lesson.appDestination).toBe("unplugged");
      expect(lesson.usesDemonstrationPet).toBe(false);
      expect(lesson.usesStudentRealPet).toBe(false);
      expect([15, 20]).toContain(lesson.durationMinutes);
      expect(lesson.steps).toHaveLength(5);
      const total = lesson.steps.reduce(
        (sum, _step, index) =>
          sum + estimatedStepMinutes(lesson.durationMinutes, lesson.steps.length, index),
        0,
      );
      expect(total).toBe(lesson.durationMinutes);
      expect(plannerExtrasFor(lesson.id).paper.kind).toBe("works-on-paper");
      const text = [
        lesson.shortDescription,
        lesson.teacherScript,
        lesson.studentInstructions,
        lesson.lightEvidence,
        lesson.stoppingPoint,
        ...lesson.steps.map((step) => step.teacherPrompt),
      ].join("\n");
      expect(text).not.toMatch(banned);
      expect(text).toMatch(/name|photo/i);
    }
  });

  it("uses pre-reader exits and does not collide with Years 3–6 slugs or codes", () => {
    const canonicalSlugs = new Set(LESSON_DEFINITIONS.map((lesson) => lesson.slug));
    const canonicalCodes = new Set(
      LESSON_DEFINITIONS.flatMap((lesson) => curriculumAlignmentForLesson(lesson).codes),
    );
    for (const lesson of FOUNDATION_LESSON_DEFINITIONS) {
      expect(canonicalSlugs.has(lesson.slug)).toBe(false);
      const codes = curriculumAlignmentForLesson(lesson).codes;
      for (const code of codes) {
        expect(canonicalCodes.has(code)).toBe(false);
      }
      const exitText = [
        lesson.steps[4]?.studentTask,
        lesson.steps[4]?.teacherPrompt,
        lesson.reflectionPrompt,
      ].join(" ");
      expect(exitText).toMatch(/point|draw|thumbs/i);
    }
  });
});

describe("year band filters for F–2 and Years 3–6", () => {
  it("reads Foundation and Years 1–2 identifiers from published codes", () => {
    expect(yearBandsInPublishedCode("AC9TDIFK01")).toEqual(["f"]);
    expect(yearBandsInPublishedCode("AC9TDIFP01")).toEqual(["f"]);
    expect(yearBandsInPublishedCode("AC9TDI2K01")).toEqual(["1-2"]);
    expect(yearBandsInPublishedCode("AC9TDI2P03")).toEqual(["1-2"]);
    expect(yearBandsInPublishedCode("AC9TDI4K01")).toEqual(["3-4"]);
    expect(yearBandsInPublishedCode("AC9TDI6P05")).toEqual(["5-6"]);
  });
});

import { describe, expect, it } from "vitest";

import { estimatedStepMinutes, plannerExtrasFor } from "@/lib/schools/classroomPack";
import {
  ALLOWED_Y78_CURRICULUM_CODES,
  OFFICIAL_Y78_CONTENT_DESCRIPTIONS,
  YEARS_78_CURRICULUM_SOURCES,
} from "@/lib/schools/years78Curriculum";
import {
  YEARS_78_ALIGNMENT_CAVEAT,
  YEARS_78_PERIOD_NOTE,
  YEARS_78_SESSION_COUNT,
  YEARS_78_SESSIONS,
} from "@/lib/schools/years78Sequence";
import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { yearBandsInPublishedCode } from "@/lib/schools/lessonFilters";
import {
  ALL_LESSON_DEFINITIONS,
  LESSON_DEFINITIONS,
  YEARS_78_LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";
import { FOUNDATION_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

const EXPECTED_IDS = [
  "hardware-for-the-job",
  "data-as-numbers",
  "why-binary",
  "trace-the-algorithm",
  "design-an-algorithm",
  "what-data-is-essential",
  "evaluate-a-system-for-a-user",
] as const;

const EXPECTED_CODES: Record<(typeof EXPECTED_IDS)[number], readonly string[]> = {
  "hardware-for-the-job": ["AC9TDI8K01"],
  "data-as-numbers": ["AC9TDI8K03"],
  "why-binary": ["AC9TDI8K04"],
  "trace-the-algorithm": ["AC9TDI8P06"],
  "design-an-algorithm": ["AC9TDI8P05"],
  "what-data-is-essential": ["AC9TDI8P14"],
  "evaluate-a-system-for-a-user": ["AC9TDI8P04", "AC9TDI8P10"],
};

describe("Years 7–8 bridge unit", () => {
  it("defines exactly seven 45-minute sessions on verified codes", () => {
    expect(YEARS_78_SESSION_COUNT).toBe(7);
    expect(YEARS_78_SESSIONS.map((session) => session.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(YEARS_78_LESSON_DEFINITIONS.map((lesson) => lesson.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(YEARS_78_SESSIONS.every((session) => session.minutes === 45)).toBe(
      true,
    );
    expect(LESSON_DEFINITIONS).toHaveLength(7);
    expect(FOUNDATION_LESSON_DEFINITIONS).toHaveLength(7);
    expect(ALL_LESSON_DEFINITIONS).toHaveLength(24);
    expect(YEARS_78_PERIOD_NOTE).toMatch(/45 minutes/);
  });

  it("quotes only official AC v9 wording and does not invent codes", () => {
    const used = new Set<string>();
    for (const lesson of YEARS_78_LESSON_DEFINITIONS) {
      const alignment = curriculumAlignmentForLesson(lesson);
      expect(alignment.codes).toEqual([...EXPECTED_CODES[lesson.id]]);
      for (const code of alignment.codes) {
        expect(ALLOWED_Y78_CURRICULUM_CODES).toContain(code);
        used.add(code);
        const official =
          OFFICIAL_Y78_CONTENT_DESCRIPTIONS[
            code as keyof typeof OFFICIAL_Y78_CONTENT_DESCRIPTIONS
          ];
        expect(official).toBeDefined();
        expect(
          alignment.outcomes.some((outcome) =>
            outcome.statement.includes(official.wording),
          ),
        ).toBe(true);
      }
      expect(getLessonBySlug(lesson.slug)?.id).toBe(lesson.id);
    }
    expect([...used].sort()).toEqual([...ALLOWED_Y78_CURRICULUM_CODES].sort());
    expect(YEARS_78_ALIGNMENT_CAVEAT).toMatch(
      /not an official ACARA endorsement/i,
    );
    expect(YEARS_78_CURRICULUM_SOURCES.length).toBeGreaterThanOrEqual(2);
    for (const source of YEARS_78_CURRICULUM_SOURCES) {
      expect(source.href).toMatch(
        /^https:\/\/www\.australiancurriculum\.edu\.au\//,
      );
    }
  });

  it("keeps every lesson unplugged or teacher-screen-only, timed, and free of student data collection", () => {
    const banned =
      /please sign in|write your real name|log in to your account|take a photo of (yourself|the class)/i;
    for (const lesson of YEARS_78_LESSON_DEFINITIONS) {
      expect(lesson.activityType).toBe("unplugged");
      expect(lesson.appDestination).toBe("unplugged");
      expect(lesson.usesDemonstrationPet).toBe(false);
      expect(lesson.usesStudentRealPet).toBe(false);
      expect(lesson.durationMinutes).toBe(45);
      expect(lesson.yearBand).toBe("years-7-8");
      expect(lesson.steps).toHaveLength(5);
      const total = lesson.steps.reduce(
        (sum, _step, index) =>
          sum +
          estimatedStepMinutes(
            lesson.durationMinutes,
            lesson.steps.length,
            index,
          ),
        0,
      );
      expect(total).toBe(45);
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
    }
    const footprint = YEARS_78_LESSON_DEFINITIONS.find(
      (lesson) => lesson.id === "what-data-is-essential",
    );
    expect(footprint?.teacherScript).toMatch(/will not log in/i);
    expect(footprint?.teacherScript).toMatch(/not investigate anyone/i);
  });

  it("does not collide with Years 3–6 or F–2 slugs or codes", () => {
    const otherSlugs = new Set(
      [...LESSON_DEFINITIONS, ...FOUNDATION_LESSON_DEFINITIONS].map(
        (lesson) => lesson.slug,
      ),
    );
    const otherCodes = new Set(
      [...LESSON_DEFINITIONS, ...FOUNDATION_LESSON_DEFINITIONS].flatMap(
        (lesson) => curriculumAlignmentForLesson(lesson).codes,
      ),
    );
    for (const lesson of YEARS_78_LESSON_DEFINITIONS) {
      expect(otherSlugs.has(lesson.slug)).toBe(false);
      for (const code of curriculumAlignmentForLesson(lesson).codes) {
        expect(otherCodes.has(code)).toBe(false);
      }
    }
  });

  it("reads the Years 7–8 identifier already present in published codes", () => {
    expect(yearBandsInPublishedCode("AC9TDI8K01")).toEqual(["7-8"]);
    expect(yearBandsInPublishedCode("AC9TDI8P14")).toEqual(["7-8"]);
    expect(yearBandsInPublishedCode("AC9TDI8K03")).toEqual(["7-8"]);
  });
});

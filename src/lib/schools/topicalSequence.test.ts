import { describe, expect, it } from "vitest";

import { estimatedStepMinutes, plannerExtrasFor } from "@/lib/schools/classroomPack";
import {
  ALLOWED_TOPICAL_CURRICULUM_CODES,
  OFFICIAL_TOPICAL_CONTENT_DESCRIPTIONS,
  TOPICAL_CURRICULUM_SOURCES,
} from "@/lib/schools/topicalCurriculum";
import { TOPICAL_ESAFETY_LINKS } from "@/lib/schools/topicalClassroomPack";
import {
  TOPICAL_ALIGNMENT_CAVEAT,
  TOPICAL_PERIOD_NOTE,
  TOPICAL_SESSION_COUNT,
  TOPICAL_SESSIONS,
} from "@/lib/schools/topicalSequence";
import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { yearBandsInPublishedCode } from "@/lib/schools/lessonFilters";
import {
  ALL_LESSON_DEFINITIONS,
  getLessonBySlug,
  TOPICAL_LESSON_DEFINITIONS,
} from "@/lib/teacher-lessons/lessonDefinitions";

const EXPECTED_IDS = [
  "chatbots-and-checking",
  "feeds-and-recommendations",
  "loot-boxes-and-purchases",
] as const;

const EXPECTED_CODES: Record<(typeof EXPECTED_IDS)[number], readonly string[]> = {
  "chatbots-and-checking": [
    "AC9TDI6P01",
    "AC9TDI6P06",
    "AC9TDI8P04",
    "AC9TDI8P10",
  ],
  "feeds-and-recommendations": ["AC9TDI6P02", "AC9TDI6P10", "AC9TDI8P14"],
  "loot-boxes-and-purchases": [
    "AC9TDI6P01",
    "AC9TDI6P06",
    "AC9TDI8P04",
    "AC9TDI8P10",
  ],
};

describe("Years 5–8 topical mini-lessons", () => {
  it("defines exactly three 25-minute sessions on verified codes", () => {
    expect(TOPICAL_SESSION_COUNT).toBe(3);
    expect(TOPICAL_SESSIONS.map((session) => session.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(TOPICAL_LESSON_DEFINITIONS.map((lesson) => lesson.id)).toEqual([
      ...EXPECTED_IDS,
    ]);
    expect(TOPICAL_SESSIONS.every((session) => session.minutes === 25)).toBe(
      true,
    );
    expect(ALL_LESSON_DEFINITIONS).toHaveLength(24);
    expect(TOPICAL_PERIOD_NOTE).toMatch(/25 minutes/);
  });

  it("quotes only official AC v9 wording and does not invent codes", () => {
    const used = new Set<string>();
    for (const lesson of TOPICAL_LESSON_DEFINITIONS) {
      const alignment = curriculumAlignmentForLesson(lesson);
      expect(alignment.codes).toEqual([...EXPECTED_CODES[lesson.id]]);
      const bands = new Set(
        alignment.codes.flatMap((code) => yearBandsInPublishedCode(code)),
      );
      expect(bands.has("5-6")).toBe(true);
      expect(bands.has("7-8")).toBe(true);
      for (const code of alignment.codes) {
        expect(ALLOWED_TOPICAL_CURRICULUM_CODES).toContain(code);
        used.add(code);
        const official = OFFICIAL_TOPICAL_CONTENT_DESCRIPTIONS[code];
        expect(official).toBeDefined();
        expect(
          alignment.outcomes.some((outcome) =>
            outcome.statement.includes(official.wording),
          ),
        ).toBe(true);
      }
      expect(getLessonBySlug(lesson.slug)?.id).toBe(lesson.id);
    }
    expect([...used].sort()).toEqual([...ALLOWED_TOPICAL_CURRICULUM_CODES].sort());
    expect(TOPICAL_ALIGNMENT_CAVEAT).toMatch(
      /not an official ACARA endorsement/i,
    );
    expect(TOPICAL_CURRICULUM_SOURCES.length).toBeGreaterThanOrEqual(2);
    for (const source of TOPICAL_CURRICULUM_SOURCES) {
      expect(source.href).toMatch(
        /^https:\/\/www\.australiancurriculum\.edu\.au\//,
      );
    }
  });

  it("keeps every lesson unplugged, timed, and free of student data collection", () => {
    const banned =
      /please sign in|write your real name|log in to your account|take a photo of (yourself|the class)|type your personal|enter your (name|address|payment)/i;
    for (const lesson of TOPICAL_LESSON_DEFINITIONS) {
      expect(lesson.activityType).toBe("unplugged");
      expect(lesson.appDestination).toBe("unplugged");
      expect(lesson.usesDemonstrationPet).toBe(false);
      expect(lesson.usesStudentRealPet).toBe(false);
      expect(lesson.durationMinutes).toBe(25);
      expect(lesson.yearBand).toBe("years-5-8");
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
      expect(total).toBe(25);
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
  });

  it("lists official eSafety pages with https URLs", () => {
    expect(TOPICAL_ESAFETY_LINKS.length).toBeGreaterThanOrEqual(5);
    for (const link of TOPICAL_ESAFETY_LINKS) {
      expect(link.href).toMatch(/^https:\/\/www\.esafety\.gov\.au\//);
      expect(link.note).toMatch(/HTTP 200/);
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  LESSON_DEFINITIONS,
  LESSON_IDS,
  TOTAL_LESSONS,
  getLessonById,
  getLessonBySlug,
  isLessonId,
} from "./lessonProgramme";

const EXPECTED_TITLES = [
  "Meet Your Meta-Pet",
  "Build a Body",
  "DNA Makes Us Different",
  "Needs, Actions and Consequences",
  "Feelings Without Words",
  "Patterns Behind the Pet",
  "The Responsible Creator Challenge",
];

const STALE_DEVELOPMENT_LANGUAGE = /placeholder|pass\s*[12]|later\s+(it|they|this)\s+(opens?|becomes?)/i;

describe("classroom lesson programme", () => {
  it("defines exactly seven lessons in canonical order", () => {
    expect(LESSON_DEFINITIONS).toHaveLength(7);
    expect(TOTAL_LESSONS).toBe(7);
    expect(LESSON_DEFINITIONS.map((lesson) => lesson.title)).toEqual(
      EXPECTED_TITLES,
    );
    expect(LESSON_DEFINITIONS.map((lesson) => lesson.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("keeps every canonical lesson within the public 20-minute core", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.durationMinutes).toBe(20);
    }
  });

  it("gives every lesson a complete five-phase classroom flow", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.steps).toHaveLength(5);
      expect(lesson.steps.map((step) => step.kind)).toEqual([
        "introduce",
        "observe",
        "interact",
        "discuss",
        "complete",
      ]);

      for (const step of lesson.steps) {
        expect(step.id).toContain(lesson.id);
        expect(step.title.length).toBeGreaterThan(8);
        expect(step.teacherPrompt.length).toBeGreaterThan(40);
        expect(step.studentTask.length).toBeGreaterThan(20);
        expect(step.whatDoINow.length).toBeGreaterThan(30);
        expect(step.expectedOutcome.length).toBeGreaterThan(30);
      }
    }
  });

  it("does not expose stale development or placeholder language", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const publicCopy = [
        lesson.shortDescription,
        lesson.learningIntention,
        lesson.teacherIntroduction,
        lesson.teacherScript,
        lesson.studentInstructions,
        lesson.completionMessage,
        lesson.extensionActivity,
        lesson.supportActivity,
        ...lesson.successCriteria,
        ...lesson.discussionPrompts,
        ...lesson.steps.flatMap((step) => [
          step.title,
          step.teacherPrompt,
          step.studentTask,
          step.whatDoINow,
          step.expectedOutcome,
        ]),
      ].join(" ");

      expect(publicCopy).not.toMatch(STALE_DEVELOPMENT_LANGUAGE);
    }
  });

  it("has unique ids and slugs", () => {
    expect(new Set(LESSON_IDS).size).toBe(7);
    expect(new Set(LESSON_DEFINITIONS.map((lesson) => lesson.slug)).size).toBe(
      7,
    );
  });

  it("provides rich, usable classroom configuration for every lesson", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.learningIntention.length).toBeGreaterThan(30);
      expect(lesson.successCriteria).toHaveLength(3);
      expect(lesson.discussionPrompts).toHaveLength(3);
      expect(lesson.completionMessage.length).toBeGreaterThan(30);
      expect(lesson.preview.mainIdea.length).toBeGreaterThan(30);
      expect(lesson.extensionActivity.length).toBeGreaterThan(30);
      expect(lesson.supportActivity.length).toBeGreaterThan(20);
      expect(typeof lesson.usesDemonstrationPet).toBe("boolean");
      expect(typeof lesson.usesStudentRealPet).toBe("boolean");
      expect(typeof lesson.persistChanges).toBe("boolean");
      expect(typeof lesson.resetAtCompletion).toBe("boolean");
    }
  });

  it("looks lessons up by id and slug", () => {
    expect(getLessonById("dna-differences")?.number).toBe(3);
    expect(getLessonBySlug("build-a-body")?.title).toBe("Build a Body");
    expect(getLessonById("nope")).toBeUndefined();
    expect(getLessonBySlug(undefined)).toBeUndefined();
  });

  it("guards lesson ids", () => {
    expect(isLessonId("meet-your-metapet")).toBe(true);
    expect(isLessonId("not-a-lesson")).toBe(false);
    expect(isLessonId(42)).toBe(false);
  });
});

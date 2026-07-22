import { describe, expect, it } from "vitest";

import {
  LESSON_DEFINITIONS,
  LESSON_IDS,
  TOTAL_LESSONS,
  getLessonById,
  getLessonBySlug,
  isLessonId,
} from "./lessonDefinitions";

const EXPECTED_TITLES = [
  "Meet Your Meta-Pet",
  "Build a Body",
  "DNA Makes Us Different",
  "Needs, Actions and Consequences",
  "Feelings Without Words",
  "Patterns Behind the Pet",
  "The Responsible Creator Challenge",
];

describe("lesson definitions", () => {
  it("defines exactly seven lessons in order", () => {
    expect(LESSON_DEFINITIONS).toHaveLength(7);
    expect(TOTAL_LESSONS).toBe(7);
    expect(LESSON_DEFINITIONS.map((l) => l.title)).toEqual(EXPECTED_TITLES);
    expect(LESSON_DEFINITIONS.map((l) => l.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("gives every lesson a five-step placeholder flow", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.steps).toHaveLength(5);
      expect(lesson.steps.map((s) => s.kind)).toEqual([
        "introduce",
        "observe",
        "interact",
        "discuss",
        "complete",
      ]);
      for (const step of lesson.steps) {
        expect(step.id).toContain(lesson.id);
        expect(step.teacherPrompt.length).toBeGreaterThan(0);
        expect(step.studentTask.length).toBeGreaterThan(0);
        expect(step.whatDoINow.length).toBeGreaterThan(0);
      }
    }
  });

  it("has unique ids and slugs", () => {
    expect(new Set(LESSON_IDS).size).toBe(7);
    expect(new Set(LESSON_DEFINITIONS.map((l) => l.slug)).size).toBe(7);
  });

  it("provides required rich configuration fields on every lesson", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.learningIntention.length).toBeGreaterThan(0);
      expect(lesson.successCriteria.length).toBeGreaterThan(0);
      expect(lesson.discussionPrompts.length).toBeGreaterThan(0);
      expect(lesson.completionMessage.length).toBeGreaterThan(0);
      expect(lesson.preview.mainIdea.length).toBeGreaterThan(0);
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

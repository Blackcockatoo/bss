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
  "Meet the System",
  "Read the Signals",
  "One Identity, Many Representations",
  "Choices and Algorithms",
  "Privacy and Responsible Design",
  "Design a Better Feature",
  "Test, Reflect and Improve",
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

  it("gives every lesson a five-step guided flow", () => {
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
      expect(lesson.movementMoment.length).toBeGreaterThan(0);
      expect(lesson.reflectionPrompt.length).toBeGreaterThan(0);
      expect(lesson.stoppingPoint.length).toBeGreaterThan(0);
      expect(lesson.lightEvidence.length).toBeGreaterThan(0);
    }
  });

  it("looks lessons up by id and slug", () => {
    expect(getLessonById("one-identity-many-representations")?.number).toBe(3);
    expect(getLessonBySlug("design-a-better-feature")?.title).toBe(
      "Design a Better Feature",
    );
    expect(getLessonById("nope")).toBeUndefined();
    expect(getLessonBySlug(undefined)).toBeUndefined();
  });

  it("runs every classroom lesson on the demonstration pet with nothing persisted", () => {
    // Field Mode's privacy pages promise that no student's own companion is
    // touched and nothing survives the lesson. That promise is data, not prose.
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.usesDemonstrationPet).toBe(true);
      expect(lesson.usesStudentRealPet).toBe(false);
      expect(lesson.persistChanges).toBe(false);
      expect(lesson.resetAtCompletion).toBe(true);
    }
  });

  it("keeps every session inside the promised 15-20 minute window", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      expect(lesson.durationMinutes).toBeGreaterThanOrEqual(15);
      expect(lesson.durationMinutes).toBeLessThanOrEqual(20);
    }
  });

  it("guards lesson ids", () => {
    expect(isLessonId("meet-the-system")).toBe(true);
    expect(isLessonId("not-a-lesson")).toBe(false);
    expect(isLessonId(42)).toBe(false);
  });
});

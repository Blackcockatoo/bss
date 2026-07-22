import { describe, expect, it } from "vitest";

import { getLessonById } from "./lessonDefinitions";
import {
  LESSON_BASE_PATH,
  buildLessonPath,
  buildTeacherHubPath,
  parsePreviewFlag,
  parseViewMode,
  resolveLessonId,
  resolveStepIndex,
} from "./lessonRouting";

const dnaLesson = getLessonById("dna-differences")!;

describe("lesson routing", () => {
  it("builds the teacher hub path", () => {
    expect(buildTeacherHubPath()).toBe("/teachers");
  });

  it("builds lesson paths from slug and id", () => {
    expect(buildLessonPath("dna-differences")).toBe(
      "/teachers/lessons/dna-differences",
    );
    // Accepts a lesson id too.
    expect(buildLessonPath("build-a-body")).toBe(
      "/teachers/lessons/build-a-body",
    );
  });

  it("appends step, preview and mode query params", () => {
    expect(buildLessonPath("dna-differences", { step: 2 })).toBe(
      "/teachers/lessons/dna-differences?step=2",
    );
    expect(buildLessonPath("dna-differences", { preview: true })).toBe(
      "/teachers/lessons/dna-differences?preview=1",
    );
    expect(
      buildLessonPath("dna-differences", { mode: "student", step: 3 }),
    ).toContain("mode=student");
  });

  it("falls back to the base path for unknown lessons", () => {
    expect(buildLessonPath("not-real")).toBe(LESSON_BASE_PATH);
  });

  it("resolves 1-based query steps into clamped 0-based indices", () => {
    expect(resolveStepIndex(dnaLesson, "1")).toBe(0);
    expect(resolveStepIndex(dnaLesson, "3")).toBe(2);
    // Out of range clamps to the last step.
    expect(resolveStepIndex(dnaLesson, "99")).toBe(dnaLesson.steps.length - 1);
    // Invalid / missing falls back to the first step.
    expect(resolveStepIndex(dnaLesson, "abc")).toBe(0);
    expect(resolveStepIndex(dnaLesson, null)).toBe(0);
    expect(resolveStepIndex(dnaLesson, 0)).toBe(0);
    expect(resolveStepIndex(dnaLesson, -5)).toBe(0);
  });

  it("parses preview flags", () => {
    expect(parsePreviewFlag("1")).toBe(true);
    expect(parsePreviewFlag("true")).toBe(true);
    expect(parsePreviewFlag(["yes"])).toBe(true);
    expect(parsePreviewFlag("0")).toBe(false);
    expect(parsePreviewFlag(undefined)).toBe(false);
  });

  it("parses view modes", () => {
    expect(parseViewMode("teacher")).toBe("teacher");
    expect(parseViewMode("student")).toBe("student");
    expect(parseViewMode("nonsense")).toBeNull();
    expect(parseViewMode(undefined)).toBeNull();
  });

  it("resolves and rejects lesson ids from slugs", () => {
    expect(resolveLessonId("feelings-without-words")).toBe(
      "feelings-without-words",
    );
    expect(resolveLessonId("broken")).toBeNull();
    expect(resolveLessonId(null)).toBeNull();
  });
});

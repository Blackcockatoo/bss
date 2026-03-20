import { describe, expect, it } from "vitest";
import {
  evaluateQuestPack,
  getLessonCompletionRequirements,
  getQuestPackById,
  normalizeLessonDnaMode,
  selectQuestPack,
} from "./quests";
import type { LessonProgress, QueuedLesson, QuestMode } from "./types";

function createModeInteractions(
  overrides: Partial<Record<QuestMode, number>> = {},
): Record<QuestMode, number> {
  return {
    spiral: 0,
    mandala: 0,
    triangle: 0,
    sound: 0,
    journey: 0,
    ...overrides,
  };
}

describe("education quests", () => {
  it("normalizes particles lessons to triangle quests", () => {
    expect(normalizeLessonDnaMode("particles")).toBe("triangle");
  });

  it("selects a quest pack from dna mode or focus area", () => {
    expect(
      selectQuestPack({
        focusArea: "pattern-recognition",
        dnaMode: "particles",
      }).id,
    ).toBe("triangle-trace");

    expect(
      selectQuestPack({
        focusArea: "geometry-creation",
        dnaMode: null,
      }).id,
    ).toBe("symmetry-studio");
  });

  it("only advances symmetry quests from symmetry-specific signals", () => {
    const pack = getQuestPackById("symmetry-studio");
    const progress = evaluateQuestPack(pack, {
      activeMode: "sound",
      visitedModes: ["sound"],
      sessionInteractions: 30,
      playCount: 4,
      modeInteractions: createModeInteractions({ sound: 18 }),
      mandalaStrokeCount: 0,
      mandalaHarmonyChangeCount: 0,
      triangleTraceSteps: 0,
      triangleVisitedSides: 0,
      trianglePlaybackCount: 0,
      soundPlaybackCount: 4,
      soundTempoChangeCount: 1,
      soundTransformChangeCount: 1,
      reflectionSubmitted: false,
    });

    expect(progress.completedCoreQuests).toBe(0);
    expect(progress.quests.every((quest) => quest.current === 0)).toBe(true);
  });

  it("requires both quest progress and reflection for dna lessons", () => {
    const lesson: QueuedLesson = {
      id: "lesson-1",
      title: "Triangle lesson",
      description: "Trace the triangle",
      focusArea: "pattern-recognition",
      dnaMode: "particles",
      targetMinutes: 15,
      standardsRef: [],
      prePrompt: null,
      postPrompt: "What did you notice?",
      position: 0,
      createdAt: 1,
    };

    const incompleteProgress: LessonProgress = {
      lessonId: lesson.id,
      studentAlias: "A",
      status: "active",
      startedAt: 1,
      completedAt: null,
      timeSpentMs: 0,
      preResponse: null,
      postResponse: null,
      dnaInteractions: 0,
      patternHash: null,
      questSummary: {
        packId: "triangle-trace",
        completedQuestIds: ["triangle-trace-steps"],
        requiredCoreQuests: 2,
        completedCoreQuests: 1,
        totalCompletedQuests: 1,
        updatedAt: 1,
      },
    };

    const completeProgress: LessonProgress = {
      ...incompleteProgress,
      postResponse: "I heard the shape change as I crossed the sides.",
      questSummary: {
        packId: "triangle-trace",
        completedQuestIds: [
          "triangle-trace-steps",
          "triangle-trace-sides",
        ],
        requiredCoreQuests: 2,
        completedCoreQuests: 2,
        totalCompletedQuests: 2,
        updatedAt: 2,
      },
    };

    expect(
      getLessonCompletionRequirements(lesson, incompleteProgress).missingRequirements,
    ).toEqual([
      "Complete 2 core quests on the Pattern Quest Board.",
      "Submit the lesson reflection.",
    ]);

    expect(getLessonCompletionRequirements(lesson, completeProgress)).toEqual({
      ready: true,
      missingRequirements: [],
    });
  });
});

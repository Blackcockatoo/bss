import { createDefaultQueueState, type QueuedLesson } from "./types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useEducationStore } from "./store";

const DNA_LESSON: QueuedLesson = {
  id: "dna-lesson",
  title: "Triangle Quest",
  description: "Trace and reflect on the triangle path.",
  focusArea: "pattern-recognition",
  dnaMode: "particles",
  targetMinutes: 15,
  standardsRef: [],
  prePrompt: null,
  postPrompt: "What changed as you traced the triangle?",
  position: 0,
  createdAt: 1,
};

describe("education store quest gating", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useEducationStore.getState().reset();
    useEducationStore.setState({
      ...createDefaultQueueState(),
      queue: [DNA_LESSON],
      sessionMode: "student",
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    useEducationStore.getState().reset();
  });

  it("blocks DNA lesson completion until quests and reflection are done", () => {
    const alias = "Student A";

    useEducationStore.getState().initProgress(DNA_LESSON.id, alias);

    let result = useEducationStore
      .getState()
      .completeLessonWithFlair(DNA_LESSON.id, alias);

    expect(result.completed).toBe(false);
    expect(result.missingRequirements).toContain(
      "Complete 2 core quests on the Pattern Quest Board.",
    );

    useEducationStore.getState().saveQuestSummary(DNA_LESSON.id, alias, {
      packId: "triangle-trace",
      completedQuestIds: [
        "triangle-trace-steps",
        "triangle-trace-sides",
      ],
      requiredCoreQuests: 2,
      completedCoreQuests: 2,
      totalCompletedQuests: 2,
      updatedAt: Date.now(),
    });

    result = useEducationStore
      .getState()
      .completeLessonWithFlair(DNA_LESSON.id, alias);

    expect(result.completed).toBe(false);
    expect(result.missingRequirements).toContain(
      "Submit the lesson reflection.",
    );

    useEducationStore
      .getState()
      .recordPostResponse(
        DNA_LESSON.id,
        alias,
        "Crossing the sides changed the rhythm of the phrase.",
      );

    result = useEducationStore
      .getState()
      .completeLessonWithFlair(DNA_LESSON.id, alias);

    expect(result.completed).toBe(true);

    const progress = useEducationStore
      .getState()
      .lessonProgress.find(
        (entry) =>
          entry.lessonId === DNA_LESSON.id && entry.studentAlias === alias,
      );

    expect(progress?.status).toBe("completed");
    expect(progress?.questSummary?.completedCoreQuests).toBe(2);
    expect(progress?.postResponse).toContain("Crossing the sides");
  });
});

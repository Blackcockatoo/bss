import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LESSON_PROGRESS_STORAGE_KEY,
  sanitizeState,
  selectLessonStatus,
  selectProgressSummary,
  selectRecord,
  useLessonProgressStore,
} from "./lessonProgressStore";

function resetStore() {
  useLessonProgressStore.getState().resetAllProgress();
  useLessonProgressStore.setState({
    currentLessonId: null,
    viewMode: "teacher",
    focusMode: false,
  });
}

describe("lesson progress store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("starts a lesson and tracks the current step", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("meet-your-metapet");
    const state = useLessonProgressStore.getState();
    expect(state.currentLessonId).toBe("meet-your-metapet");
    const record = selectRecord(state, "meet-your-metapet");
    expect(record.startedAt).not.toBeNull();
    expect(record.currentStep).toBe(0);
    expect(selectLessonStatus(state, "meet-your-metapet")).toBe("in-progress");
  });

  it("moves between steps and clamps at the boundaries", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("build-a-body");
    store.nextStep();
    store.nextStep();
    expect(selectRecord(useLessonProgressStore.getState(), "build-a-body").currentStep).toBe(2);
    store.previousStep();
    expect(selectRecord(useLessonProgressStore.getState(), "build-a-body").currentStep).toBe(1);
    // Clamp below zero.
    store.previousStep();
    store.previousStep();
    expect(selectRecord(useLessonProgressStore.getState(), "build-a-body").currentStep).toBe(0);
    // Clamp above the last step (5 steps -> max index 4).
    for (let i = 0; i < 10; i += 1) store.nextStep();
    expect(selectRecord(useLessonProgressStore.getState(), "build-a-body").currentStep).toBe(4);
  });

  it("completes steps and the whole lesson", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("dna-differences");
    store.completeStep(0);
    store.completeStep(1);
    let record = selectRecord(useLessonProgressStore.getState(), "dna-differences");
    expect(record.completedSteps).toEqual([0, 1]);
    expect(record.completed).toBe(false);

    store.completeLesson("dna-differences");
    record = selectRecord(useLessonProgressStore.getState(), "dna-differences");
    expect(record.completed).toBe(true);
    expect(record.completedAt).not.toBeNull();
    expect(record.completedSteps).toEqual([0, 1, 2, 3, 4]);
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "dna-differences"),
    ).toBe("completed");
  });

  it("pauses and resumes", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("needs-and-consequences");
    store.pauseLesson();
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "needs-and-consequences"),
    ).toBe("paused");
    store.resumeLesson();
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "needs-and-consequences"),
    ).toBe("in-progress");
  });

  it("resets a single step, a whole lesson, and everything", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("feelings-without-words");
    store.completeStep(0);
    store.completeStep(1);
    store.saveEvidence("feelings-without-words-step-1", "a note");

    store.resetStep(1);
    let record = selectRecord(useLessonProgressStore.getState(), "feelings-without-words");
    expect(record.completedSteps).toEqual([0]);

    store.resetLesson("feelings-without-words");
    record = selectRecord(useLessonProgressStore.getState(), "feelings-without-words");
    expect(record.completedSteps).toEqual([]);
    expect(record.evidence).toEqual({});
    expect(record.startedAt).toBeNull();

    store.startLesson("patterns-behind-the-pet");
    store.completeStep(0);
    store.resetAllProgress();
    expect(useLessonProgressStore.getState().currentLessonId).toBeNull();
    expect(useLessonProgressStore.getState().records).toEqual({});
  });

  it("ignores invalid lesson ids", () => {
    const store = useLessonProgressStore.getState();
    // @ts-expect-error deliberately invalid
    store.startLesson("not-a-lesson");
    expect(useLessonProgressStore.getState().currentLessonId).toBeNull();
    // @ts-expect-error deliberately invalid
    store.completeLesson("also-invalid");
    expect(useLessonProgressStore.getState().records).toEqual({});
  });

  it("saves and clears student evidence placeholders", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("responsible-creator");
    store.saveEvidence("responsible-creator-step-3", "my promise");
    expect(
      selectRecord(useLessonProgressStore.getState(), "responsible-creator")
        .evidence["responsible-creator-step-3"],
    ).toBe("my promise");
  });

  it("computes an overall progress summary", () => {
    const store = useLessonProgressStore.getState();
    store.completeLesson("meet-your-metapet");
    store.startLesson("build-a-body");
    const summary = selectProgressSummary(useLessonProgressStore.getState());
    expect(summary.totalLessons).toBe(7);
    expect(summary.completedLessons).toBe(1);
    expect(summary.resumeLessonId).toBe("build-a-body");
    expect(summary.completionRatio).toBeCloseTo(1 / 7);
  });

  it("toggles view mode and focus mode", () => {
    const store = useLessonProgressStore.getState();
    store.setViewMode("student");
    expect(useLessonProgressStore.getState().viewMode).toBe("student");
    store.toggleViewMode();
    expect(useLessonProgressStore.getState().viewMode).toBe("teacher");
    store.setFocusMode(true);
    expect(useLessonProgressStore.getState().focusMode).toBe(true);
  });
});

describe("sanitizeState (corruption safety)", () => {
  it("returns a safe default for garbage input", () => {
    expect(sanitizeState(null).records).toEqual({});
    expect(sanitizeState("nonsense").currentLessonId).toBeNull();
    expect(sanitizeState(42).viewMode).toBe("teacher");
  });

  it("drops unknown lessons and repairs out-of-range steps", () => {
    const dirty = {
      version: 1,
      currentLessonId: "meet-your-metapet",
      viewMode: "student",
      focusMode: "yes", // wrong type
      records: {
        "meet-your-metapet": {
          lessonId: "meet-your-metapet",
          currentStep: 999,
          completedSteps: [0, 1, 42, -3, "x"],
          completed: false,
          paused: true,
          startedAt: 123,
          lastActiveAt: 456,
          completedAt: null,
          evidence: { a: "keep", b: 5 },
        },
        "ghost-lesson": { currentStep: 0 },
      },
    };

    const clean = sanitizeState(dirty);
    expect(clean.viewMode).toBe("student");
    expect(clean.focusMode).toBe(false);
    expect(Object.keys(clean.records)).toEqual(["meet-your-metapet"]);

    const record = clean.records["meet-your-metapet"]!;
    // 5 steps -> max index 4.
    expect(record.currentStep).toBe(4);
    expect(record.completedSteps).toEqual([0, 1]);
    expect(record.evidence).toEqual({ a: "keep" });
  });

  it("survives a simulated refresh via persisted local storage", () => {
    // Write directly to the persisted key as if from a previous session.
    window.localStorage.setItem(
      LESSON_PROGRESS_STORAGE_KEY,
      JSON.stringify({
        state: {
          version: 1,
          currentLessonId: "dna-differences",
          viewMode: "teacher",
          focusMode: false,
          records: {
            "dna-differences": {
              lessonId: "dna-differences",
              currentStep: 2,
              completedSteps: [0, 1],
              completed: false,
              paused: false,
              startedAt: 1,
              lastActiveAt: 2,
              completedAt: null,
              evidence: {},
            },
          },
        },
        version: 1,
      }),
    );

    // Rehydrate the persisted store (mimics a page refresh).
    useLessonProgressStore.persist.rehydrate();

    const state = useLessonProgressStore.getState();
    expect(state.currentLessonId).toBe("dna-differences");
    expect(selectRecord(state, "dna-differences").currentStep).toBe(2);
    expect(selectRecord(state, "dna-differences").completedSteps).toEqual([
      0, 1,
    ]);
  });
});

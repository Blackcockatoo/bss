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
    store.startLesson("meet-the-system");
    const state = useLessonProgressStore.getState();
    expect(state.currentLessonId).toBe("meet-the-system");
    const record = selectRecord(state, "meet-the-system");
    expect(record.startedAt).not.toBeNull();
    expect(record.currentStep).toBe(0);
    expect(selectLessonStatus(state, "meet-the-system")).toBe("in-progress");
  });

  it("moves between steps and clamps at the boundaries", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("design-a-better-feature");
    store.nextStep();
    store.nextStep();
    expect(selectRecord(useLessonProgressStore.getState(), "design-a-better-feature").currentStep).toBe(2);
    store.previousStep();
    expect(selectRecord(useLessonProgressStore.getState(), "design-a-better-feature").currentStep).toBe(1);
    // Clamp below zero.
    store.previousStep();
    store.previousStep();
    expect(selectRecord(useLessonProgressStore.getState(), "design-a-better-feature").currentStep).toBe(0);
    // Clamp above the last step (5 steps -> max index 4).
    for (let i = 0; i < 10; i += 1) store.nextStep();
    expect(selectRecord(useLessonProgressStore.getState(), "design-a-better-feature").currentStep).toBe(4);
  });

  it("completes steps and the whole lesson", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("one-identity-many-representations");
    store.completeStep(0);
    store.completeStep(1);
    let record = selectRecord(useLessonProgressStore.getState(), "one-identity-many-representations");
    expect(record.completedSteps).toEqual([0, 1]);
    expect(record.completed).toBe(false);

    store.completeLesson("one-identity-many-representations");
    record = selectRecord(useLessonProgressStore.getState(), "one-identity-many-representations");
    expect(record.completed).toBe(true);
    expect(record.completedAt).not.toBeNull();
    expect(record.completedSteps).toEqual([0, 1, 2, 3, 4]);
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "one-identity-many-representations"),
    ).toBe("completed");
  });

  it("pauses and resumes", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("choices-and-algorithms");
    store.pauseLesson();
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "choices-and-algorithms"),
    ).toBe("paused");
    store.resumeLesson();
    expect(
      selectLessonStatus(useLessonProgressStore.getState(), "choices-and-algorithms"),
    ).toBe("in-progress");
  });

  it("resets a single step, a whole lesson, and everything", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("read-the-signals");
    store.completeStep(0);
    store.completeStep(1);
    store.saveEvidence("read-the-signals-step-1", "a note");

    store.resetStep(1);
    let record = selectRecord(useLessonProgressStore.getState(), "read-the-signals");
    expect(record.completedSteps).toEqual([0]);

    store.resetLesson("read-the-signals");
    record = selectRecord(useLessonProgressStore.getState(), "read-the-signals");
    expect(record.completedSteps).toEqual([]);
    expect(record.evidence).toEqual({});
    expect(record.startedAt).toBeNull();

    store.startLesson("test-reflect-and-improve");
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
    store.startLesson("privacy-and-responsible-design");
    store.saveEvidence("privacy-and-responsible-design-step-3", "my promise");
    expect(
      selectRecord(useLessonProgressStore.getState(), "privacy-and-responsible-design")
        .evidence["privacy-and-responsible-design-step-3"],
    ).toBe("my promise");
  });

  it("computes an overall progress summary", () => {
    const store = useLessonProgressStore.getState();
    store.completeLesson("meet-the-system");
    store.startLesson("design-a-better-feature");
    const summary = selectProgressSummary(useLessonProgressStore.getState());
    expect(summary.totalLessons).toBe(7);
    expect(summary.completedLessons).toBe(1);
    expect(summary.resumeLessonId).toBe("design-a-better-feature");
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
      currentLessonId: "meet-the-system",
      viewMode: "student",
      focusMode: "yes", // wrong type
      records: {
        "meet-the-system": {
          lessonId: "meet-the-system",
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
    expect(Object.keys(clean.records)).toEqual(["meet-the-system"]);

    const record = clean.records["meet-the-system"]!;
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
          currentLessonId: "one-identity-many-representations",
          viewMode: "teacher",
          focusMode: false,
          records: {
            "one-identity-many-representations": {
              lessonId: "one-identity-many-representations",
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
    expect(state.currentLessonId).toBe("one-identity-many-representations");
    expect(selectRecord(state, "one-identity-many-representations").currentStep).toBe(2);
    expect(selectRecord(state, "one-identity-many-representations").completedSteps).toEqual([
      0, 1,
    ]);
  });
});

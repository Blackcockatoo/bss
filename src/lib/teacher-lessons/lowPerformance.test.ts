import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { sanitizeState, useLessonProgressStore } from "./lessonProgressStore";

beforeEach(() => {
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
});

afterEach(() => {
  window.localStorage.clear();
  useLessonProgressStore.getState().resetAllProgress();
});

describe("Low Performance Mode", () => {
  it("defaults to off and toggles on", () => {
    expect(useLessonProgressStore.getState().lowPerformance).toBe(false);
    useLessonProgressStore.getState().setLowPerformance(true);
    expect(useLessonProgressStore.getState().lowPerformance).toBe(true);
    useLessonProgressStore.getState().setLowPerformance(false);
    expect(useLessonProgressStore.getState().lowPerformance).toBe(false);
  });

  it("survives sanitisation of older persisted state (defaults off)", () => {
    const clean = sanitizeState({
      version: 1,
      currentLessonId: null,
      records: {},
      viewMode: "teacher",
      focusMode: false,
    });
    expect(clean.lowPerformance).toBe(false);
    const dirty = sanitizeState({ lowPerformance: true });
    expect(dirty.lowPerformance).toBe(true);
  });
});

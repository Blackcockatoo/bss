import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { selectRecord, useLessonProgressStore } from "./lessonProgressStore";
import type { PetObservationCardEvidence } from "./evidence";

function resetStore() {
  useLessonProgressStore.getState().resetAllProgress();
}

const cardEvidence: PetObservationCardEvidence = {
  kind: "pet-observation-card",
  version: 1,
  lessonId: "meet-the-system",
  stepId: "meet-the-system-step-5",
  createdAt: 1,
  alias: "Pip",
  observations: { shape: "round", surface: "shiny", movement: "floaty" },
  question: "How does it see me?",
};

describe("lesson progress store — typed evidence & preferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("saves a typed evidence entry against the current lesson", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("meet-the-system");
    store.saveEvidenceEntry("meet-the-system-step-5", cardEvidence);

    const record = selectRecord(
      useLessonProgressStore.getState(),
      "meet-the-system",
    );
    const saved = record.evidenceEntries["meet-the-system-step-5"];
    expect(saved?.kind).toBe("pet-observation-card");
    if (saved?.kind === "pet-observation-card") {
      expect(saved.alias).toBe("Pip");
    }
  });

  it("rejects evidence whose lessonId does not match the current lesson", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("design-a-better-feature");
    store.saveEvidenceEntry("design-a-better-feature-step-5", cardEvidence);
    const record = selectRecord(
      useLessonProgressStore.getState(),
      "design-a-better-feature",
    );
    expect(record.evidenceEntries["design-a-better-feature-step-5"]).toBeUndefined();
  });

  it("clears evidence when a step is reset", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("meet-the-system");
    store.goToStep(4);
    store.saveEvidenceEntry("meet-the-system-step-5", cardEvidence);
    store.resetStep(4);
    const record = selectRecord(
      useLessonProgressStore.getState(),
      "meet-the-system",
    );
    expect(record.evidenceEntries["meet-the-system-step-5"]).toBeUndefined();
  });

  it("persists presentation and timing preferences", () => {
    const store = useLessonProgressStore.getState();
    store.setPresentationMode("support");
    store.setTimingMode("demo");
    expect(useLessonProgressStore.getState().presentationMode).toBe("support");
    expect(useLessonProgressStore.getState().timingMode).toBe("demo");

    // Invalid values fall back to safe defaults.
    store.setPresentationMode("nonsense" as never);
    store.setTimingMode("nonsense");
    expect(useLessonProgressStore.getState().presentationMode).toBe("standard");
    expect(useLessonProgressStore.getState().timingMode).toBe("standard");
  });

  it("survives a v1 → v2 persisted upgrade without losing progress", () => {
    // A v1 blob predates typed evidence and preference fields.
    window.localStorage.setItem(
      "metapet-teacher-lesson-progress",
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

    useLessonProgressStore.persist.rehydrate();
    const state = useLessonProgressStore.getState();
    expect(state.currentLessonId).toBe("one-identity-many-representations");
    expect(state.presentationMode).toBe("standard");
    expect(state.timingMode).toBe("standard");
    const record = selectRecord(state, "one-identity-many-representations");
    expect(record.currentStep).toBe(2);
    // The new evidenceEntries field is filled in as an empty object.
    expect(record.evidenceEntries).toEqual({});
  });
});

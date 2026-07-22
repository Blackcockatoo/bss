import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { selectRecord, useLessonProgressStore } from "./lessonProgressStore";
import type { PetObservationCardEvidence } from "./evidence";

function resetStore() {
  useLessonProgressStore.getState().resetAllProgress();
}

const cardEvidence: PetObservationCardEvidence = {
  kind: "pet-observation-card",
  version: 1,
  lessonId: "meet-your-metapet",
  stepId: "meet-your-metapet-step-5",
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
    store.startLesson("meet-your-metapet");
    store.saveEvidenceEntry("meet-your-metapet-step-5", cardEvidence);

    const record = selectRecord(
      useLessonProgressStore.getState(),
      "meet-your-metapet",
    );
    const saved = record.evidenceEntries["meet-your-metapet-step-5"];
    expect(saved?.kind).toBe("pet-observation-card");
    if (saved?.kind === "pet-observation-card") {
      expect(saved.alias).toBe("Pip");
    }
  });

  it("rejects evidence whose lessonId does not match the current lesson", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("build-a-body");
    store.saveEvidenceEntry("build-a-body-step-5", cardEvidence);
    const record = selectRecord(
      useLessonProgressStore.getState(),
      "build-a-body",
    );
    expect(record.evidenceEntries["build-a-body-step-5"]).toBeUndefined();
  });

  it("clears evidence when a step is reset", () => {
    const store = useLessonProgressStore.getState();
    store.startLesson("meet-your-metapet");
    store.goToStep(4);
    store.saveEvidenceEntry("meet-your-metapet-step-5", cardEvidence);
    store.resetStep(4);
    const record = selectRecord(
      useLessonProgressStore.getState(),
      "meet-your-metapet",
    );
    expect(record.evidenceEntries["meet-your-metapet-step-5"]).toBeUndefined();
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

    useLessonProgressStore.persist.rehydrate();
    const state = useLessonProgressStore.getState();
    expect(state.currentLessonId).toBe("dna-differences");
    expect(state.presentationMode).toBe("standard");
    expect(state.timingMode).toBe("standard");
    const record = selectRecord(state, "dna-differences");
    expect(record.currentStep).toBe(2);
    // The new evidenceEntries field is filled in as an empty object.
    expect(record.evidenceEntries).toEqual({});
  });
});

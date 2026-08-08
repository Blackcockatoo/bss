import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  PILOT_CHECKLIST,
  PILOT_FEEDBACK_QUESTIONS,
  sanitizePilotState,
  usePilotStore,
} from "./pilot";

beforeEach(() => {
  window.localStorage.clear();
  usePilotStore.getState().reset();
});

afterEach(() => {
  window.localStorage.clear();
  usePilotStore.getState().reset();
});

describe("pilot readiness store", () => {
  it("toggles checklist items", () => {
    usePilotStore.getState().toggleChecklistItem("devices");
    expect(usePilotStore.getState().checklist["devices"]).toBe(true);
    usePilotStore.getState().toggleChecklistItem("devices");
    expect(usePilotStore.getState().checklist["devices"]).toBe(false);
  });

  it("stores feedback locally without any student identity field", () => {
    // The feedback questions never ask for a student name.
    const ids = PILOT_FEEDBACK_QUESTIONS.map((q) => q.id).join(" ");
    const labels = PILOT_FEEDBACK_QUESTIONS.map((q) => q.label)
      .join(" ")
      .toLowerCase();
    expect(ids).not.toMatch(/student.*name|real.*name/i);
    expect(labels).not.toContain("student name");

    usePilotStore.getState().addFeedback({
      lessonId: "meet-the-system",
      answers: { "begin-without-help": "Yes" },
    });
    const entry = usePilotStore.getState().feedback[0];
    expect(entry.answers["begin-without-help"]).toBe("Yes");
    expect(Object.keys(entry)).not.toContain("studentName");
  });

  it("clears feedback and checklist", () => {
    usePilotStore.getState().toggleChecklistItem("projector");
    usePilotStore.getState().addFeedback({ answers: { x: "y" } });
    usePilotStore.getState().clearFeedback();
    usePilotStore.getState().resetChecklist();
    expect(usePilotStore.getState().feedback).toEqual([]);
    expect(usePilotStore.getState().checklist).toEqual({});
  });

  it("sanitises corrupted persisted pilot state", () => {
    const clean = sanitizePilotState({
      checklist: { devices: "yes", nonsense: true },
      feedback: [{ createdAt: 1, answers: {} }, "garbage", null],
    });
    expect(clean.checklist["devices"]).toBe(false); // non-boolean coerced
    expect(clean.feedback).toHaveLength(1);
    // Only known checklist ids are retained.
    expect(Object.keys(clean.checklist)).toEqual(
      PILOT_CHECKLIST.map((i) => i.id),
    );
  });
});

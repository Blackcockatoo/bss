import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FIELD_MISSION_PROGRESS_STORAGE_KEY,
  sanitizeFieldMissionProgressState,
  selectFieldMissionRecord,
  useFieldMissionProgressStore,
} from "./fieldMissionProgressStore";

function resetStore() {
  useFieldMissionProgressStore.getState().resetAll();
}

describe("Field Mission progress store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("uses a namespaced, versioned storage key", () => {
    expect(FIELD_MISSION_PROGRESS_STORAGE_KEY).toBe(
      "metapet-field-mission-progress",
    );
  });

  it("marks a mission complete and reads it back", () => {
    useFieldMissionProgressStore.getState().completeMission("silent-signal");
    const record = selectFieldMissionRecord(
      useFieldMissionProgressStore.getState(),
      "silent-signal",
    );
    expect(record.completed).toBe(true);
    expect(record.completedAt).not.toBeNull();
  });

  it("saves a short class note without student names by contract (caller-enforced) and caps length", () => {
    useFieldMissionProgressStore
      .getState()
      .setMissionNote("pet-detective", "a".repeat(1000));
    const record = selectFieldMissionRecord(
      useFieldMissionProgressStore.getState(),
      "pet-detective",
    );
    expect(record.note.length).toBe(280);
  });

  it("resets a single mission and all missions", () => {
    useFieldMissionProgressStore.getState().completeMission("broken-loop");
    useFieldMissionProgressStore.getState().resetMission("broken-loop");
    expect(
      selectFieldMissionRecord(
        useFieldMissionProgressStore.getState(),
        "broken-loop",
      ).completed,
    ).toBe(false);

    useFieldMissionProgressStore.getState().completeMission("broken-loop");
    useFieldMissionProgressStore.getState().resetAll();
    expect(useFieldMissionProgressStore.getState().records).toEqual({});
  });

  it("drops unknown mission ids and repairs corrupted records", () => {
    const clean = sanitizeFieldMissionProgressState({
      records: {
        "silent-signal": { completed: true, completedAt: 1, note: "ok" },
        "ghost-mission": { completed: true },
      },
    });
    expect(Object.keys(clean.records)).toEqual(["silent-signal"]);
  });

  it("returns a safe default for garbage input", () => {
    expect(sanitizeFieldMissionProgressState(null).records).toEqual({});
    expect(sanitizeFieldMissionProgressState("nonsense").records).toEqual({});
  });
});

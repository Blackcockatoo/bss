import { describe, expect, it } from "vitest";

import { isClassConsequenceActionId } from "./classConsequences";
import {
  FIELD_MISSIONS,
  FIELD_MISSION_IDS,
  getFieldMissionBySlug,
  isFieldMissionId,
} from "./fieldMissions";
import { LESSON_IDS } from "./lessonDefinitions";

describe("Field Missions", () => {
  it("defines exactly eight missions", () => {
    expect(FIELD_MISSIONS).toHaveLength(8);
    expect(FIELD_MISSION_IDS).toHaveLength(8);
  });

  it("has unique ids and slugs", () => {
    expect(new Set(FIELD_MISSIONS.map((m) => m.id)).size).toBe(8);
    expect(new Set(FIELD_MISSIONS.map((m) => m.slug)).size).toBe(8);
  });

  it("keeps every mission short (5-10 minutes) and low-prep", () => {
    for (const mission of FIELD_MISSIONS) {
      expect(mission.minutes).toBeGreaterThanOrEqual(5);
      expect(mission.minutes).toBeLessThanOrEqual(10);
      expect(mission.teacherPrompt.length).toBeGreaterThan(0);
      expect(mission.studentTask.length).toBeGreaterThan(0);
      expect(mission.reflectionPrompt.length).toBeGreaterThan(0);
    }
  });

  it("gives every mission an off-screen action", () => {
    for (const mission of FIELD_MISSIONS) {
      expect(mission.offScreenAction.length).toBeGreaterThan(0);
    }
  });

  it("only references real, canonical lessons", () => {
    for (const mission of FIELD_MISSIONS) {
      for (const lessonId of mission.relatedLessonIds) {
        expect(LESSON_IDS).toContain(lessonId);
      }
    }
  });

  it("only references real, known class-consequence actions", () => {
    for (const mission of FIELD_MISSIONS) {
      expect(isClassConsequenceActionId(mission.consequenceActionId)).toBe(true);
    }
  });

  it("looks missions up by slug and guards ids", () => {
    expect(getFieldMissionBySlug("privacy-inspector")?.title).toBe(
      "Privacy Inspector",
    );
    expect(getFieldMissionBySlug("nope")).toBeUndefined();
    expect(getFieldMissionBySlug(undefined)).toBeUndefined();
    expect(isFieldMissionId("silent-signal")).toBe(true);
    expect(isFieldMissionId("not-a-mission")).toBe(false);
    expect(isFieldMissionId(42)).toBe(false);
  });

  it("includes the named starter set", () => {
    const titles = FIELD_MISSIONS.map((m) => m.title).sort();
    expect(titles).toEqual(
      [
        "Silent Signal",
        "One Change Only",
        "Broken Loop",
        "Pet Detective",
        "Privacy Inspector",
        "Pattern Mutation",
        "Low-Tech Rescue",
        "Explain It Simply",
      ].sort(),
    );
  });
});

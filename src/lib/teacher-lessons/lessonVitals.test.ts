import { describe, expect, it } from "vitest";

import {
  DEFAULT_CLASSROOM_VITALS,
  applyLessonAction,
  describeRealEffect,
  getActionMeta,
  vitalsBalanceScore,
} from "./lessonVitals";
import { INTERACTION_EFFECTS } from "@/vitals";

describe("classroom vitals sandbox", () => {
  it("drives the four core vitals with the real interaction model", () => {
    const after = applyLessonAction(DEFAULT_CLASSROOM_VITALS, "feed");
    // Real 'feed' raises hunger by +20 (clamped).
    expect(after.hunger).toBe(
      Math.min(100, DEFAULT_CLASSROOM_VITALS.hunger + INTERACTION_EFFECTS.feed.hunger),
    );
  });

  it("play has a secondary effect on energy (one action, several needs)", () => {
    const after = applyLessonAction(DEFAULT_CLASSROOM_VITALS, "play");
    expect(after.mood).toBeGreaterThan(DEFAULT_CLASSROOM_VITALS.mood);
    expect(after.energy).toBeLessThan(DEFAULT_CLASSROOM_VITALS.energy);
  });

  it("comfort is a classroom-only action affecting trust and stress", () => {
    const after = applyLessonAction(DEFAULT_CLASSROOM_VITALS, "comfort");
    expect(after.trust).toBeGreaterThan(DEFAULT_CLASSROOM_VITALS.trust);
    expect(after.stress).toBeLessThan(DEFAULT_CLASSROOM_VITALS.stress);
  });

  it("keeps all vitals within 0-100", () => {
    let vitals = { ...DEFAULT_CLASSROOM_VITALS };
    for (let i = 0; i < 20; i += 1) {
      vitals = applyLessonAction(vitals, "play");
      for (const value of Object.values(vitals)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("computes a balance score", () => {
    const score = vitalsBalanceScore(DEFAULT_CLASSROOM_VITALS);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("describes the real effect for teacher explanations", () => {
    expect(describeRealEffect("feed")).toContain("Real Meta-Pet effect");
    expect(describeRealEffect("comfort")).toContain("classroom care action");
    expect(getActionMeta("play").label).toBe("Play");
  });
});

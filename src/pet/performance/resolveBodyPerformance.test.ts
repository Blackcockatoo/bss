import { describe, expect, it } from "vitest";

import { DEFAULT_VITALS, type Vitals } from "@/vitals";
import {
  derivePresentationVitals,
  resolveBodyPerformance,
  type BodyPerformanceInput,
} from "./resolveBodyPerformance";
import type { BodyPerformanceState } from "./types";

const baseInput = (overrides: Partial<Vitals> = {}): BodyPerformanceInput => ({
  vitals: { ...DEFAULT_VITALS, ...overrides },
});

function expectAllFinite(state: BodyPerformanceState) {
  for (const [key, value] of Object.entries(state)) {
    expect(Number.isFinite(value), `${key} should be finite`).toBe(true);
  }
}

describe("resolveBodyPerformance", () => {
  it("is deterministic: identical input yields identical output", () => {
    const input = baseInput({ hunger: 62, energy: 41, mood: 77, hygiene: 12 });
    expect(resolveBodyPerformance(input)).toEqual(
      resolveBodyPerformance(input),
    );
  });

  it("clamps extreme and hostile vitals safely", () => {
    const hostile = resolveBodyPerformance({
      vitals: {
        hunger: Number.POSITIVE_INFINITY,
        hygiene: -5_000,
        mood: Number.NaN,
        energy: 10_000,
        isSick: true,
        sicknessSeverity: Number.POSITIVE_INFINITY,
        sicknessType: "hungry",
        deathCount: 0,
      },
    });
    expectAllFinite(hostile);
    expect(hostile.posture).toBeGreaterThanOrEqual(-1);
    expect(hostile.posture).toBeLessThanOrEqual(1);
    expect(hostile.eyelidOpen).toBeGreaterThan(0);
    expect(hostile.breathSeconds).toBeGreaterThan(0);
    expect(hostile.saturation).toBeGreaterThan(0);
  });

  it("keeps every unit-range channel within 0..1", () => {
    for (const vitals of [
      {},
      { hunger: 100, energy: 0, mood: 0, hygiene: 0 },
      { hunger: 0, energy: 100, mood: 100, hygiene: 100 },
    ]) {
      const state = resolveBodyPerformance(baseInput(vitals));
      for (const key of [
        "hungerNeed",
        "fatigue",
        "cheer",
        "surfaceClarity",
        "health",
        "trust",
        "curiosity",
        "stress",
        "bellyTension",
        "movementWeight",
        "animationAmplitude",
        "browTension",
        "mouthOpen",
        "gazeConfidence",
        "gazeTracking",
        "proximity",
        "sparkle",
        "outlineCleanliness",
        "postureStability",
        "auraCohesion",
        "auraTurbulence",
        "limbTension",
        "featureActivity",
        "bounce",
      ] as const) {
        expect(state[key], key).toBeGreaterThanOrEqual(0);
        expect(state[key], key).toBeLessThanOrEqual(1);
      }
    }
  });

  it("maps state to readable body language", () => {
    const content = resolveBodyPerformance(
      baseInput({ hunger: 10, energy: 90, mood: 90, hygiene: 90 }),
    );
    const starving = resolveBodyPerformance(
      baseInput({ hunger: 96, energy: 90, mood: 90, hygiene: 90 }),
    );
    const exhausted = resolveBodyPerformance(
      baseInput({ hunger: 10, energy: 5, mood: 60 }),
    );
    const dirty = resolveBodyPerformance(baseInput({ hygiene: 4 }));
    const sick = resolveBodyPerformance({
      vitals: {
        ...DEFAULT_VITALS,
        isSick: true,
        sicknessSeverity: 80,
        sicknessType: "dirty",
      },
    });

    // Hunger tightens the belly and drops the posture.
    expect(starving.bellyTension).toBeGreaterThan(content.bellyTension);
    expect(starving.posture).toBeLessThan(content.posture);
    // Energy opens the eyes and quickens breath/response.
    expect(exhausted.eyelidOpen).toBeLessThan(content.eyelidOpen);
    expect(exhausted.breathSeconds).toBeGreaterThan(content.breathSeconds);
    expect(exhausted.responseSpeed).toBeLessThan(content.responseSpeed);
    // Mood curves the mouth and adds bounce.
    expect(content.mouthCurve).toBeGreaterThan(0);
    expect(content.bounce).toBeGreaterThan(exhausted.bounce);
    // Hygiene owns surface clarity and sparkle.
    expect(dirty.surfaceClarity).toBeLessThan(content.surfaceClarity);
    expect(dirty.sparkle).toBeLessThan(content.sparkle);
    expect(dirty.outlineCleanliness).toBeLessThan(content.outlineCleanliness);
    // Health owns saturation, stability and aura cohesion.
    expect(sick.saturation).toBeLessThan(content.saturation);
    expect(sick.postureStability).toBeLessThan(content.postureStability);
    expect(sick.auraCohesion).toBeLessThan(content.auraCohesion);
  });

  it("derives presentation-only trust/curiosity/stress from existing state", () => {
    const calm = derivePresentationVitals(
      baseInput({ mood: 85, energy: 80, hunger: 15 }),
    );
    const crisis = derivePresentationVitals({
      vitals: {
        ...DEFAULT_VITALS,
        hunger: 95,
        energy: 6,
        mood: 10,
        isSick: true,
        sicknessSeverity: 70,
        sicknessType: "hungry",
      },
    });
    for (const value of [
      calm.trust,
      calm.curiosity,
      calm.stress,
      crisis.trust,
      crisis.curiosity,
      crisis.stress,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(crisis.stress).toBeGreaterThan(calm.stress);
    expect(crisis.trust).toBeLessThan(calm.trust);
    expect(crisis.curiosity).toBeLessThan(calm.curiosity);
  });

  it("softens motion under reduced motion without going dead", () => {
    const normal = resolveBodyPerformance(baseInput({ mood: 80, energy: 80 }));
    const reduced = resolveBodyPerformance({
      ...baseInput({ mood: 80, energy: 80 }),
      reducedMotion: true,
    });
    expect(reduced.animationAmplitude).toBeLessThan(
      normal.animationAmplitude,
    );
    expect(reduced.breathDepth).toBeLessThan(normal.breathDepth);
    expect(reduced.animationAmplitude).toBeGreaterThan(0);
    // Expression channels stay readable — state legibility is not motion.
    expect(reduced.eyelidOpen).toBe(normal.eyelidOpen);
    expect(reduced.mouthCurve).toBe(normal.mouthCurve);
  });

  it("never mutates its input", () => {
    const vitals = Object.freeze({ ...DEFAULT_VITALS });
    const input = Object.freeze({ vitals });
    expect(() => resolveBodyPerformance(input)).not.toThrow();
  });
});

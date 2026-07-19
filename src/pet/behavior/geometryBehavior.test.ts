import { describe, expect, it } from "vitest";

import type { DerivedTraits } from "@/lib/genome";
import type { HeptaProfileV2 } from "@/lib/heptaProfile";

import {
  decideGeometryBehavior,
  deriveGeometryBehaviorSpec,
  nextGeometryBehaviorDelayMs,
} from "./geometryBehavior";

function profile(dominant: "void" | "spark"): HeptaProfileV2 {
  const active = dominant === "spark";
  return {
    version: "hepta-profile/v2",
    axes: {
      void: active ? 4 : 58,
      spark: active ? 48 : 4,
      sense: 10,
      voice: 8,
      frame: active ? 6 : 14,
      flux: active ? 18 : 2,
      crown: 6,
    },
    dominantAxis: dominant,
    secondaryAxis: active ? "flux" : "frame",
    temperament: active ? "fiery-restless" : "still-steadfast",
    behaviorWeights: {
      cadence: active ? 0.8 : 0.03,
      greeting: 0.1,
      curiosity: 0.1,
      steadiness: active ? 0.06 : 0.14,
      rest: active ? 0.04 : 0.58,
      confidence: 0.06,
      variety: active ? 0.18 : 0.02,
    },
    matrix: Array.from({ length: 7 }, () => Array(7).fill(1)),
  };
}

function personality(active: boolean): DerivedTraits["personality"] {
  return {
    temperament: active ? "Energetic" : "Calm",
    energy: active ? 95 : 15,
    social: 50,
    curiosity: 50,
    discipline: active ? 20 : 90,
    affection: 50,
    independence: 50,
    playfulness: active ? 95 : 10,
    loyalty: 50,
    quirks: [],
  };
}

describe("Geometry personality behavior", () => {
  it("gives an energetic spark pet a visibly faster cadence", () => {
    const active = deriveGeometryBehaviorSpec(
      profile("spark"),
      personality(true),
    );
    const calm = deriveGeometryBehaviorSpec(
      profile("void"),
      personality(false),
    );
    expect(active.minIntervalMs).toBeLessThan(calm.minIntervalMs);
    expect(active.maxIntervalMs).toBeLessThan(calm.maxIntervalMs);
    expect(active.movementWeights.dance).toBeGreaterThan(
      calm.movementWeights.dance,
    );
    expect(calm.movementWeights.lotus).toBeGreaterThan(
      active.movementWeights.lotus,
    );
  });

  it("replays the same delays and decisions for the same pet seed", () => {
    const spec = deriveGeometryBehaviorSpec(
      profile("spark"),
      personality(true),
    );
    expect(nextGeometryBehaviorDelayMs(spec, 123, 7)).toBe(
      nextGeometryBehaviorDelayMs(spec, 123, 7),
    );
    expect(decideGeometryBehavior(spec, 123, 7)).toEqual(
      decideGeometryBehavior(spec, 123, 7),
    );
  });

  it("respects critical and reduced-motion gates", () => {
    const spec = deriveGeometryBehaviorSpec(
      profile("spark"),
      personality(true),
    );
    expect(
      decideGeometryBehavior(spec, 1, 1, { critical: true }).movement,
    ).toBe("lotus");
    expect(
      decideGeometryBehavior(spec, 1, 1, { reduceMotion: true }).movement,
    ).toBe("idle");
  });

  it("keeps every interval inside the promised 2.5–12 second window", () => {
    const spec = deriveGeometryBehaviorSpec(
      profile("spark"),
      personality(true),
    );
    for (let tick = 0; tick < 100; tick += 1) {
      const delay = nextGeometryBehaviorDelayMs(spec, 99, tick);
      expect(delay).toBeGreaterThanOrEqual(2_500);
      expect(delay).toBeLessThanOrEqual(12_000);
    }
  });
});

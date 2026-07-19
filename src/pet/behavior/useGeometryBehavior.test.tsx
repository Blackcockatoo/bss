import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DerivedTraits } from "@/lib/genome";
import type { HeptaProfileV2 } from "@/lib/heptaProfile";
import { hashSeed } from "@/pet/movement/movementScheduler";

import {
  decideGeometryBehavior,
  deriveGeometryBehaviorSpec,
  nextGeometryBehaviorDelayMs,
} from "./geometryBehavior";
import { useGeometryBehavior } from "./useGeometryBehavior";

const profile: HeptaProfileV2 = {
  version: "hepta-profile/v2",
  axes: {
    void: 2,
    spark: 92,
    sense: 24,
    voice: 4,
    frame: 5,
    flux: 88,
    crown: 70,
  },
  dominantAxis: "spark",
  secondaryAxis: "flux",
  temperament: "fiery-restless",
  behaviorWeights: {
    cadence: 0.95,
    greeting: 0,
    curiosity: 0.2,
    steadiness: 0.05,
    rest: 0.02,
    confidence: 0.7,
    variety: 0.9,
  },
  matrix: Array.from({ length: 7 }, () => Array(7).fill(1)),
};

const personality: DerivedTraits["personality"] = {
  temperament: "Energetic",
  energy: 95,
  social: 0,
  curiosity: 85,
  discipline: 20,
  affection: 0,
  independence: 75,
  playfulness: 96,
  loyalty: 0,
  quirks: [],
};

afterEach(() => {
  vi.useRealTimers();
});
describe("useGeometryBehavior", () => {
  it("fires the pet-seeded movement at its exact recursive timeout", () => {
    vi.useFakeTimers();
    const spec = deriveGeometryBehaviorSpec(profile, personality);
    let identityKey = "timed-pet-0";
    let seed = hashSeed(identityKey);
    let expected = decideGeometryBehavior(spec, seed, 1, {
      previousMovement: "idle",
    });
    for (let index = 1; expected.movement === "idle"; index += 1) {
      identityKey = `timed-pet-${index}`;
      seed = hashSeed(identityKey);
      expected = decideGeometryBehavior(spec, seed, 1, {
        previousMovement: "idle",
      });
    }
    const delay = nextGeometryBehaviorDelayMs(spec, seed, 0);
    const { result } = renderHook(() =>
      useGeometryBehavior({ identityKey, profile, personality }),
    );

    act(() => vi.advanceTimersByTime(delay - 1));
    expect(result.current.movement).toBe("idle");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.movement).toBe(expected.movement);
    expect(result.current.intent).toBe(expected.intent);

    act(() => vi.advanceTimersByTime(expected.durationMs));
    expect(result.current.movement).toBe("idle");
  });

  it("gives care actions priority while reduced motion remains an override", () => {
    vi.useFakeTimers();
    const initial = {
      identityKey: "care-pet",
      profile,
      personality,
      lastAction: null as string | null,
      lastActionAt: 0,
      reduceMotion: false,
    };
    const { result, rerender } = renderHook(
      (options: typeof initial) => useGeometryBehavior(options),
      { initialProps: initial },
    );

    rerender({ ...initial, lastAction: "play", lastActionAt: 100 });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.movement).toBe("dance");
    expect(result.current.intent).toBe("Responding to play");

    rerender({
      ...initial,
      lastAction: "play",
      lastActionAt: 101,
      reduceMotion: true,
    });
    expect(result.current.movement).toBe("idle");
    expect(result.current.intent).toBe("Resting with reduced motion");
  });
});

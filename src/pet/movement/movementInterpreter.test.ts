import { describe, expect, it } from "vitest";

import { DEFAULT_VITALS } from "@/vitals";
import {
  NEUTRAL_PERFORMANCE,
  PERFORMANCE_BOUNDS,
  clampPerformance,
  resolveBodyPerformance,
  type MovementPerformance,
} from "@/pet/performance";
import { MOVEMENT_CLIPS } from "./movementVocabulary";
import {
  baselinePerformance,
  interpretMovement,
  type MovementBodyContext,
  type MovementInterpreterContext,
} from "./movementInterpreter";

const WINGED: MovementBodyContext = {
  hasWings: true,
  wingStyle: "feather",
  wingPurpose: "flight",
  hasThirdEye: true,
  hasTailFlame: true,
  hasHorns: false,
  hasCrown: false,
};

const WINGLESS: MovementBodyContext = {
  hasWings: false,
  wingStyle: "veil",
  wingPurpose: "decorative",
  hasThirdEye: false,
  hasTailFlame: false,
  hasHorns: true,
  hasCrown: true,
};

function makeContext(
  overrides: Partial<MovementInterpreterContext> = {},
): MovementInterpreterContext {
  return {
    body: WINGED,
    performance: resolveBodyPerformance({ vitals: DEFAULT_VITALS }),
    intensity: 0.8,
    reducedMotion: false,
    seed: 12345,
    ...overrides,
  };
}

function expectBounded(frame: MovementPerformance, label: string) {
  for (const key of Object.keys(
    NEUTRAL_PERFORMANCE,
  ) as Array<keyof MovementPerformance>) {
    const value = frame[key];
    expect(Number.isFinite(value), `${label}.${key} finite`).toBe(true);
    expect(value, `${label}.${key} >= min`).toBeGreaterThanOrEqual(
      PERFORMANCE_BOUNDS.min[key],
    );
    expect(value, `${label}.${key} <= max`).toBeLessThanOrEqual(
      PERFORMANCE_BOUNDS.max[key],
    );
  }
}

describe("interpretMovement", () => {
  const clipIds = Object.keys(MOVEMENT_CLIPS);

  it("covers the entire registered vocabulary", () => {
    expect(clipIds.length).toBeGreaterThanOrEqual(21);
  });

  it("produces a valid bounded frame for every clip at 0, midpoint and 1", () => {
    for (const clipId of clipIds) {
      for (const body of [WINGED, WINGLESS]) {
        for (const reducedMotion of [false, true]) {
          for (const t of [0, 0.5, 1]) {
            const frame = interpretMovement(
              clipId,
              t,
              makeContext({ body, reducedMotion }),
            );
            expectBounded(
              frame,
              `${clipId}@${t}${body.hasWings ? "" : " wingless"}${reducedMotion ? " rm" : ""}`,
            );
          }
        }
      }
    }
  });

  it("survives hostile progress values", () => {
    for (const t of [-5, Number.NaN, Number.POSITIVE_INFINITY, 42]) {
      const frame = interpretMovement("happy_bounce", t, makeContext());
      expectBounded(frame, `happy_bounce@${t}`);
    }
  });

  it("is deterministic for identical inputs", () => {
    const ctx = makeContext();
    expect(interpretMovement("quantum_stutter", 0.4, ctx)).toEqual(
      interpretMovement("quantum_stutter", 0.4, ctx),
    );
  });

  it("varies quantum_stutter phase by pet seed, not randomness", () => {
    const a = interpretMovement(
      "quantum_stutter",
      0.4,
      makeContext({ seed: 1 }),
    );
    const b = interpretMovement(
      "quantum_stutter",
      0.4,
      makeContext({ seed: 999_331 }),
    );
    expect(a.bodyX).not.toBe(b.bodyX);
  });

  it("resolves unknown clips to the living baseline", () => {
    const ctx = makeContext();
    expect(interpretMovement("no_such_clip", 0.5, ctx)).toEqual(
      baselinePerformance(ctx.performance),
    );
  });

  it("gives wing moves a non-destructive fallback on wingless bodies", () => {
    const winged = interpretMovement(
      "black_wing_bloom",
      0.5,
      makeContext({ body: WINGED }),
    );
    const wingless = interpretMovement(
      "black_wing_bloom",
      0.5,
      makeContext({ body: WINGLESS }),
    );
    // Real wings open; absent wings raise a shadow-field impression.
    expect(winged.wingSpread).toBeGreaterThan(1);
    expect(wingless.shadowEnclosure).toBeGreaterThan(winged.shadowEnclosure);

    const hideWinged = interpretMovement(
      "folded_wing_hide",
      0.5,
      makeContext({ body: WINGED }),
    );
    const hideWingless = interpretMovement(
      "folded_wing_hide",
      0.5,
      makeContext({ body: WINGLESS }),
    );
    expect(hideWinged.wingFold).toBeGreaterThan(0.3);
    expect(hideWingless.shadowEnclosure).toBeGreaterThan(
      hideWinged.shadowEnclosure,
    );
  });

  it("moves wings differently per purpose", () => {
    const purposes = ["flight", "attack", "attract", "defend", "decorative"] as const;
    const frames = purposes.map((wingPurpose) =>
      interpretMovement(
        "wing_flutter",
        0.3,
        makeContext({ body: { ...WINGED, wingPurpose } }),
      ),
    );
    const signatures = new Set(
      frames.map(
        (frame) =>
          `${frame.wingSpread.toFixed(4)}|${frame.wingFold.toFixed(4)}|${frame.featureIntensity.toFixed(4)}|${frame.bodyY.toFixed(4)}|${frame.rotation.toFixed(4)}`,
      ),
    );
    expect(signatures.size).toBe(purposes.length);
  });

  it("suppresses phase echoes and softens amplitude under reduced motion", () => {
    for (const clipId of clipIds) {
      const frame = interpretMovement(
        clipId,
        0.5,
        makeContext({ reducedMotion: true }),
      );
      expect(frame.phaseEchoes, clipId).toBe(0);
    }
    const normal = interpretMovement("happy_bounce", 0.25, makeContext());
    const reduced = interpretMovement(
      "happy_bounce",
      0.25,
      makeContext({ reducedMotion: true }),
    );
    expect(Math.abs(reduced.bodyY)).toBeLessThan(Math.abs(normal.bodyY));
  });

  it("returns to a settled pose: progress 1 is close to the baseline", () => {
    const ctx = makeContext();
    const base = baselinePerformance(ctx.performance);
    for (const clipId of ["happy_bounce", "tap_surprise", "swipe_spin", "beat_hit"]) {
      const end = interpretMovement(clipId, 1, ctx);
      expect(Math.abs(end.bodyY - base.bodyY), clipId).toBeLessThan(2.5);
      expect(Math.abs(end.rotation - base.rotation), clipId).toBeLessThan(3);
      expect(Math.abs(end.scaleX - base.scaleX), clipId).toBeLessThan(0.06);
    }
  });

  it("shows off the anatomy a stage just granted during stage_emergence", () => {
    const ctx = makeContext({ body: WINGED });
    const base = baselinePerformance(ctx.performance);
    const reveal = interpretMovement("stage_emergence", 0.5, ctx);

    // The reveal beat lifts, stretches, opens the wings and lights every
    // feature accent so the newly granted anatomy is impossible to miss.
    expect(reveal.bodyY).toBeLessThan(base.bodyY);
    expect(reveal.scaleY).toBeGreaterThan(base.scaleY);
    expect(reveal.wingSpread).toBeGreaterThan(1);
    expect(reveal.featureIntensity).toBeGreaterThan(0.5);
    expect(reveal.auraPulse).toBeGreaterThan(0.3);

    // Eyes squeeze shut while the change lands, then reopen for the reveal.
    const during = interpretMovement("stage_emergence", 0.3, ctx);
    expect(during.eyelidOpen).toBeLessThan(reveal.eyelidOpen);

    // It settles back onto the body instead of leaving it parked mid-pose.
    const end = interpretMovement("stage_emergence", 1, ctx);
    expect(Math.abs(end.bodyY - base.bodyY)).toBeLessThan(2.5);
    expect(Math.abs(end.scaleY - base.scaleY)).toBeLessThan(0.06);
  });

  it("gives each stage signature move its own distinct shape", () => {
    const ctx = makeContext({ body: WINGED });
    const signatures = [
      "genesis_shimmer",
      "neuro_lattice_ripple",
      "phase_drift",
      "crown_ascend",
    ].map((clipId) => interpretMovement(clipId, 0.5, ctx));

    const fingerprints = new Set(
      signatures.map((frame) =>
        [
          frame.bodyX.toFixed(4),
          frame.bodyY.toFixed(4),
          frame.auraScale.toFixed(4),
          frame.featureIntensity.toFixed(4),
          frame.phaseEchoes,
        ].join("|"),
      ),
    );
    expect(fingerprints.size).toBe(signatures.length);

    const [genesis, , phase, crown] = signatures;
    // GENETICS barely moves; the apex display is the biggest ambient move.
    expect(Math.abs(genesis.bodyY)).toBeLessThan(Math.abs(crown.bodyY));
    // Only the quantum-class move splits the silhouette.
    expect(phase.phaseEchoes).toBeGreaterThan(0);
    expect(crown.wingSpread).toBeGreaterThan(1);
  });

  it("keeps stage signature moves readable on bodies missing the stage feature", () => {
    // A NEURO pet whose forge body has no horns still carries the signal —
    // through the aura instead of the missing anatomy.
    const withHorns = interpretMovement(
      "neuro_lattice_ripple",
      0.5,
      makeContext({ body: WINGLESS }),
    );
    const withoutHorns = interpretMovement(
      "neuro_lattice_ripple",
      0.5,
      makeContext({ body: { ...WINGLESS, hasHorns: false } }),
    );
    expect(withHorns.featureIntensity).toBeGreaterThan(
      withoutHorns.featureIntensity,
    );
    expect(withoutHorns.auraPulse).toBeGreaterThan(0);
  });

  it("never mutates the living performance state", () => {
    const performance = Object.freeze(
      resolveBodyPerformance({ vitals: DEFAULT_VITALS }),
    );
    expect(() =>
      interpretMovement("evolution_ceremony", 0.6, makeContext({ performance })),
    ).not.toThrow();
  });
});

describe("clampPerformance", () => {
  it("squashes non-finite channels back to neutral", () => {
    const broken = {
      ...NEUTRAL_PERFORMANCE,
      bodyX: Number.NaN,
      scaleY: Number.POSITIVE_INFINITY,
    };
    const fixed = clampPerformance(broken);
    expect(fixed.bodyX).toBe(NEUTRAL_PERFORMANCE.bodyX);
    expect(fixed.scaleY).toBeLessThanOrEqual(PERFORMANCE_BOUNDS.max.scaleY);
  });
});

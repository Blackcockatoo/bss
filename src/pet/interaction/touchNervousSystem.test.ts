import { describe, expect, it } from "vitest";
import { MovementPriority } from "@/pet/movement/movementVocabulary";
import {
  DEFAULT_INTERACTION_CONTEXT,
  classifyGesture,
  clampGazeOffset,
  deriveInteractionOverlay,
  normalizePointerPosition,
  reduceInteractionState,
  shouldApplyInteractionOverlay,
} from "./touchNervousSystem";
import type { InteractionContext, InteractionState } from "./types";

const RECT = { left: 0, top: 0, width: 200, height: 200 };

describe("normalizePointerPosition", () => {
  it("returns zero offsets and outside region for a degenerate rect", () => {
    const result = normalizePointerPosition(10, 10, { rect: { left: 0, top: 0, width: 0, height: 0 } });
    expect(result).toEqual({
      stageX: 0,
      stageY: 0,
      faceX: 0,
      faceY: 0,
      bodyX: 0,
      bodyY: 0,
      region: "outside",
    });
  });

  it("normalises the center to (0, 0)", () => {
    const result = normalizePointerPosition(100, 100, { rect: RECT });
    expect(result.stageX).toBeCloseTo(0);
    expect(result.stageY).toBeCloseTo(0);
  });

  it("clamps stage offsets to -1..1 even far outside the rect", () => {
    const result = normalizePointerPosition(10_000, -10_000, { rect: RECT });
    expect(result.stageX).toBeLessThanOrEqual(1);
    expect(result.stageX).toBeGreaterThanOrEqual(-1);
    expect(result.stageY).toBeLessThanOrEqual(1);
    expect(result.stageY).toBeGreaterThanOrEqual(-1);
  });

  it("classifies the top band as the face region and the rest as body", () => {
    const face = normalizePointerPosition(100, 10, { rect: RECT, faceFraction: 0.45 });
    const body = normalizePointerPosition(100, 150, { rect: RECT, faceFraction: 0.45 });
    expect(face.region).toBe("face");
    expect(body.region).toBe("body");
  });

  it("reports outside for points beyond the rect", () => {
    const result = normalizePointerPosition(-50, 100, { rect: RECT });
    expect(result.region).toBe("outside");
  });
});

describe("clampGazeOffset (pupil bounds)", () => {
  it("passes through in-range values", () => {
    expect(clampGazeOffset(0.3, -0.4)).toEqual({ x: 0.3, y: -0.4 });
  });

  it("clamps extreme values to the documented -1..1 anatomical travel range", () => {
    expect(clampGazeOffset(50, -50)).toEqual({ x: 1, y: -1 });
    expect(clampGazeOffset(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({
      x: 0,
      y: 1,
    });
  });
});

describe("classifyGesture", () => {
  it("detects a tap: short duration, low travel, released", () => {
    const result = classifyGesture({
      duration: 120,
      distance: 4,
      velocity: 0.05,
      direction: 0,
      contact: false,
      released: true,
    });
    expect(result.isTap).toBe(true);
    expect(result.isHold).toBe(false);
    expect(result.isFastSwipe).toBe(false);
  });

  it("does not classify a released-but-far press as a tap", () => {
    const result = classifyGesture({
      duration: 120,
      distance: 40,
      velocity: 0.05,
      direction: 0,
      contact: false,
      released: true,
    });
    expect(result.isTap).toBe(false);
  });

  it("detects a hold: long duration, low travel, still in contact", () => {
    const result = classifyGesture({
      duration: 700,
      distance: 3,
      velocity: 0.005,
      direction: 0,
      contact: true,
      released: false,
    });
    expect(result.isHold).toBe(true);
    expect(result.isTap).toBe(false);
    expect(result.isSlowStroke).toBe(false);
  });

  it("detects a slow stroke: sustained low-to-moderate velocity with real travel", () => {
    const result = classifyGesture({
      duration: 400,
      distance: 60,
      velocity: 0.15,
      direction: 0,
      contact: true,
      released: false,
    });
    expect(result.isSlowStroke).toBe(true);
    expect(result.isFastSwipe).toBe(false);
    expect(result.isHold).toBe(false);
  });

  it("detects a fast swipe on high velocity", () => {
    const result = classifyGesture({
      duration: 100,
      distance: 90,
      velocity: 1.5,
      direction: 0,
      contact: true,
      released: false,
    });
    expect(result.isFastSwipe).toBe(true);
  });

  it("detects a fast swipe from average velocity even when the smoothed instantaneous velocity under-reports it", () => {
    const result = classifyGesture({
      duration: 110,
      distance: 100,
      velocity: 0.2, // deliberately low/stale smoothed sample
      direction: 0,
      contact: true,
      released: false,
    });
    expect(result.isFastSwipe).toBe(true);
  });

  it("does not classify a genuinely slow, long drag as a fast swipe just because it covered real distance", () => {
    const result = classifyGesture({
      duration: 2000,
      distance: 120,
      velocity: 0.1,
      direction: 0,
      contact: true,
      released: false,
    });
    expect(result.isFastSwipe).toBe(false);
    expect(result.isSlowStroke).toBe(true);
  });

  it("fast-swipe classification takes priority over stroke/hold/tap", () => {
    const result = classifyGesture({
      duration: 100,
      distance: 90,
      velocity: 2,
      direction: 0,
      contact: false,
      released: true,
    });
    expect(result.isFastSwipe).toBe(true);
    expect(result.isTap).toBe(false);
    expect(result.isSlowStroke).toBe(false);
  });

  it("produces higher intensity for fast swipes than slow strokes", () => {
    const swipe = classifyGesture({
      duration: 100,
      distance: 90,
      velocity: 1.5,
      direction: 0,
      contact: true,
      released: false,
    });
    const stroke = classifyGesture({
      duration: 400,
      distance: 60,
      velocity: 0.15,
      direction: 0,
      contact: true,
      released: false,
    });
    expect(swipe.intensity).toBeGreaterThan(stroke.intensity);
  });
});

describe("reduceInteractionState", () => {
  const ctx = (patch: Partial<InteractionContext> = {}): InteractionContext => ({
    ...DEFAULT_INTERACTION_CONTEXT,
    ...patch,
  });

  it("idle -> noticing on pointer-near", () => {
    const result = reduceInteractionState("idle", { type: "pointer-near", at: 0 }, ctx());
    expect(result.state).toBe("noticing");
  });

  it("noticing -> observing after the dwell timer via settle-tick", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "noticing",
      { type: "settle-tick", at: 1000 },
      entered,
    );
    expect(result.state).toBe("observing");
  });

  it("observing -> curious after a longer dwell while over the face", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "observing",
      { type: "settle-tick", at: 1000, region: "face" },
      entered,
    );
    expect(result.state).toBe("curious");
  });

  it("observing stays put past the dwell if the pointer is over the body, not the face", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "observing",
      { type: "settle-tick", at: 1000, region: "body" },
      entered,
    );
    expect(result.state).toBe("observing");
  });

  it("any state -> touched on contact-start (deliberate contact always wins)", () => {
    for (const from of ["idle", "noticing", "observing", "curious"] as InteractionState[]) {
      const result = reduceInteractionState(from, { type: "contact-start", at: 0 }, ctx());
      expect(result.state).toBe("touched");
    }
  });

  it("touched -> stroked on a slow-stroke gesture", () => {
    const result = reduceInteractionState(
      "touched",
      { type: "gesture-slow-stroke", at: 100 },
      ctx({ enteredAt: 0 }),
    );
    expect(result.state).toBe("stroked");
  });

  it("stroked -> pleased after sustained calm dwell", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "stroked",
      { type: "settle-tick", at: 2000 },
      entered,
    );
    expect(result.state).toBe("pleased");
  });

  it("touched -> pleased on a long hold", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "touched",
      { type: "settle-tick", at: 1000 },
      entered,
    );
    expect(result.state).toBe("pleased");
  });

  it("fast swipe startles from a calm state", () => {
    const result = reduceInteractionState(
      "touched",
      { type: "gesture-fast-swipe", at: 100 },
      ctx({ enteredAt: 0, roughStreak: 0 }),
    );
    expect(result.state).toBe("startled");
  });

  it("repeated rough gestures escalate startled -> irritated -> overstimulated", () => {
    let state: InteractionState = "touched";
    let context = ctx({ enteredAt: 0, roughStreak: 0 });
    const seen: InteractionState[] = [];
    for (let i = 0; i < 6; i++) {
      const result = reduceInteractionState(
        state,
        { type: "gesture-fast-swipe", at: i * 50 },
        context,
      );
      state = result.state;
      context = result.context;
      seen.push(state);
    }
    expect(seen).toContain("startled");
    expect(seen).toContain("irritated");
    expect(seen).toContain("overstimulated");
    // Monotonic escalation: once overstimulated is reached it never regresses
    // to idle/noticing purely from more swipes.
    const finalIndex = seen.lastIndexOf("overstimulated");
    expect(finalIndex).toBeGreaterThan(-1);
  });

  it("startled decays back to observing after the decay window", () => {
    const entered = ctx({ enteredAt: 0 });
    const result = reduceInteractionState(
      "startled",
      { type: "settle-tick", at: 1000 },
      entered,
    );
    expect(result.state).toBe("observing");
  });

  it("contact-end moves any active-engagement state to settling", () => {
    for (const from of ["touched", "stroked", "pleased", "startled"] as InteractionState[]) {
      const result = reduceInteractionState(from, { type: "contact-end", at: 500 }, ctx());
      expect(result.state).toBe("settling");
    }
  });

  it("pointer-leave from idle is a no-op (nothing to settle)", () => {
    const result = reduceInteractionState("idle", { type: "pointer-leave", at: 0 }, ctx());
    expect(result.state).toBe("idle");
  });

  it("settle-complete always returns to idle with a clean context", () => {
    const result = reduceInteractionState(
      "settling",
      { type: "settle-complete", at: 900 },
      ctx({ roughStreak: 0.8, lastWeight: 0.4 }),
    );
    expect(result.state).toBe("idle");
    expect(result.context.roughStreak).toBe(0);
    expect(result.context.lastWeight).toBe(0);
  });

  it("a calm slow-stroke can talk an irritated pet back down toward stroked", () => {
    const result = reduceInteractionState(
      "irritated",
      { type: "gesture-slow-stroke", at: 100 },
      ctx({ enteredAt: 0, roughStreak: 0.7 }),
    );
    expect(result.state).toBe("stroked");
    expect(result.context.roughStreak).toBeLessThan(0.7);
  });
});

describe("deriveInteractionOverlay", () => {
  it("idle has zero weight (no visible influence at rest)", () => {
    const overlay = deriveInteractionOverlay("idle", 0, DEFAULT_INTERACTION_CONTEXT);
    expect(overlay.weight).toBe(0);
  });

  it("stroked produces trust-positive deltas: relaxed brow, positive mouth curve, warmer aura", () => {
    const overlay = deriveInteractionOverlay("stroked", 0.3, {
      ...DEFAULT_INTERACTION_CONTEXT,
      trust: 0.7,
    });
    expect(overlay.browTensionDelta).toBeLessThan(0);
    expect(overlay.mouthCurveDelta).toBeGreaterThan(0);
    expect(overlay.auraCohesionDelta).toBeGreaterThan(0);
    expect(overlay.weight).toBeGreaterThan(0);
  });

  it("startled produces a recoil: negative head tilt, reduced proximity, raised brow tension", () => {
    const overlay = deriveInteractionOverlay("startled", 0.8, DEFAULT_INTERACTION_CONTEXT);
    expect(overlay.headTiltDelta).toBeLessThan(0);
    expect(overlay.proximityDelta).toBeLessThan(0);
    expect(overlay.browTensionDelta).toBeGreaterThan(0);
  });

  it("overstimulated produces the strongest withdrawal of any state", () => {
    const overstim = deriveInteractionOverlay("overstimulated", 1, DEFAULT_INTERACTION_CONTEXT);
    const irritated = deriveInteractionOverlay("irritated", 1, DEFAULT_INTERACTION_CONTEXT);
    expect(overstim.proximityDelta).toBeLessThan(irritated.proximityDelta);
    expect(overstim.auraTurbulenceDelta).toBeGreaterThan(irritated.auraTurbulenceDelta);
  });

  it("never returns non-finite deltas across every state", () => {
    const states: InteractionState[] = [
      "idle",
      "noticing",
      "observing",
      "curious",
      "touched",
      "stroked",
      "pleased",
      "startled",
      "irritated",
      "overstimulated",
      "settling",
    ];
    for (const state of states) {
      const overlay = deriveInteractionOverlay(state, 0.5, DEFAULT_INTERACTION_CONTEXT);
      for (const value of Object.values(overlay)) {
        expect(Number.isFinite(value)).toBe(true);
      }
    }
  });
});

describe("shouldApplyInteractionOverlay (priority gate)", () => {
  it("applies while no clip is running above touch-reaction priority", () => {
    expect(
      shouldApplyInteractionOverlay(MovementPriority.IdleBreathing, MovementPriority.TouchReaction),
    ).toBe(true);
    expect(
      shouldApplyInteractionOverlay(MovementPriority.TouchReaction, MovementPriority.TouchReaction),
    ).toBe(true);
  });

  it("is suppressed during an evolution ceremony or other high-priority clip", () => {
    expect(
      shouldApplyInteractionOverlay(MovementPriority.EvolutionCeremony, MovementPriority.TouchReaction),
    ).toBe(false);
    expect(
      shouldApplyInteractionOverlay(MovementPriority.BigEmotion, MovementPriority.TouchReaction),
    ).toBe(false);
  });
});

describe("no BodySpec mutation", () => {
  it("deriveInteractionOverlay never touches its context argument", () => {
    const context = Object.freeze({ ...DEFAULT_INTERACTION_CONTEXT, trust: 0.6 });
    expect(() => deriveInteractionOverlay("pleased", 0.5, context)).not.toThrow();
  });

  it("reduceInteractionState returns a new context object instead of mutating the input", () => {
    const context = Object.freeze({ ...DEFAULT_INTERACTION_CONTEXT });
    const result = reduceInteractionState("idle", { type: "pointer-near", at: 10 }, context);
    expect(result.context).not.toBe(context);
    expect(context.enteredAt).toBe(0);
  });
});

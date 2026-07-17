import { describe, expect, it } from "vitest";
import {
  classifySignal,
  nextInteractionState,
  HOLD_MS,
  TAP_MS,
  STARTLE_VELOCITY,
  DWELL_MS,
  NEAR_DISTANCE,
  IRRITATED_COUNT,
  OVERSTIM_COUNT,
  SETTLE_MS,
  STROKE_REVERSALS,
  type PointerFrame,
} from "./pointerSignals";

function frame(overrides: Partial<PointerFrame> = {}): PointerFrame {
  return {
    isDown: false,
    distance: 2,
    velocity: 0,
    pressDuration: 0,
    dwellMs: 0,
    reversalCount: 0,
    recentGestureCount: 0,
    pointerType: "mouse",
    ...overrides,
  };
}

describe("classifySignal", () => {
  it("classifies a short release as a tap, not a swipe", () => {
    const result = classifySignal(frame(), TAP_MS - 10, 5);
    expect(result.isTap).toBe(true);
    expect(result.isSwipe).toBe(false);
  });

  it("a long-travel release is a swipe, never a tap even if brief", () => {
    const result = classifySignal(frame(), 100, 80);
    expect(result.isSwipe).toBe(true);
    expect(result.isTap).toBe(false);
  });

  it("flags startle only above the velocity threshold", () => {
    expect(classifySignal(frame({ velocity: STARTLE_VELOCITY + 0.1 }), null, 0).isStartle).toBe(true);
    expect(classifySignal(frame({ velocity: STARTLE_VELOCITY - 0.1 }), null, 0).isStartle).toBe(false);
  });

  it("flags hold once a press exceeds HOLD_MS", () => {
    expect(
      classifySignal(frame({ isDown: true, pressDuration: HOLD_MS + 1 }), null, 0).isHold,
    ).toBe(true);
    expect(
      classifySignal(frame({ isDown: true, pressDuration: HOLD_MS - 1 }), null, 0).isHold,
    ).toBe(false);
  });

  it("flags stroke once reversals cross the threshold while pressed", () => {
    expect(
      classifySignal(
        frame({ isDown: true, reversalCount: STROKE_REVERSALS }),
        null,
        0,
      ).isStroke,
    ).toBe(true);
  });

  it("intensity stays within 0..1", () => {
    const result = classifySignal(
      frame({ isDown: true, velocity: 50, reversalCount: 10 }),
      null,
      0,
    );
    expect(result.intensity).toBeGreaterThanOrEqual(0);
    expect(result.intensity).toBeLessThanOrEqual(1);
  });
});

describe("nextInteractionState", () => {
  it("idle pointer far from the stage stays idle", () => {
    expect(nextInteractionState("idle", frame({ distance: 2 }))).toBe("idle");
  });

  it("a far pointer approaching becomes noticing", () => {
    expect(nextInteractionState("idle", frame({ distance: 0.8 }))).toBe(
      "noticing",
    );
  });

  it("a near, non-dwelling pointer is observing", () => {
    expect(
      nextInteractionState(
        "noticing",
        frame({ distance: NEAR_DISTANCE - 0.1, dwellMs: 50 }),
      ),
    ).toBe("observing");
  });

  it("a near pointer that dwells becomes curious", () => {
    expect(
      nextInteractionState(
        "observing",
        frame({ distance: NEAR_DISTANCE - 0.1, dwellMs: DWELL_MS + 10 }),
      ),
    ).toBe("curious");
  });

  it("pressing down while curious becomes touched", () => {
    expect(
      nextInteractionState("curious", frame({ isDown: true, pressDuration: 10 })),
    ).toBe("touched");
  });

  it("sustained reversals while pressed become stroked", () => {
    expect(
      nextInteractionState(
        "touched",
        frame({ isDown: true, reversalCount: STROKE_REVERSALS, pressDuration: 200 }),
      ),
    ).toBe("stroked");
  });

  it("a long, calm press becomes pleased", () => {
    expect(
      nextInteractionState(
        "touched",
        frame({ isDown: true, pressDuration: HOLD_MS + 50 }),
      ),
    ).toBe("pleased");
  });

  it("high velocity while pressed becomes startled regardless of prior state", () => {
    expect(
      nextInteractionState(
        "pleased",
        frame({ isDown: true, velocity: STARTLE_VELOCITY + 1, pressDuration: 900 }),
      ),
    ).toBe("startled");
  });

  it("repeated gestures in the trailing window become irritated", () => {
    expect(
      nextInteractionState(
        "touched",
        frame({ isDown: true, recentGestureCount: IRRITATED_COUNT, pressDuration: 10 }),
      ),
    ).toBe("irritated");
  });

  it("excessive gestures become overstimulated even mid-press", () => {
    expect(
      nextInteractionState(
        "irritated",
        frame({ isDown: true, recentGestureCount: OVERSTIM_COUNT }),
      ),
    ).toBe("overstimulated");
  });

  it("releasing from an active state moves to settling, then idle after the decay window", () => {
    expect(nextInteractionState("touched", frame({ isDown: false }))).toBe(
      "settling",
    );
    expect(
      nextInteractionState("settling", frame({ isDown: false, dwellMs: 10 })),
    ).toBe("settling");
    expect(
      nextInteractionState(
        "settling",
        frame({ isDown: false, dwellMs: SETTLE_MS + 10, distance: 2 }),
      ),
    ).toBe("idle");
  });
});

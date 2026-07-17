/**
 * Pure pointer-signal classification for the touch-native interaction
 * controller. No DOM, no React — takes primitive samples in and returns
 * primitive classifications out, so the state machine is fully unit
 * testable and reusable by both the pet stage and (later) any other
 * touch-reactive surface.
 *
 * Units: distance is normalized 0 (center of stage) .. ~1.4 (corner) of the
 * stage's half-width/half-height. Velocity is px/ms in raw client space
 * (independent of stage size, so a slow drag on a small phone and a slow
 * drag on a large desktop classify the same way).
 */

export type InteractionState =
  | "idle"
  | "noticing"
  | "observing"
  | "curious"
  | "touched"
  | "stroked"
  | "pleased"
  | "startled"
  | "irritated"
  | "overstimulated"
  | "settling";

/** Mirrors the thresholds already tuned in VisualDNAPet's original gesture code. */
export const TAP_MS = 340;
export const HOLD_MS = 620;
export const SWIPE_PX = 42;

export const NEAR_DISTANCE = 0.55;
export const DWELL_MS = 400;
export const STROKE_REVERSALS = 3;
export const STROKE_MS = 900;
export const STARTLE_VELOCITY = 1.6;
export const IRRITATED_COUNT = 4;
export const IRRITATED_WINDOW_MS = 1200;
export const OVERSTIM_COUNT = 7;
export const OVERSTIM_WINDOW_MS = 4000;
export const SETTLE_MS = 500;

export interface PointerFrame {
  /** Whether a pointer is currently pressed on the stage. */
  isDown: boolean;
  /** Normalized distance from stage center; NaN/undefined-safe callers pass Infinity when unknown. */
  distance: number;
  /** px/ms instantaneous speed since the previous sample. */
  velocity: number;
  /** ms elapsed since the current press began (0 when not pressed). */
  pressDuration: number;
  /** ms spent continuously within NEAR_DISTANCE without a press (hover dwell). */
  dwellMs: number;
  /** Direction reversals counted during the current press (petting motion). */
  reversalCount: number;
  /** Discrete press-release cycles within the trailing gesture window. */
  recentGestureCount: number;
  pointerType: string;
}

export interface ClassifiedSignal {
  isTap: boolean;
  isHold: boolean;
  isStroke: boolean;
  isSwipe: boolean;
  isStartle: boolean;
  /** 0..1 composite strength, used to scale the visual overlay. */
  intensity: number;
}

export function classifySignal(
  frame: PointerFrame,
  releasedPressDuration: number | null,
  travelPx: number,
): ClassifiedSignal {
  const isStartle = frame.velocity > STARTLE_VELOCITY;
  const isSwipe = travelPx > SWIPE_PX;
  const isHold = frame.isDown && frame.pressDuration >= HOLD_MS;
  const isStroke = frame.isDown && frame.reversalCount >= STROKE_REVERSALS;
  const isTap =
    releasedPressDuration !== null &&
    releasedPressDuration <= TAP_MS &&
    !isSwipe;

  const intensity = Math.max(
    0,
    Math.min(
      1,
      (frame.velocity / (STARTLE_VELOCITY * 1.5)) * 0.5 +
        (frame.isDown ? 0.4 : 0.1) +
        (isStroke ? 0.3 : 0),
    ),
  );

  return { isTap, isHold, isStroke, isSwipe, isStartle, intensity };
}

/**
 * Pure state transition. `current` plus one normalized frame yields the
 * next state — no history required beyond what the caller packs into
 * `frame` (reversal/gesture counters are maintained by the caller's refs).
 */
export function nextInteractionState(
  current: InteractionState,
  frame: PointerFrame,
): InteractionState {
  if (frame.recentGestureCount >= OVERSTIM_COUNT) return "overstimulated";

  if (!frame.isDown) {
    const wasActive =
      current === "touched" ||
      current === "stroked" ||
      current === "pleased" ||
      current === "startled" ||
      current === "irritated" ||
      current === "overstimulated";
    if (wasActive) return "settling";
    if (current === "settling") {
      return frame.dwellMs > SETTLE_MS ? "idle" : "settling";
    }
    if (!Number.isFinite(frame.distance) || frame.distance > 1) return "idle";
    if (frame.distance <= NEAR_DISTANCE) {
      return frame.dwellMs > DWELL_MS ? "curious" : "observing";
    }
    return "noticing";
  }

  // Pointer is down.
  if (frame.velocity > STARTLE_VELOCITY) return "startled";
  if (frame.recentGestureCount >= IRRITATED_COUNT) return "irritated";
  if (frame.reversalCount >= STROKE_REVERSALS) return "stroked";
  if (frame.pressDuration >= HOLD_MS || frame.pressDuration >= STROKE_MS) {
    return "pleased";
  }
  return "touched";
}

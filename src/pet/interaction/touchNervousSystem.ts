/**
 * Touch-native nervous system — pure logic.
 *
 * Everything here is a deterministic function of its arguments: no DOM, no
 * timers, no React. `useTouchNervousSystem.ts` is the only place that wires
 * this to real pointer events, refs and `requestAnimationFrame`. Keeping the
 * decision logic pure is what makes it possible to unit-test tap/hold/
 * slow-stroke/fast-swipe classification and the state machine without a
 * browser.
 *
 * ── Priority ────────────────────────────────────────────────────────────
 * This module does not invent a second priority system. It answers to the
 * existing Moss60 movement priority ladder (`MovementPriority` in
 * `src/pet/movement/movementVocabulary.ts`):
 *
 *   1. system-critical / sealed         → caller checks `sealed` and never
 *                                          calls into this module at all.
 *   2. evolution ceremony / big emotion → MovementPriority.EvolutionCeremony
 *                                          / BigEmotion (8-9). `tryPlay`
 *                                          already refuses lower-priority
 *                                          interrupts, so gesture clips fired
 *                                          from here can never cut one off.
 *   3. active care / game action        → MovementPriority.MoodExpression /
 *                                          AddonReaction (2, 5), driven by
 *                                          `playAction` sequences.
 *   4. direct user interaction (HERE)   → MovementPriority.TouchReaction (4).
 *   5. spontaneous Moss60 behaviour     → ambient brain-tick picks; `tryPlay`
 *                                          only lets a same-or-lower-priority
 *                                          ambient pick interrupt once the
 *                                          running clip has finished.
 *   6. idle movement                    → MovementPriority.IdleBreathing (1).
 *
 * `shouldApplyInteractionOverlay` below gates the *continuous* living-body
 * overlay (independent of clips) the same way: it only applies while the
 * active clip's priority is at or below TouchReaction, so an evolution
 * ceremony or a care-action sequence is never fought by a stray touch.
 */

import type {
  GestureSignals,
  InteractionContext,
  InteractionEvent,
  InteractionState,
  PointerRegion,
  PointerSample,
} from "./types";

// ── Tunable thresholds ─────────────────────────────────────────────────
// One canonical set of gesture thresholds for the whole runtime. Previously
// VisualDNAPet.tsx hard-coded its own TAP_MS/HOLD_MS/SWIPE_PX; those now
// derive from here so the two never drift apart.
export const GESTURE_THRESHOLDS = Object.freeze({
  tapMaxMs: 260,
  tapMaxDistancePx: 12,
  holdMinMs: 560,
  holdMaxDistancePx: 16,
  slowStrokeMinMs: 240,
  slowStrokeMinVelocity: 0.015, // px/ms (~15px/s floor — anything slower reads as a hold)
  slowStrokeMaxVelocity: 0.42, // px/ms (~420px/s ceiling)
  fastSwipeVelocity: 1.05, // px/ms (~1050px/s)
  fastSwipeMinDistancePx: 42,
  noticeDwellMs: 220,
  observingDwellMs: 550,
  pleasedDwellMs: 1300,
  startleDecayMs: 520,
  roughWindowMs: 2600,
  roughToIrritated: 0.55,
  roughToOverstimulated: 0.92,
  settleMsBase: 700,
});

const T = GESTURE_THRESHOLDS;

function clamp(value: number, min: number, max: number): number {
  // NaN falls back to the neutral (0-ish) point in range; +/-Infinity still
  // clamp correctly via the normal min/max below.
  if (Number.isNaN(value)) return Math.max(min, Math.min(max, 0));
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

// ── Pointer normalisation ──────────────────────────────────────────────

export interface StageGeometry {
  rect: { left: number; top: number; width: number; height: number };
  /** Fraction of stage height (from top) treated as the face region, e.g. 0.45. */
  faceFraction?: number;
}

/**
 * Turns a raw client-space pointer position into stage-relative, face-
 * relative and body-relative normalised offsets, all clamped to [-1, 1] —
 * "pupils move within anatomical bounds" starts here: nothing downstream
 * ever receives an out-of-range gaze target.
 */
export function normalizePointerPosition(
  clientX: number,
  clientY: number,
  geometry: StageGeometry,
): Pick<
  PointerSample,
  "stageX" | "stageY" | "faceX" | "faceY" | "bodyX" | "bodyY" | "region"
> {
  const { rect } = geometry;
  const faceFraction = geometry.faceFraction ?? 0.45;
  if (rect.width <= 0 || rect.height <= 0) {
    return {
      stageX: 0,
      stageY: 0,
      faceX: 0,
      faceY: 0,
      bodyX: 0,
      bodyY: 0,
      region: "outside",
    };
  }

  const stageX = clamp((clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
  const stageY = clamp((clientY - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);

  const faceCenterY = rect.top + rect.height * (faceFraction / 2);
  const faceRadius = rect.height * faceFraction;
  const faceX = clamp((clientX - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
  const faceY = faceRadius > 0 ? clamp((clientY - faceCenterY) / faceRadius, -1, 1) : 0;

  const bodyCenterY = rect.top + rect.height * (faceFraction + (1 - faceFraction) / 2);
  const bodyRadius = rect.height * (1 - faceFraction);
  const bodyX = stageX;
  const bodyY = bodyRadius > 0 ? clamp((clientY - bodyCenterY) / bodyRadius, -1, 1) : 0;

  const inside =
    clientX >= rect.left &&
    clientX <= rect.left + rect.width &&
    clientY >= rect.top &&
    clientY <= rect.top + rect.height;
  const region: PointerRegion = !inside
    ? "outside"
    : clientY - rect.top <= rect.height * faceFraction
      ? "face"
      : "body";

  return { stageX, stageY, faceX, faceY, bodyX, bodyY, region };
}

/** Clamps a gaze/pupil offset pair into the documented -1..1 travel range. */
export function clampGazeOffset(x: number, y: number): { x: number; y: number } {
  return { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
}

// ── Gesture classification ─────────────────────────────────────────────

export interface GestureWindow {
  /** ms since the current contact/hover run started. */
  duration: number;
  /** Cumulative px travelled since the run started. */
  distance: number;
  /** Smoothed px/ms velocity. */
  velocity: number;
  /** Radians, smoothed direction of travel. */
  direction: number;
  /** True while a pointer button/touch is actively down. */
  contact: boolean;
  /** True the instant contact ends (pointerup/cancel) this sample. */
  released: boolean;
}

/**
 * Classifies one motion window into the four required gesture types. A
 * window may match more than one predicate (e.g. a very short, very fast
 * flick is both "not a tap" and "a fast swipe") — callers should check
 * `isFastSwipe` first since it is the highest-salience read.
 */
export function classifyGesture(window: GestureWindow): GestureSignals {
  const { duration, distance, velocity, direction, contact } = window;

  // Average velocity catches a large, quick displacement even when the
  // smoothed instantaneous `velocity` sample under-reports it (e.g. right
  // after a direction change); a genuinely slow drag covering the same
  // distance over a much longer duration must NOT trip this. Gated on a
  // minimum distance too, so a sub-pixel jitter sampled over a near-zero
  // duration (distance/duration -> huge) can never misfire as a swipe.
  const avgVelocity = duration > 0 ? distance / duration : 0;
  const isFastSwipe =
    velocity >= T.fastSwipeVelocity ||
    (distance >= T.fastSwipeMinDistancePx && avgVelocity >= T.fastSwipeVelocity * 0.85);

  const isTap =
    !isFastSwipe &&
    window.released &&
    duration <= T.tapMaxMs &&
    distance <= T.tapMaxDistancePx;

  const isHold =
    !isFastSwipe &&
    contact &&
    duration >= T.holdMinMs &&
    distance <= T.holdMaxDistancePx;

  const isSlowStroke =
    !isFastSwipe &&
    contact &&
    duration >= T.slowStrokeMinMs &&
    velocity > T.slowStrokeMinVelocity &&
    velocity <= T.slowStrokeMaxVelocity &&
    distance > T.holdMaxDistancePx;

  const roughness = clamp01(velocity / T.fastSwipeVelocity);
  const intensity = isFastSwipe
    ? clamp01(0.75 + roughness * 0.25)
    : isSlowStroke
      ? clamp01(0.25 + (velocity / T.slowStrokeMaxVelocity) * 0.2)
      : isHold
        ? 0.3
        : isTap
          ? 0.45
          : clamp01(roughness);

  return {
    velocity,
    direction,
    distance,
    duration,
    intensity,
    isTap,
    isHold,
    isSlowStroke,
    isFastSwipe,
  };
}

// ── State machine ──────────────────────────────────────────────────────

export const DEFAULT_INTERACTION_CONTEXT: InteractionContext = Object.freeze({
  roughStreak: 0,
  trust: 0.5,
  stress: 0,
  enteredAt: 0,
  lastWeight: 0,
});

export interface ReduceResult {
  state: InteractionState;
  context: InteractionContext;
}

/**
 * The interaction state machine. Every branch below documents its trigger
 * (the `case` condition), its response (handled by `deriveInteractionOverlay`
 * for that state) and its exit rule (the transitions listed for it) per the
 * uplift brief's "every state must have a meaningful trigger, response and
 * exit rule" requirement.
 */
export function reduceInteractionState(
  state: InteractionState,
  event: InteractionEvent,
  context: InteractionContext,
): ReduceResult {
  const enter = (next: InteractionState, patch: Partial<InteractionContext> = {}): ReduceResult => ({
    state: next,
    context: { ...context, ...patch, enteredAt: event.at },
  });
  const stay = (patch: Partial<InteractionContext> = {}): ReduceResult => ({
    state,
    context: { ...context, ...patch },
  });

  // Roughness decays continuously; every branch below starts from the
  // decayed value so a single old spike can't pin the pet irritated forever.
  const elapsedSinceEnter = Math.max(0, event.at - context.enteredAt);
  const decayedRoughStreak = clamp01(
    context.roughStreak * Math.exp(-elapsedSinceEnter / T.roughWindowMs),
  );

  switch (event.type) {
    case "contact-start":
      // Trigger: pointerdown, from ANY prior state — deliberate contact
      // always takes over immediately. Response: brief acknowledgement,
      // handled by `touched`. Exit: see gesture-* events below.
      return enter("touched", { roughStreak: decayedRoughStreak });

    case "gesture-fast-swipe": {
      // Trigger: velocity/distance spike, with or without contact.
      // Response: recoil + tracking (see deriveInteractionOverlay).
      // Exit: settle-tick timers below (startleDecayMs) return to
      // `settling`/`observing`; repeated swipes raise roughStreak toward
      // `irritated`/`overstimulated`.
      const nextRough = clamp01(decayedRoughStreak + 0.32);
      if (nextRough >= T.roughToOverstimulated) {
        return enter("overstimulated", { roughStreak: nextRough });
      }
      if (nextRough >= T.roughToIrritated) {
        return enter("irritated", { roughStreak: nextRough });
      }
      return enter("startled", { roughStreak: nextRough });
    }

    case "gesture-rough":
      // Trigger: caller-flagged rough repetition (e.g. rapid direction
      // reversals) independent of a single swipe. Response/exit mirror
      // gesture-fast-swipe's escalation ladder.
      return reduceInteractionState(state, { ...event, type: "gesture-fast-swipe" }, context);

    case "gesture-slow-stroke":
      // Trigger: sustained low-velocity contact movement. Response: trust
      // overlay (soft eyes, head lean, warm aura). Exit: dwelling in this
      // state past pleasedDwellMs (checked via settle-tick) advances to
      // `pleased`; contact ending moves to `settling`.
      if (state === "irritated" || state === "overstimulated") {
        // A calm stroke can talk an irritated pet down, but gradually.
        return enter("stroked", { roughStreak: clamp01(decayedRoughStreak * 0.5) });
      }
      return enter("stroked", { roughStreak: clamp01(decayedRoughStreak * 0.85) });

    case "gesture-hold":
      // Trigger: sustained low-travel contact. Response: attention building
      // into affection. Exit: contact end → settling; a hold that runs long
      // enough is promoted to `pleased` by settle-tick below.
      return enter("pleased", { roughStreak: decayedRoughStreak });

    case "gesture-tap":
      // Trigger: short, low-travel contact-and-release. Response: brief
      // alert/affectionate blip (mood/trust dependent, resolved by the
      // overlay). Exit: immediately settles once released.
      return enter("touched", { roughStreak: decayedRoughStreak });

    case "settle-tick": {
      // Internal timer tick, fired by the hook's rAF loop while `contact`
      // stays true. Promotes long, calm engagement into the next state.
      if (state === "stroked" && elapsedSinceEnter >= T.pleasedDwellMs) {
        return enter("pleased", { roughStreak: decayedRoughStreak });
      }
      if (state === "touched" && elapsedSinceEnter >= T.holdMinMs) {
        return enter("pleased", { roughStreak: decayedRoughStreak });
      }
      if (state === "startled" && elapsedSinceEnter >= T.startleDecayMs) {
        return enter("observing", { roughStreak: decayedRoughStreak });
      }
      if (state === "noticing" && elapsedSinceEnter >= T.noticeDwellMs) {
        return enter("observing", { roughStreak: decayedRoughStreak });
      }
      if (
        state === "observing" &&
        elapsedSinceEnter >= T.observingDwellMs &&
        event.region === "face"
      ) {
        return enter("curious", { roughStreak: decayedRoughStreak });
      }
      if (
        (state === "irritated" || state === "overstimulated") &&
        decayedRoughStreak < T.roughToIrritated * 0.4
      ) {
        return enter("settling", { roughStreak: decayedRoughStreak });
      }
      return stay({ roughStreak: decayedRoughStreak });
    }

    case "contact-end":
      // Trigger: pointerup/pointercancel while touched/stroked/pleased/
      // startled/irritated/overstimulated. Response: none new — decay
      // begins. Exit: `settle-complete` (fired by the hook after its decay
      // timer) returns to idle.
      if (state === "idle" || state === "settling") return stay();
      return enter("settling", { roughStreak: decayedRoughStreak, lastWeight: context.lastWeight });

    case "pointer-near":
      // Trigger: pointer enters the stage without contact (hover-capable
      // devices only — touch skips straight to contact-start). Response:
      // faint alertness. Exit: dwell timers above, or pointer-leave.
      if (state === "idle" || state === "settling") {
        return enter("noticing", { roughStreak: decayedRoughStreak });
      }
      return stay({ roughStreak: decayedRoughStreak });

    case "pointer-leave":
      // Trigger: pointer exits the stage bounds. Response: none new.
      // Exit: settle-complete returns to idle.
      if (state === "idle") return stay();
      return enter("settling", { roughStreak: decayedRoughStreak, lastWeight: context.lastWeight });

    case "settle-complete":
      // Trigger: the hook's decay timer finished. Exit: back to rest.
      return enter("idle", { roughStreak: 0, lastWeight: 0 });

    case "pointer-idle-dwell":
      return stay({ roughStreak: decayedRoughStreak });

    default:
      return stay();
  }
}

/** Priority gate: only let the continuous overlay apply while no
 * higher-priority Moss60 clip (care action, ceremony, big emotion) is
 * running. `activeClipPriority` is `movement.active.clip.priority`. */
export function shouldApplyInteractionOverlay(
  activeClipPriority: number,
  touchReactionPriority: number,
): boolean {
  return activeClipPriority <= touchReactionPriority;
}

// ── Overlay derivation ─────────────────────────────────────────────────

/** Named living-body channels this module is allowed to nudge. Deliberately
 * a subset of `BodyPerformanceState` — identity/vitals fields are untouched. */
export interface InteractionOverlay {
  eyelidOpenDelta: number;
  browTensionDelta: number;
  mouthCurveDelta: number;
  headTiltDelta: number;
  gazeTrackingDelta: number;
  proximityDelta: number;
  auraCohesionDelta: number;
  auraTurbulenceDelta: number;
  bounceDelta: number;
  /** 0..1 overall strength this overlay should be blended at. */
  weight: number;
}

const NEUTRAL_OVERLAY: InteractionOverlay = Object.freeze({
  eyelidOpenDelta: 0,
  browTensionDelta: 0,
  mouthCurveDelta: 0,
  headTiltDelta: 0,
  gazeTrackingDelta: 0,
  proximityDelta: 0,
  auraCohesionDelta: 0,
  auraTurbulenceDelta: 0,
  bounceDelta: 0,
  weight: 0,
});

/**
 * Pure mapping from interaction state → living-body deltas. Every state
 * here has a *response*, matching the trigger/exit documented in
 * `reduceInteractionState`. Deltas are small and additive — callers clamp
 * the final `BodyPerformanceState` the same way the movement layer already
 * clamps `MovementPerformance` (see `clampPerformance`).
 */
export function deriveInteractionOverlay(
  state: InteractionState,
  intensity: number,
  context: InteractionContext,
): InteractionOverlay {
  const trustFactor = clamp01(context.trust);
  const i = clamp01(intensity);

  switch (state) {
    case "idle":
      return NEUTRAL_OVERLAY;

    case "noticing":
      return { ...NEUTRAL_OVERLAY, gazeTrackingDelta: 0.08, weight: 0.15 };

    case "observing":
      return {
        ...NEUTRAL_OVERLAY,
        gazeTrackingDelta: 0.16,
        headTiltDelta: 1.5,
        weight: 0.3,
      };

    case "curious":
      return {
        ...NEUTRAL_OVERLAY,
        gazeTrackingDelta: 0.26,
        headTiltDelta: 3,
        auraCohesionDelta: 0.06,
        weight: 0.45,
      };

    case "touched":
      // Brief alert-or-affectionate acknowledgement; leans affectionate as
      // trust rises, alert when trust is low.
      return {
        ...NEUTRAL_OVERLAY,
        eyelidOpenDelta: 0.1,
        browTensionDelta: (1 - trustFactor) * 0.15,
        mouthCurveDelta: trustFactor * 0.12,
        gazeTrackingDelta: 0.3,
        weight: 0.5,
      };

    case "stroked":
      // Calm slow stroke → trust, soft eyes, gentle head lean, relaxed
      // mouth, warmer aura (all explicitly required by the brief).
      return {
        eyelidOpenDelta: 0.08,
        browTensionDelta: -0.18,
        mouthCurveDelta: 0.22 + trustFactor * 0.1,
        headTiltDelta: 4 * (0.5 + trustFactor * 0.5),
        gazeTrackingDelta: 0.2,
        proximityDelta: 0.22,
        auraCohesionDelta: 0.16,
        auraTurbulenceDelta: -0.1,
        bounceDelta: 0.05,
        weight: 0.55,
      };

    case "pleased":
      return {
        eyelidOpenDelta: 0.05,
        browTensionDelta: -0.22,
        mouthCurveDelta: 0.35,
        headTiltDelta: 2,
        gazeTrackingDelta: 0.22,
        proximityDelta: 0.3,
        auraCohesionDelta: 0.22,
        auraTurbulenceDelta: -0.14,
        bounceDelta: 0.18,
        weight: 0.6,
      };

    case "startled":
      // Fast swipe → startled tracking + recoil.
      return {
        eyelidOpenDelta: 0.18,
        browTensionDelta: 0.35,
        mouthCurveDelta: -0.15,
        headTiltDelta: -6,
        gazeTrackingDelta: 0.5,
        proximityDelta: -0.25,
        auraCohesionDelta: -0.08,
        auraTurbulenceDelta: 0.22,
        bounceDelta: 0,
        weight: clamp01(0.55 + i * 0.3),
      };

    case "irritated":
      return {
        eyelidOpenDelta: -0.06,
        browTensionDelta: 0.45,
        mouthCurveDelta: -0.3,
        headTiltDelta: -3,
        gazeTrackingDelta: -0.1,
        proximityDelta: -0.35,
        auraCohesionDelta: -0.16,
        auraTurbulenceDelta: 0.35,
        bounceDelta: -0.1,
        weight: clamp01(0.55 + context.roughStreak * 0.3),
      };

    case "overstimulated":
      // Strong withdrawal. Intentionally does not scale *up* with vitals
      // stress — the caller (deriveBodyPerformance already folds vitals
      // stress into `living`) provides that; this only adds the
      // interaction-specific disengagement on top, capped at 1.
      return {
        eyelidOpenDelta: -0.22,
        browTensionDelta: 0.55,
        mouthCurveDelta: -0.4,
        headTiltDelta: -8,
        gazeTrackingDelta: -0.3,
        proximityDelta: -0.5,
        auraCohesionDelta: -0.3,
        auraTurbulenceDelta: 0.5,
        bounceDelta: -0.2,
        weight: 0.75,
      };

    case "settling": {
      // Decay is driven by the hook (it lerps `context.lastWeight` → 0);
      // this only returns the *shape* of the settle, not the timing.
      return { ...NEUTRAL_OVERLAY, weight: context.lastWeight };
    }

    default:
      return NEUTRAL_OVERLAY;
  }
}

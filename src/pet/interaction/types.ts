/**
 * Touch-native nervous system: shared types.
 *
 * Two layers, mirroring the existing living-body performance split
 * (see `src/pet/performance/types.ts`):
 *
 * - `InteractionState` — the slow, readable state machine (idle → touched →
 *   stroked → pleased, etc). Changes on discrete events, not every frame.
 * - `InteractionSignals` — the fast, continuous numbers (velocity,
 *   distance, intensity) computed from raw pointer samples via refs + rAF,
 *   never written to React state at input frequency.
 */

export type PointerKind = "mouse" | "touch" | "pen" | "unknown";

/** Which anatomical region the pointer is currently nearest to. */
export type PointerRegion = "face" | "body" | "outside";

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

/** One resolved pointer sample, already normalised against the stage. */
export interface PointerSample {
  /** ms clock (performance.now()). */
  t: number;
  clientX: number;
  clientY: number;
  /** -1..1 relative to the stage center. */
  stageX: number;
  stageY: number;
  /** -1..1 relative to the face anchor, clamped to anatomical travel. */
  faceX: number;
  faceY: number;
  /** -1..1 relative to the body anchor. */
  bodyX: number;
  bodyY: number;
  region: PointerRegion;
  pointerType: PointerKind;
  /** True while a deliberate press/touch is active (pointer capture held). */
  contact: boolean;
}

/** Continuous, smoothed motion signals derived from a short sample window. */
export interface GestureSignals {
  /** px/ms, smoothed. */
  velocity: number;
  /** Radians, smoothed (0 = pointing +x/right). */
  direction: number;
  /** Cumulative travel since the current contact/hover run began, px. */
  distance: number;
  /** ms since the current contact/hover run began. */
  duration: number;
  /** 0..1 composite "how strong/rough" this gesture reads. */
  intensity: number;
  isTap: boolean;
  isHold: boolean;
  isSlowStroke: boolean;
  isFastSwipe: boolean;
}

/** Rolling context the reducer needs beyond the immediate event. */
export interface InteractionContext {
  /** 0..1 recent-roughness counter; decays over time, escalates state. */
  roughStreak: number;
  /** 0..1 trust proxy (mirrors BodyPerformanceState.trust) — softens/hardens reactions. */
  trust: number;
  /** 0..1 stress proxy — lowers the threshold into irritated/overstimulated. */
  stress: number;
  /** ms timestamp the current state was entered, for exit-timer rules. */
  enteredAt: number;
  /** Overlay weight (0..1) carried into `settling` so decay starts from the right place. */
  lastWeight: number;
}

export type InteractionEventType =
  | "pointer-near"
  | "pointer-idle-dwell"
  | "contact-start"
  | "gesture-tap"
  | "gesture-hold"
  | "gesture-slow-stroke"
  | "gesture-fast-swipe"
  | "gesture-rough"
  | "contact-end"
  | "pointer-leave"
  | "settle-tick"
  | "settle-complete";

export interface InteractionEvent {
  type: InteractionEventType;
  at: number;
  region?: PointerRegion;
}

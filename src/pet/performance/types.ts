/**
 * Living-body performance layer for the canonical Meta-Pet runtime.
 *
 * Two renderer-neutral value objects flow through this layer:
 *
 * - `BodyPerformanceState` — the slow layer. A pure resolution of vitals,
 *   personality and care history into named presentation values (posture,
 *   breath, gaze confidence, surface clarity…). It changes when state
 *   changes, not per animation frame.
 * - `MovementPerformance` — the fast layer. One bounded frame of motion
 *   produced by interpreting the active movement clip at a normalized
 *   progress. `PetBodyRenderer` applies it to whichever BodySpec is active.
 *
 * Neither layer ever writes back into a stored BodySpec: inherited anatomy
 * stays inherited, performance stays temporary.
 */

/**
 * Renderer-neutral movement output for a single frame. Every field is
 * bounded (see `clampPerformance`) so a bad clip or corrupted progress can
 * never fling the creature off the stage.
 */
export interface MovementPerformance {
  /** Horizontal body offset in body viewBox px. */
  bodyX: number;
  /** Vertical body offset in body viewBox px (negative = lift). */
  bodyY: number;
  /** Whole-body rotation in degrees. */
  rotation: number;
  /** Horizontal squash/stretch multiplier. */
  scaleX: number;
  /** Vertical squash/stretch multiplier. */
  scaleY: number;
  /** Face-group tilt in degrees (adapts when no separate head exists). */
  headTilt: number;
  /** 0 closed .. 1 fully open (may briefly exceed 1 for surprise). */
  eyelidOpen: number;
  /** Pupil size multiplier. */
  pupilScale: number;
  /** Gaze offset, -1..1 of the eye's travel range. */
  gazeX: number;
  /** Gaze offset, -1..1 of the eye's travel range. */
  gazeY: number;
  /** Wing spread multiplier over the inherited spread (1 = as forged). */
  wingSpread: number;
  /** 0 = free, 1 = fully folded against the body. */
  wingFold: number;
  /** 0..1 activity level for horns/crown/third-eye/tail-flame accents. */
  featureIntensity: number;
  /** Aura scale multiplier. */
  auraScale: number;
  /** 0..1 momentary aura pulse strength. */
  auraPulse: number;
  /** Additional aura rotation in degrees. */
  auraRotation: number;
  /** Number of phase-echo afterimages to draw (0..3). */
  phaseEchoes: number;
  /** 0..1 shadow-field enclosure around the creature. */
  shadowEnclosure: number;
}

/** The performance frame that renders the creature exactly as forged. */
export const NEUTRAL_PERFORMANCE: MovementPerformance = Object.freeze({
  bodyX: 0,
  bodyY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  headTilt: 0,
  eyelidOpen: 1,
  pupilScale: 1,
  gazeX: 0,
  gazeY: 0,
  wingSpread: 1,
  wingFold: 0,
  featureIntensity: 0,
  auraScale: 1,
  auraPulse: 0,
  auraRotation: 0,
  phaseEchoes: 0,
  shadowEnclosure: 0,
});

export interface PerformanceBounds {
  min: MovementPerformance;
  max: MovementPerformance;
}

export const PERFORMANCE_BOUNDS: PerformanceBounds = Object.freeze({
  min: Object.freeze({
    bodyX: -26,
    bodyY: -30,
    rotation: -32,
    scaleX: 0.68,
    scaleY: 0.68,
    headTilt: -18,
    eyelidOpen: 0.04,
    pupilScale: 0.5,
    gazeX: -1,
    gazeY: -1,
    wingSpread: 0.1,
    wingFold: 0,
    featureIntensity: 0,
    auraScale: 0.55,
    auraPulse: 0,
    auraRotation: -360,
    phaseEchoes: 0,
    shadowEnclosure: 0,
  }),
  max: Object.freeze({
    bodyX: 26,
    bodyY: 22,
    rotation: 32,
    scaleX: 1.32,
    scaleY: 1.32,
    headTilt: 18,
    eyelidOpen: 1.12,
    pupilScale: 1.6,
    gazeX: 1,
    gazeY: 1,
    wingSpread: 1.55,
    wingFold: 1,
    featureIntensity: 1,
    auraScale: 1.55,
    auraPulse: 1,
    auraRotation: 360,
    phaseEchoes: 3,
    shadowEnclosure: 1,
  }),
});

const PERFORMANCE_KEYS = Object.keys(
  NEUTRAL_PERFORMANCE,
) as Array<keyof MovementPerformance>;

/**
 * Clamps every channel to its documented bound and squashes non-finite
 * values back to the neutral pose so one bad number can never break a frame.
 */
export function clampPerformance(
  frame: MovementPerformance,
): MovementPerformance {
  const result = { ...frame };
  for (const key of PERFORMANCE_KEYS) {
    const value = result[key];
    result[key] = Number.isFinite(value)
      ? Math.min(
          PERFORMANCE_BOUNDS.max[key],
          Math.max(PERFORMANCE_BOUNDS.min[key], value),
        )
      : NEUTRAL_PERFORMANCE[key];
  }
  return result;
}

/**
 * The slow living-body layer: named presentation values resolved purely
 * from canonical state. Trust, curiosity and stress do not exist in the
 * persisted store — they are derived here as presentation values only.
 */
export interface BodyPerformanceState {
  /** 0..1 satiation pressure (1 = starving). */
  hungerNeed: number;
  /** 0..1 fatigue (1 = exhausted). */
  fatigue: number;
  /** 0..1 positive mood. */
  cheer: number;
  /** 0..1 surface cleanliness. */
  surfaceClarity: number;
  /** 0..1 overall health cohesion (1 = fully well). */
  health: number;
  /** Derived presentation value: 0..1 willingness to engage/approach. */
  trust: number;
  /** Derived presentation value: 0..1 environmental interest. */
  curiosity: number;
  /** Derived presentation value: 0..1 tension/agitation. */
  stress: number;

  /** -1 full droop .. +1 lifted, proud posture. */
  posture: number;
  /** 0 slack .. 1 tight, hungry belly. */
  bellyTension: number;
  /** 0 weightless .. 1 heavy, effortful movement. */
  movementWeight: number;
  /** Seconds per breath cycle. */
  breathSeconds: number;
  /** Breathing scale amplitude (0..0.12). */
  breathDepth: number;
  /** 0..1 master amplitude applied to all clip motion. */
  animationAmplitude: number;
  /** Playback-speed factor for reactions (0.55..1.5). */
  responseSpeed: number;

  /** Baseline eyelid openness 0.05..1.05. */
  eyelidOpen: number;
  /** Baseline pupil dilation multiplier. */
  pupilDilation: number;
  /** 0 relaxed .. 1 knitted brows / upper-eye tension. */
  browTension: number;
  /** -1 full frown .. +1 open smile. */
  mouthCurve: number;
  /** 0..1 mouth opening. */
  mouthOpen: number;
  /** Resting head tilt in degrees. */
  headTilt: number;
  /** 0..1 how directly the pet holds eye contact. */
  gazeConfidence: number;
  /** 0..1 how strongly the gaze follows a pointer/touch. */
  gazeTracking: number;
  /** 0..1 lean toward the viewer/touch. */
  proximity: number;

  /** 0..1 sparkle level over the surface. */
  sparkle: number;
  /** 0..1 outline cleanliness (dirt fuzzes the silhouette). */
  outlineCleanliness: number;
  /** Colour saturation multiplier 0.55..1.2. */
  saturation: number;
  /** 0..1 posture stability (low health sways). */
  postureStability: number;
  /** 0..1 aura ring cohesion. */
  auraCohesion: number;
  /** 0..1 aura turbulence. */
  auraTurbulence: number;
  /** 0..1 limb/wing bracing tension. */
  limbTension: number;
  /** 0..1 feature (horn/third-eye/tail) activity. */
  featureActivity: number;
  /** 0..1 idle bounce energy. */
  bounce: number;
}

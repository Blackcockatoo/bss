/**
 * Pure movement interpreter: converts the active movement clip and its
 * normalized progress into a renderer-neutral `MovementPerformance` frame.
 *
 * The controller decides WHICH clip plays; this module decides WHAT the
 * clip looks like on the inherited body. Nothing here touches a stored
 * BodySpec — a clip is interpreted through the body's features (wings,
 * third eye, tail flame…) and falls back gracefully when a feature is
 * absent, so the same vocabulary works on every forged creature.
 */

import {
  NEUTRAL_PERFORMANCE,
  clampPerformance,
  type BodyPerformanceState,
  type MovementPerformance,
} from "@/pet/performance";
import type {
  WingPurpose,
  WingStyle,
} from "@/components/body-forge/PetBodyRenderer";

/** The body facts a clip may adapt to. Derived from BodySpec, never mutated. */
export interface MovementBodyContext {
  hasWings: boolean;
  wingStyle: WingStyle;
  wingPurpose: WingPurpose;
  hasThirdEye: boolean;
  hasTailFlame: boolean;
  hasHorns: boolean;
  hasCrown: boolean;
}

export interface MovementInterpreterContext {
  body: MovementBodyContext;
  /** Slow living-body layer; scales amplitude and carries baseline pose. */
  performance: BodyPerformanceState;
  /** Clip baseline intensity 0..1 (from the vocabulary, may be scaled). */
  intensity: number;
  reducedMotion: boolean;
  /** Stable per-pet seed for deterministic phase/direction variation. */
  seed: number;
}

const TAU = Math.PI * 2;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/** Smooth 0→1→0 arc across the clip. */
function arc(t: number): number {
  return Math.sin(clamp01(t) * Math.PI);
}

/** Ease-out that settles at 0 by the end of the clip. */
function settle(t: number): number {
  const p = clamp01(t);
  return Math.sin(p * Math.PI) * (1 - p * 0.35);
}

function easeInOut(t: number): number {
  const p = clamp01(t);
  return p * p * (3 - 2 * p);
}

/** Deterministic -1|+1 direction from the pet's stable seed. */
function seedSign(seed: number, salt: number): number {
  return ((seed ^ Math.imul(salt, 0x9e3779b9)) & 1) === 0 ? 1 : -1;
}

/** Deterministic 0..1 from the pet's stable seed. */
function seedUnit(seed: number, salt: number): number {
  const mixed = Math.imul(seed ^ salt, 0x45d9f3b) >>> 0;
  return (mixed % 1000) / 1000;
}

/**
 * Baseline pose for the current living-body state: what the creature does
 * between and underneath clips. The idle clip's breathing layers on top.
 */
export function baselinePerformance(
  body: BodyPerformanceState,
): MovementPerformance {
  return clampPerformance({
    ...NEUTRAL_PERFORMANCE,
    bodyY: -body.posture * 3 + body.movementWeight * 2.5,
    rotation: (1 - body.postureStability) * 1.2,
    scaleX: 1 + body.bellyTension * 0.02,
    scaleY: 1 - body.bellyTension * 0.03 - body.movementWeight * 0.02,
    headTilt: body.headTilt * 0.6,
    eyelidOpen: body.eyelidOpen,
    pupilScale: body.pupilDilation,
    gazeY: 0.08 - body.posture * 0.1,
    wingSpread: 1 - body.limbTension * 0.25 + body.bounce * 0.06,
    wingFold: body.limbTension * 0.3 + body.fatigue * 0.25,
    featureIntensity: body.featureActivity * 0.4,
    auraScale: 0.94 + body.auraCohesion * 0.1,
    auraPulse: body.auraTurbulence * 0.25,
    phaseEchoes: 0,
    shadowEnclosure: (1 - body.health) * 0.15,
  });
}

type ClipInterpreter = (
  t: number,
  ctx: MovementInterpreterContext,
) => Partial<MovementPerformance>;

/**
 * Per-clip choreography, expressed as deltas over the baseline. `t` is
 * normalized clip progress in [0, 1].
 */
const CLIP_INTERPRETERS: Record<string, ClipInterpreter> = {
  idle_breathe: (t, ctx) => {
    const breath = Math.sin(t * TAU);
    const depth = ctx.performance.breathDepth;
    return {
      scaleX: 1 + breath * depth,
      scaleY: 1 - breath * depth * 0.55,
      bodyY: -breath * depth * 18,
      wingSpread: 1 + breath * depth * (ctx.body.hasWings ? 1.6 : 0),
      auraScale: 1 + breath * depth * 0.9,
      auraPulse: Math.max(0, breath) * depth * 3,
    };
  },

  blink: (t) => {
    // Fast close, slower open; drives only the eyelids.
    const closed = t < 0.4 ? easeInOut(t / 0.4) : 1 - easeInOut((t - 0.4) / 0.6);
    return { eyelidOpen: 1 - closed * 0.97 };
  },

  head_tilt: (t, ctx) => {
    const wave = settle(t);
    const dir = seedSign(ctx.seed, 3);
    return {
      headTilt: dir * wave * 9 * ctx.intensity,
      rotation: dir * wave * 2.2,
      gazeX: dir * wave * 0.4,
      eyelidOpen: 1 + wave * 0.06,
    };
  },

  happy_bounce: (t, ctx) => {
    // Two bounces with squash on landing and stretch at apex.
    const phase = t * 2 * Math.PI * 2;
    const hop = Math.abs(Math.sin(phase / 2));
    const fade = 1 - easeInOut(Math.max(0, t - 0.7) / 0.3);
    const lift = hop * 13 * ctx.intensity * fade;
    return {
      bodyY: -lift,
      scaleY: 1 + (hop - 0.5) * 0.12 * fade,
      scaleX: 1 - (hop - 0.5) * 0.1 * fade,
      headTilt: Math.sin(phase) * 2.5 * fade,
      wingSpread: ctx.body.hasWings ? 1 + hop * 0.25 * fade : 1,
      auraPulse: hop * 0.4 * fade,
      featureIntensity: 0.4 + hop * 0.3,
      auraScale: 1 + hop * 0.06 * fade,
    };
  },

  sleepy_droop: (t, ctx) => {
    const droop = easeInOut(Math.min(1, t * 1.6)) * (1 - Math.max(0, t - 0.8) * 2);
    return {
      bodyY: droop * 6,
      scaleY: 1 - droop * 0.05,
      headTilt: seedSign(ctx.seed, 5) * droop * 5,
      eyelidOpen: 1 - droop * 0.62,
      gazeY: droop * 0.4,
      wingFold: ctx.body.hasWings ? droop * 0.5 : 0,
      auraScale: 1 - droop * 0.07,
      auraPulse: 0,
    };
  },

  wing_flutter: (t, ctx) => {
    if (!ctx.body.hasWings) {
      // Wingless fallback: a light full-body shimmer instead of dead air.
      const ripple = Math.sin(t * TAU * 3) * settle(t);
      return {
        scaleX: 1 + ripple * 0.02,
        bodyY: -arc(t) * 2,
        auraPulse: arc(t) * 0.3,
      };
    }
    const purpose = ctx.body.wingPurpose;
    // Purpose shapes the flutter: attack snaps wide, defend braces close,
    // attract shows off slowly, flight beats steadily, decorative shimmers.
    const rate = purpose === "attack" ? 5 : purpose === "attract" ? 1.5 : purpose === "decorative" ? 2 : 3;
    const beat = Math.sin(t * TAU * rate) * settle(t);
    const spreadBase =
      purpose === "attack" ? 0.4 : purpose === "attract" ? 0.32 : purpose === "defend" ? 0.12 : 0.22;
    return {
      wingSpread: 1 + Math.abs(beat) * spreadBase + (purpose === "attack" ? arc(t) * 0.18 : 0),
      wingFold: purpose === "defend" ? arc(t) * 0.3 : 0,
      bodyY: -Math.abs(beat) * (purpose === "flight" ? 4 : 1.5),
      rotation: beat * (purpose === "decorative" ? 1.5 : 0.8),
      featureIntensity: purpose === "attract" ? 0.4 + arc(t) * 0.5 : 0.3,
      auraPulse: purpose === "attract" ? arc(t) * 0.45 : Math.abs(beat) * 0.2,
    };
  },

  aura_pulse: (t) => {
    const wave = arc(t);
    return {
      auraScale: 1 + wave * 0.18,
      auraPulse: wave,
      featureIntensity: wave * 0.5,
      eyelidOpen: 1 + wave * 0.04,
    };
  },

  tap_surprise: (t, ctx) => {
    // Quick recoil squash, wide pupils, aura flash, settle.
    const recoil = t < 0.25 ? easeInOut(t / 0.25) : settle((t - 0.25) / 0.75) * 0.5;
    return {
      scaleX: 1 + recoil * 0.09,
      scaleY: 1 - recoil * 0.11,
      bodyY: recoil * 2.5,
      eyelidOpen: 1 + recoil * 0.12,
      pupilScale: 1 + recoil * 0.4,
      auraPulse: recoil * 0.8,
      wingSpread: ctx.body.hasWings ? 1 + recoil * 0.3 : 1,
      headTilt: -seedSign(ctx.seed, 7) * recoil * 3,
    };
  },

  hold_charge: (t, ctx) => {
    // Gather aura and Moss60 geometry inward while held, release cleanly.
    const gather = t < 0.7 ? easeInOut(t / 0.7) : 0;
    const release = t >= 0.7 ? arc((t - 0.7) / 0.3) : 0;
    return {
      scaleX: 1 - gather * 0.04 + release * 0.05,
      scaleY: 1 - gather * 0.04 + release * 0.05,
      auraScale: 1 - gather * 0.28 + release * 0.35,
      auraPulse: gather * 0.5 + release,
      auraRotation: gather * 40,
      featureIntensity: gather * 0.8 + release,
      eyelidOpen: 1 - gather * 0.3,
      pupilScale: 1 - gather * 0.15 + release * 0.35,
      wingFold: ctx.body.hasWings ? gather * 0.4 : 0,
      shadowEnclosure: gather * 0.2,
    };
  },

  swipe_spin: (t, ctx) => {
    // A controlled body turn with recovery — never a full disorienting 360.
    const dir = seedSign(ctx.seed, 11);
    const spin = Math.sin(easeInOut(t) * Math.PI) * dir;
    return {
      rotation: spin * 24 * ctx.intensity,
      scaleX: 1 - Math.abs(spin) * 0.06,
      bodyX: spin * 6,
      auraRotation: spin * 70,
      auraPulse: arc(t) * 0.4,
      wingSpread: ctx.body.hasWings ? 1 + Math.abs(spin) * 0.2 : 1,
      eyelidOpen: 1 - Math.abs(spin) * 0.2,
    };
  },

  beat_hit: (t) => {
    // Short rhythmic accent for future music sync; safe when spammed.
    const hit = settle(t);
    return {
      scaleX: 1 + hit * 0.045,
      scaleY: 1 - hit * 0.035,
      bodyY: -hit * 3,
      auraPulse: hit * 0.7,
      featureIntensity: hit * 0.5,
    };
  },

  quantum_split: (t, ctx) => {
    // Phase echoes bloom mid-clip while the true silhouette stays readable.
    const wave = arc(t);
    return {
      phaseEchoes: ctx.reducedMotion ? 0 : Math.round(wave * 3),
      bodyX: Math.sin(t * TAU * 2) * wave * 3,
      auraPulse: wave * 0.6,
      auraRotation: wave * 30,
      featureIntensity: 0.5 + wave * 0.5,
      pupilScale: 1 + wave * 0.2,
      shadowEnclosure: wave * 0.18,
    };
  },

  black_wing_bloom: (t, ctx) => {
    // Open real wings; when absent, raise a temporary shadow-field
    // impression instead. Never mutates the stored BodySpec.
    const bloom = t < 0.55 ? easeInOut(t / 0.55) : 1 - easeInOut((t - 0.55) / 0.45) * 0.85;
    if (!ctx.body.hasWings) {
      return {
        shadowEnclosure: bloom * 0.75,
        auraScale: 1 + bloom * 0.3,
        auraPulse: bloom * 0.7,
        featureIntensity: bloom,
        bodyY: -bloom * 4,
        eyelidOpen: 1 - bloom * 0.25,
      };
    }
    return {
      wingSpread: 1 + bloom * 0.5,
      shadowEnclosure: bloom * 0.45,
      auraScale: 1 + bloom * 0.22,
      auraPulse: bloom * 0.6,
      featureIntensity: bloom,
      bodyY: -bloom * 5,
      rotation: 0,
    };
  },

  evolution_ceremony: (t, ctx) => {
    // Slow gather → radiant hold → settle; identity is never replaced.
    const gather = easeInOut(Math.min(1, t / 0.35));
    const radiance = t > 0.35 && t < 0.8 ? 1 : t >= 0.8 ? 1 - easeInOut((t - 0.8) / 0.2) : gather;
    return {
      bodyY: -radiance * 7,
      scaleX: 1 + radiance * 0.05,
      scaleY: 1 + radiance * 0.05,
      auraScale: 1 + radiance * 0.4,
      auraPulse: radiance * 0.9,
      auraRotation: easeInOut(t) * 120,
      featureIntensity: radiance,
      wingSpread: ctx.body.hasWings ? 1 + radiance * 0.4 : 1,
      eyelidOpen: 1 - radiance * 0.35,
      phaseEchoes: ctx.reducedMotion ? 0 : Math.round(radiance),
    };
  },

  // ── Secret signature moves ────────────────────────────────────────────
  omen_twitch: (t, ctx) => {
    // Tiny, strange, easily missed: one off-axis flick and a pupil narrow.
    const spike = t > 0.3 && t < 0.55 ? arc((t - 0.3) / 0.25) : 0;
    const dir = seedSign(ctx.seed, 13);
    return {
      headTilt: dir * spike * 6,
      bodyX: dir * spike * 1.5,
      pupilScale: 1 - spike * 0.35,
      eyelidOpen: 1 - spike * 0.2,
      featureIntensity: ctx.body.hasThirdEye ? spike * 0.8 : spike * 0.3,
      shadowEnclosure: spike * 0.12,
    };
  },

  moss60_orbit: (t) => {
    // The red/blue/black strands orbit the living body — expressed through
    // aura rotation and cohesive pulsing; the renderer draws the strands.
    const sweep = easeInOut(t);
    return {
      auraRotation: sweep * 300,
      auraScale: 1 + arc(t) * 0.12,
      auraPulse: 0.3 + arc(t) * 0.4,
      featureIntensity: 0.5 + arc(t) * 0.3,
      phaseEchoes: 0,
      gazeX: Math.sin(t * TAU) * 0.5,
      gazeY: Math.cos(t * TAU) * 0.3,
    };
  },

  venom_pulse: (t) => {
    // A red/black impulse travelling through body, outline and aura.
    const pulse = Math.sin(t * TAU * 2) * settle(t);
    return {
      scaleX: 1 + Math.abs(pulse) * 0.03,
      auraPulse: Math.abs(pulse),
      featureIntensity: Math.abs(pulse) * 0.9,
      shadowEnclosure: Math.abs(pulse) * 0.3,
      pupilScale: 1 - Math.abs(pulse) * 0.25,
      eyelidOpen: 1 - Math.abs(pulse) * 0.3,
    };
  },

  folded_wing_hide: (t, ctx) => {
    // Fold real wings; otherwise enclose in posture + shadow geometry.
    const hide = t < 0.4 ? easeInOut(t / 0.4) : t > 0.75 ? 1 - easeInOut((t - 0.75) / 0.25) : 1;
    return {
      wingFold: ctx.body.hasWings ? hide * 0.9 : 0,
      wingSpread: ctx.body.hasWings ? 1 - hide * 0.45 : 1,
      shadowEnclosure: hide * (ctx.body.hasWings ? 0.3 : 0.55),
      scaleX: 1 - hide * 0.05,
      scaleY: 1 - hide * 0.06,
      bodyY: hide * 4,
      eyelidOpen: 1 - hide * 0.4,
      gazeY: hide * 0.4,
      auraScale: 1 - hide * 0.18,
    };
  },

  oracle_blink: (t, ctx) => {
    // Ordinary eyes and the third eye blink in coordination with a
    // restrained gold signal (featureIntensity peaks between the blinks).
    const eyeBlink = t < 0.35 ? arc(t / 0.35) : 0;
    const signal = t >= 0.3 && t < 0.75 ? arc((t - 0.3) / 0.45) : 0;
    return {
      eyelidOpen: 1 - eyeBlink * 0.95,
      featureIntensity: ctx.body.hasThirdEye ? signal : signal * 0.4,
      auraPulse: signal * 0.5,
      pupilScale: 1 + signal * 0.15,
      gazeY: -signal * 0.2,
    };
  },

  quantum_stutter: (t, ctx) => {
    // Seeded phase displacement in discrete steps — never random jitter.
    const steps = 5;
    const step = Math.min(steps - 1, Math.floor(clamp01(t) * steps));
    const offset = (seedUnit(ctx.seed, 17 + step) - 0.5) * 2;
    const envelope = settle(t);
    return {
      bodyX: offset * 5 * envelope,
      phaseEchoes: ctx.reducedMotion ? 0 : step % 2 === 0 ? 2 : 1,
      auraPulse: envelope * 0.5,
      shadowEnclosure: envelope * 0.15,
      eyelidOpen: 1 - envelope * 0.15,
      featureIntensity: envelope * 0.6,
    };
  },

  sacred_toy_bounce: (t, ctx) => {
    // Playful, ceremonial, slightly strange: three quickening hops with a
    // gold accent and a tiny mid-air suspension on the last one.
    const phase = easeInOut(t) * 3;
    const hop = Math.abs(Math.sin(phase * Math.PI));
    const suspend = t > 0.62 && t < 0.78 ? 1 : 0;
    const fade = 1 - Math.max(0, t - 0.85) / 0.15;
    return {
      bodyY: -(hop * 11 + suspend * 4) * ctx.intensity * fade,
      scaleY: 1 + (hop - 0.5) * 0.14 * fade,
      scaleX: 1 - (hop - 0.5) * 0.12 * fade,
      rotation: Math.sin(phase * Math.PI * 2) * 4 * fade,
      headTilt: seedSign(ctx.seed, 19) * hop * 5 * fade,
      featureIntensity: 0.5 + hop * 0.5,
      auraPulse: hop * 0.6 * fade,
      auraRotation: easeInOut(t) * 60,
      wingSpread: ctx.body.hasWings ? 1 + hop * 0.3 * fade : 1,
    };
  },
};

/** Clip ids the interpreter has explicit choreography for. */
export const INTERPRETED_CLIP_IDS: readonly string[] =
  Object.keys(CLIP_INTERPRETERS);

/**
 * Interprets one frame of the active clip over the living-body baseline.
 * Unknown clips resolve to the baseline pose, and every output channel is
 * clamped, so this function is total: any (clipId, t) pair is safe.
 */
export function interpretMovement(
  clipId: string,
  progress: number,
  ctx: MovementInterpreterContext,
): MovementPerformance {
  const base = baselinePerformance(ctx.performance);
  const interpreter = CLIP_INTERPRETERS[clipId];
  if (!interpreter) return base;

  const t = clamp01(progress);
  const clip = interpreter(t, ctx);
  const amplitude = ctx.reducedMotion
    ? 0.22
    : 0.45 + ctx.performance.animationAmplitude * 0.75;

  const scaled: MovementPerformance = {
    bodyX: base.bodyX + (clip.bodyX ?? 0) * amplitude,
    bodyY: base.bodyY + (clip.bodyY ?? 0) * amplitude,
    rotation: base.rotation + (clip.rotation ?? 0) * amplitude,
    scaleX: base.scaleX * (1 + ((clip.scaleX ?? 1) - 1) * amplitude),
    scaleY: base.scaleY * (1 + ((clip.scaleY ?? 1) - 1) * amplitude),
    headTilt: base.headTilt + (clip.headTilt ?? 0) * amplitude,
    mouthBias: base.mouthBias + (clip.mouthBias ?? 0) * amplitude,
    // Eyelids/pupils read as expression, not motion: they keep full range
    // (still bounded) even under reduced motion so state stays legible.
    eyelidOpen: base.eyelidOpen * (clip.eyelidOpen ?? 1),
    pupilScale: base.pupilScale * (clip.pupilScale ?? 1),
    gazeX: base.gazeX + (clip.gazeX ?? 0),
    gazeY: base.gazeY + (clip.gazeY ?? 0),
    wingSpread: base.wingSpread * (1 + ((clip.wingSpread ?? 1) - 1) * amplitude),
    wingFold: Math.max(base.wingFold, clip.wingFold ?? 0),
    featureIntensity: Math.max(
      base.featureIntensity,
      (clip.featureIntensity ?? 0) * (ctx.reducedMotion ? 0.6 : 1),
    ),
    auraScale: base.auraScale * (1 + ((clip.auraScale ?? 1) - 1) * amplitude),
    auraPulse: Math.max(base.auraPulse, (clip.auraPulse ?? 0) * amplitude),
    auraRotation:
      base.auraRotation + (clip.auraRotation ?? 0) * (ctx.reducedMotion ? 0.15 : 1),
    phaseEchoes: ctx.reducedMotion ? 0 : (clip.phaseEchoes ?? 0),
    shadowEnclosure: Math.max(
      base.shadowEnclosure,
      (clip.shadowEnclosure ?? 0) * (ctx.reducedMotion ? 0.5 : 1),
    ),
  };

  return clampPerformance(scaled);
}

/**
 * Addon animation "pop" system.
 *
 * Gives every addon animation type a shared impact vocabulary:
 *   attack -> impact -> aftershock -> settle
 * scaled by a per-rarity pop profile so mythic items hit visibly harder
 * than common ones while staying cheap to compute (pure math, no timers).
 */

import type { AddonRarity } from "./types";

export type PopPhase = "attack" | "impact" | "aftershock" | "settle";

export interface RarityPopProfile {
  /** Multiplier applied to transform amplitudes (scale/rotate/translate). */
  amplitude: number;
  /** Particle radius/speed boost applied during the impact phase. */
  particleBoost: number;
  /** Whether this rarity earns a shockwave ring on impact. */
  shockwave: boolean;
  /** Glow/opacity intensity multiplier. */
  glowBoost: number;
}

export const RARITY_POP: Record<AddonRarity, RarityPopProfile> = {
  common: { amplitude: 0.55, particleBoost: 1.05, shockwave: false, glowBoost: 0.6 },
  uncommon: { amplitude: 0.75, particleBoost: 1.15, shockwave: false, glowBoost: 0.8 },
  rare: { amplitude: 1.0, particleBoost: 1.25, shockwave: true, glowBoost: 1.0 },
  epic: { amplitude: 1.35, particleBoost: 1.4, shockwave: true, glowBoost: 1.25 },
  legendary: { amplitude: 1.7, particleBoost: 1.55, shockwave: true, glowBoost: 1.5 },
  mythic: { amplitude: 2.0, particleBoost: 1.7, shockwave: true, glowBoost: 1.8 },
};

/** How much of every value survives when the user prefers reduced motion. */
export const REDUCED_MOTION_DAMP = 0.3;

// Envelope phase boundaries (fractions of one animation cycle).
const ATTACK_END = 0.12;
const IMPACT_END = 0.24;
const AFTERSHOCK_END = 0.6;

/** Duration of the equip "snap on" flourish, in animation-phase ms. */
export const SNAP_ON_DURATION_MS = 520;

export function getPopPhase(cycleT: number): PopPhase {
  const t = normalizeCycle(cycleT);
  if (t < ATTACK_END) return "attack";
  if (t < IMPACT_END) return "impact";
  if (t < AFTERSHOCK_END) return "aftershock";
  return "settle";
}

function normalizeCycle(t: number): number {
  const n = t % 1;
  return n < 0 ? n + 1 : n;
}

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Impact envelope over one animation cycle.
 * Returns roughly -0.35..1: negative during the wind-up (attack),
 * peaking at 1 on impact, ringing down through the aftershock,
 * and resting at 0 while settled.
 */
export function popEnvelope(cycleT: number): number {
  const t = normalizeCycle(cycleT);

  if (t < ATTACK_END) {
    // Anticipation: pull back before the hit.
    const p = t / ATTACK_END;
    return -0.35 * Math.sin(p * Math.PI);
  }
  if (t < IMPACT_END) {
    // Snap to peak.
    const p = (t - ATTACK_END) / (IMPACT_END - ATTACK_END);
    return easeOutCubic(p);
  }
  if (t < AFTERSHOCK_END) {
    // Damped ring-down: two visible wobbles.
    const p = (t - IMPACT_END) / (AFTERSHOCK_END - IMPACT_END);
    return (1 - p) * Math.cos(p * Math.PI * 2.5) * (1 - p * 0.4);
  }
  return 0;
}

/** Smooth 0..1 breathing wave for glow/float-style motion. */
export function breatheWave(cycleT: number): number {
  return 0.5 + Math.sin(normalizeCycle(cycleT) * Math.PI * 2) * 0.5;
}

export interface ShockwaveState {
  /** Ring radius in local SVG units. */
  radius: number;
  /** Ring opacity, 0 when invisible. */
  opacity: number;
  /** Ring stroke width. */
  strokeWidth: number;
}

const SHOCKWAVE_BASE_RADIUS = 12;
const SHOCKWAVE_MAX_GROWTH = 34;

/**
 * Shockwave ring emitted at the impact point of the cycle.
 * Returns opacity 0 outside the impact/aftershock window.
 */
export function getShockwave(
  cycleT: number,
  amplitude: number,
): ShockwaveState {
  const t = normalizeCycle(cycleT);
  if (t < ATTACK_END || t > AFTERSHOCK_END) {
    return { radius: 0, opacity: 0, strokeWidth: 0 };
  }
  const p = (t - ATTACK_END) / (AFTERSHOCK_END - ATTACK_END);
  const eased = easeOutCubic(p);
  return {
    radius: SHOCKWAVE_BASE_RADIUS + eased * SHOCKWAVE_MAX_GROWTH * amplitude,
    opacity: (1 - p) * 0.55 * Math.min(1, amplitude),
    strokeWidth: 2.5 * (1 - p) + 0.5,
  };
}

export interface SnapOnState {
  /** Overall group scale during the equip flourish. */
  scale: number;
  /** Group opacity fading in. */
  opacity: number;
  /** True while the flourish is running. */
  active: boolean;
}

/**
 * "Snap on" flourish when an addon is first mounted: it lands slightly
 * oversized, overshoots below rest scale, then settles at 1.
 */
export function getSnapOn(elapsedMs: number, reduceMotion: boolean): SnapOnState {
  if (elapsedMs >= SNAP_ON_DURATION_MS || elapsedMs < 0) {
    return { scale: 1, opacity: 1, active: false };
  }
  const p = elapsedMs / SNAP_ON_DURATION_MS;
  if (reduceMotion) {
    // Gentle fade/scale only.
    return { scale: 0.96 + 0.04 * p, opacity: 0.4 + 0.6 * p, active: true };
  }
  // 1.5 -> 0.92 -> 1 with a springy overshoot.
  const drop = easeOutCubic(Math.min(1, p * 1.6));
  const overshoot = Math.sin(Math.min(1, p) * Math.PI * 2) * 0.08 * (1 - p);
  return {
    scale: 1.5 - 0.5 * drop - overshoot,
    opacity: Math.min(1, p * 3),
    active: true,
  };
}

/**
 * Particle boost during the impact window: multiplies orbit radius and
 * apparent speed so bursts feel synchronized with the hit.
 */
export function getParticleImpactBoost(
  cycleT: number,
  profile: RarityPopProfile,
  reduceMotion: boolean,
): number {
  if (reduceMotion) return 1;
  const e = Math.max(0, popEnvelope(cycleT));
  return 1 + e * (profile.particleBoost - 1);
}

export interface PopTransform {
  /** SVG transform string (may be empty). */
  transform: string;
  /** Extra opacity factor 0..1 layered onto existing opacity handling. */
  opacityFactor: number;
}

/**
 * Compute the per-type animation transform with rarity pop applied.
 * `cycleT` is normalized progress through one animation cycle.
 */
export function getPopTransform(
  type: "float" | "rotate" | "pulse" | "shimmer" | "sparkle" | "glow",
  cycleT: number,
  rarity: AddonRarity,
  reduceMotion: boolean,
): PopTransform {
  const profile = RARITY_POP[rarity];
  const damp = reduceMotion ? REDUCED_MOTION_DAMP : 1;
  const a = profile.amplitude * damp;
  const e = popEnvelope(cycleT);
  const breathe = breatheWave(cycleT);

  switch (type) {
    case "pulse": {
      // Squash & stretch: stretch tall on impact, squash wide on rebound.
      const stretch = e * 0.14 * a;
      return {
        transform: `scale(${(1 - stretch * 0.75).toFixed(4)}, ${(1 + stretch).toFixed(4)})`,
        opacityFactor: 1,
      };
    }
    case "sparkle": {
      // Snap-scale hit; sparkle particles are drawn by the renderer.
      const snap = Math.max(0, e) * 0.1 * a;
      return {
        transform: `scale(${(1 + snap).toFixed(4)})`,
        opacityFactor: 1,
      };
    }
    case "glow": {
      // Slow breathing with a small impact kick.
      const s = 1 + breathe * 0.04 * a + Math.max(0, e) * 0.05 * a;
      return {
        transform: `scale(${s.toFixed(4)})`,
        opacityFactor: 0.85 + breathe * 0.15 * Math.min(1.5, profile.glowBoost),
      };
    }
    case "shimmer": {
      // Lateral glint drift; opacity wave handled by the renderer.
      const drift = Math.sin(cycleT * Math.PI * 2) * 2.2 * a;
      const tilt = Math.sin(cycleT * Math.PI * 4) * 1.2 * a;
      return {
        transform: `translate(${drift.toFixed(3)}, 0) rotate(${tilt.toFixed(3)})`,
        opacityFactor: 1,
      };
    }
    case "rotate": {
      // Continuous spin with a tiny overshoot kick at impact.
      const deg = cycleT * 360 + e * 9 * a;
      return { transform: `rotate(${deg.toFixed(2)})`, opacityFactor: 1 };
    }
    case "float": {
      // Smooth float; rarity only widens the travel.
      const y = Math.sin(cycleT * Math.PI * 2) * (3 + 1.6 * a);
      const sway = Math.sin(cycleT * Math.PI * 2 + Math.PI / 3) * 0.8 * a;
      return {
        transform: `translate(${sway.toFixed(3)}, ${y.toFixed(3)})`,
        opacityFactor: 1,
      };
    }
    default:
      return { transform: "", opacityFactor: 1 };
  }
}

/** Deterministic sparkle positions around the addon for the sparkle type. */
export function getSparklePoints(
  cycleT: number,
  count: number,
): Array<{ x: number; y: number; r: number; opacity: number }> {
  const points: Array<{ x: number; y: number; r: number; opacity: number }> = [];
  for (let i = 0; i < count; i++) {
    const seed = i / count;
    const angle = seed * Math.PI * 2 + cycleT * Math.PI;
    const twinkle = 0.5 + Math.sin((cycleT + seed) * Math.PI * 6) * 0.5;
    points.push({
      x: Math.cos(angle) * (16 + seed * 14),
      y: Math.sin(angle) * (16 + seed * 14),
      r: 0.8 + twinkle * 1.4,
      opacity: 0.25 + twinkle * 0.65,
    });
  }
  return points;
}

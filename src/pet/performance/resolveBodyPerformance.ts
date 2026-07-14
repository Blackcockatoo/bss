import type { Vitals } from "@/vitals";
import type { BodyPerformanceState } from "./types";

/**
 * Everything the living-body resolver is allowed to read. All fields map to
 * state that already exists in the canonical store — nothing here expands
 * persistence.
 */
export interface BodyPerformanceInput {
  vitals: Vitals;
  /** DerivedTraits.personality, 0–100 scales. Optional pre-genome. */
  personality?: {
    curiosity: number;
    energy: number;
    playfulness: number;
  } | null;
  /** Total care interactions witnessed this session/history (bounded use). */
  careActions?: number;
  /** Essence gives a mild long-term confidence signal. */
  essence?: number;
  /** An active, unresolved Vimana anomaly nearby. */
  anomalyActive?: boolean;
  reducedMotion?: boolean;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/** Normalize a 0–100 vital (defensively, hostile saves included). */
function unit(value: number): number {
  return clamp01((Number.isFinite(value) ? value : 0) / 100);
}

/**
 * Derives the presentation-only trust / curiosity / stress values from
 * canonical state. These are never persisted; they exist so the body can
 * perform social behaviour without expanding the vitals schema.
 */
export function derivePresentationVitals(input: BodyPerformanceInput): {
  trust: number;
  curiosity: number;
  stress: number;
} {
  const { vitals } = input;
  const mood = unit(vitals.mood);
  const energy = unit(vitals.energy);
  const hunger = unit(vitals.hunger);
  const sickness = vitals.isSick ? unit(vitals.sicknessSeverity) : 0;
  const care = clamp01((input.careActions ?? 0) / 40);
  const essence = clamp01((input.essence ?? 0) / 400);

  const trust = clamp01(
    0.32 + mood * 0.34 + care * 0.18 + essence * 0.16 - sickness * 0.22,
  );

  const personalityCuriosity = clamp01(
    (input.personality?.curiosity ?? 50) / 100,
  );
  const curiosity = clamp01(
    personalityCuriosity * 0.55 +
      energy * 0.3 +
      mood * 0.15 -
      sickness * 0.3 -
      Math.max(0, hunger - 0.7) * 0.5,
  );

  const stress = clamp01(
    sickness * 0.55 +
      Math.max(0, hunger - 0.6) * 0.9 +
      Math.max(0, 0.25 - energy) * 1.2 +
      Math.max(0, 0.35 - mood) * 0.8 +
      (input.anomalyActive ? 0.18 : 0),
  );

  return { trust, curiosity, stress };
}

/**
 * Pure, deterministic mapping from canonical vitals to the slow living-body
 * performance layer. Same input always yields the same output; every output
 * is clamped into its documented range.
 */
export function resolveBodyPerformance(
  input: BodyPerformanceInput,
): BodyPerformanceState {
  const { vitals } = input;
  const hungerNeed = clamp01((unit(vitals.hunger) - 0.3) / 0.7);
  const fatigue = clamp01((0.65 - unit(vitals.energy)) / 0.65);
  const cheer = unit(vitals.mood);
  const surfaceClarity = unit(vitals.hygiene);
  const sickness = vitals.isSick ? Math.max(0.3, unit(vitals.sicknessSeverity)) : 0;
  const health = clamp01(1 - sickness);
  const { trust, curiosity, stress } = derivePresentationVitals(input);
  const playfulness = clamp01((input.personality?.playfulness ?? 50) / 100);
  const reducedMotion = Boolean(input.reducedMotion);

  const posture = clamp(
    0.35 +
      cheer * 0.5 +
      health * 0.25 -
      hungerNeed * 0.55 -
      fatigue * 0.65 -
      stress * 0.2,
    -1,
    1,
  );

  return {
    hungerNeed,
    fatigue,
    cheer,
    surfaceClarity,
    health,
    trust,
    curiosity,
    stress,

    posture,
    bellyTension: clamp01(hungerNeed * 0.85 + stress * 0.25),
    movementWeight: clamp01(fatigue * 0.6 + hungerNeed * 0.3 + sickness * 0.35),
    breathSeconds: clamp(
      3.1 + fatigue * 2.2 - cheer * 0.5 - stress * 1.1 + sickness * 0.6,
      1.6,
      6.5,
    ),
    breathDepth: reducedMotion
      ? clamp(0.012 + fatigue * 0.01, 0, 0.03)
      : clamp(0.03 + cheer * 0.02 + stress * 0.03 - fatigue * 0.012, 0.012, 0.09),
    animationAmplitude: reducedMotion
      ? clamp01(0.18 - sickness * 0.08)
      : clamp01(
          0.45 +
            unit(vitals.energy) * 0.4 +
            playfulness * 0.15 -
            sickness * 0.3 -
            fatigue * 0.25,
        ),
    responseSpeed: clamp(
      0.85 + unit(vitals.energy) * 0.55 - fatigue * 0.3 - sickness * 0.2,
      0.55,
      1.5,
    ),

    eyelidOpen: clamp(
      0.55 + unit(vitals.energy) * 0.45 + curiosity * 0.1 - sickness * 0.25,
      0.08,
      1.05,
    ),
    pupilDilation: clamp(
      0.9 + cheer * 0.18 + curiosity * 0.12 - stress * 0.3 + trust * 0.08,
      0.6,
      1.35,
    ),
    browTension: clamp01(stress * 0.7 + hungerNeed * 0.25 + sickness * 0.3),
    mouthCurve: clamp(
      cheer * 1.6 - 0.55 - stress * 0.4 - sickness * 0.35,
      -1,
      1,
    ),
    mouthOpen: clamp01(cheer * 0.35 + Math.max(0, hungerNeed - 0.5) * 0.5),
    headTilt: clamp(
      (cheer - 0.5) * 7 + curiosity * 3 - fatigue * 4,
      -8,
      8,
    ),
    gazeConfidence: clamp01(trust * 0.75 + cheer * 0.2 - stress * 0.25 + 0.1),
    gazeTracking: clamp01(
      curiosity * 0.55 + trust * 0.35 - fatigue * 0.35 - sickness * 0.4 + 0.15,
    ),
    proximity: clamp01(trust * 0.7 + cheer * 0.25 - stress * 0.35),

    sparkle: clamp01(surfaceClarity * 0.75 + cheer * 0.2 - sickness * 0.3),
    outlineCleanliness: clamp01(surfaceClarity * 0.85 + 0.15 - sickness * 0.2),
    saturation: clamp(
      0.78 + health * 0.22 + cheer * 0.14 - fatigue * 0.12,
      0.55,
      1.2,
    ),
    postureStability: clamp01(health * 0.7 + 0.3 - stress * 0.3 - fatigue * 0.2),
    auraCohesion: clamp01(health * 0.6 + surfaceClarity * 0.2 + trust * 0.2),
    auraTurbulence: clamp01(
      stress * 0.55 + sickness * 0.35 + hungerNeed * 0.2 + (1 - surfaceClarity) * 0.2,
    ),
    limbTension: clamp01(stress * 0.75 + hungerNeed * 0.2),
    featureActivity: clamp01(curiosity * 0.6 + cheer * 0.25 + trust * 0.15),
    bounce: clamp01(
      cheer * 0.6 + playfulness * 0.3 - fatigue * 0.5 - sickness * 0.4,
    ),
  };
}

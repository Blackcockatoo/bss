/** Pure, deterministic personality -> Geometry movement policy. */

import type { DerivedTraits } from "@/lib/genome";
import type { HeptaProfileV2 } from "@/lib/heptaProfile";
import { seededUnit } from "@/pet/movement/movementScheduler";

export type GeometryMovement =
  | "idle"
  | "wave"
  | "dab"
  | "shuffle"
  | "walk"
  | "dance"
  | "lotus";

export interface GeometryBehaviorSpec {
  temperament: string;
  dominantAxis: HeptaProfileV2["dominantAxis"];
  secondaryAxis: HeptaProfileV2["secondaryAxis"];
  minIntervalMs: number;
  maxIntervalMs: number;
  repeatAvoidance: number;
  greetingLikelihood: number;
  attentionSpan: number;
  touchResponse: number;
  noveltyBias: number;
  reactionStrength: number;
  recoverySpeed: number;
  movementWeights: Record<GeometryMovement, number>;
}

export interface GeometryBehaviorContext {
  critical?: boolean;
  sleeping?: boolean;
  reduceMotion?: boolean;
  previousMovement?: GeometryMovement;
}

export interface GeometryBehaviorDecision {
  movement: GeometryMovement;
  intent: string;
  durationMs: number;
}

const MOVEMENTS: readonly GeometryMovement[] = [
  "idle",
  "wave",
  "dab",
  "shuffle",
  "walk",
  "dance",
  "lotus",
];

const INTENTS: Record<GeometryMovement, string> = {
  idle: "Listening through the lattice",
  wave: "Reaching out to greet you",
  dab: "Throwing a bold spark",
  shuffle: "Following a restless rhythm",
  walk: "Exploring the edge of the field",
  dance: "Letting its fire move",
  lotus: "Settling into the bindu",
};

const DURATION_MS: Record<GeometryMovement, number> = {
  idle: 2_000,
  wave: 3_200,
  dab: 2_600,
  shuffle: 3_600,
  walk: 4_000,
  dance: 4_200,
  lotus: 4_800,
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const unit = (value: number | undefined): number =>
  clamp01((value ?? 50) / 100);

export function deriveGeometryBehaviorSpec(
  profile: HeptaProfileV2,
  personality: DerivedTraits["personality"],
): GeometryBehaviorSpec {
  const spark = profile.axes.spark / 100;
  const sense = profile.axes.sense / 100;
  const voice = profile.axes.voice / 100;
  const frame = profile.axes.frame / 100;
  const flux = profile.axes.flux / 100;
  const crown = profile.axes.crown / 100;
  const voidAxis = profile.axes.void / 100;
  const energy = unit(personality.energy);
  const social = unit(personality.social);
  const curiosity = unit(personality.curiosity);
  const discipline = unit(personality.discipline);
  const affection = unit(personality.affection);
  const independence = unit(personality.independence);
  const playfulness = unit(personality.playfulness);
  const loyalty = unit(personality.loyalty);

  const activity = clamp01(
    profile.behaviorWeights.cadence * 0.38 +
      energy * 0.22 +
      playfulness * 0.22 +
      flux * 0.1 +
      social * 0.08,
  );

  const noveltyBias = clamp01(
    curiosity * 0.4 + flux * 0.28 + independence * 0.2 + playfulness * 0.12,
  );
  const attentionSpan = clamp01(
    discipline * 0.32 + frame * 0.28 + loyalty * 0.22 + sense * 0.18,
  );
  const touchResponse = clamp01(
    affection * 0.42 + social * 0.25 + voice * 0.18 + loyalty * 0.15,
  );
  const reactionStrength = clamp01(
    spark * 0.3 +
      energy * 0.24 +
      playfulness * 0.22 +
      crown * 0.14 +
      voice * 0.1,
  );
  const recoverySpeed = clamp01(
    discipline * 0.3 + frame * 0.28 + loyalty * 0.24 + voidAxis * 0.18,
  );

  return {
    temperament: profile.temperament,
    dominantAxis: profile.dominantAxis,
    secondaryAxis: profile.secondaryAxis,
    minIntervalMs: Math.round(6_500 - activity * 4_000),
    maxIntervalMs: Math.round(12_000 - activity * 7_500),
    repeatAvoidance: clamp01(0.2 + noveltyBias * 0.8),
    greetingLikelihood: clamp01(
      profile.behaviorWeights.greeting * 0.45 +
        social * 0.25 +
        affection * 0.15 +
        crown * 0.08 +
        loyalty * 0.07,
    ),
    attentionSpan,
    touchResponse,
    noveltyBias,
    reactionStrength,
    recoverySpeed,
    movementWeights: {
      idle: 0.25 + voidAxis * 1.3 + frame * 0.45,
      lotus: 0.1 + voidAxis * 1.4 + discipline * 0.7 + frame * 0.55,
      wave: 0.1 + voice * 1.25 + social * 0.8 + affection * 0.45,
      walk: 0.1 + sense * 1.2 + curiosity * 0.9 + independence * 0.35,
      shuffle: 0.08 + flux * 1.25 + playfulness * 0.75,
      dance: 0.08 + spark * 1.15 + playfulness * 1.05 + energy * 0.45,
      dab: 0.05 + spark * 0.9 + crown * 0.8 + playfulness * 0.45,
    },
  };
}

export function nextGeometryBehaviorDelayMs(
  spec: GeometryBehaviorSpec,
  seed: number,
  counter: number,
): number {
  const rangeRoll = seededUnit(seed, counter, 71);
  const jitter = 0.85 + seededUnit(seed, counter, 73) * 0.3;
  const raw =
    spec.minIntervalMs + (spec.maxIntervalMs - spec.minIntervalMs) * rangeRoll;
  return Math.round(Math.max(2_500, Math.min(12_000, raw * jitter)));
}

export function decideGeometryBehavior(
  spec: GeometryBehaviorSpec,
  seed: number,
  counter: number,
  context: GeometryBehaviorContext = {},
): GeometryBehaviorDecision {
  if (context.reduceMotion) {
    return {
      movement: "idle",
      intent: "Resting with reduced motion",
      durationMs: 2_000,
    };
  }
  if (context.critical || context.sleeping) {
    return {
      movement: "lotus",
      intent: "Conserving energy in the bindu",
      durationMs: 5_000,
    };
  }

  const weights = MOVEMENTS.map((movement) => {
    const repeatPenalty =
      movement === context.previousMovement
        ? 1 - spec.repeatAvoidance * 0.85
        : 1;
    return Math.max(0, spec.movementWeights[movement] * repeatPenalty);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let target = seededUnit(seed, counter, 79) * total;
  let movement: GeometryMovement = "idle";

  for (let index = 0; index < MOVEMENTS.length; index += 1) {
    target -= weights[index];
    if (target <= 0) {
      movement = MOVEMENTS[index];
      break;
    }
  }

  return {
    movement,
    intent: INTENTS[movement],
    durationMs: Math.round(
      DURATION_MS[movement] * (0.82 + spec.attentionSpan * 0.36),
    ),
  };
}

export function greetingDecision(
  spec: GeometryBehaviorSpec,
  seed: number,
): GeometryBehaviorDecision | null {
  if (seededUnit(seed, 0, 83) > spec.greetingLikelihood) return null;
  return {
    movement: "wave",
    intent: INTENTS.wave,
    durationMs: Math.round(
      DURATION_MS.wave * (0.82 + spec.reactionStrength * 0.36),
    ),
  };
}

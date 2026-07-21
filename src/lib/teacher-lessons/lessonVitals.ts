/**
 * Meta-Pet Teacher Lesson System — classroom vitals sandbox (Pass 2, Lesson 4).
 *
 * The four core vitals (hunger, hygiene, mood, energy) are driven by the REAL
 * Meta-Pet interaction model (`INTERACTION_EFFECTS` / `applyInteraction` from
 * `@/vitals`) so the classroom demonstration matches the real system's truth.
 * Three extra classroom-only vitals (trust, curiosity, stress) are layered on
 * with simple, transparent relationships to make the "one action affects
 * several needs" idea vivid. Everything is pure and deterministic, and the
 * sandbox never touches the real pet store.
 */

import {
  INTERACTION_EFFECTS,
  applyInteraction,
  clamp,
  type Interaction,
  type Vitals,
} from "@/vitals";

/** The classroom-facing action set (maps onto real interactions). */
export type LessonAction = "feed" | "play" | "clean" | "rest" | "comfort";

/** Extended classroom vitals kept alongside the four real ones. */
export interface ClassroomVitals {
  hunger: number;
  hygiene: number;
  mood: number;
  energy: number;
  trust: number;
  curiosity: number;
  stress: number;
}

/** Deterministic starting state — every classroom begins identically. */
export const DEFAULT_CLASSROOM_VITALS: ClassroomVitals = {
  hunger: 55,
  hygiene: 60,
  mood: 50,
  energy: 45,
  trust: 50,
  curiosity: 55,
  stress: 45,
};

/** Map a classroom action to the underlying real interaction, if any. */
const ACTION_TO_INTERACTION: Record<LessonAction, Interaction | null> = {
  feed: "feed",
  clean: "clean",
  play: "play",
  rest: "sleep",
  comfort: null, // comfort is classroom-only (trust/stress focused)
};

/** Extra deltas for the classroom-only vitals, layered on the real model. */
const EXTENDED_EFFECTS: Record<
  LessonAction,
  Partial<Pick<ClassroomVitals, "trust" | "curiosity" | "stress" | "mood">>
> = {
  feed: { trust: 6, stress: -4 },
  play: { curiosity: 10, trust: 4, stress: -6 },
  clean: { trust: 3, stress: -3, curiosity: -2 },
  rest: { stress: -10, curiosity: -4 },
  comfort: { trust: 12, stress: -14, mood: 6 },
};

export interface LessonVitalMeta {
  id: keyof ClassroomVitals;
  label: string;
  /** Whether a higher value is "better" (drives colour-independent wording). */
  higherIsBetter: boolean;
}

export const CLASSROOM_VITAL_META: LessonVitalMeta[] = [
  { id: "hunger", label: "Hunger", higherIsBetter: false },
  { id: "energy", label: "Energy", higherIsBetter: true },
  { id: "mood", label: "Mood", higherIsBetter: true },
  { id: "hygiene", label: "Hygiene", higherIsBetter: true },
  { id: "trust", label: "Trust", higherIsBetter: true },
  { id: "curiosity", label: "Curiosity", higherIsBetter: true },
  { id: "stress", label: "Stress", higherIsBetter: false },
];

export interface LessonActionMeta {
  id: LessonAction;
  label: string;
  /** Short, plain-language description of the main effect. */
  immediate: string;
  /** The knock-on effect that makes the system idea vivid. */
  secondary: string;
  /** How the pet visibly responds. */
  petResponse: string;
}

export const LESSON_ACTION_META: LessonActionMeta[] = [
  {
    id: "feed",
    label: "Feed",
    immediate: "Hunger goes down",
    secondary: "Energy rises a little",
    petResponse: "The pet perks up and looks content.",
  },
  {
    id: "play",
    label: "Play",
    immediate: "Mood rises",
    secondary: "Energy falls and hunger creeps up",
    petResponse: "The pet bounces and looks excited.",
  },
  {
    id: "clean",
    label: "Clean",
    immediate: "Hygiene rises",
    secondary: "Mood lifts slightly",
    petResponse: "The pet looks fresh and calm.",
  },
  {
    id: "rest",
    label: "Rest",
    immediate: "Energy rises",
    secondary: "Stress falls",
    petResponse: "The pet settles and breathes slowly.",
  },
  {
    id: "comfort",
    label: "Comfort",
    immediate: "Stress falls",
    secondary: "Trust and mood rise",
    petResponse: "The pet leans in and relaxes.",
  },
];

export function getActionMeta(id: LessonAction): LessonActionMeta {
  return LESSON_ACTION_META.find((a) => a.id === id) ?? LESSON_ACTION_META[0];
}

/**
 * Apply a classroom action, returning the new vitals. Core-four changes come
 * from the real `applyInteraction`; classroom-only vitals use the transparent
 * extended deltas. Pure — callers keep their own state.
 */
export function applyLessonAction(
  vitals: ClassroomVitals,
  action: LessonAction,
): ClassroomVitals {
  const interaction = ACTION_TO_INTERACTION[action];

  // Start from the real model for the four core vitals.
  const coreInput: Vitals = {
    hunger: vitals.hunger,
    hygiene: vitals.hygiene,
    mood: vitals.mood,
    energy: vitals.energy,
    isSick: false,
    sicknessSeverity: 0,
    sicknessType: "none",
    deathCount: 0,
  };
  const core = interaction ? applyInteraction(coreInput, interaction) : coreInput;

  const extended = EXTENDED_EFFECTS[action];

  return {
    hunger: core.hunger,
    hygiene: core.hygiene,
    mood: clamp(core.mood + (extended.mood ?? 0)),
    energy: core.energy,
    trust: clamp(vitals.trust + (extended.trust ?? 0)),
    curiosity: clamp(vitals.curiosity + (extended.curiosity ?? 0)),
    stress: clamp(vitals.stress + (extended.stress ?? 0)),
  };
}

/** A simple 0-100 "balance" score, higher is more balanced. */
export function vitalsBalanceScore(vitals: ClassroomVitals): number {
  // Distance of each vital from its ideal (low hunger/stress, high others).
  const targets: Record<keyof ClassroomVitals, number> = {
    hunger: 25,
    hygiene: 75,
    mood: 75,
    energy: 70,
    trust: 75,
    curiosity: 70,
    stress: 25,
  };
  let totalDistance = 0;
  for (const meta of CLASSROOM_VITAL_META) {
    totalDistance += Math.abs(vitals[meta.id] - targets[meta.id]);
  }
  const maxDistance = CLASSROOM_VITAL_META.length * 100;
  return Math.round(100 - (totalDistance / maxDistance) * 100);
}

/** Expose the raw real effect table for teacher "show why" explanations. */
export function describeRealEffect(action: LessonAction): string {
  const interaction = ACTION_TO_INTERACTION[action];
  if (!interaction) {
    return "Comfort is a classroom care action focused on trust and calm.";
  }
  const effects = INTERACTION_EFFECTS[interaction];
  const parts = Object.entries(effects).map(
    ([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`,
  );
  return `Real Meta-Pet effect: ${parts.join(", ")}.`;
}

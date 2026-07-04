/**
 * B$S movement vocabulary for the Auralia geometry pet.
 *
 * A movement clip is a named, tagged unit of motion the controller can
 * schedule. Clips do not render anything themselves — components read the
 * active clip (id + normalized progress) and interpret it visually.
 *
 * Movement language: cute but cursed, sacred but playable — geometry
 * pretending to be alive. Red = impact/body/heat, blue = intelligence/
 * trail/resonance, black = shadow/afterimage/depth, gold = reward/unlock.
 */

import type { EvolutionState } from "@/evolution/types";

export type PetMood = "happy" | "neutral" | "tired" | "unhappy" | "curious";

/**
 * Priority stack, low to high. A clip may only interrupt a running clip of
 * strictly lower priority.
 */
export enum MovementPriority {
  IdleBreathing = 1,
  MoodExpression = 2,
  Attention = 3,
  TouchReaction = 4,
  AddonReaction = 5,
  AudioBeat = 6,
  BigEmotion = 7,
  EvolutionCeremony = 8,
  SecretMove = 9,
}

export type MovementTag =
  | "idle"
  | "mood"
  | "attention"
  | "touch"
  | "addon"
  | "audio"
  | "emotion"
  | "evolution"
  | "secret"
  | "red"
  | "blue"
  | "black"
  | "gold";

export interface MovementClip {
  id: string;
  label: string;
  /** Clip length in ms. */
  duration: number;
  priority: MovementPriority;
  /** 0..1 baseline strength; controllers may scale this. */
  intensity: number;
  tags: MovementTag[];
  /** Moods that allow this clip; undefined = any mood. */
  allowedMoods?: PetMood[];
  /** Evolution states that allow this clip; undefined = any state. */
  allowedEvolutionStates?: EvolutionState[];
  /** Safe to play (possibly softened) under prefers-reduced-motion. */
  reducedMotionSafe: boolean;
}

const clip = (c: MovementClip): MovementClip => c;

export const MOVEMENT_CLIPS: Record<string, MovementClip> = {
  idle_breathe: clip({
    id: "idle_breathe",
    label: "Idle Breathe",
    duration: 3200,
    priority: MovementPriority.IdleBreathing,
    intensity: 0.2,
    tags: ["idle"],
    reducedMotionSafe: true,
  }),
  blink: clip({
    id: "blink",
    label: "Blink",
    duration: 240,
    priority: MovementPriority.Attention,
    intensity: 0.3,
    tags: ["attention"],
    reducedMotionSafe: true,
  }),
  head_tilt: clip({
    id: "head_tilt",
    label: "Head Tilt",
    duration: 900,
    priority: MovementPriority.Attention,
    intensity: 0.4,
    tags: ["attention"],
    allowedMoods: ["happy", "neutral", "curious"],
    reducedMotionSafe: true,
  }),
  happy_bounce: clip({
    id: "happy_bounce",
    label: "Happy Bounce",
    duration: 1100,
    priority: MovementPriority.MoodExpression,
    intensity: 0.7,
    tags: ["mood", "red"],
    allowedMoods: ["happy"],
    reducedMotionSafe: false,
  }),
  sleepy_droop: clip({
    id: "sleepy_droop",
    label: "Sleepy Droop",
    duration: 2600,
    priority: MovementPriority.MoodExpression,
    intensity: 0.35,
    tags: ["mood", "black"],
    allowedMoods: ["tired"],
    reducedMotionSafe: true,
  }),
  wing_flutter: clip({
    id: "wing_flutter",
    label: "Wing Flutter",
    duration: 800,
    priority: MovementPriority.MoodExpression,
    intensity: 0.6,
    tags: ["mood", "blue"],
    allowedMoods: ["happy", "curious"],
    reducedMotionSafe: false,
  }),
  aura_pulse: clip({
    id: "aura_pulse",
    label: "Aura Pulse",
    duration: 1400,
    priority: MovementPriority.AddonReaction,
    intensity: 0.5,
    tags: ["addon", "blue"],
    reducedMotionSafe: true,
  }),
  tap_surprise: clip({
    id: "tap_surprise",
    label: "Tap Surprise",
    duration: 620,
    priority: MovementPriority.TouchReaction,
    intensity: 0.8,
    tags: ["touch", "red"],
    reducedMotionSafe: true,
  }),
  hold_charge: clip({
    id: "hold_charge",
    label: "Hold Charge",
    duration: 1600,
    priority: MovementPriority.TouchReaction,
    intensity: 0.7,
    tags: ["touch", "gold"],
    reducedMotionSafe: true,
  }),
  swipe_spin: clip({
    id: "swipe_spin",
    label: "Swipe Spin",
    duration: 950,
    priority: MovementPriority.TouchReaction,
    intensity: 0.85,
    tags: ["touch", "blue"],
    reducedMotionSafe: false,
  }),
  beat_hit: clip({
    id: "beat_hit",
    label: "Beat Hit",
    duration: 380,
    priority: MovementPriority.AudioBeat,
    intensity: 0.6,
    tags: ["audio", "blue"],
    reducedMotionSafe: true,
  }),
  quantum_split: clip({
    id: "quantum_split",
    label: "Quantum Split",
    duration: 1300,
    priority: MovementPriority.BigEmotion,
    intensity: 0.9,
    tags: ["emotion", "black", "blue"],
    allowedEvolutionStates: ["QUANTUM", "SPECIATION"],
    reducedMotionSafe: false,
  }),
  black_wing_bloom: clip({
    id: "black_wing_bloom",
    label: "Black Wing Bloom",
    duration: 2200,
    priority: MovementPriority.EvolutionCeremony,
    intensity: 1,
    tags: ["evolution", "black", "gold"],
    allowedEvolutionStates: ["SPECIATION"],
    reducedMotionSafe: false,
  }),
  evolution_ceremony: clip({
    id: "evolution_ceremony",
    label: "Evolution Ceremony",
    duration: 4200,
    priority: MovementPriority.EvolutionCeremony,
    intensity: 1,
    tags: ["evolution", "gold"],
    reducedMotionSafe: true,
  }),

  // ── Signature secret moves (rare) ─────────────────────────────────────
  omen_twitch: clip({
    id: "omen_twitch",
    label: "Omen Twitch",
    duration: 420,
    priority: MovementPriority.SecretMove,
    intensity: 0.75,
    tags: ["secret", "black"],
    reducedMotionSafe: true,
  }),
  moss60_orbit: clip({
    id: "moss60_orbit",
    label: "Moss60 Orbit",
    duration: 3600,
    priority: MovementPriority.SecretMove,
    intensity: 0.5,
    tags: ["secret", "blue"],
    reducedMotionSafe: true,
  }),
  venom_pulse: clip({
    id: "venom_pulse",
    label: "Venom Pulse",
    duration: 1200,
    priority: MovementPriority.SecretMove,
    intensity: 0.85,
    tags: ["secret", "red"],
    allowedMoods: ["unhappy", "neutral"],
    reducedMotionSafe: false,
  }),
  folded_wing_hide: clip({
    id: "folded_wing_hide",
    label: "Folded-Wing Hide",
    duration: 2000,
    priority: MovementPriority.SecretMove,
    intensity: 0.4,
    tags: ["secret", "black"],
    allowedMoods: ["tired", "unhappy"],
    reducedMotionSafe: true,
  }),
  oracle_blink: clip({
    id: "oracle_blink",
    label: "Oracle Blink",
    duration: 700,
    priority: MovementPriority.SecretMove,
    intensity: 0.6,
    tags: ["secret", "gold"],
    allowedEvolutionStates: ["NEURO", "QUANTUM", "SPECIATION"],
    reducedMotionSafe: true,
  }),
  quantum_stutter: clip({
    id: "quantum_stutter",
    label: "Quantum Stutter",
    duration: 900,
    priority: MovementPriority.SecretMove,
    intensity: 0.9,
    tags: ["secret", "black", "blue"],
    allowedEvolutionStates: ["QUANTUM", "SPECIATION"],
    reducedMotionSafe: false,
  }),
  sacred_toy_bounce: clip({
    id: "sacred_toy_bounce",
    label: "Sacred Toy Bounce",
    duration: 1500,
    priority: MovementPriority.SecretMove,
    intensity: 0.8,
    tags: ["secret", "gold", "red"],
    allowedMoods: ["happy", "curious"],
    reducedMotionSafe: false,
  }),
};

export const SECRET_MOVE_IDS: string[] = Object.values(MOVEMENT_CLIPS)
  .filter((c) => c.tags.includes("secret"))
  .map((c) => c.id);

export function getMovementClip(id: string): MovementClip | undefined {
  return MOVEMENT_CLIPS[id];
}

/** Whether a clip may play given the pet's current mood/evolution/motion prefs. */
export function isClipAllowed(
  clipDef: MovementClip,
  mood: PetMood,
  evolutionState: EvolutionState,
  reduceMotion: boolean,
): boolean {
  if (reduceMotion && !clipDef.reducedMotionSafe) return false;
  if (clipDef.allowedMoods && !clipDef.allowedMoods.includes(mood)) return false;
  if (
    clipDef.allowedEvolutionStates &&
    !clipDef.allowedEvolutionStates.includes(evolutionState)
  ) {
    return false;
  }
  return true;
}

/** Map raw 0–100 mood/energy stats to the vocabulary's mood buckets. */
export function deriveMood(
  mood: number,
  energy: number,
  curiosity: number,
): PetMood {
  if (energy < 30) return "tired";
  if (mood < 35) return "unhappy";
  if (mood > 70) return "happy";
  if (curiosity > 70) return "curious";
  return "neutral";
}

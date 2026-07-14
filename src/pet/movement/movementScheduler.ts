/**
 * Deterministic movement scheduler.
 *
 * The controller's "brain tick" used to roll `Math.random()`, which made
 * behaviour untestable and hydration-hostile. This module replaces it with
 * a pure decision function driven by a stable pet identity seed plus an
 * advancing local tick counter: the same pet replays the same behavioural
 * rhythm, different pets keep genuinely different rhythms, and nothing here
 * ever runs during React render or persists into Zustand.
 */

import {
  MOVEMENT_CLIPS,
  SECRET_MOVE_IDS,
  isClipAllowed,
  type PetMood,
} from "./movementVocabulary";
import type { EvolutionState } from "@/evolution/types";

/** FNV-1a hash for deriving a numeric seed from any stable identity string. */
export function hashSeed(identity: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/** Deterministic 0..1 stream value for (seed, counter, salt). */
export function seededUnit(seed: number, counter: number, salt = 0): number {
  let state = (seed ^ Math.imul(counter + 1, 0x9e3779b9) ^ Math.imul(salt + 1, 0x85ebca6b)) >>> 0;
  state = Math.imul(state ^ (state >>> 16), 0x45d9f3b) >>> 0;
  state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35) >>> 0;
  state ^= state >>> 16;
  return (state >>> 0) / 4_294_967_296;
}

export interface SchedulerGates {
  mood: PetMood;
  evolutionState: EvolutionState;
  reduceMotion: boolean;
  /** Critical states suppress celebratory moves entirely. */
  critical: boolean;
  /** An explicit care action is currently reacting; ambient picks wait. */
  careActionActive: boolean;
  equippedAddonCount: number;
  secretMoveChance: number;
}

/** Clips that read as celebration and must not fire in critical states. */
const CELEBRATORY_CLIPS = new Set([
  "happy_bounce",
  "sacred_toy_bounce",
  "wing_flutter",
  "swipe_spin",
  "black_wing_bloom",
]);

export function isCelebratoryClip(clipId: string): boolean {
  return CELEBRATORY_CLIPS.has(clipId);
}

/**
 * Pure brain-tick decision: which ambient clip (if any) wants to play at
 * this counter value. Returns null when the pet should simply keep doing
 * what it is doing. Deterministic in (seed, counter, gates).
 */
export function decideAmbientClip(
  seed: number,
  counter: number,
  gates: SchedulerGates,
): string | null {
  // During an explicit care reaction the ambient brain stays quiet:
  // blinking or mood expressions must never interrupt an action response.
  if (gates.careActionActive) return null;

  const allowed = (clipId: string): boolean => {
    const clip = MOVEMENT_CLIPS[clipId];
    if (!clip) return false;
    if (gates.critical && isCelebratoryClip(clipId)) return false;
    return isClipAllowed(clip, gates.mood, gates.evolutionState, gates.reduceMotion);
  };

  const roll = seededUnit(seed, counter, 1);

  // Rare secret signature move — genuinely rare, never during crisis
  // celebration-suppression unless the move itself is a low-key one.
  if (roll < gates.secretMoveChance) {
    const pickIndex = Math.floor(
      seededUnit(seed, counter, 2) * SECRET_MOVE_IDS.length,
    );
    const pick = SECRET_MOVE_IDS[pickIndex % SECRET_MOVE_IDS.length];
    if (allowed(pick)) return pick;
  }

  // Occasional addon shimmer when anything is equipped.
  if (gates.equippedAddonCount > 0 && roll < 0.18 && allowed("aura_pulse")) {
    return "aura_pulse";
  }

  // Mood expression roughly every few ticks.
  if (roll < 0.45) {
    const moodClip =
      gates.mood === "happy"
        ? "happy_bounce"
        : gates.mood === "tired"
          ? "sleepy_droop"
          : gates.mood === "curious"
            ? "wing_flutter"
            : "head_tilt";
    if (allowed(moodClip)) return moodClip;
    // Suppressed celebration degrades to a calm head tilt, not silence.
    if (moodClip !== "head_tilt" && allowed("head_tilt")) return "head_tilt";
  }

  // Ambient blink keeps the face alive between expressions.
  if (roll < 0.78 && allowed("blink")) return "blink";

  return null;
}

/**
 * Deterministic blink cadence: seconds until the next natural blink for a
 * given blink index. Varies per pet and per blink but replays identically.
 */
export function blinkIntervalSeconds(
  seed: number,
  blinkIndex: number,
  fatigue: number,
): number {
  const jitter = seededUnit(seed, blinkIndex, 5);
  const base = 2.6 + jitter * 3.4;
  return base * (1 - Math.min(0.45, Math.max(0, fatigue) * 0.45));
}

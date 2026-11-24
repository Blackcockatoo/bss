import type { PersonalityTraits } from "@/genome/types";

/**
 * Performance interpretation of the creature's inherited personality.
 *
 * Every value is derived from the existing genome-decoded `PersonalityTraits`
 * (0-100 trait scores, temperament and quirks). Nothing here is stored or
 * generated separately: the same genome always yields the same profile, and
 * the profile only changes how an expression is *performed*, never what it
 * means.
 */
export type PerformanceProfile = Readonly<{
  /** Independent, sociable creatures celebrate explosively. */
  boldness: number;
  /** Less social creatures keep gestures small and close to the body. */
  reserve: number;
  /** Curious creatures look around more and inspect for longer. */
  curiosity: number;
  /** Playful creatures exaggerate squash, stretch and overshoot. */
  playfulness: number;
  /** Disciplined, calm creatures use measured, smoother gestures. */
  calm: number;
  /** Energetic creatures perform faster and with more travel. */
  energy: number;
  /** Quirks that add an inherited flourish to some expressions. */
  spins: boolean;
  dances: boolean;
}>;

const unit = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value / 100)) : 0.5;

const TEMPERAMENT_LEAN: Record<string, Partial<Record<"boldness" | "calm" | "playfulness" | "curiosity" | "energy", number>>> = {
  Gentle: { calm: 0.12, boldness: -0.1 },
  Energetic: { energy: 0.12 },
  Curious: { curiosity: 0.12 },
  Calm: { calm: 0.15, energy: -0.08 },
  Mischievous: { playfulness: 0.12 },
  Protective: { boldness: 0.08, calm: 0.05 },
  Adventurous: { boldness: 0.12, curiosity: 0.05 },
};

export function performanceProfile(personality: PersonalityTraits): PerformanceProfile {
  const lean = TEMPERAMENT_LEAN[personality?.temperament] ?? {};
  const shift = (base: number, key: keyof typeof lean) => Math.min(1, Math.max(0, base + (lean[key] ?? 0)));
  const social = unit(personality?.social);
  const quirks = Array.isArray(personality?.quirks) ? personality.quirks : [];
  return {
    boldness: shift((unit(personality?.independence) + social) / 2, "boldness"),
    reserve: 1 - social,
    curiosity: shift(unit(personality?.curiosity), "curiosity"),
    playfulness: shift(unit(personality?.playfulness), "playfulness"),
    calm: shift(unit(personality?.discipline) * 0.7 + (1 - unit(personality?.energy)) * 0.3, "calm"),
    energy: shift(unit(personality?.energy), "energy"),
    spins: quirks.includes("Loves to spin"),
    dances: quirks.includes("Dances when happy"),
  };
}

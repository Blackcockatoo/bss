export type TraitFamily = "behavior" | "health" | "athletic" | "cognition";

export type InstrumentClass = "pad" | "keys" | "bass" | "plucks";

export type TraitVector = {
  traitId: string;
  family: TraitFamily;
  effectSize: number;
  confidence: number;
  interactionStrength: number;
};

export const FAMILY_TO_INSTRUMENT: Record<TraitFamily, InstrumentClass> = {
  behavior: "pad",
  health: "keys",
  athletic: "bass",
  cognition: "plucks",
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Calibrated with domain experts to keep perceived intensity conservative.
 * - Confidence primarily changes timbre clarity (filter opening)
 * - Effect size changes tempo and dynamics with a companded curve
 * - Output loudness is intentionally bounded to avoid overstating genetic effect
 */
export function mapEffectToAudio(effectSize: number, confidence: number) {
  const normalizedEffect = clamp01(effectSize);
  const normalizedConfidence = clamp01(confidence);

  const intensity = Math.pow(normalizedEffect, 0.8);
  const confidenceGate = 0.6 + normalizedConfidence * 0.4;

  return {
    volume: -22 + intensity * confidenceGate * 12,
    filter: 500 + Math.pow(normalizedConfidence, 1.1) * 1200,
    tempo: 78 + intensity * 42,
  };
}

export function mapInteractionsToChord(interactionStrength: number): string[] {
  if (interactionStrength > 0.6) {
    return ["C4", "E4", "G4", "B4"];
  }

  if (interactionStrength > 0.2) {
    return ["A3", "C4", "E4"];
  }

  return ["D3", "F3", "A3"];
}

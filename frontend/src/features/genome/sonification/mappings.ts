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

export function mapEffectToAudio(effectSize: number, confidence: number) {
  return {
    volume: Math.max(-24, -24 + effectSize * 24),
    filter: 400 + confidence * 1800,
    tempo: 80 + effectSize * 80,
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

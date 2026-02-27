export type SonifySummaryResponse = {
  petId: string;
  normalizedTraitVector: Array<{
    traitId: string;
    family: "behavior" | "health" | "athletic" | "cognition";
    value: number;
    confidence: number;
  }>;
  interactionMatrix: Record<string, Record<string, number>>;
};

export function getSonifySummary(petId: string): SonifySummaryResponse {
  const normalizedTraitVector = [
    { traitId: "sociality", family: "behavior" as const, value: 0.82, confidence: 0.91 },
    { traitId: "resilience", family: "health" as const, value: 0.67, confidence: 0.83 },
    { traitId: "agility", family: "athletic" as const, value: 0.77, confidence: 0.79 },
    { traitId: "focus", family: "cognition" as const, value: 0.58, confidence: 0.75 },
  ];

  return {
    petId,
    normalizedTraitVector,
    interactionMatrix: {
      sociality: { resilience: 0.2, agility: -0.1 },
      resilience: { focus: 0.35 },
      agility: { focus: 0.18 },
      focus: { sociality: 0.12 },
    },
  };
}

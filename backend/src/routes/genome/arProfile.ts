export type RegionTraitCard = {
  region: string;
  trait: string;
  confidence: number;
  uncertaintyNote: string;
};

export function getArProfile(petId: string): { petId: string; cards: RegionTraitCard[] } {
  return {
    petId,
    cards: [
      {
        region: "head",
        trait: "focus",
        confidence: 0.78,
        uncertaintyNote: "Signal may vary with sleep quality and stress.",
      },
      {
        region: "chest",
        trait: "resilience",
        confidence: 0.81,
        uncertaintyNote: "Cardio-linked trait projections have moderate model variance.",
      },
      {
        region: "hind_legs",
        trait: "agility",
        confidence: 0.86,
        uncertaintyNote: "Outcome depends strongly on activity schedule.",
      },
    ],
  };
}

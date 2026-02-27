export type RegionTraitCard = {
  region: "head" | "chest" | "forelegs" | "hind_legs" | "tail";
  trait: string;
  confidence: number;
  uncertaintyNote: string;
};

const deterministicV1Cards: RegionTraitCard[] = [
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
    region: "forelegs",
    trait: "coordination",
    confidence: 0.73,
    uncertaintyNote: "Coordination projections are sensitive to recent training load.",
  },
  {
    region: "hind_legs",
    trait: "agility",
    confidence: 0.86,
    uncertaintyNote: "Outcome depends strongly on activity schedule.",
  },
  {
    region: "tail",
    trait: "balance",
    confidence: 0.69,
    uncertaintyNote: "Balance inference has higher uncertainty for younger pets.",
  },
];

export function getArProfile(petId: string): { petId: string; cards: RegionTraitCard[]; schemaVersion: "v1" } {
  return {
    petId,
    schemaVersion: "v1",
    cards: deterministicV1Cards,
  };
}

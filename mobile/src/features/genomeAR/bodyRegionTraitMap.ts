export type BodyRegion = "head" | "chest" | "forelegs" | "hind_legs" | "tail";

export type RegionTraitMapping = {
  region: BodyRegion;
  traitCluster: string;
  confidenceColor: string;
  educationalHint: string;
};

export const bodyRegionTraitMap: RegionTraitMapping[] = [
  {
    region: "head",
    traitCluster: "cognition-focus",
    confidenceColor: "#22d3ee",
    educationalHint: "Head-region markers are linked to attention and learning speed.",
  },
  {
    region: "chest",
    traitCluster: "cardio-resilience",
    confidenceColor: "#4ade80",
    educationalHint: "Chest-linked markers influence endurance and recovery traits.",
  },
  {
    region: "hind_legs",
    traitCluster: "mobility-power",
    confidenceColor: "#f59e0b",
    educationalHint: "Hind-leg trait clusters correlate with agility potential.",
  },
];

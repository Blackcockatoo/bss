export type BodyRegion = "head" | "chest" | "forelegs" | "hind_legs" | "tail";

export type RegionTraitMapping = {
  region: BodyRegion;
  traitCluster: string;
  confidenceColor: string;
  educationalHint: string;
  markerAnchor: "skull" | "sternum" | "carpal" | "pelvic" | "caudal";
};

export const bodyRegionTraitMap: RegionTraitMapping[] = [
  {
    region: "head",
    traitCluster: "cognition-focus",
    confidenceColor: "#22d3ee",
    educationalHint: "Head-region markers are linked to attention and learning speed.",
    markerAnchor: "skull",
  },
  {
    region: "chest",
    traitCluster: "cardio-resilience",
    confidenceColor: "#4ade80",
    educationalHint: "Chest-linked markers influence endurance and recovery traits.",
    markerAnchor: "sternum",
  },
  {
    region: "forelegs",
    traitCluster: "coordination-stability",
    confidenceColor: "#a78bfa",
    educationalHint: "Foreleg markers can indicate coordination and stance stability.",
    markerAnchor: "carpal",
  },
  {
    region: "hind_legs",
    traitCluster: "mobility-power",
    confidenceColor: "#f59e0b",
    educationalHint: "Hind-leg trait clusters correlate with agility potential.",
    markerAnchor: "pelvic",
  },
  {
    region: "tail",
    traitCluster: "balance-recovery",
    confidenceColor: "#fb7185",
    educationalHint: "Tail-adjacent markers often track balance and directional recovery.",
    markerAnchor: "caudal",
  },
];

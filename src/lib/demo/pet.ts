export interface DemoPet {
  id: string;
  name: string;
  species: string;
  mood: string;
  level: number;
  energy: number;
  focus: number;
  activities: string[];
  genomeSummary: string;
}

export const SEEDED_DEMO_PET: DemoPet = {
  id: "demo-pet-01",
  name: "Nova",
  species: "Lumen Fox",
  mood: "Curious",
  level: 3,
  energy: 84,
  focus: 67,
  activities: ["Pattern Explorer", "Breathing Orbit", "Genome Mix Lab"],
  genomeSummary: "AAGT-CCGT-TTAC-GGCA",
};

export function getPetOrDemo(pet?: Partial<DemoPet> | null): DemoPet {
  return {
    ...SEEDED_DEMO_PET,
    ...(pet ?? {}),
  };
}

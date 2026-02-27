export type EnvironmentChoice = {
  diet: "standard" | "high-protein" | "balanced";
  activity: "low" | "medium" | "high";
  enrichment: "low" | "medium" | "high";
};

export type FutureBranch = {
  id: string;
  label: string;
  confidence: number;
  divergenceSummary: string;
};

export function projectFutures(petId: string, env: EnvironmentChoice): FutureBranch[] {
  const modifier =
    (env.diet === "high-protein" ? 0.06 : 0) +
    (env.activity === "high" ? 0.08 : env.activity === "medium" ? 0.03 : -0.02) +
    (env.enrichment === "high" ? 0.06 : env.enrichment === "medium" ? 0.02 : -0.03);

  return [
    {
      id: `${petId}-balanced-growth`,
      label: "Balanced Growth Arc",
      confidence: Math.min(0.95, 0.72 + modifier),
      divergenceSummary: "Stable emotional profile with moderate athletic gain.",
    },
    {
      id: `${petId}-performance-arc`,
      label: "Performance Arc",
      confidence: Math.min(0.92, 0.64 + modifier / 2),
      divergenceSummary: "Higher agility trajectory, mild attention volatility risk.",
    },
  ];
}

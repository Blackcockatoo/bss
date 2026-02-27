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
  branchDrivers: Array<{
    driver: "diet" | "activity" | "enrichment";
    selectedValue: string;
    provenanceLabel: string;
  }>;
  confidenceSignals: Array<{
    signal: string;
    strength: number;
    rationale: string;
  }>;
};

const STAGE_MODIFIER = {
  "puppy/kitten": 0.02,
  adolescent: 0.05,
  adult: 0,
  senior: -0.03,
} as const;

export function projectFutures(
  petId: string,
  env: EnvironmentChoice,
  stage: keyof typeof STAGE_MODIFIER = "adult",
): FutureBranch[] {
  const modifier =
    (env.diet === "high-protein" ? 0.06 : 0) +
    (env.activity === "high" ? 0.08 : env.activity === "medium" ? 0.03 : -0.02) +
    (env.enrichment === "high" ? 0.06 : env.enrichment === "medium" ? 0.02 : -0.03);
  const stageModifier = STAGE_MODIFIER[stage] ?? 0;

  const branchDrivers: FutureBranch["branchDrivers"] = [
    {
      driver: "diet",
      selectedValue: env.diet,
      provenanceLabel: `Care plan input · diet:${env.diet}`,
    },
    {
      driver: "activity",
      selectedValue: env.activity,
      provenanceLabel: `Care plan input · activity:${env.activity}`,
    },
    {
      driver: "enrichment",
      selectedValue: env.enrichment,
      provenanceLabel: `Care plan input · enrichment:${env.enrichment}`,
    },
  ];

  const confidenceSignals: FutureBranch["confidenceSignals"] = [
    {
      signal: "genetic-fit",
      strength: Math.max(0.35, Math.min(1, 0.63 + stageModifier + modifier * 0.35)),
      rationale: "Alignment between selected environment and inherited trait expression.",
    },
    {
      signal: "longitudinal-cohort",
      strength: Math.max(0.3, Math.min(1, 0.58 + stageModifier * 0.5 + modifier * 0.2)),
      rationale: "How similar care routines performed across matching historical cohorts.",
    },
    {
      signal: "signal-consistency",
      strength: Math.max(0.25, Math.min(1, 0.61 + modifier * 0.1)),
      rationale: "Consistency of model outputs across perturbation checks.",
    },
  ];

  return [
    {
      id: `${petId}-${stage}-balanced-growth`,
      label: "Balanced Growth Arc",
      confidence: Math.min(0.95, 0.72 + modifier + stageModifier),
      divergenceSummary: "Stable emotional profile with moderate athletic gain.",
      branchDrivers,
      confidenceSignals,
    },
    {
      id: `${petId}-${stage}-performance-arc`,
      label: "Performance Arc",
      confidence: Math.min(0.92, 0.64 + modifier / 2 + stageModifier),
      divergenceSummary: "Higher agility trajectory, mild attention volatility risk.",
      branchDrivers,
      confidenceSignals,
    },
  ];
}

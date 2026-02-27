import {
  type EnvironmentChoice,
  type FutureBranch,
  validateEnvironmentChoice,
  validatePetId,
} from "../../domain/genomeContracts";

export function projectFutures(petId: string, env: EnvironmentChoice): FutureBranch[] {
  const normalizedPetId = validatePetId(petId);
  const validatedEnvironment = validateEnvironmentChoice(env);

  const modifier =
    (validatedEnvironment.diet === "high-protein" ? 0.06 : 0) +
    (validatedEnvironment.activity === "high"
      ? 0.08
      : validatedEnvironment.activity === "medium"
        ? 0.03
        : -0.02) +
    (validatedEnvironment.enrichment === "high"
      ? 0.06
      : validatedEnvironment.enrichment === "medium"
        ? 0.02
        : -0.03);

  return [
    {
      id: `${normalizedPetId}-balanced-growth`,
      label: "Balanced Growth Arc",
      confidence: Math.min(0.95, 0.72 + modifier + stageModifier),
      divergenceSummary: "Stable emotional profile with moderate athletic gain.",
      branchDrivers,
      confidenceSignals,
    },
    {
      id: `${normalizedPetId}-performance-arc`,
      label: "Performance Arc",
      confidence: Math.min(0.92, 0.64 + modifier / 2 + stageModifier),
      divergenceSummary: "Higher agility trajectory, mild attention volatility risk.",
      branchDrivers,
      confidenceSignals,
    },
  ];
}

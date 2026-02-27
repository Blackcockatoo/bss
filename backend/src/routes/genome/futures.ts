import {
  type EnvironmentChoice,
  type FutureBranch,
  validateEnvironmentChoice,
  validatePetId,
} from "../../domain/genomeContracts";

const clampConfidence = (value: number, max: number): number => Math.max(0, Math.min(max, value));

export function projectFutures(petId: string, env: EnvironmentChoice): FutureBranch[] {
  const normalizedPetId = validatePetId(petId);
  const validatedEnvironment = validateEnvironmentChoice(env);

  const modifier =
    (validatedEnvironment.diet === "high-protein" ? 0.06 : validatedEnvironment.diet === "balanced" ? 0.02 : 0) +
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

  const stageModifier =
    (validatedEnvironment.activity === "high" && validatedEnvironment.enrichment !== "low" ? 0.02 : 0) +
    (validatedEnvironment.diet === "balanced" && validatedEnvironment.activity === "medium" ? 0.01 : 0);

  return [
    {
      id: `${normalizedPetId}-balanced-growth`,
      label: "Balanced Growth Arc",
      confidence: clampConfidence(0.72 + modifier + stageModifier, 0.95),
      divergenceSummary: "Stable emotional profile with moderate athletic gain.",
    },
    {
      id: `${normalizedPetId}-performance-arc`,
      label: "Performance Arc",
      confidence: clampConfidence(0.64 + modifier / 2 + stageModifier, 0.92),
      divergenceSummary: "Higher agility trajectory, mild attention volatility risk.",
    },
  ];
}

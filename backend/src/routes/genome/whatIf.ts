import { whatIfScenarioRepository } from "../../repositories/whatIfScenarioRepository";

export function listScenarios(ownerId: string) {
  return whatIfScenarioRepository.listByOwner(ownerId);
}

export function saveScenario(ownerId: string, name: string, controls: Record<string, number>) {
  return whatIfScenarioRepository.save({ ownerId, name, controls });
}

export function shareScenario(sharedToken: string) {
  const scenario = whatIfScenarioRepository.findBySharedToken(sharedToken);
  if (!scenario) {
    throw new Error("Scenario not found");
  }

  return {
    id: scenario.id,
    name: scenario.name,
    controls: scenario.controls,
    sharedToken: scenario.sharedToken,
    updatedAt: scenario.updatedAt,
  };
}

import type { SimulationRequest, SimulationResult } from "../../../../shared/contracts/genomeResonance";

export type InteractionGraph = Record<string, Record<string, number>>;

export function runTraitIntervention(
  request: SimulationRequest,
  graph: InteractionGraph,
): SimulationResult[] {
  return Object.entries(request.deltas).map(([traitId, delta]) => {
    const neighborhood = graph[traitId] ?? {};
    const propagated = Object.values(neighborhood).reduce((sum, value) => sum + delta * value, delta);
    const uncertainty = Math.min(0.4, Math.abs(propagated) * 0.25);
    const feasibility = Math.max(0.1, 1 - uncertainty);

    const biggestConflict = Object.entries(neighborhood).find(([, weight]) => weight < -0.4);

    return {
      traitId,
      estimate: propagated,
      lowerBound: propagated - uncertainty,
      upperBound: propagated + uncertainty,
      tradeoffWarning: biggestConflict
        ? `Boosting ${traitId} may suppress ${biggestConflict[0]}.`
        : undefined,
      feasibility,
    };
  });
}

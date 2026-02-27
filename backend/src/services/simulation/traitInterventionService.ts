export type TraitDeltaInput = Record<string, number>;

export type InteractionGraph = Record<string, Record<string, number>>;

export type InterventionOutput = {
  traitId: string;
  predictedShift: number;
  confidenceInterval: { lower: number; upper: number };
  tradeoffAlert?: string;
  feasibilityScore: number;
};

export function runTraitIntervention(
  deltas: TraitDeltaInput,
  graph: InteractionGraph,
): InterventionOutput[] {
  return Object.entries(deltas).map(([traitId, delta]) => {
    const neighborhood = graph[traitId] ?? {};
    const propagated = Object.values(neighborhood).reduce((sum, value) => sum + delta * value, delta);
    const uncertainty = Math.min(0.4, Math.abs(propagated) * 0.25);
    const feasibility = Math.max(0.1, 1 - uncertainty);

    const biggestConflict = Object.entries(neighborhood).find(([, weight]) => weight < -0.4);

    return {
      traitId,
      predictedShift: propagated,
      confidenceInterval: {
        lower: propagated - uncertainty,
        upper: propagated + uncertainty,
      },
      tradeoffAlert: biggestConflict
        ? `Boosting ${traitId} may suppress ${biggestConflict[0]}.`
        : undefined,
      feasibilityScore: feasibility,
    };
  });
}

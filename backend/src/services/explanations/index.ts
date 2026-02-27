import type {
  ExplanationRequest,
  ExplanationResponse,
  SimulationResult,
} from "../../../../shared/contracts/genomeResonance";

type EvidenceItem = {
  signal: string;
  confidence: number;
  implication: string;
  limitation: string;
};

const cache = new Map<string, ExplanationResponse>();

function toEvidence(selectedTraitId: string | undefined, simulation: SimulationResult[]): EvidenceItem[] {
  const focusResult =
    simulation.find((item) => item.traitId === selectedTraitId) ??
    simulation[0];

  if (!focusResult) {
    return [];
  }

  return [
    {
      signal: selectedTraitId ?? focusResult.traitId,
      confidence: Math.max(0.3, Math.min(0.95, focusResult.feasibility)),
      implication: `an estimated shift of ${focusResult.estimate.toFixed(2)} with likely range ${focusResult.lowerBound.toFixed(2)} to ${focusResult.upperBound.toFixed(2)}`,
      limitation: focusResult.tradeoffWarning ?? "Simulation reflects probabilistic trend, not destiny.",
    },
    ...simulation
      .filter((item) => item !== focusResult)
      .slice(0, 2)
      .map((item) => ({
        signal: item.traitId,
        confidence: Math.max(0.25, Math.min(0.9, item.feasibility - 0.05)),
        implication: `secondary response estimate ${item.estimate.toFixed(2)}`,
        limitation: item.tradeoffWarning ?? "Secondary effects can vary by environment and training.",
      })),
  ];
}

export function buildExplanation(input: ExplanationRequest): ExplanationResponse {
  const key = `${input.petId}:${input.viewStateKey}:${input.tone}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const evidence = toEvidence(input.selectedTraitId, input.simulation);

  const blocks = evidence.map((item, index) => ({
    id: `insight-${index + 1}`,
    title: `Insight ${index + 1}`,
    message:
      input.tone === "story"
        ? `Your pet's ${item.signal} appears to hum with ${item.implication}.`
        : input.tone === "practical"
          ? `${item.signal} indicates ${item.implication}.`
          : `${item.signal}: posterior implication ${item.implication}.`,
    sourceSignals: [item.signal],
    confidence: item.confidence,
    guardrail: item.limitation,
  }));

  const output: ExplanationResponse = {
    petId: input.petId,
    viewStateKey: input.viewStateKey,
    tone: input.tone,
    generatedAt: new Date().toISOString(),
    blocks,
  };

  cache.set(key, output);
  return output;
}

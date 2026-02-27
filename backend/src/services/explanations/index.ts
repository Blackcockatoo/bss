export type ExplanationTone = "story" | "practical" | "technical";

export type ExplanationInput = {
  petId: string;
  viewStateKey: string;
  tone: ExplanationTone;
  evidence: Array<{ signal: string; confidence: number; implication: string; limitation: string }>;
};

export type ExplanationOutput = {
  petId: string;
  viewStateKey: string;
  tone: ExplanationTone;
  generatedAt: string;
  blocks: Array<{
    title: string;
    message: string;
    sourceSignals: string[];
    confidence: number;
    guardrail: string;
  }>;
};

const cache = new Map<string, ExplanationOutput>();

export function buildExplanation(input: ExplanationInput): ExplanationOutput {
  const key = `${input.petId}:${input.viewStateKey}:${input.tone}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const blocks = input.evidence.map((item, index) => ({
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

  const output: ExplanationOutput = {
    petId: input.petId,
    viewStateKey: input.viewStateKey,
    tone: input.tone,
    generatedAt: new Date().toISOString(),
    blocks,
  };

  cache.set(key, output);
  return output;
}

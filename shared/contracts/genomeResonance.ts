export type ExplanationTone = "story" | "practical" | "technical";

export type SimulationResult = {
  traitId: string;
  estimate: number;
  lowerBound: number;
  upperBound: number;
  feasibility: number;
  tradeoffWarning?: string;
};

export type SimulationRequest = {
  selectedTraitId?: string;
  deltas: Record<string, number>;
};

export type SimulationResponse = {
  selectedTraitId?: string;
  generatedAt: string;
  results: SimulationResult[];
};

export type ExplanationBlock = {
  id: string;
  title: string;
  message: string;
  sourceSignals: string[];
  confidence: number;
  guardrail: string;
};

export type ExplanationRequest = {
  petId: string;
  viewStateKey: string;
  tone: ExplanationTone;
  selectedTraitId?: string;
  simulation: SimulationResult[];
};

export type ExplanationResponse = {
  petId: string;
  viewStateKey: string;
  tone: ExplanationTone;
  generatedAt: string;
  blocks: ExplanationBlock[];
};

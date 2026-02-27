"use client";

import { useState } from "react";
import { ConstellationDome } from "../../../frontend/src/features/genome/ConstellationDome";
import { ResonanceArena } from "../../../frontend/src/features/genome/arena/ResonanceArena";
import { ExplainerPanel } from "../../../frontend/src/features/genome/explainer/ExplainerPanel";
import { SonificationCompareMode } from "../../../frontend/src/features/genome/sonification/CompareMode";
import { GenomeTimeline } from "../../../frontend/src/features/genome/timeline/GenomeTimeline";
import { WhatIfLab } from "../../../frontend/src/features/genome/whatIf/WhatIfLab";
import type {
  ExplanationBlock,
  ExplanationResponse,
  SimulationResponse,
  SimulationResult,
} from "../../../shared/contracts/genomeResonance";

const nodes = [
  {
    id: "sociality",
    chromosome: "chr1",
    traitFamily: "behavior",
    effectSize: 0.8,
    confidence: 0.9,
    stageActivation: { kitten_puppy: 0.7, adolescent: 0.9, adult: 0.8, senior: 0.6 },
  },
  {
    id: "agility",
    chromosome: "chr3",
    traitFamily: "athletic",
    effectSize: 0.74,
    confidence: 0.82,
    stageActivation: { kitten_puppy: 0.6, adolescent: 0.8, adult: 0.9, senior: 0.5 },
  },
  {
    id: "focus",
    chromosome: "chr4",
    traitFamily: "cognition",
    effectSize: 0.59,
    confidence: 0.76,
    stageActivation: { kitten_puppy: 0.4, adolescent: 0.6, adult: 0.7, senior: 0.7 },
  },
];

const edges = [
  { source: "sociality", target: "focus", weight: 0.34, interactionType: "coexpression" as const },
  { source: "agility", target: "focus", weight: 0.21, interactionType: "support" as const },
];

const initialBlocks: ExplanationBlock[] = [
  {
    id: "exp-1",
    title: "Behavioral Signal",
    message: "Pick a trait, run a simulation, and this panel will explain evidence-backed implications.",
    sourceSignals: ["sociality", "focus"],
    confidence: 0.82,
    guardrail: "This is not a deterministic temperament diagnosis.",
  },
];

export default function GenomeResonancePage() {
  const [selectedTraitId, setSelectedTraitId] = useState<string>(nodes[0].id);
  const [lastSimulation, setLastSimulation] = useState<SimulationResult[]>([]);
  const [blocks, setBlocks] = useState<ExplanationBlock[]>(initialBlocks);

  async function runSimulation(deltas: Record<string, number>) {
    const simulationResponse = await fetch("/api/genome-resonance/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedTraitId, deltas }),
    });

    const simulationData = (await simulationResponse.json()) as SimulationResponse;
    setLastSimulation(simulationData.results);

    const nextViewStateKey = `${selectedTraitId}:${simulationData.results.map((item) => `${item.traitId}:${item.estimate.toFixed(2)}`).join("|")}`;

    const explanationResponse = await fetch("/api/genome-resonance/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petId: "pet-a",
        viewStateKey: nextViewStateKey,
        tone: "story",
        selectedTraitId,
        simulation: simulationData.results,
      }),
    });

    const explanationData = (await explanationResponse.json()) as ExplanationResponse;
    setBlocks(explanationData.blocks);

    return simulationData.results;
  }

  return (
    <main className="space-y-4 p-4">
      <section className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
        <h1 className="text-lg font-semibold">Genome Resonance v1 Loop</h1>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-300">
          <li>Select a trait node in the Constellation Dome.</li>
          <li>Adjust What-If sliders and run a simulation.</li>
          <li>Review the explainer blocks generated from node + simulation evidence.</li>
        </ol>
        <div className="mt-2 text-xs text-sky-300">Current selected node: {selectedTraitId}</div>
      </section>

      <ConstellationDome nodes={nodes} edges={edges} onNodeSelect={setSelectedTraitId} />
      <WhatIfLab
        controls={[
          { id: "sociality", label: "Sociality", baseline: 0.7 },
          { id: "agility", label: "Agility", baseline: 0.6 },
        ]}
        onResults={setLastSimulation}
        onSimulate={runSimulation}
      />
      <SonificationCompareMode petAId="pet-a" petBId="pet-b" />
      <GenomeTimeline
        branchesByStage={{
          adult: [
            { id: "b1", label: "Balanced Arc", confidence: 0.8, divergenceSummary: "Balanced mood and athletics." },
            { id: "b2", label: "Performance Arc", confidence: 0.73, divergenceSummary: "Improved speed; slight focus volatility." },
          ],
        }}
      />
      <ResonanceArena signatures={[{ petId: "pet-a", behavior: 0.8, health: 0.66, athletic: 0.74 }]} />
      <ExplainerPanel blocks={blocks} />

      <section className="rounded-xl border border-slate-800 p-4 text-xs">
        <h3 className="font-semibold">v1 Success Metrics</h3>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-300">
          <li>Time to first trait insight (node select → first explanation block render).</li>
          <li>% users who run at least one simulation.</li>
          <li>% simulations with viewed explanation.</li>
        </ul>
      </section>
    </main>
  );
}

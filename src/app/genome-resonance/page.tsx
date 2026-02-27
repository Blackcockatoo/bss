"use client";

import { ConstellationDome } from "../../../frontend/src/features/genome/ConstellationDome";
import { ResonanceArena } from "../../../frontend/src/features/genome/arena/ResonanceArena";
import { ExplainerPanel } from "../../../frontend/src/features/genome/explainer/ExplainerPanel";
import { SonificationCompareMode } from "../../../frontend/src/features/genome/sonification/CompareMode";
import { GenomeTimeline } from "../../../frontend/src/features/genome/timeline/GenomeTimeline";
import { WhatIfLab } from "../../../frontend/src/features/genome/whatIf/WhatIfLab";

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

export default function GenomeResonancePage() {
  return (
    <main className="space-y-4 p-4">
      <ConstellationDome nodes={nodes} edges={edges} />
      <WhatIfLab
        controls={[
          { id: "sociality", label: "Sociality", baseline: 0.7 },
          { id: "agility", label: "Agility", baseline: 0.6 },
        ]}
        onSimulate={async (deltas) =>
          Object.entries(deltas).map(([traitId, value]) => ({
            traitId,
            estimate: value,
            lowerBound: value - 0.12,
            upperBound: value + 0.12,
            tradeoffWarning: value > 0.15 ? "Elevating this trait can reduce recovery stability." : undefined,
            feasibility: Math.max(0.25, 0.9 - Math.abs(value)),
          }))
        }
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
      <ExplainerPanel
        blocks={[
          {
            id: "exp-1",
            title: "Behavioral Signal",
            message: "Your pet may thrive in social enrichment routines.",
            sourceSignals: ["sociality", "focus"],
            confidence: 0.82,
            guardrail: "This is not a deterministic temperament diagnosis.",
          },
        ]}
      />
    </main>
  );
}

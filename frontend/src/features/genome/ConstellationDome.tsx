"use client";

import { useMemo, useState } from "react";
import {
  stageOrder,
  transformToConstellationGraph,
  type DevelopmentStage,
  type GenomeEdge,
  type GenomeNode,
} from "./graphTransform";

type Props = {
  nodes: GenomeNode[];
  edges: GenomeEdge[];
  onLassoSelect?: (nodeIds: string[]) => Promise<void> | void;
  onNodeSelect?: (nodeId: string) => void;
};

export function ConstellationDome({ nodes, edges, onLassoSelect, onNodeSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [stage, setStage] = useState<DevelopmentStage>("adult");
  const graph = useMemo(() => transformToConstellationGraph(nodes, edges, stage), [nodes, edges, stage]);

  const selectedNode = nodes.find((node) => node.id === selected);

  async function selectCluster() {
    const firstSix = graph.nodes.slice(0, 6).map((node) => node.id);
    await onLassoSelect?.(firstSix);
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Genome Constellation Dome</h2>
        <button className="rounded-md bg-sky-500 px-3 py-1 text-sm font-medium" onClick={selectCluster} type="button">
          Lasso (demo selection)
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-slate-800 p-3">
          <p className="mb-2 text-xs text-slate-400">Node map (2D projection placeholder for 3D scene)</p>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
            {graph.nodes.map((node) => (
              <button
                className="rounded border px-2 py-1 text-left text-xs"
                key={node.id}
                onClick={() => {
                  setSelected(node.id);
                  onNodeSelect?.(node.id);
                }}
                style={{ borderColor: node.color }}
                type="button"
              >
                <div className="font-medium">{node.id}</div>
                <div className="text-slate-400">radius: {node.radius.toFixed(2)}</div>
              </button>
            ))}
          </div>

          <label className="mt-3 block text-xs text-slate-300" htmlFor="timeline-stage">
            Time scrubber
          </label>
          <input
            id="timeline-stage"
            max={stageOrder.length - 1}
            min={0}
            onChange={(event) => setStage(stageOrder[Number(event.target.value)])}
            step={1}
            type="range"
            value={stageOrder.indexOf(stage)}
          />
          <p className="text-xs text-slate-400">Stage: {stage.replace("_", "/")}</p>
        </div>

        <aside className="rounded-lg border border-slate-800 p-3 text-sm">
          <h3 className="font-semibold">Trait detail panel</h3>
          {selectedNode ? (
            <div className="mt-2 space-y-1 text-xs">
              <p>ID: {selectedNode.id}</p>
              <p>Trait family: {selectedNode.traitFamily}</p>
              <p>Effect size: {selectedNode.effectSize.toFixed(2)}</p>
              <p>Confidence: {(selectedNode.confidence * 100).toFixed(0)}%</p>
              <p>Related traits: {edges.filter((edge) => edge.source === selectedNode.id).map((edge) => edge.target).join(", ") || "None"}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Select a node to inspect confidence, effect size, and related traits.</p>
          )}
        </aside>
      </div>
    </section>
  );
}

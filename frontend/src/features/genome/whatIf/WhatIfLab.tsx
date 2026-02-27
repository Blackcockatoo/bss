"use client";

import { useMemo, useState } from "react";
import type { SimulationResult } from "../../../../../shared/contracts/genomeResonance";

export type TraitControl = {
  id: string;
  label: string;
  baseline: number;
};

type Scenario = {
  name: string;
  controls: Record<string, number>;
};

type Props = {
  controls: TraitControl[];
  onSimulate: (deltas: Record<string, number>) => Promise<SimulationResult[]>;
  onResults?: (results: SimulationResult[]) => void;
};

export function WhatIfLab({ controls, onSimulate, onResults }: Props) {
  const baseline = useMemo(
    () => controls.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.id]: c.baseline }), {}),
    [controls],
  );
  const [values, setValues] = useState<Record<string, number>>(baseline);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [saved, setSaved] = useState<Scenario[]>([]);

  async function run() {
    const deltas = Object.fromEntries(
      Object.entries(values).map(([id, value]) => [id, value - baseline[id]]),
    );
    const nextResults = await onSimulate(deltas);
    setResults(nextResults);
    onResults?.(nextResults);
  }

  function reset() {
    setValues(baseline);
    setResults([]);
    onResults?.([]);
  }

  function saveScenario() {
    const scenario: Scenario = { name: `Scenario ${saved.length + 1}`, controls: values };
    const next = [...saved, scenario];
    setSaved(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("genome-whatif-scenarios", JSON.stringify(next));
    }
  }

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">What-If Lab</h3>
      <div className="mt-3 space-y-3">
        {controls.map((control) => (
          <label className="block text-xs" key={control.id}>
            {control.label}: {values[control.id].toFixed(2)}
            <input
              className="w-full"
              max={1}
              min={0}
              onChange={(event) =>
                setValues((state) => ({ ...state, [control.id]: Number(event.target.value) }))
              }
              step={0.01}
              type="range"
              value={values[control.id]}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <button className="rounded bg-indigo-500 px-3 py-1 text-white" onClick={run} type="button">Simulate</button>
        <button className="rounded border px-3 py-1" onClick={reset} type="button">Reset baseline</button>
        <button className="rounded border px-3 py-1" onClick={saveScenario} type="button">Save/share scenario</button>
      </div>

      <ul className="mt-4 space-y-2 text-xs">
        {results.map((result) => (
          <li className="rounded border border-slate-700 p-2" key={result.traitId}>
            <div className="font-medium">{result.traitId}</div>
            <div>
              Central estimate: {result.estimate.toFixed(2)} [{result.lowerBound.toFixed(2)} -{" "}
              {result.upperBound.toFixed(2)}]
            </div>
            <div>Feasibility: {(result.feasibility * 100).toFixed(0)}%</div>
            {result.tradeoffWarning ? <div className="text-amber-300">Tradeoff: {result.tradeoffWarning}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

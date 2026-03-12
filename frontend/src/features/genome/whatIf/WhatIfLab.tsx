"use client";

import { useEffect, useMemo, useState } from "react";
import type { SimulationResult } from "../../../../../shared/contracts/genomeResonance";
import {
  type SavedScenario,
  listSavedScenarios,
  saveScenario,
} from "../data/genomePersistenceClient";

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
    () =>
      controls.reduce<Record<string, number>>(
        (acc, c) => ({ ...acc, [c.id]: c.baseline }),
        {},
      ),
    [controls],
  );
  const [values, setValues] = useState<Record<string, number>>(baseline);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    listSavedScenarios()
      .then(setSaved)
      .catch(() => setError("Failed to load saved scenarios."));
  }, []);

  async function run() {
    setError(null);
    setIsRunning(true);

    try {
      const deltas = Object.fromEntries(
        Object.entries(values).map(([id, value]) => [id, value - baseline[id]]),
      );
      const nextResults = await onSimulate(deltas);
      setResults(nextResults);
      onResults?.(nextResults);
    } catch (error) {
      setResults([]);
      onResults?.([]);
      setError(error instanceof Error ? error.message : "Simulation failed.");
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
    setValues(baseline);
    setResults([]);
    onResults?.([]);
  }

  async function persistScenario() {
    setError(null);
    const optimistic: SavedScenario = {
      id: `optimistic-${saved.length + 1}`,
      name: `Scenario ${saved.length + 1}`,
      controls: values,
      sharedToken: "pending",
      updatedAt: new Date().toISOString(),
    };
    const previous = saved;
    setSaved([...previous, optimistic]);

    try {
      const persisted = await saveScenario(optimistic.name, values);
      setSaved([...previous, persisted]);
    } catch {
      setSaved(previous);
      setError("Scenario save failed and was rolled back.");
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
                setValues((state) => ({
                  ...state,
                  [control.id]: Number(event.target.value),
                }))
              }
              step={0.01}
              type="range"
              value={values[control.id]}
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <button
          className="rounded bg-indigo-500 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRunning}
          onClick={run}
          type="button"
        >
          {isRunning ? "Simulating..." : "Simulate"}
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={reset}
          type="button"
        >
          Reset baseline
        </button>
        <button
          className="rounded border px-3 py-1"
          onClick={persistScenario}
          type="button"
        >
          Save/share scenario
        </button>
      </div>

      <ul className="mt-4 space-y-2 text-xs">
        {results.map((result) => (
          <li
            className="rounded border border-slate-700 p-2"
            key={result.traitId}
          >
            <div className="font-medium">{result.traitId}</div>
            <div>
              Central estimate: {result.estimate.toFixed(2)} [
              {result.lowerBound.toFixed(2)} - {result.upperBound.toFixed(2)}]
            </div>
            <div>Feasibility: {(result.feasibility * 100).toFixed(0)}%</div>
            {result.tradeoffWarning ? (
              <div className="text-amber-300">
                Tradeoff: {result.tradeoffWarning}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Saved scenarios: {saved.length}
      </p>
      {saved.at(-1)?.sharedToken && saved.at(-1)?.sharedToken !== "pending" ? (
        <p className="mt-1 text-xs text-slate-500">
          Share token: {saved.at(-1)?.sharedToken}
        </p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </section>
  );
}

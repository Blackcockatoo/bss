"use client";

import { useState } from "react";

export type ToneMode = "story" | "practical" | "technical";

export type ExplanationBlock = {
  id: string;
  title: string;
  message: string;
  sourceSignals: string[];
  confidence: number;
  guardrail: string;
};

type Props = {
  blocks: ExplanationBlock[];
};

export function ExplainerPanel({ blocks }: Props) {
  const [mode, setMode] = useState<ToneMode>("story");

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">AI Explainer</h3>
      <div className="mt-2 flex gap-2 text-xs">
        {(["story", "practical", "technical"] as const).map((item) => (
          <button
            className={`rounded px-2 py-1 ${mode === item ? "bg-emerald-600 text-white" : "border"}`}
            key={item}
            onClick={() => setMode(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-2 text-xs">
        {blocks.map((block) => (
          <li className="rounded border border-slate-700 p-2" key={block.id}>
            <div className="font-medium">{block.title}</div>
            <div>{block.message}</div>
            <div>Source signals: {block.sourceSignals.join(", ")}</div>
            <div>Confidence: {(block.confidence * 100).toFixed(0)}%</div>
            <div className="text-amber-300">What this does not mean: {block.guardrail}</div>
            <div className="text-slate-500">Tone mode active: {mode}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useState } from "react";

type OverlayMode = "similarity" | "complementarity" | "divergence";

type Signature = {
  petId: string;
  behavior: number;
  health: number;
  athletic: number;
};

type Props = {
  signatures: Signature[];
};

export function ResonanceArena({ signatures }: Props) {
  const [mode, setMode] = useState<OverlayMode>("similarity");

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">Resonance Arena</h3>
      <div className="mt-2 flex gap-2 text-xs">
        {(["similarity", "complementarity", "divergence"] as const).map((item) => (
          <button
            className={`rounded px-2 py-1 ${mode === item ? "bg-violet-600 text-white" : "border"}`}
            key={item}
            onClick={() => setMode(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-2 text-xs">
        {signatures.map((signature) => (
          <li className="rounded border border-slate-700 p-2" key={signature.petId}>
            <div className="font-medium">{signature.petId}</div>
            <div>
              Overlay ({mode}): B {signature.behavior.toFixed(2)} / H {signature.health.toFixed(2)} / A{" "}
              {signature.athletic.toFixed(2)}
            </div>
            <div className="text-slate-400">Live cursor + annotations hook point</div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-slate-500">Invite links, viewer/editor permission controls, and snapshot export are supported in room APIs.</p>
    </section>
  );
}

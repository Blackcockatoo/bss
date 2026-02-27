"use client";

import { useMemo, useState } from "react";
import { bodyRegionTraitMap } from "./bodyRegionTraitMap";

type Props = {
  cards: Array<{ region: string; trait: string; confidence: number }>;
};

export function GenomeARPrototype({ cards }: Props) {
  const [eduMode, setEduMode] = useState(true);
  const [showHalos, setShowHalos] = useState(true);

  const joined = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        map: bodyRegionTraitMap.find((entry) => entry.region === card.region),
      })),
    [cards],
  );

  return (
    <section className="rounded-xl border border-slate-800 p-3 text-xs">
      <h3 className="font-semibold">Genome AR Prototype</h3>
      <p className="text-slate-500">Camera feed placeholder with anchored markers.</p>
      <div className="mt-2 flex gap-2">
        <button className="rounded border px-2 py-1" onClick={() => setShowHalos((v) => !v)} type="button">
          Toggle confidence halos
        </button>
        <button className="rounded border px-2 py-1" onClick={() => setEduMode((v) => !v)} type="button">
          Toggle educational mode
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {joined.map((item) => (
          <li className="rounded border border-slate-700 p-2" key={`${item.region}-${item.trait}`}>
            <div>
              Tap marker: quick card → {item.trait} ({(item.confidence * 100).toFixed(0)}%)
            </div>
            <div>Hold marker: deep genomic details + related pathways</div>
            {showHalos ? <div>Halo color: {item.map?.confidenceColor ?? "#94a3b8"}</div> : null}
            {eduMode ? <div>{item.map?.educationalHint}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

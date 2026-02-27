"use client";

import { useMemo, useState } from "react";
import { bodyRegionTraitMap, type BodyRegion } from "./bodyRegionTraitMap";

type Props = {
  cards: Array<{ region: BodyRegion; trait: string; confidence: number }>;
  onMarkerInteraction?: (event: ArMarkerInteractionEvent) => void;
};

export type ArMarkerInteractionEvent = {
  region: BodyRegion;
  trait: string;
  gesture: "tap" | "hold";
  confidence: number;
  timestamp: string;
};

export function GenomeARPrototype({ cards, onMarkerInteraction }: Props) {
  const [eduMode, setEduMode] = useState(true);
  const [showHalos, setShowHalos] = useState(true);

  const joined = useMemo(
    () =>
      bodyRegionTraitMap.map((overlay) => {
        const card = cards.find((item) => item.region === overlay.region);
        return {
          region: overlay.region,
          trait: card?.trait ?? overlay.traitCluster,
          confidence: card?.confidence ?? 0.5,
          map: overlay,
        };
      }),
    [cards],
  );

  function trackMarkerInteraction(region: BodyRegion, trait: string, confidence: number, gesture: "tap" | "hold") {
    onMarkerInteraction?.({
      region,
      trait,
      confidence,
      gesture,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <section className="rounded-xl border border-slate-800 p-3 text-xs">
      <h3 className="font-semibold">Genome AR Prototype (optional)</h3>
      <p className="text-slate-500">Stable marker overlays with deterministic region cards.</p>
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
            <div className="font-medium">Marker overlay: {item.region}</div>
            <div>
              <button
                className="mr-2 rounded border px-2 py-0.5"
                onClick={() => trackMarkerInteraction(item.region, item.trait, item.confidence, "tap")}
                type="button"
              >
                Tap marker
              </button>
              quick card → {item.trait} ({(item.confidence * 100).toFixed(0)}%)
            </div>
            <div>
              <button
                className="mr-2 rounded border px-2 py-0.5"
                onClick={() => trackMarkerInteraction(item.region, item.trait, item.confidence, "hold")}
                type="button"
              >
                Hold marker
              </button>
              deep genomic details + related pathways
            </div>
            {showHalos ? <div>Halo color: {item.map.confidenceColor}</div> : null}
            {eduMode ? <div>{item.map.educationalHint}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

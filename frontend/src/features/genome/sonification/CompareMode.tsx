"use client";

import { useMemo } from "react";
import { buildSonifiedTracks, synchronizeTracks } from "./engine";
import type { TraitVector } from "./mappings";

type Props = {
  petA: TraitVector[];
  petB: TraitVector[];
};

export function SonificationCompareMode({ petA, petB }: Props) {
  const synced = useMemo(() => {
    const a = buildSonifiedTracks(petA);
    const b = buildSonifiedTracks(petB);
    return synchronizeTracks(a, b);
  }, [petA, petB]);

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">Sonification Compare Mode</h3>
      <p className="text-xs text-slate-500">Two pets rendered as synchronized tracks with active genome region cues.</p>
      <ul className="mt-3 space-y-2 text-xs">
        {synced.map((pair) => (
          <li className="rounded border border-slate-700 p-2" key={`${pair.primary.traitId}-${pair.activeGenomeRegion}`}>
            <div className="font-medium">{pair.activeGenomeRegion}</div>
            <div>A: {pair.primary.instrument} {pair.primary.chord.join("-")}</div>
            <div>B: {pair.secondary.instrument} {pair.secondary.chord.join("-")}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

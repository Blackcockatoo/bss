'use client';

import { useMemo } from 'react';

import { useStore } from '@/lib/store';

export default function AppGenomePage() {
  const genome = useStore((state) => state.genome);
  const evolution = useStore((state) => state.evolution);
  const genomeSummary = useMemo(() => {
    if (!genome) {
      return null;
    }

    return [
      `R-${genome.red60.slice(0, 8).join('')}`,
      `B-${genome.blue60.slice(0, 8).join('')}`,
      `K-${genome.black60.slice(0, 8).join('')}`,
    ].join(' · ');
  }, [genome]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-white">Genome View</h1>
      <p className="mt-2 text-zinc-300">
        The active companion&apos;s current genome signature is shown below.
      </p>
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        {genomeSummary ? (
          <>
            <p className="font-mono text-lg tracking-widest text-cyan-200">{genomeSummary}</p>
            <p className="mt-3 text-sm text-zinc-400">
              Live stage: {evolution.state} · Level {evolution.level}
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-400">
            No active genome is loaded in this session yet.
          </p>
        )}
      </div>
    </main>
  );
}

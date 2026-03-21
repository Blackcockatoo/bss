"use client";

import { Moss60Hub } from "@/components/Moss60Hub";
import { useDnaImprint } from "@/lib/dnaImprint";

export default function AppMoss60Page() {
  const dnaImprint = useDnaImprint();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">
            Student App
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            MOSS60 Studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Read the active companion through pet-coded glyphs, shaped reality projections,
            readable security lessons, and deterministic MOSS60 exports.
          </p>
        </div>

        <section className="mb-6 grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">
              What MOSS60 is
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-100">
              This is the advanced studio. It turns the pet and DNA layers into
              readable glyphs, proof trails, and geometry exports instead of
              introducing a separate product line.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">
              Why the jargon exists
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-100">
              In practice, the jargon maps to mechanics: glyphs are visual
              outputs, braids are proof layers, and security lessons explain how
              integrity checks work on the active companion data.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">
              Current handoff
            </p>
            {dnaImprint ? (
              <div className="mt-3 space-y-2 text-sm text-zinc-100">
                <p>
                  Resonance: <strong>{dnaImprint.resonanceClass}</strong>
                </p>
                <p>
                  Mutation seed:{" "}
                  <span className="font-mono">{dnaImprint.liveMutationSeed}</span>
                </p>
                <p>Last DNA mode: {dnaImprint.completedMode}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-zinc-100">
                Open the DNA route first to bring a live genome imprint into the
                advanced studio.
              </p>
            )}
          </div>
        </section>

        <Moss60Hub />
      </div>
    </main>
  );
}

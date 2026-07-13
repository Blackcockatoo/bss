'use client';

import { useEffect, useMemo, useState } from 'react';

import { resolveDigitalDosha, type DigitalDoshaKey } from '@/digital-dosha';
import { useStore } from '@/lib/store';

const ACTION_WINDOW_MS = 1_600;

const DOSHA_META: Record<DigitalDoshaKey, { name: string; alias: string; description: string }> = {
  vata: {
    name: 'Vāta',
    alias: 'Flux',
    description: 'Movement, signal, curiosity, switching and adaptive variation.',
  },
  pitta: {
    name: 'Pitta',
    alias: 'Forge',
    description: 'Transformation, focus, learning intensity and processing heat.',
  },
  kapha: {
    name: 'Kapha',
    alias: 'Anchor',
    description: 'Memory, bonding, persistence, resilience and structural cohesion.',
  },
};

function percentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function DigitalDoshaPanel({ className = '' }: { className?: string }) {
  const traits = useStore((state) => state.traits);
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  // Tracks which action timestamp has aged past the reaction window. Keeps
  // render pure (no Date.now during render): while an action is fresh the
  // memo is fed now=lastActionAt (full impulse), after the timer fires it is
  // fed a time past the window (impulse settled).
  const [settledActionAt, setSettledActionAt] = useState<number | null>(null);

  useEffect(() => {
    if (!lastAction || !lastActionAt) return;
    const remaining = ACTION_WINDOW_MS - (Date.now() - lastActionAt);
    const timeout = window.setTimeout(
      () => setSettledActionAt(lastActionAt),
      Math.max(0, remaining + 20),
    );
    return () => window.clearTimeout(timeout);
  }, [lastAction, lastActionAt]);

  const actionSettled = !lastActionAt || settledActionAt === lastActionAt;

  const dosha = useMemo(() => {
    if (!traits) return null;
    return resolveDigitalDosha({
      traits,
      vitals,
      evolution,
      lastAction,
      lastActionAt,
      now: actionSettled ? lastActionAt + ACTION_WINDOW_MS : lastActionAt,
    });
  }, [actionSettled, evolution, lastAction, lastActionAt, traits, vitals]);

  if (!dosha) return null;

  const keys: DigitalDoshaKey[] = ['vata', 'pitta', 'kapha'];

  return (
    <section className={`rounded-3xl border border-violet-900/50 bg-slate-950/75 p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300">Digital dosha dynamics</p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {DOSHA_META[dosha.constitution.dominant].alias}–{DOSHA_META[dosha.constitution.secondary].alias} constitution
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            The inherited ratio is the pet&apos;s native operating pattern. Live experience creates temporary drift; the target is not equal thirds.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-right text-xs text-zinc-400">
          <p className="uppercase tracking-wide text-zinc-500">Current phase</p>
          <p className="mt-1 text-sm font-semibold text-violet-200">{dosha.state.phase.replace('-', ' ')}</p>
          <p className="mt-1">Coherence {percentage(dosha.state.coherence)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {keys.map((key) => {
          const meta = DOSHA_META[key];
          const nativeValue = dosha.constitution.baseline[key];
          const currentValue = dosha.state.current[key];
          const drift = dosha.state.drift[key];
          return (
            <article key={key} className="rounded-2xl border border-slate-800 bg-slate-900/55 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-white">{meta.alias} <span className="text-xs font-normal text-zinc-500">({meta.name})</span></h3>
                <span className="text-xs text-zinc-400">{drift >= 0 ? '+' : ''}{Math.round(drift * 100)} drift</span>
              </div>
              <p className="mt-2 min-h-12 text-xs leading-5 text-zinc-500">{meta.description}</p>
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="mb-1 flex justify-between"><span>Native</span><span>{percentage(nativeValue)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500/70" style={{ width: percentage(nativeValue) }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between"><span>Current</span><span>{percentage(currentValue)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-violet-400/80" style={{ width: percentage(currentValue) }} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"><span className="text-zinc-500">Volatility</span><p className="mt-1 font-semibold text-white">{percentage(dosha.state.volatility)}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"><span className="text-zinc-500">Throughput</span><p className="mt-1 font-semibold text-white">{percentage(dosha.state.throughput)}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"><span className="text-zinc-500">Cohesion</span><p className="mt-1 font-semibold text-white">{percentage(dosha.state.cohesion)}</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"><span className="text-zinc-500">Digital residue</span><p className="mt-1 font-semibold text-white">{percentage(dosha.state.residue)}</p></div>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-900/40 bg-violet-950/20 p-4">
        <p className="text-xs uppercase tracking-wide text-violet-300">System cue · {dosha.guidance.cue}</p>
        <p className="mt-2 text-sm text-zinc-300">{dosha.guidance.label}</p>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-zinc-600">
        Symbolic game architecture inspired by Ayurvedic dosha concepts. It is not a human constitution test, health assessment or medical model.
      </p>
    </section>
  );
}

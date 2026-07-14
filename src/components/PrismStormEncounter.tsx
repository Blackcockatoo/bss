'use client';

import { useEffect, useRef, useState } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import { createPrismStorm, submitPrismGuess, type PrismStormState } from '@/lib/minigames/prismStorm';

interface PrismStormEncounterProps {
  seed: number;
  accentHue: number;
  onComplete: () => void;
}

export function PrismStormEncounter({ seed, accentHue, onComplete }: PrismStormEncounterProps) {
  // createPrismStorm is a pure function of `seed` — safe to call during render.
  const [state, setState] = useState<PrismStormState>(() => createPrismStorm(seed));
  const [lastWrong, setLastWrong] = useState<number | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (state.resolved && !completedRef.current) {
      completedRef.current = true;
      triggerHaptic('success');
      const timer = window.setTimeout(onComplete, 550);
      return () => window.clearTimeout(timer);
    }
  }, [state.resolved, onComplete]);

  const handleGuess = (index: number) => {
    if (state.resolved) return;
    const next = submitPrismGuess(state, index);
    setState(next);
    if (next.resolved) {
      setLastWrong(null);
    } else {
      setLastWrong(index);
      triggerHaptic('warning');
      window.setTimeout(() => setLastWrong((current) => (current === index ? null : current)), 400);
    }
  };

  return (
    <div
      className="vimana-map-fx absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-slate-950"
      style={{ animation: 'vimana-sheet-up 160ms ease-out' }}
    >
      <style>{`
        @keyframes prism-steady {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.28); opacity: 1; }
        }
        @keyframes prism-flicker {
          0% { transform: scale(1); opacity: 0.6; }
          12% { transform: scale(1.4); opacity: 1; }
          20% { transform: scale(0.85); opacity: 0.5; }
          38% { transform: scale(1.15); opacity: 0.9; }
          55% { transform: scale(0.9); opacity: 0.6; }
          70% { transform: scale(1.3); opacity: 1; }
          85% { transform: scale(0.95); opacity: 0.55; }
          100% { transform: scale(1); opacity: 0.6; }
        }
      `}</style>

      <p className="text-xs uppercase tracking-wide text-slate-400">
        {state.resolved ? 'Stable signal found!' : 'Prism Storm — tap the one steady signal'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {state.signals.map((signal) => {
          const hue = (accentHue + signal.id * 40) % 360;
          const wrong = lastWrong === signal.id;
          const foundStable = state.resolved && signal.stable;
          return (
            <button
              key={signal.id}
              type="button"
              aria-label={`Signal ${signal.id + 1}`}
              onPointerDown={(event) => {
                event.preventDefault();
                handleGuess(signal.id);
              }}
              disabled={state.resolved}
              className="relative flex h-14 w-14 touch-none items-center justify-center rounded-full disabled:cursor-default"
            >
              <span
                className="vimana-map-fx absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, hsl(${hue} 85% 65%), hsl(${hue} 70% 35%))`,
                  animation:
                    state.resolved && !signal.stable
                      ? 'none'
                      : `${signal.stable ? 'prism-steady 1s' : 'prism-flicker 1.3s'} ease-in-out ${(signal.id % 5) * 0.15}s infinite`,
                  opacity: wrong ? 0.3 : state.resolved && !signal.stable ? 0.15 : 1,
                  boxShadow: foundStable ? `0 0 26px hsl(${hue} 90% 65%)` : undefined,
                }}
              />
            </button>
          );
        })}
      </div>

      {!state.resolved && (
        <p className="text-[11px] text-slate-500">
          {lastWrong !== null
            ? 'That one is flickering — keep watching for the steady pulse.'
            : 'Every attempt reveals something — guess as many times as you need.'}
        </p>
      )}
      {state.resolved && (
        <p className="text-lg font-bold text-emerald-300" style={{ textShadow: '0 0 16px #34d399' }}>
          Signal isolated!
        </p>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import {
  beginEchoInput,
  createEchoLoop,
  submitEchoTap,
  type EchoLoopState,
} from '@/lib/minigames/echoLoop';

interface EchoLoopEncounterProps {
  seed: number;
  accentHue: number;
  onComplete: () => void;
}

const PAD_ON_MS = 480;
const PAD_GAP_MS = 220;
const LEAD_IN_MS = 500;

export function EchoLoopEncounter({ seed, accentHue, onComplete }: EchoLoopEncounterProps) {
  // createEchoLoop is a pure function of `seed` — safe to call during render.
  const [state, setState] = useState<EchoLoopState>(() => createEchoLoop(seed));
  const [activePad, setActivePad] = useState<number | null>(null);
  const completedRef = useRef(false);

  // Plays the sequence back once, then hands control to the player.
  useEffect(() => {
    if (state.status !== 'showing') return;
    const timers: number[] = [];
    state.sequence.forEach((pad, i) => {
      const start = LEAD_IN_MS + i * (PAD_ON_MS + PAD_GAP_MS);
      timers.push(
        window.setTimeout(() => {
          setActivePad(pad);
          triggerHaptic('selection');
        }, start),
      );
      timers.push(window.setTimeout(() => setActivePad(null), start + PAD_ON_MS));
    });
    const totalMs = LEAD_IN_MS + state.sequence.length * (PAD_ON_MS + PAD_GAP_MS);
    timers.push(window.setTimeout(() => setState((s) => beginEchoInput(s)), totalMs));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [state.status, state.sequence]);

  useEffect(() => {
    if (state.status === 'success' && !completedRef.current) {
      completedRef.current = true;
      triggerHaptic('success');
      const timer = window.setTimeout(onComplete, 500);
      return () => window.clearTimeout(timer);
    }
  }, [state.status, onComplete]);

  const handleTap = (pad: number) => {
    if (state.status !== 'input') return;
    const next = submitEchoTap(state, pad);
    if (next === state) return;
    setState(next);
    if (next.mistakes > state.mistakes) {
      triggerHaptic('warning');
    } else {
      triggerHaptic('light');
    }
  };

  return (
    <div
      className="vimana-map-fx absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl bg-slate-950"
      style={{ animation: 'vimana-sheet-up 160ms ease-out' }}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {state.status === 'showing'
          ? 'Echo Loop — watch the resonance pattern'
          : state.status === 'success'
            ? 'Pattern matched!'
            : `Echo Loop — replay the pattern (${state.playerInput.length}/${state.sequence.length})`}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, pad) => {
          const hue = (accentHue + pad * 90) % 360;
          const lit = activePad === pad;
          return (
            <button
              key={pad}
              type="button"
              aria-label={`Resonance pad ${pad + 1}`}
              onPointerDown={(event) => {
                event.preventDefault();
                handleTap(pad);
              }}
              disabled={state.status !== 'input'}
              className="h-20 w-20 touch-none rounded-2xl border-2 transition-all disabled:cursor-default"
              style={{
                borderColor: `hsl(${hue} 70% 60%)`,
                background: lit
                  ? `radial-gradient(circle, hsl(${hue} 85% 70%), hsl(${hue} 70% 40%))`
                  : `hsl(${hue} 40% 18%)`,
                boxShadow: lit ? `0 0 24px hsl(${hue} 85% 60% / 0.8)` : undefined,
              }}
            />
          );
        })}
      </div>

      {state.mistakes > 0 && state.status === 'input' && (
        <p className="text-[11px] text-slate-500">Not quite — watch the pattern land, then try again.</p>
      )}
      {state.status === 'success' && (
        <p className="text-lg font-bold text-emerald-300" style={{ textShadow: '0 0 16px #34d399' }}>
          Echo resolved!
        </p>
      )}
    </div>
  );
}

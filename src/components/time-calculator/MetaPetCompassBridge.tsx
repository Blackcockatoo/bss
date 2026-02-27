'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { CompactVitalsBar } from '@/components/CompactVitalsBar';
import { PetHero } from '@/components/PetHero';
import { FloatingActions } from '@/components/FloatingActions';

interface MetaPetCompassBridgeProps {
  onApplyPreset: (preset: { color: 'red' | 'blue' | 'black'; pattern: 'timeCompass' | 'nodePattern' | 'circlePattern' }) => void;
}

export function MetaPetCompassBridge({ onApplyPreset }: MetaPetCompassBridgeProps) {
  const vitals = useStore(state => state.vitals);
  const avgVital = (vitals.energy + vitals.hunger + vitals.hygiene + vitals.mood) / 4;

  const recommendedPreset = useMemo(() => {
    if (vitals.energy < 35) {
      return {
        color: 'blue' as const,
        pattern: 'timeCompass' as const,
        reason: 'Low energy: use calm blue time flow to stabilize and recharge.'
      };
    }

    if (vitals.mood < 40 || vitals.hygiene < 40) {
      return {
        color: 'black' as const,
        pattern: 'nodePattern' as const,
        reason: 'Need grounding: node pattern helps center and reset routine states.'
      };
    }

    return {
      color: 'red' as const,
      pattern: 'circlePattern' as const,
      reason: 'Strong vitals: red circle mode amplifies momentum and playful focus.'
    };
  }, [vitals.energy, vitals.hygiene, vitals.mood]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-white">MetaPet Resonance Bridge</h2>
        <p className="text-sm text-zinc-300">
          Your pet state can drive the time calculator. Care for MetaPet, then apply a matching pattern preset.
        </p>
      </div>

      <CompactVitalsBar />
      <div className="py-4">
        <PetHero staticMode className="scale-90 origin-top" />
      </div>
      <FloatingActions />

      <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3">
        <p className="text-xs uppercase tracking-wider text-zinc-400">Suggested preset</p>
        <p className="mt-1 text-sm text-zinc-200">
          Avg Vital: <span className="font-mono text-cyan-300">{avgVital.toFixed(1)}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-300">{recommendedPreset.reason}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          onClick={() => onApplyPreset({ color: recommendedPreset.color, pattern: recommendedPreset.pattern })}
        >
          Apply to Time Calculator
        </button>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import {
  createGravityFold,
  rotateGravityTile,
  type GravityFoldState,
} from '@/lib/minigames/gravityFold';

interface GravityFoldEncounterProps {
  seed: number;
  accentHue: number;
  onComplete: () => void;
}

/** Simple glyphs that visibly rotate with the tile's rotation state. */
const TILE_GLYPH: Record<GravityFoldState['tiles'][number]['kind'], string> = {
  straight: '━',
  elbow: '┗',
};

export function GravityFoldEncounter({ seed, accentHue, onComplete }: GravityFoldEncounterProps) {
  // createGravityFold is a pure function of `seed` — safe to call during render.
  const [state, setState] = useState<GravityFoldState>(() => createGravityFold(seed));
  const completedRef = useRef(false);

  useEffect(() => {
    if (state.solved && !completedRef.current) {
      completedRef.current = true;
      triggerHaptic('success');
      const timer = window.setTimeout(onComplete, 500);
      return () => window.clearTimeout(timer);
    }
  }, [state.solved, onComplete]);

  const handleRotate = (index: number) => {
    const next = rotateGravityTile(state, index);
    if (next === state) return;
    setState(next);
    triggerHaptic(next.solved ? 'success' : 'light');
  };

  return (
    <div
      className="vimana-map-fx absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-slate-950"
      style={{ animation: 'vimana-sheet-up 160ms ease-out' }}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {state.solved ? 'Route aligned!' : 'Gravity Fold — rotate the pieces into a route'}
      </p>

      <div className="flex gap-2">
        {state.tiles.map((tile, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Route tile ${index + 1}, rotate`}
            onPointerDown={(event) => {
              event.preventDefault();
              handleRotate(index);
            }}
            disabled={state.solved}
            className="flex h-16 w-16 touch-none items-center justify-center rounded-xl border-2 text-2xl font-bold transition-transform disabled:cursor-default"
            style={{
              borderColor: tile.rotation === 0
                ? `hsl(${accentHue} 80% 60%)`
                : `hsl(${accentHue} 30% 35%)`,
              background: tile.rotation === 0
                ? `hsl(${accentHue} 60% 22%)`
                : 'rgba(15,23,42,0.7)',
              color: tile.rotation === 0 ? `hsl(${accentHue} 90% 75%)` : '#94a3b8',
              transform: `rotate(${tile.rotation * 90}deg)`,
              boxShadow: tile.rotation === 0 ? `0 0 16px hsl(${accentHue} 80% 55% / 0.6)` : undefined,
            }}
          >
            {TILE_GLYPH[tile.kind]}
          </button>
        ))}
      </div>

      {state.solved && (
        <p className="text-lg font-bold text-emerald-300" style={{ textShadow: '0 0 16px #34d399' }}>
          Path stabilized!
        </p>
      )}
    </div>
  );
}

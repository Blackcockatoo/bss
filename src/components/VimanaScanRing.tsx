'use client';

import { useEffect, useRef, useState } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import {
  SCAN_CLEAN_WINDOW_MS,
  SCAN_RING_DURATION_MS,
  createScanRing,
  evaluateScanResult,
  registerScanTap,
  type ScanRingResult,
  type ScanRingState,
} from '@/lib/minigames/vimanaScanRing';

interface VimanaScanRingProps {
  accentHue: number;
  onComplete: (result: ScanRingResult) => void;
}

const TIER_META: Record<ScanRingResult['tier'], { label: string; color: string }> = {
  rough: { label: 'Rough Scan', color: '#94a3b8' },
  clean: { label: 'Clean Scan', color: '#38bdf8' },
  perfect: { label: 'Perfect Scan!', color: '#facc15' },
};

/** How long after the final target we wait before forcing a result. */
const GRACE_MS = SCAN_CLEAN_WINDOW_MS * 2;

export function VimanaScanRing({ accentHue, onComplete }: VimanaScanRingProps) {
  const stateRef = useRef<ScanRingState | null>(null);
  // Mirrors of stateRef used for rendering — refs must never be read during
  // render, so every value the JSX needs is copied into state alongside it.
  const [targets, setTargets] = useState<number[] | null>(null);
  const [taps, setTaps] = useState(0);
  // Driven by the rAF timestamp (not a direct clock read) so render stays pure.
  const [now, setNow] = useState<number | null>(null);
  const [result, setResult] = useState<ScanRingResult | null>(null);
  const frameRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Deferred to an effect since it reads the clock; the tick loop below
  // only starts advancing once this has populated stateRef.
  useEffect(() => {
    const initFrame = requestAnimationFrame(() => {
      const initial = createScanRing(performance.now());
      stateRef.current = initial;
      setTargets(initial.targets);
      setNow(initial.startedAt);
    });
    return () => cancelAnimationFrame(initFrame);
  }, []);

  useEffect(() => {
    const step = (timestamp: number) => {
      const current = stateRef.current;
      if (current && !completedRef.current) {
        const lastTarget = current.targets[current.targets.length - 1];
        if (current.complete || timestamp > lastTarget + GRACE_MS) {
          completedRef.current = true;
          const final = evaluateScanResult(current);
          triggerHaptic(
            final.tier === 'perfect' ? 'success' : final.tier === 'clean' ? 'medium' : 'light'
          );
          setResult(final);
          window.setTimeout(() => onComplete(final), 700);
        }
        setNow(timestamp);
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [onComplete]);

  const handleTap = () => {
    const current = stateRef.current;
    if (completedRef.current || !current) return;
    const tapNow = performance.now();
    const next = registerScanTap(current, tapNow);
    if (next !== current) {
      stateRef.current = next;
      setTaps(next.taps.length);
      triggerHaptic('light');
    }
  };

  if (now === null || targets === null) return null;

  let activeIndex = targets.findIndex((target) => now <= target + GRACE_MS);
  if (activeIndex === -1) activeIndex = targets.length - 1;
  const target = targets[activeIndex] ?? now;
  const ringStart = target - SCAN_RING_DURATION_MS;
  const progress = Math.max(0, Math.min(1.15, (now - ringStart) / SCAN_RING_DURATION_MS));

  return (
    <div
      className="vimana-map-fx absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-950"
      style={{ animation: 'vimana-sheet-up 160ms ease-out' }}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">
        Tap when the ring matches — ring {Math.min(taps + 1, 3)} of 3
      </p>

      <button
        type="button"
        aria-label="Tap to time the resonance ring"
        onPointerDown={(event) => {
          event.preventDefault();
          handleTap();
        }}
        className="relative flex h-48 w-48 touch-none items-center justify-center rounded-full"
      >
        {/* Fixed target ring */}
        <span
          className="absolute h-32 w-32 rounded-full border-2 border-dashed"
          style={{ borderColor: `hsl(${accentHue} 70% 60% / 0.6)` }}
        />
        {/* Expanding resonance ring */}
        <span
          className="absolute rounded-full border-4"
          style={{
            width: `${32 * progress}px`,
            height: `${32 * progress}px`,
            borderColor: `hsl(${accentHue} 85% 65%)`,
            opacity: Math.max(0, 1 - Math.max(0, progress - 1) * 4),
            transform: 'translate(0,0)',
          }}
        />
        {/* Filled core so early progress is still visible */}
        <span
          className="absolute rounded-full"
          style={{
            width: `${128 * Math.min(1, progress)}px`,
            height: `${128 * Math.min(1, progress)}px`,
            background: `hsl(${accentHue} 80% 55% / 0.15)`,
          }}
        />
        <span className="relative text-3xl">📡</span>
      </button>

      {result ? (
        <p
          className="vimana-map-fx text-lg font-bold"
          style={{ color: TIER_META[result.tier].color, textShadow: `0 0 16px ${TIER_META[result.tier].color}` }}
        >
          {TIER_META[result.tier].label}
        </p>
      ) : (
        <p className="text-[11px] text-slate-500">Every attempt reveals something — there is no failed scan.</p>
      )}
    </div>
  );
}

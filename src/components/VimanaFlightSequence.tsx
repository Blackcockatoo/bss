'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import {
  FLIGHT_LANES,
  createFlight,
  steerFlight,
  tickFlight,
  type FlightState,
} from '@/lib/minigames/vimanaFlight';

interface VimanaFlightSequenceProps {
  seed: number;
  petName: string;
  accentHue: number;
  fromLabel: string;
  toLabel: string;
  onComplete: (gatesHit: number) => void;
}

const LANE_LEFT_PERCENT: Record<number, number> = { [-1]: 18, [0]: 50, [1]: 82 };

function laneToLeftPercent(lane: number): number {
  // Linear-interpolate between the three discrete lane positions.
  if (lane <= -1) return LANE_LEFT_PERCENT[-1];
  if (lane >= 1) return LANE_LEFT_PERCENT[1];
  if (lane <= 0) return LANE_LEFT_PERCENT[-1] + (lane + 1) * (LANE_LEFT_PERCENT[0] - LANE_LEFT_PERCENT[-1]);
  return LANE_LEFT_PERCENT[0] + lane * (LANE_LEFT_PERCENT[1] - LANE_LEFT_PERCENT[0]);
}

function driftParticles(seed: number, count: number, hue: number) {
  let h = (seed * 2654435761) >>> 0;
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 0xffffffff;
  };
  return Array.from({ length: count }, () => ({
    left: 10 + next() * 80,
    delay: next() * 2,
    duration: 0.9 + next() * 0.8,
    hue: (hue + next() * 50 - 25 + 360) % 360,
  }));
}

export function VimanaFlightSequence({
  seed,
  petName,
  accentHue,
  fromLabel,
  toLabel,
  onComplete,
}: VimanaFlightSequenceProps) {
  const stateRef = useRef<FlightState | null>(null);
  const [flight, setFlight] = useState<FlightState | null>(null);
  const frameRef = useRef<number | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startLane: number } | null>(null);
  const completedRef = useRef(false);
  const gateFlashRef = useRef<Set<number>>(new Set());

  const particles = useMemo(() => driftParticles(seed, 14, accentHue), [seed, accentHue]);

  // Deferred to an effect (not computed during render) since it reads the
  // clock; the perpetual tick loop below only starts advancing once this
  // has populated stateRef.
  useEffect(() => {
    const initFrame = requestAnimationFrame(() => {
      const initial = createFlight(seed, performance.now());
      stateRef.current = initial;
      setFlight(initial);
    });
    return () => cancelAnimationFrame(initFrame);
  }, [seed]);

  useEffect(() => {
    const step = (timestamp: number) => {
      const current = stateRef.current;
      if (current && !completedRef.current) {
        const next = tickFlight(current, timestamp);
        if (next !== current) {
          for (const gate of next.gates) {
            if (gate.resolved && !gateFlashRef.current.has(gate.id)) {
              gateFlashRef.current.add(gate.id);
              triggerHaptic(gate.hit ? 'success' : 'light');
            }
          }
          stateRef.current = next;
          setFlight(next);
          if (next.complete) {
            completedRef.current = true;
            triggerHaptic('medium');
            window.setTimeout(() => onComplete(next.gatesHit), 260);
          }
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [onComplete]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (dragRef.current || !stateRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startLane: stateRef.current.lane };
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current;
    const current = stateRef.current;
    if (!drag || !current || drag.pointerId !== event.pointerId) return;
    const width = event.currentTarget.clientWidth || 240;
    const delta = (event.clientX - drag.startX) / (width * 0.4);
    const nextLane = drag.startLane + delta;
    const steered = steerFlight(current, nextLane);
    if (steered !== current) {
      stateRef.current = steered;
      setFlight(steered);
    }
  }, []);

  const handlePointerEnd = useCallback((event: React.PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }, []);

  if (!flight) return null;

  const craftLeft = laneToLeftPercent(flight.lane);

  return (
    <div
      className="vimana-map-fx absolute inset-0 z-30 flex flex-col overflow-hidden rounded-2xl bg-slate-950"
      style={{ animation: 'vimana-sheet-up 160ms ease-out' }}
    >
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-slate-400">
        <span>{fromLabel}</span>
        <span className="uppercase tracking-wide text-cyan-300">In flight</span>
        <span>{toLabel}</span>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative mx-4 mt-2 flex-1 touch-none overflow-hidden rounded-xl border border-slate-800"
        style={{
          background:
            `linear-gradient(180deg, #020617, hsl(${accentHue} 40% 10%))`,
        }}
      >
        {/* Signal particles drifting past for a sense of speed. */}
        {particles.map((particle, index) => (
          <span
            key={index}
            className="vimana-map-fx absolute h-1 w-1 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: '-4%',
              background: `hsl(${particle.hue} 90% 70%)`,
              animation: `vimana-flight-particle ${particle.duration}s linear ${particle.delay}s infinite`,
            }}
          />
        ))}

        {/* Route gates: a bar with a gap at the target lane. */}
        {flight.gates.map((gate) => {
          const distance = Math.max(0, Math.min(1, gate.position - flight.progress));
          if (gate.position < flight.progress - 0.05) return null;
          const topPercent = (1 - distance) * 92;
          const gapLeft = laneToLeftPercent(gate.lane);
          return (
            <div
              key={gate.id}
              className="absolute inset-x-0 h-2"
              style={{ top: `${topPercent}%` }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{ right: `${100 - gapLeft}%`, background: gate.resolved ? (gate.hit ? '#22c55e88' : '#ef444488') : '#38bdf888' }}
              />
              <div
                className="absolute inset-y-0 right-0"
                style={{ left: `${gapLeft + 14}%`, background: gate.resolved ? (gate.hit ? '#22c55e88' : '#ef444488') : '#38bdf888' }}
              />
            </div>
          );
        })}

        {/* Craft, with the pet riding along. */}
        <div
          className="vimana-map-fx absolute flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${craftLeft}%`, top: '82%', animation: 'vimana-craft-bob 1.6s ease-in-out infinite' }}
        >
          <span className="text-[10px] text-slate-300">🐾 {petName}</span>
          <span className="text-2xl">🛸</span>
        </div>

        {/* Progress bar */}
        <div className="absolute inset-x-3 top-1 h-1 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className="h-full rounded-full"
            style={{
              width: `${flight.progress * 100}%`,
              background: `hsl(${accentHue} 80% 55%)`,
            }}
          />
        </div>
      </div>

      <p className="px-4 py-2 text-center text-[11px] text-slate-500">
        Drag to steer through the gates — arrival is never in doubt, only the bonus.
      </p>
    </div>
  );
}

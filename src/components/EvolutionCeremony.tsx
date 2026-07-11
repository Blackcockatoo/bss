"use client";

/**
 * EvolutionCeremony — full-screen ceremonial overlay played when Auralia
 * advances an evolution stage. Sequence:
 *
 *   1. dim pulse (blackout)
 *   2. red/blue/black 60-point ring tightens
 *   3. stage-specific transformation
 *        GENETICS → DNA coil, NEURO → neural lattice,
 *        QUANTUM → ghost split, SPECIATION → wing/mandala bloom
 *   4. shockwave
 *   5. settle into the new stage
 *
 * Pure SVG + CSS transforms driven by one rAF clock — no heavy filters —
 * so it runs fine on mobile. Reduced motion swaps displacement for
 * fade/scale and drops the particle ring density.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { EVOLUTION_STAGE_INFO, EVOLUTION_VISUALS } from "@/evolution/types";
import type { EvolutionState } from "@/evolution/types";

export interface EvolutionCeremonyProps {
  /** The stage being entered. */
  stage: EvolutionState;
  /** Called when the ceremony finishes (or is skipped). */
  onComplete: () => void;
  reduceMotion?: boolean;
  /** Branch accent triad; overrides the stage's default colours. */
  accentColors?: [string, string, string];
  /** Branch display title; overrides the stage's default title. */
  displayTitle?: string;
}

type CeremonyPhase = "dim" | "tighten" | "transform" | "shockwave" | "settle";

const PHASE_TIMELINE: Array<{ phase: CeremonyPhase; duration: number }> = [
  { phase: "dim", duration: 700 },
  { phase: "tighten", duration: 1000 },
  { phase: "transform", duration: 1400 },
  { phase: "shockwave", duration: 700 },
  { phase: "settle", duration: 900 },
];
const TOTAL_DURATION = PHASE_TIMELINE.reduce((sum, p) => sum + p.duration, 0);
const RING_POINTS = 60;
const RING_POINTS_REDUCED = 20;

const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

function phaseAt(elapsed: number): { phase: CeremonyPhase; local: number } {
  let acc = 0;
  for (const step of PHASE_TIMELINE) {
    if (elapsed < acc + step.duration) {
      return { phase: step.phase, local: (elapsed - acc) / step.duration };
    }
    acc += step.duration;
  }
  return { phase: "settle", local: 1 };
}

export function EvolutionCeremony({
  stage,
  onComplete,
  reduceMotion = false,
  accentColors,
  displayTitle,
}: EvolutionCeremonyProps) {
  const [elapsed, setElapsed] = useState(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const e = now - start;
      if (e >= TOTAL_DURATION) {
        setElapsed(TOTAL_DURATION);
        onCompleteRef.current();
        return;
      }
      setElapsed(e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { phase, local } = phaseAt(elapsed);
  const visuals = EVOLUTION_VISUALS[stage];
  const info = EVOLUTION_STAGE_INFO[stage];
  const palette = accentColors ?? visuals.colors;
  const [c0, c1, c2] = [
    palette[0],
    palette[1] ?? palette[0],
    palette[2] ?? palette[0],
  ];

  // Backdrop dim: rises fast, holds, releases at settle.
  const dimOpacity = useMemo(() => {
    if (phase === "dim") return easeInOut(local) * 0.88;
    if (phase === "settle") return (1 - easeInOut(local)) * 0.88;
    return 0.88;
  }, [phase, local]);

  // 60-point ring radius: wide → tight during "tighten", explodes on shockwave.
  const ringProgress = useMemo(() => {
    if (phase === "dim") return 0;
    if (phase === "tighten") return easeInOut(local);
    return 1;
  }, [phase, local]);

  const shockRadius = phase === "shockwave" ? easeInOut(local) : phase === "settle" ? 1 : 0;

  const pointCount = reduceMotion ? RING_POINTS_REDUCED : RING_POINTS;
  const ringPoints = useMemo(() => {
    const baseRadius = 165 - ringProgress * 105; // 165 → 60
    return Array.from({ length: pointCount }, (_, i) => {
      const angle = (i / pointCount) * Math.PI * 2;
      return {
        x: 200 + Math.cos(angle) * baseRadius,
        y: 200 + Math.sin(angle) * baseRadius,
        color: i % 3 === 0 ? "#FF4136" : i % 3 === 1 ? "#4AA8FF" : "#9CA3AF",
      };
    });
  }, [ringProgress, pointCount]);

  const transformT = phase === "transform" ? local : phase === "shockwave" || phase === "settle" ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={`Evolving to ${displayTitle ?? info.title}`}
    >
      {/* Blackout / dim pulse */}
      <div
        className="absolute inset-0 bg-black transition-none"
        style={{ opacity: dimOpacity }}
      />

      <svg
        viewBox="0 0 400 400"
        className="relative h-[min(80vw,26rem)] w-[min(80vw,26rem)]"
        aria-hidden
      >
        {/* Tightening tri-color ring */}
        <g opacity={phase === "dim" ? local : 1}>
          {ringPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={reduceMotion ? 2 : 2.4} fill={p.color} opacity={0.85} />
          ))}
        </g>

        {/* Stage-specific transformation */}
        {transformT > 0 && (
          <StageTransform stage={stage} t={transformT} colors={[c0, c1, c2]} reduceMotion={reduceMotion} />
        )}

        {/* Shockwave */}
        {shockRadius > 0 && phase === "shockwave" && !reduceMotion && (
          <>
            <circle
              cx="200"
              cy="200"
              r={60 + shockRadius * 150}
              fill="none"
              stroke={c1}
              strokeWidth={3 * (1 - shockRadius) + 0.5}
              opacity={(1 - shockRadius) * 0.8}
            />
            <circle
              cx="200"
              cy="200"
              r={40 + shockRadius * 120}
              fill="none"
              stroke="#F3D87A"
              strokeWidth={2 * (1 - shockRadius)}
              opacity={(1 - shockRadius) * 0.5}
            />
          </>
        )}
        {/* Reduced motion: gentle glow instead of the shockwave */}
        {phase === "shockwave" && reduceMotion && (
          <circle cx="200" cy="200" r="90" fill={c0} opacity={(1 - local) * 0.25} />
        )}

        {/* Settle: new-stage core fades in */}
        {phase === "settle" && (
          <g opacity={easeInOut(local)}>
            <circle cx="200" cy="200" r="46" fill={c0} opacity="0.35" />
            <circle cx="200" cy="200" r="30" fill={c1} opacity="0.5" />
            <circle cx="200" cy="200" r="14" fill={c2} opacity="0.9" />
          </g>
        )}
      </svg>

      {/* Stage label */}
      <div
        className="pointer-events-none absolute bottom-[18%] left-0 right-0 text-center"
        style={{ opacity: phase === "settle" ? easeInOut(local) : phase === "shockwave" ? local * 0.7 : 0 }}
      >
        <p className="text-xs uppercase tracking-[0.4em]" style={{ color: c1 }}>
          Evolution
        </p>
        <p className="mt-1 text-2xl font-bold text-white">{displayTitle ?? info.title}</p>
        <p className="mt-1 text-sm text-zinc-300">{info.tagline}</p>
      </div>

      {/* Skip affordance — ceremony must never trap the user */}
      <button
        type="button"
        onClick={() => onCompleteRef.current()}
        className="absolute bottom-6 right-6 min-h-[44px] min-w-[44px] rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs text-zinc-300 backdrop-blur hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}

function StageTransform({
  stage,
  t,
  colors,
  reduceMotion,
}: {
  stage: EvolutionState;
  t: number;
  colors: [string, string, string];
  reduceMotion: boolean;
}) {
  const [c0, c1, c2] = colors;
  const grow = easeInOut(Math.min(1, t));

  switch (stage) {
    case "GENETICS": {
      // DNA coil winding upward.
      const rungs = reduceMotion ? 6 : 10;
      return (
        <g opacity={grow}>
          {Array.from({ length: rungs }, (_, i) => {
            const p = i / (rungs - 1);
            const y = 290 - p * 180 * grow;
            const spread = Math.sin(p * Math.PI * 3 + t * Math.PI * 2) * 42;
            return (
              <g key={i}>
                <circle cx={200 - spread} cy={y} r="4" fill={c0} />
                <circle cx={200 + spread} cy={y} r="4" fill={c1} />
                <line x1={200 - spread} y1={y} x2={200 + spread} y2={y} stroke={c2} strokeWidth="1" opacity="0.6" />
              </g>
            );
          })}
        </g>
      );
    }
    case "NEURO": {
      // Neural lattice sparking outward.
      const nodes = reduceMotion ? 6 : 9;
      return (
        <g opacity={grow}>
          {Array.from({ length: nodes }, (_, i) => {
            const a = (i / nodes) * Math.PI * 2;
            const r = 40 + grow * 80;
            const x = 200 + Math.cos(a) * r;
            const y = 200 + Math.sin(a) * r;
            return (
              <g key={i}>
                <line x1="200" y1="200" x2={x} y2={y} stroke={c1} strokeWidth="1.2" opacity={0.5 + (i % 2) * 0.3} />
                <circle cx={x} cy={y} r="5" fill={c0} />
              </g>
            );
          })}
          <circle cx="200" cy="200" r={10 + grow * 6} fill={c2} />
        </g>
      );
    }
    case "QUANTUM": {
      // Ghost split / impossible displacement.
      const offset = reduceMotion ? 10 * grow : 26 * grow;
      return (
        <g opacity={grow}>
          <circle cx={200 - offset} cy={200 + offset * 0.4} r="52" fill="none" stroke={c0} strokeWidth="2" opacity="0.55" />
          <circle cx={200 + offset} cy={200 - offset * 0.4} r="52" fill="none" stroke={c1} strokeWidth="2" opacity="0.55" />
          <circle cx="200" cy="200" r="52" fill="none" stroke={c2} strokeWidth="2.4" opacity="0.9" />
        </g>
      );
    }
    case "SPECIATION": {
      // Wing / mandala bloom.
      const petals = reduceMotion ? 6 : 12;
      return (
        <g opacity={grow}>
          {Array.from({ length: petals }, (_, i) => {
            const a = (i / petals) * 360;
            return (
              <ellipse
                key={i}
                cx="200"
                cy={200 - 55 * grow}
                rx="14"
                ry={55 * grow}
                fill="none"
                stroke={i % 2 === 0 ? c0 : c1}
                strokeWidth="1.4"
                opacity="0.65"
                transform={`rotate(${a} 200 200)`}
              />
            );
          })}
          <circle cx="200" cy="200" r={16 + grow * 8} fill={c2} opacity="0.9" />
        </g>
      );
    }
    default:
      return null;
  }
}

export default EvolutionCeremony;

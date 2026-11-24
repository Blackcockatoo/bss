"use client";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAliveFrame, useAlivePaused, weightedFrame } from "./AliveContext";
import { clamp } from "@/lib/expressions/studio";
import type { ReactNode } from "react";

export function AliveSvgMotion({ children, reduced = false }: { children: ReactNode; reduced?: boolean }) {
  const sample = useAliveFrame();
  const deviceReduced = useReducedMotion();
  const frame = sample && weightedFrame(sample);
  const transform = frame && !reduced && !deviceReduced
    ? `translate(${200 + frame.x * .52} ${185 + frame.y * .52}) rotate(${clamp(frame.angle, -35, 35)}) scale(${1 + frame.squash} ${1 - frame.squash}) translate(-200 -185)`
    : undefined;
  return <g transform={transform} data-alive-cue={sample?.cue.expressionId}>
    {children}
    {frame && frame.aura > .03 && (
      <g pointerEvents="none" fill="#b2eaf5" opacity={frame.aura}>
        <ellipse cx="200" cy="185" rx={67 + frame.aura * 22} ry={82 + frame.aura * 22} fill="none" stroke="#dbb666" strokeWidth="1.4" />
        {frame.particles.map((particle, index) => <circle key={index}
          cx={200 + (particle.x - 256) * .5} cy={185 + (particle.y - 247) * .5}
          r={particle.size * .56} opacity={particle.opacity} />)}
      </g>
    )}
  </g>;
}

export function AliveGeometryMotion({ children, gaze }: { children: ReactNode; gaze: { x: number; y: number } }) {
  const sample = useAliveFrame();
  const reduced = useReducedMotion();
  const paused = useAlivePaused();
  const frame = sample && weightedFrame(sample);
  const turn = clamp((frame?.angle ?? 0) * .6 + gaze.x * 8, -32, 32);
  const scale = 1 + (frame?.aura ?? 0) * .052;
  return <div className="relative aspect-square w-full" data-alive-cue={sample?.cue.expressionId}
    style={paused || reduced ? undefined : {
      transform: `translate(${(frame?.x ?? 0) * .45}px, ${(frame?.y ?? 0) * .45}px) rotate(${turn}deg) scale(${scale})`,
    }}>
    {children}
    {frame && frame.aura > .03 && <div aria-hidden className="pointer-events-none absolute inset-[14%] rounded-full border border-cyan-200"
      style={{ opacity: frame.aura * .6 }} />}
  </div>;
}

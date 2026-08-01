"use client";

/**
 * "The stage just changed" as a value any renderer can animate against.
 *
 * The Evolved body performs a real movement clip (`stage_emergence`) for this
 * moment. Auralia and Geometry have no clip system, so they read this
 * emphasis envelope instead — one shared curve, so the beat lands with the
 * same timing and shape on all three renderers.
 *
 * First mount never fires: loading an already-evolved save must not replay a
 * ceremony the player already had.
 */

import { useEffect, useRef, useState } from "react";

import type { EvolutionState } from "@/evolution/types";

/** Length of the emphasis beat, matched to the `stage_emergence` clip. */
export const STAGE_TRANSITION_MS = 2_600;

function easeInOut(t: number): number {
  const p = Math.max(0, Math.min(1, t));
  return p * p * (3 - 2 * p);
}

/**
 * Emphasis at `elapsed` ms into the beat: a fast rise, a held radiance, then
 * a settle back to nothing. Pure and total — any input returns a 0..1 value.
 */
export function stageTransitionEmphasis(
  elapsed: number,
  reduceMotion = false,
): number {
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  if (elapsed >= STAGE_TRANSITION_MS) return 0;
  const t = elapsed / STAGE_TRANSITION_MS;
  const shaped =
    t < 0.22
      ? easeInOut(t / 0.22)
      : t < 0.62
        ? 1
        : 1 - easeInOut((t - 0.62) / 0.38);
  // Reduced motion keeps the signal — you still see that something happened —
  // but at an amplitude that cannot read as a flash.
  return reduceMotion ? shaped * 0.4 : shaped;
}

export interface StageTransitionOptions {
  reduceMotion?: boolean;
  /** Suspends the beat entirely (sealed runtime, unmounted stage). */
  paused?: boolean;
}

/**
 * Returns 0 at rest, rising to 1 across `STAGE_TRANSITION_MS` whenever
 * `state` changes to a different stage.
 */
export function useEvolutionStageTransition(
  state: EvolutionState,
  { reduceMotion = false, paused = false }: StageTransitionOptions = {},
): number {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [emphasis, setEmphasis] = useState(0);
  const knownStateRef = useRef<EvolutionState | null>(null);

  // Deferred a tick so the effect body never sets state synchronously; the
  // ref makes the first-mount skip independent of render timing.
  useEffect(() => {
    const previous = knownStateRef.current;
    knownStateRef.current = state;
    if (paused || previous === null || previous === state) return;
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => setStartedAt(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [state, paused]);

  // The animation frame only runs while a beat is in flight — at rest this
  // hook costs nothing, which matters because every renderer mounts it.
  useEffect(() => {
    if (startedAt === null || paused || typeof window === "undefined") return;
    let raf = 0;
    const step = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= STAGE_TRANSITION_MS) {
        setEmphasis(0);
        setStartedAt(null);
        return;
      }
      // Quantised so identical consecutive values skip the re-render.
      const next =
        Math.round(stageTransitionEmphasis(elapsed, reduceMotion) * 60) / 60;
      setEmphasis((previous) => (previous === next ? previous : next));
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [startedAt, paused, reduceMotion]);

  // Pausing mid-beat settles the creature immediately rather than freezing
  // it part-way through the emergence.
  return paused ? 0 : emphasis;
}

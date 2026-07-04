"use client";

/**
 * Movement controller hook for the Auralia geometry pet.
 *
 * Deliberately simple: one active clip at a time, replaced only by a clip
 * of strictly higher priority (or when the active clip finishes). Idle
 * breathing is the permanent fallback. A slow "brain tick" occasionally
 * schedules mood expressions and (rarely) secret signature moves.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EvolutionState } from "@/evolution/types";
import {
  MOVEMENT_CLIPS,
  MovementPriority,
  SECRET_MOVE_IDS,
  deriveMood,
  isClipAllowed,
  type MovementClip,
  type PetMood,
} from "./movementVocabulary";

export type PointerGesture = "tap" | "hold" | "swipe" | "drag";

export interface MovementControllerInputs {
  /** 0–100 stats. */
  mood?: number;
  energy?: number;
  curiosity?: number;
  bond?: number;
  evolutionState?: EvolutionState;
  /** Last store action, e.g. 'feed' | 'play' — used for emotion picks. */
  lastAction?: string | null;
  /** Number of equipped addons — more addons, more addon reactions. */
  equippedAddonCount?: number;
  reduceMotion?: boolean;
  /** Chance per brain tick of a secret move (default 0.02). */
  secretMoveChance?: number;
  /** Disable the internal timer (for tests/SSR-safety). */
  paused?: boolean;
  /**
   * Update `progress` continuously via rAF. Off by default: per-frame state
   * updates re-render every consumer and can interrupt React hydration, so
   * only enable it when something actually renders the progress value.
   */
  trackProgress?: boolean;
}

export interface ActiveMovement {
  clip: MovementClip;
  /** ms timestamp when the clip started. */
  startedAt: number;
}

export interface MovementControllerApi {
  /** Currently playing clip (always defined; idle_breathe at rest). */
  active: ActiveMovement;
  /** Normalized 0..1 clip progress; stays 0 unless `trackProgress` is set. */
  progress: number;
  /** Derived mood bucket used for gating. */
  moodBucket: PetMood;
  /** Ask for a specific clip; returns true if it took over. */
  play: (clipId: string) => boolean;
  /** Notify a pointer gesture on the pet; picks the matching touch clip. */
  onGesture: (gesture: PointerGesture) => void;
  /** Notify an audio beat (only call if audio analysis exists). */
  onBeat: () => void;
  /** Trigger the evolution ceremony movement. */
  playCeremony: () => void;
}

/**
 * Cross-component movement requests: any code (e.g. the evolution ceremony)
 * can ask running movement controllers to play a clip without a shared store.
 */
export const MOVEMENT_REQUEST_EVENT = "bss:movement-request";

export function requestMovement(clipId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(MOVEMENT_REQUEST_EVENT, { detail: { clipId } }),
  );
}

const BRAIN_TICK_MS = 2400;
const DEFAULT_SECRET_CHANCE = 0.02;
const IDLE_CLIP = MOVEMENT_CLIPS.idle_breathe;

const GESTURE_CLIP: Record<PointerGesture, string> = {
  tap: "tap_surprise",
  hold: "hold_charge",
  swipe: "swipe_spin",
  drag: "swipe_spin",
};

export function useMovementController(
  inputs: MovementControllerInputs = {},
): MovementControllerApi {
  const {
    mood = 50,
    energy = 50,
    curiosity = 50,
    evolutionState = "GENETICS",
    lastAction = null,
    equippedAddonCount = 0,
    reduceMotion = false,
    secretMoveChance = DEFAULT_SECRET_CHANCE,
    paused = false,
    trackProgress = false,
  } = inputs;

  const moodBucket = useMemo(
    () => deriveMood(mood, energy, curiosity),
    [mood, energy, curiosity],
  );

  const [active, setActive] = useState<ActiveMovement>(() => ({
    clip: IDLE_CLIP,
    startedAt: Date.now(),
  }));
  const [progress, setProgress] = useState(0);

  // Keep gating inputs in a ref so callbacks stay stable.
  const gateRef = useRef({ moodBucket, evolutionState, reduceMotion });
  useEffect(() => {
    gateRef.current = { moodBucket, evolutionState, reduceMotion };
  }, [moodBucket, evolutionState, reduceMotion]);

  const tryPlay = useCallback((clipId: string): boolean => {
    const clip = MOVEMENT_CLIPS[clipId];
    if (!clip) return false;
    const gate = gateRef.current;
    if (!isClipAllowed(clip, gate.moodBucket, gate.evolutionState, gate.reduceMotion)) {
      return false;
    }
    let accepted = false;
    setActive((current) => {
      const elapsed = Date.now() - current.startedAt;
      const finished = elapsed >= current.clip.duration;
      if (!finished && clip.priority <= current.clip.priority) {
        return current;
      }
      accepted = true;
      return { clip, startedAt: Date.now() };
    });
    return accepted;
  }, []);

  const onGesture = useCallback(
    (gesture: PointerGesture) => {
      tryPlay(GESTURE_CLIP[gesture]);
    },
    [tryPlay],
  );

  const onBeat = useCallback(() => {
    tryPlay("beat_hit");
  }, [tryPlay]);

  const playCeremony = useCallback(() => {
    tryPlay("evolution_ceremony");
  }, [tryPlay]);

  // Big-emotion reaction to store actions (feed/play/etc.). Deferred a
  // frame so the effect body never sets state synchronously.
  const lastActionRef = useRef(lastAction);
  useEffect(() => {
    if (!lastAction || lastAction === lastActionRef.current) {
      lastActionRef.current = lastAction;
      return;
    }
    lastActionRef.current = lastAction;
    const clipId =
      lastAction === "play"
        ? "happy_bounce"
        : lastAction === "sleep"
          ? "sleepy_droop"
          : "head_tilt";
    const timer = window.setTimeout(() => tryPlay(clipId), 0);
    return () => window.clearTimeout(timer);
  }, [lastAction, tryPlay]);

  // Clip expiry → fall back to idle breathing. Deliberately quiet: while
  // idle no state updates fire at all, so mounting the controller never
  // interrupts React hydration or re-renders consumers at rest.
  useEffect(() => {
    if (paused || typeof window === "undefined") return;
    const EXPIRY_CHECK_MS = 150;
    const expiry = window.setInterval(() => {
      if (active.clip.id === IDLE_CLIP.id) return;
      if (Date.now() - active.startedAt >= active.clip.duration) {
        setActive({ clip: IDLE_CLIP, startedAt: Date.now() });
      }
    }, EXPIRY_CHECK_MS);

    // Optional per-frame progress for consumers that render it.
    let raf = 0;
    if (trackProgress) {
      const step = () => {
        const elapsed = Date.now() - active.startedAt;
        setProgress(
          active.clip.id === IDLE_CLIP.id
            ? (elapsed % IDLE_CLIP.duration) / IDLE_CLIP.duration
            : Math.min(1, elapsed / active.clip.duration),
        );
        raf = window.requestAnimationFrame(step);
      };
      raf = window.requestAnimationFrame(step);
    }

    return () => {
      window.clearInterval(expiry);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [active, paused, trackProgress]);

  // External movement requests (evolution ceremony, add-on equips, …).
  useEffect(() => {
    if (paused || typeof window === "undefined") return;
    const onRequest = (event: Event) => {
      const clipId = (event as CustomEvent<{ clipId?: string }>).detail?.clipId;
      if (clipId) tryPlay(clipId);
    };
    window.addEventListener(MOVEMENT_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(MOVEMENT_REQUEST_EVENT, onRequest);
  }, [paused, tryPlay]);

  // Brain tick: schedule mood expressions, addon reactions, secret moves.
  useEffect(() => {
    if (paused || typeof window === "undefined") return;
    const tick = window.setInterval(() => {
      const roll = Math.random();

      // Rare secret signature move.
      if (roll < secretMoveChance) {
        const pick =
          SECRET_MOVE_IDS[Math.floor(Math.random() * SECRET_MOVE_IDS.length)];
        if (tryPlay(pick)) return;
      }

      // Occasional addon shimmer if anything is equipped.
      if (equippedAddonCount > 0 && roll < 0.18) {
        if (tryPlay("aura_pulse")) return;
      }

      // Mood expression roughly every few ticks.
      if (roll < 0.45) {
        const gate = gateRef.current;
        const moodClip =
          gate.moodBucket === "happy"
            ? "happy_bounce"
            : gate.moodBucket === "tired"
              ? "sleepy_droop"
              : gate.moodBucket === "curious"
                ? "wing_flutter"
                : "head_tilt";
        if (tryPlay(moodClip)) return;
      }

      // Ambient blink.
      if (roll < 0.7) tryPlay("blink");
    }, BRAIN_TICK_MS);
    return () => window.clearInterval(tick);
  }, [paused, secretMoveChance, equippedAddonCount, tryPlay]);

  return { active, progress, moodBucket, play: tryPlay, onGesture, onBeat, playCeremony };
}

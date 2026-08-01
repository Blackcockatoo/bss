"use client";

/**
 * Movement controller hook for the canonical Meta-Pet body.
 *
 * One active clip at a time, replaced only by a clip of strictly higher
 * priority (or when the active clip finishes). Idle breathing is the
 * permanent fallback. Care actions play short choreographed SEQUENCES of
 * clips (anticipation → reaction → settle) that ambient movement may never
 * interrupt. The old `Math.random()` brain tick is replaced by a seeded,
 * deterministic scheduler driven by stable pet identity plus an advancing
 * local counter — no randomness during render, no hydration mismatch, and
 * reproducible behaviour in tests.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EvolutionState } from "@/evolution/types";
import {
  MOVEMENT_CLIPS,
  MovementPriority,
  deriveMood,
  isClipAllowed,
  type MovementClip,
  type PetMood,
} from "./movementVocabulary";
import {
  decideAmbientClip,
  hashSeed,
  isCelebratoryClip,
  seededUnit,
} from "./movementScheduler";

export type PointerGesture = "tap" | "hold" | "swipe" | "drag";

export type CareActionId =
  | "feed"
  | "clean"
  | "play"
  | "sleep"
  | "love"
  | "evolution"
  | "anomaly";

export interface MovementControllerInputs {
  /** 0–100 stats. */
  mood?: number;
  energy?: number;
  curiosity?: number;
  bond?: number;
  /** 0–100; extreme hunger suppresses celebratory moves. */
  hunger?: number;
  isSick?: boolean;
  evolutionState?: EvolutionState;
  /** Last store action, e.g. 'feed' | 'play' — triggers action sequences. */
  lastAction?: string | null;
  /** Number of equipped addons — more addons, more addon reactions. */
  equippedAddonCount?: number;
  reduceMotion?: boolean;
  /** Chance per brain tick of a secret move (default 0.02). */
  secretMoveChance?: number;
  /** Stable pet identity for the deterministic scheduler. */
  identityKey?: string | number;
  /** Disable the internal timer (for tests/SSR-safety). */
  paused?: boolean;
}

export interface ActiveMovement {
  clip: MovementClip;
  /** ms timestamp when the clip started. */
  startedAt: number;
}

export interface MovementControllerApi {
  /** Currently playing clip (always defined; idle_breathe at rest). */
  active: ActiveMovement;
  /** Normalized 0..1 progress through the active clip. */
  progress: number;
  /** Derived mood bucket used for gating. */
  moodBucket: PetMood;
  /** Stable numeric identity seed (for interpreters/phase offsets). */
  seed: number;
  /** Ask for a specific clip; returns true if it took over. */
  play: (clipId: string) => boolean;
  /** Play a named care-action choreography (sequence of clips). */
  playAction: (action: CareActionId) => void;
  /** Notify a pointer gesture on the pet; picks the matching touch clip. */
  onGesture: (gesture: PointerGesture) => void;
  /** Notify an audio beat (only call if audio analysis exists). */
  onBeat: () => void;
  /** Affectionate touch: lean, soft blink, head tilt, aura bloom. */
  onAffection: () => void;
  /** A Vimana anomaly surfaced near the pet. */
  onAnomaly: () => void;
  /** Trigger the evolution ceremony movement. */
  playCeremony: () => void;
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

/**
 * Care-action choreography. Each entry is played in order; steps whose
 * gates fail are skipped so a tired or crisis-state pet naturally performs
 * a subdued version instead of a forbidden celebration.
 */
const ACTION_SEQUENCES: Record<CareActionId, readonly string[]> = {
  // anticipation → inward gathering (+ clean release inside hold_charge)
  // → satisfied release.
  feed: ["head_tilt", "hold_charge", "happy_bounce"],
  // resolved per-call: happy bounce, or rarely the sacred toy bounce.
  play: ["happy_bounce"],
  // aura pulse plus an outward cleansing sweep (wingless bodies shimmer).
  clean: ["aura_pulse", "wing_flutter"],
  // droop, then fold in (fold gate skips it for bright moods/no wings).
  sleep: ["sleepy_droop", "folded_wing_hide"],
  // lean + soft blink + head tilt + aura bloom.
  love: ["head_tilt", "blink", "aura_pulse"],
  // ceremony → the new form emerging and being tested → black-wing bloom
  // (apex only; its gate skips it at every earlier stage).
  evolution: ["evolution_ceremony", "stage_emergence", "black_wing_bloom"],
  // resolved per-call from evolution state.
  anomaly: ["omen_twitch"],
};

export function useMovementController(
  inputs: MovementControllerInputs = {},
): MovementControllerApi {
  const {
    mood = 50,
    energy = 50,
    curiosity = 50,
    hunger = 30,
    isSick = false,
    evolutionState = "GENETICS",
    lastAction = null,
    equippedAddonCount = 0,
    reduceMotion = false,
    secretMoveChance = DEFAULT_SECRET_CHANCE,
    identityKey = "meta-pet",
    paused = false,
  } = inputs;

  const seed = useMemo(
    () =>
      typeof identityKey === "number"
        ? identityKey >>> 0
        : hashSeed(identityKey),
    [identityKey],
  );

  const moodBucket = useMemo(
    () => deriveMood(mood, energy, curiosity),
    [mood, energy, curiosity],
  );

  // Critical distress suppresses celebratory moves entirely.
  const critical = isSick || hunger >= 90 || energy <= 8;

  const [active, setActive] = useState<ActiveMovement>(() => ({
    clip: IDLE_CLIP,
    startedAt: 0,
  }));
  const [progress, setProgress] = useState(0);

  // Synchronous mirror of the active clip so play decisions are made
  // immediately instead of inside a (possibly deferred) state updater.
  const activeRef = useRef<ActiveMovement>({ clip: IDLE_CLIP, startedAt: 0 });

  // Keep gating inputs in a ref so callbacks stay stable.
  const gateRef = useRef({ moodBucket, evolutionState, reduceMotion, critical });
  useEffect(() => {
    gateRef.current = { moodBucket, evolutionState, reduceMotion, critical };
  }, [moodBucket, evolutionState, reduceMotion, critical]);

  // Pending steps of an action sequence. Presentation-only: never persisted.
  const sequenceRef = useRef<string[]>([]);
  // Advancing counters for the deterministic scheduler. Local refs only.
  const tickCounterRef = useRef(0);
  const pickCounterRef = useRef(0);

  const tryPlay = useCallback(
    (clipId: string, viaSequence = false): boolean => {
      const clip = MOVEMENT_CLIPS[clipId];
      if (!clip) return false;
      const gate = gateRef.current;
      if (gate.critical && isCelebratoryClip(clipId)) return false;
      if (
        !isClipAllowed(clip, gate.moodBucket, gate.evolutionState, gate.reduceMotion)
      ) {
        return false;
      }
      const current = activeRef.current;
      const elapsed = Date.now() - current.startedAt;
      const finished = elapsed >= current.clip.duration;
      // Sequence steps follow their own action; external asks must beat
      // the running clip's priority.
      if (!viaSequence && !finished && clip.priority <= current.clip.priority) {
        return false;
      }
      // An external interruption abandons any in-flight sequence.
      if (!viaSequence) sequenceRef.current = [];
      const next = { clip, startedAt: Date.now() };
      activeRef.current = next;
      setActive(next);
      return true;
    },
    [],
  );

  const startSequence = useCallback(
    (clipIds: readonly string[]) => {
      const [first, ...rest] = clipIds;
      if (!first) return;
      sequenceRef.current = [...rest];
      if (!tryPlay(first, true)) {
        // First step gated out — fall through to the next playable step.
        while (sequenceRef.current.length > 0) {
          const next = sequenceRef.current.shift();
          if (next && tryPlay(next, true)) break;
        }
      }
    },
    [tryPlay],
  );

  const playAction = useCallback(
    (action: CareActionId) => {
      const gate = gateRef.current;
      let sequence: readonly string[] = ACTION_SEQUENCES[action];
      if (action === "play") {
        // Rare ceremonial variant, deterministically seeded per invocation.
        pickCounterRef.current += 1;
        const roll = seededUnit(seed, pickCounterRef.current, 23);
        sequence = roll < 0.25 ? ["sacred_toy_bounce"] : ["happy_bounce"];
      } else if (action === "anomaly") {
        pickCounterRef.current += 1;
        const roll = seededUnit(seed, pickCounterRef.current, 29);
        const evolved =
          gate.evolutionState === "QUANTUM" ||
          gate.evolutionState === "SPECIATION";
        sequence = evolved
          ? roll < 0.4
            ? ["quantum_stutter"]
            : roll < 0.7
              ? ["quantum_split", "oracle_blink"]
              : ["omen_twitch", "oracle_blink"]
          : roll < 0.5
            ? ["omen_twitch"]
            : ["omen_twitch", "oracle_blink"];
      }
      startSequence(sequence);
    },
    [seed, startSequence],
  );

  const onGesture = useCallback(
    (gesture: PointerGesture) => {
      tryPlay(GESTURE_CLIP[gesture]);
    },
    [tryPlay],
  );

  const onBeat = useCallback(() => {
    tryPlay("beat_hit");
  }, [tryPlay]);

  const onAffection = useCallback(() => {
    playAction("love");
  }, [playAction]);

  const onAnomaly = useCallback(() => {
    playAction("anomaly");
  }, [playAction]);

  const playCeremony = useCallback(() => {
    playAction("evolution");
  }, [playAction]);

  // Care-action reaction to store actions (feed/play/etc.). Deferred a
  // frame so the effect body never sets state synchronously.
  const lastActionRef = useRef(lastAction);
  useEffect(() => {
    if (!lastAction || lastAction === lastActionRef.current) {
      lastActionRef.current = lastAction;
      return;
    }
    lastActionRef.current = lastAction;
    const known: CareActionId[] = ["feed", "clean", "play", "sleep", "love"];
    const action = known.includes(lastAction as CareActionId)
      ? (lastAction as CareActionId)
      : null;
    const timer = window.setTimeout(() => {
      if (action) playAction(action);
      else tryPlay("head_tilt");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lastAction, playAction, tryPlay]);

  // Progress ticker + clip expiry → next sequence step or idle breathing.
  // Progress commits are throttled to ~30fps: SVG body language reads
  // perfectly at that rate and the whole pet subtree re-renders per commit,
  // so 60fps commits would double the render cost for no visible gain.
  useEffect(() => {
    if (paused || typeof window === "undefined") return;
    if (activeRef.current.startedAt === 0) {
      const started = { clip: activeRef.current.clip, startedAt: Date.now() };
      activeRef.current = started;
      setActive(started);
    }
    let raf = 0;
    let lastCommit = 0;
    const commitProgress = (value: number, now: number) => {
      if (now - lastCommit < 33) return;
      lastCommit = now;
      // Quantised so identical consecutive values skip the re-render.
      const quantised = Math.round(value * 240) / 240;
      setProgress((previous) => (previous === quantised ? previous : quantised));
    };
    const step = () => {
      const now = Date.now();
      const current = activeRef.current;
      const elapsed = now - current.startedAt;
      if (elapsed >= current.clip.duration) {
        const nextStep = sequenceRef.current.shift();
        if (nextStep && tryPlay(nextStep, true)) {
          // Sequence advanced; progress restarts on the next frame.
        } else if (current.clip.id !== IDLE_CLIP.id) {
          const idle = { clip: IDLE_CLIP, startedAt: now };
          activeRef.current = idle;
          setActive(idle);
        } else {
          // Loop idle breathing.
          commitProgress(
            (elapsed % IDLE_CLIP.duration) / IDLE_CLIP.duration,
            now,
          );
        }
      } else {
        commitProgress(elapsed / current.clip.duration, now);
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [paused, tryPlay]);

  // Deterministic brain tick: mood expressions, addon shimmer, secret moves.
  useEffect(() => {
    if (paused || typeof window === "undefined") return;
    const tick = window.setInterval(() => {
      tickCounterRef.current += 1;
      const gate = gateRef.current;
      const pick = decideAmbientClip(seed, tickCounterRef.current, {
        mood: gate.moodBucket,
        evolutionState: gate.evolutionState,
        reduceMotion: gate.reduceMotion,
        critical: gate.critical,
        careActionActive: sequenceRef.current.length > 0,
        equippedAddonCount,
        secretMoveChance,
      });
      if (pick) tryPlay(pick);
    }, BRAIN_TICK_MS);
    return () => window.clearInterval(tick);
  }, [paused, seed, secretMoveChance, equippedAddonCount, tryPlay]);

  return {
    active,
    progress,
    moodBucket,
    seed,
    play: tryPlay,
    playAction,
    onGesture,
    onBeat,
    onAffection,
    onAnomaly,
    playCeremony,
  };
}

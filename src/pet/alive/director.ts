import type { PersonalityTraits } from "@/genome/types";
import type { PetForm } from "@/lib/petForms";
import { clamp, DEFAULT_SETTINGS, durationMs, getExpression } from "@/lib/expressions/studio";
import { sampleTake, TAKE_LIMIT_CUES, TAKE_LIMIT_MS, type CueSource, type PerformanceCue, type PerformanceSample, type PerformanceTake } from "@/lib/expressions/take";
import { MovementPriority } from "@/pet/movement/movementVocabulary";
import type { GreetingSide } from "./greetingHabit";
import { seededUnit } from "@/pet/movement/movementScheduler";

export type AliveMode = "playful" | "calm" | "dance";
export type Gesture = {
  kind: "hover" | "tap" | "double-tap" | "rhythm" | "hold" | "stroke" | "swipe" | "release";
  intensity: number;
  direction: -1 | 1;
  greetingSide?: GreetingSide;
  tapAt?: number;
};

export const CUE_PRIORITY: Record<CueSource, MovementPriority> = {
  ambient: MovementPriority.Attention,
  touch: MovementPriority.TouchReaction,
  learned: MovementPriority.AudioBeat,
  music: MovementPriority.AudioBeat,
  directed: MovementPriority.BigEmotion,
};

export function gestureExpression(gesture: Gesture, mode: AliveMode, personality: PersonalityTraits) {
  if (gesture.kind === "swipe") return gesture.intensity > .82 ? "surprised" : "curious";
  if (gesture.kind === "rhythm") return mode === "calm" ? "resonance" : "dance";
  if (gesture.kind === "double-tap") return personality.playfulness > 48 && mode !== "calm" ? "lol" : "happy";
  if (gesture.kind === "hold") return "focus";
  if (gesture.kind === "stroke") return personality.affection > 49 ? "love" : "peace";
  if (gesture.kind === "release") return "peace";
  return mode === "dance" ? "dance" : mode === "calm" ? "curious" : personality.social > 50 ? "hello" : "cheeky";
}

const idleRepertoires = {
  tired: ["sleepy", "yawn", "moonbeam", "goodnight"],
  calm: ["peace", "stargazing", "shimmer", "mandala"],
  dance: ["dance", "resonance", "spiral", "blue-streak"],
  curious: ["curious", "explore", "discovery", "question"],
  playful: ["stretching", "wink", "cheeky", "shimmer", "zoomies", "snake-energy"],
} as const;

export function idleExpression(seed: number, index: number, mode: AliveMode, tired: boolean, curiosity: number) {
  const pool = tired ? idleRepertoires.tired : mode === "calm" ? idleRepertoires.calm :
    mode === "dance" ? idleRepertoires.dance :
    seededUnit(seed, index, 17) < curiosity / 210 ? idleRepertoires.curious : idleRepertoires.playful;
  // Step through the pool from a per-pet offset so neighbouring picks vary.
  return pool[(Math.floor(seededUnit(seed, 0, 18) * pool.length) + index) % pool.length];
}

export function idleDelayMs(seed: number, index: number, mode: AliveMode) {
  const spread = seededUnit(seed, index, 7);
  return mode === "calm" ? 4500 + spread * 2200 : 2500 + spread * 1600;
}

const touchVariations: Partial<Record<Gesture["kind"], readonly string[]>> = {
  tap: ["wink", "high-five", "cheer"],
  "double-tap": ["happy", "lol", "wobbly"],
  rhythm: ["dance", "zoomies", "resonance"],
  stroke: ["shimmer", "best-friends", "hug"],
  swipe: ["spin-out", "blue-streak", "wobbly"],
};

type CueOptions = { source: CueSource; duration?: number; intensity?: number; direction?: -1 | 1; record?: boolean; replay?: Pick<PerformanceCue, "intensity" | "exaggeration"> };
type Clock = { now: () => number; request: (f: FrameRequestCallback) => number; cancel: (id: number) => void };
type DirectorConfig = {
  form: PetForm; personality: PersonalityTraits; seed: number;
  blocked: () => boolean; reduced: () => boolean; clock?: Clock;
  onGreeting?: (side: GreetingSide) => void;
};
const clock: Clock = {
  now: () => performance.now(), request: callback => requestAnimationFrame(callback), cancel: id => cancelAnimationFrame(id),
};

/** Presentation-only channel. Subscribers wake only while a cue is changing. */
export function createDirector(config: DirectorConfig) {
  const timer = config.clock ?? clock;
  const timeline: PerformanceTake = { version: 1, form: config.form, cues: [] };
  const listeners = new Set<() => void>();
  const policyListeners = new Set<() => void>();
  const stageTapListeners = new Set<(at: number | null) => boolean>();
  let sample: PerformanceSample | null = null;
  let request = 0;
  let lastTick = -Infinity;
  let stillUntil = 0;
  let paused = false;
  let mode: AliveMode = "playful";
  let intensity = 1;
  let exaggeration = .8;
  let recording: { start: number; cues: PerformanceCue[] } | null = null;
  let last: PerformanceCue | null = null;
  let lastLook = -Infinity;
  const gestures = new Map<Gesture["kind"], number>();

  function publish(next: PerformanceSample | null) {
    if (sample !== next) {
      sample = next;
      for (const listener of listeners) listener();
    }
  }

  function stop() {
    timer.cancel(request);
    request = 0;
    stillUntil = 0;
    timeline.cues = [];
    publish(null);
  }

  function tick(now: number) {
    request = 0;
    if (paused || config.blocked()) { stop(); return; }
    const reduced = config.reduced();
    if (reduced ? now >= stillUntil : !timeline.cues.some(cue => now < cue.at + cue.duration)) {
      stop();
      return;
    }
    if (now - lastTick >= 33 && (!reduced || sample?.cue !== timeline.cues.at(-1))) {
      lastTick = now;
      publish(sampleTake(timeline, now, config.personality, config.seed, reduced));
    }
    request = timer.request(tick);
  }

  function play(expressionId: string, options: CueOptions) {
    const expression = getExpression(expressionId);
    if (!expression || paused || config.blocked() || (recording && options.source === "ambient")) return false;
    const now = timer.now();
    const current = timeline.cues.at(-1);
    // Intentional touches interrupt passive motion. Equal-priority gestures
    // can continue a rhythm. One active cue owns the performance channels.
    const incoming = CUE_PRIORITY[options.source];
    if (current && now < current.at + current.duration &&
      (options.source === "ambient" || (incoming < CUE_PRIORITY[current.source] &&
        !(options.source === "touch" && current.source === "music")))) return false;
    const cue: PerformanceCue = {
      at: now, expressionId, source: options.source,
      duration: Math.round(clamp(options.duration ?? durationMs(expression, DEFAULT_SETTINGS, config.personality), 120, 5000)),
      intensity: options.replay?.intensity ?? clamp(intensity * (options.intensity ?? 1) * (mode === "calm" ? .68 : 1), .45, 1.45),
      exaggeration: options.replay?.exaggeration ?? exaggeration, direction: options.direction ?? 1,
    };
    if (options.source !== "ambient" && options.record !== false) last = cue;
    if (recording && options.record !== false && options.source !== "ambient" && recording.cues.length < TAKE_LIMIT_CUES &&
      now - recording.start <= TAKE_LIMIT_MS) {
      recording.cues.push({ ...cue, at: Math.round(now - recording.start) });
    }
    timeline.cues = current ? [current, cue] : [cue];
    stillUntil = now + Math.min(650, cue.duration);
    if (!request) request = timer.request(tick);
    return true;
  }

  return {
    form: config.form,
    personality: config.personality,
    seed: config.seed,
    play,
    isBlocked: config.blocked,
    isReduced: config.reduced,
    stopCue(id: string) {
      const current = timeline.cues.at(-1);
      if (current?.expressionId === id) stop();
    },
    subscribeStageTap(listener: (at: number | null) => boolean) {
      stageTapListeners.add(listener);
      return () => { stageTapListeners.delete(listener); };
    },
    clearStageTaps() {
      for (const listener of stageTapListeners) listener(null);
    },
    gesture(gesture: Gesture) {
      if (gesture.tapAt !== undefined && !config.blocked()) {
        for (const listener of stageTapListeners) {
          if (listener(gesture.tapAt)) return true;
        }
      } else if (gesture.kind === "hold" || gesture.kind === "swipe" || gesture.kind === "stroke") {
        for (const listener of stageTapListeners) listener(null);
      }
      if (gesture.kind === "hover") {
        const now = timer.now();
        const current = timeline.cues.at(-1);
        if (config.reduced() || now - lastLook < 3000 ||
          (current && current.source !== "ambient" && now < current.at + current.duration)) return false;
        const accepted = play("curious", { source: "ambient", intensity: .69, direction: gesture.direction });
        if (accepted) lastLook = now;
        return accepted;
      }
      const count = gestures.get(gesture.kind) ?? 0;
      const options = touchVariations[gesture.kind];
      const variation = count % 2 === 1 && options && mode === "playful" && !config.reduced()
        ? options[(Math.floor(count / 2) + config.seed % options.length) % options.length] : undefined;
      const accepted = play(variation ?? gestureExpression(gesture, mode, config.personality), {
        source: "touch", direction: gesture.direction,
        intensity: .79 + clamp(gesture.intensity, 0, 1) * .46,
        duration: gesture.kind === "release" ? 830 : undefined,
      });
      if (accepted) {
        gestures.set(gesture.kind, count + 1);
        if (gesture.kind === "tap" && gesture.greetingSide) config.onGreeting?.(gesture.greetingSide);
      }
      return accepted;
    },
    replay() {
      return last ? play(last.expressionId, { source: "directed", duration: last.duration, direction: last.direction, replay: last }) : false;
    },
    getFrame: () => sample,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    subscribePolicy(listener: () => void) { policyListeners.add(listener); return () => { policyListeners.delete(listener); }; },
    isPaused: () => paused,
    setPaused(next: boolean) {
      paused = next;
      if (next) stop();
      for (const listener of policyListeners) listener();
    },
    getMode: () => mode,
    tune(nextMode: AliveMode, nextIntensity: number, nextExaggeration: number) {
      mode = nextMode; intensity = nextIntensity; exaggeration = nextExaggeration;
    },
    startTake() { stop(); recording = { start: timer.now(), cues: [] }; },
    finishTake(): PerformanceTake | null {
      const cues = recording?.cues;
      recording = null;
      if (!cues?.length) return null;
      const first = cues[0].at;
      return { version: 1, form: config.form, cues: cues.map(cue => ({ ...cue, at: cue.at - first })) };
    },
    stop,
  };
}

export type Director = ReturnType<typeof createDirector>;

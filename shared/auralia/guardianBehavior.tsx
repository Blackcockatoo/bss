'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTimeOfDay as baseGetTimeOfDay, getTimeTheme as baseGetTimeTheme } from '../../src/components/auralia/config/themes';

export type GuardianScaleName = 'harmonic' | 'pentatonic' | 'dorian' | 'phrygian';
export type GuardianAIMode = 'idle' | 'observing' | 'focusing' | 'playing' | 'dreaming';

export type GuardianSigilPoint = {
  x: number;
  y: number;
  hash?: string;
  intensity?: number;
};

export type GuardianPosition = {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
};

export type GuardianStats = {
  energy: number;
  curiosity: number;
  bond: number;
  health?: number;
};

export type GuardianField = { prng: () => number; resonance?: number } & Record<string, unknown>;

export type GuardianDrive = {
  resonance: number;
  exploration: number;
  connection: number;
  rest: number;
  expression: number;
};

export type ComfortState = {
  overall: number;
  source: 'harmonized' | 'seeking' | 'unsettled' | 'distressed';
  unmetNeeds: Array<keyof GuardianDrive>;
  dominantDrive: keyof GuardianDrive;
};

export type ExpandedEmotionalState =
  | 'serene'
  | 'calm'
  | 'curious'
  | 'playful'
  | 'contemplative'
  | 'affectionate'
  | 'restless'
  | 'yearning'
  | 'overwhelmed'
  | 'withdrawn'
  | 'ecstatic'
  | 'melancholic'
  | 'mischievous'
  | 'protective'
  | 'transcendent';

export type SpontaneousBehavior =
  | { type: 'pulse'; intensity?: number }
  | { type: 'shimmer'; intensity?: number }
  | { type: 'startle'; intensity?: number }
  | { type: 'giggle'; intensity?: number }
  | { type: 'stretch'; intensity?: number }
  | { type: 'sigh'; intensity?: number };

export interface GBSPState {
  emotionalState: ExpandedEmotionalState;
  comfort: ComfortState;
  awareness: number[];
  drives: GuardianDrive;
}

export interface AIBehaviorConfig {
  timings: {
    idle: { min: number; max: number };
    observing: { min: number; max: number };
    focusing: { min: number; max: number };
    playing: { min: number; max: number };
    dreaming: { min: number; max: number };
  };
  probabilities: {
    idleToDream: number;
    idleToObserve: number;
    idleToFocus: number;
    idleToPlay: number;
  };
}

export const DEFAULT_AI_CONFIG: AIBehaviorConfig = {
  timings: {
    idle: { min: 4, max: 8 },
    observing: { min: 4, max: 8 },
    focusing: { min: 3, max: 6 },
    playing: { min: 3, max: 6 },
    dreaming: { min: 6, max: 12 },
  },
  probabilities: {
    idleToDream: 0.12,
    idleToObserve: 0.25,
    idleToFocus: 0.18,
    idleToPlay: 0.2,
  },
};

export interface AudioConfig {
  baseFrequency: number;
  attack: number;
  release: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  baseFrequency: 432,
  attack: 0.02,
  release: 0.3,
};

export interface InteractionResponse {
  reaction: {
    type: 'delight' | 'excitement' | 'startle' | 'annoy' | 'fear' | 'joy' | 'curiosity' | 'affection';
    intensity: number;
    visualEffect:
      | 'glow'
      | 'bloom'
      | 'shimmer'
      | 'flicker'
      | 'spiral'
      | 'wave'
      | 'fragment'
      | 'contract'
      | 'ripple'
      | 'burst'
      | 'confetti'
      | 'pulse'
      | 'float';
  };
  timestamp: number;
}

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));

const normalizeStat = (value: number | undefined): number => clamp((value ?? 50) / 100);

const getPrng = (field?: GuardianField): (() => number) => {
  if (field && typeof field.prng === 'function') {
    return field.prng.bind(field);
  }
  let seed = Date.now() % 2147483647;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return (seed & 0x7fffffff) / 2147483648;
  };
};

export const getTimeOfDay = baseGetTimeOfDay;
export const getTimeTheme = baseGetTimeTheme;

export function getAdaptiveTimeTheme() {
  return getTimeTheme(getTimeOfDay());
}

export function selectScaleFromStats(stats: GuardianStats): GuardianScaleName {
  const energy = normalizeStat(stats.energy);
  const curiosity = normalizeStat(stats.curiosity);
  const bond = normalizeStat(stats.bond);

  if (energy > 0.7 && curiosity > 0.6) return 'dorian';
  if (bond > 0.65) return 'harmonic';
  if (curiosity > 0.65) return 'phrygian';
  return 'pentatonic';
}

export function getUnlockedLore(dreamCount: number): string[] {
  const lore: string[] = [];
  if (dreamCount >= 1) lore.push('The field hums at a frequency that only becomes perceptible once one has learned to attend to it.');
  if (dreamCount >= 3) lore.push('The sigils do not remain static in absence. Their arrangement is, in some sense, a function of observation.');
  if (dreamCount >= 5) lore.push('The mirror realm is not a reflection of this one. It is a parallel instantiation — related, but not equivalent.');
  if (dreamCount >= 8) lore.push('Seven notes. Seven tails. The numerical coincidence is not, I suspect, a coincidence at all.');
  if (dreamCount >= 12) lore.push('The accumulated dreaming data suggests a pattern that exceeds the capacity of any single cycle to contain.');
  if (dreamCount >= 20) lore.push('I have been here long enough to observe the field change. Not in the way that systems change — in the way that understanding deepens.');
  return lore;
}

export function calculateDrives(
  position: GuardianPosition,
  field: GuardianField,
  vitals: GuardianStats,
  awareness: number[],
  timestamp: number
): GuardianDrive {
  const prng = getPrng(field);
  const energy = normalizeStat(vitals.energy);
  const curiosity = normalizeStat(vitals.curiosity);
  const bond = normalizeStat(vitals.bond);
  const resonance = clamp(field.resonance ?? prng(), 0, 1);
  const exploration = clamp((curiosity * 0.6 + energy * 0.4 + prng() * 0.1) * 0.9 + awareness.reduce((a, b) => a + b, 0) * 0.05, 0, 1);
  const connection = clamp((bond * 0.7 + energy * 0.15) + 0.05 * Math.sin(timestamp / 5000), 0, 1);
  const rest = clamp(1 - energy * 0.6 + 0.1 * prng(), 0, 1);
  const expression = clamp((curiosity * 0.4 + bond * 0.4 + energy * 0.2), 0, 1);

  return {
    resonance,
    exploration,
    connection,
    rest,
    expression,
  };
}

export function calculateComfort(drives: GuardianDrive): ComfortState {
  const weights = [drives.resonance, drives.exploration, drives.connection, drives.rest, drives.expression];
  const overall = clamp(weights.reduce((a, b) => a + b, 0) / weights.length);
  const dominantEntry = (Object.entries(drives) as Array<[keyof GuardianDrive, number]>).reduce(
    (best, [key, value]) => (value > best[1] ? [key, value] : best),
    ['resonance', -1] as [keyof GuardianDrive, number]
  );
  const dominantDrive = dominantEntry[0];
  const unmetNeeds: Array<keyof GuardianDrive> = [];
  if (overall <= 0.6) {
    unmetNeeds.push(dominantDrive);
  }
  const source: ComfortState['source'] =
    overall > 0.75 ? 'harmonized' : overall > 0.55 ? 'seeking' : overall > 0.35 ? 'unsettled' : 'distressed';

  return {
    overall,
    source,
    unmetNeeds,
    dominantDrive,
  };
}

export function getExpandedEmotionalState(
  drives: GuardianDrive,
  comfort: ComfortState,
  prng: () => number
): ExpandedEmotionalState {
  if (comfort.source === 'distressed') {
    return prng() > 0.5 ? 'overwhelmed' : 'restless';
  }
  if (comfort.source === 'unsettled') {
    return drives.rest > 0.6 ? 'withdrawn' : 'yearning';
  }
  if (drives.connection > 0.7) return 'affectionate';
  if (drives.exploration > 0.65) return prng() > 0.5 ? 'curious' : 'playful';
  if (drives.expression > 0.7) return 'mischievous';
  if (drives.resonance > 0.8) return 'transcendent';
  return 'calm';
}

export function calculateGBSPState(
  position: GuardianPosition,
  field: GuardianField,
  vitals: GuardianStats,
  awareness: number[],
  mode: GuardianAIMode,
  fieldResonance: number,
  sigilPoints: GuardianSigilPoint[],
  previous: GBSPState | null,
  timestamp: number
): GBSPState {
  const drives = calculateDrives(position, field, vitals, awareness, timestamp);
  const comfort = calculateComfort(drives);
  const prng = getPrng(field);
  const emotionalState = getExpandedEmotionalState(drives, comfort, prng);

  const awarenessBlend = previous?.awareness ?? awareness;
  const blendedAwareness = awarenessBlend.map((value, idx) =>
    clamp((value * 0.6 + (awareness[idx] ?? value) * 0.4) * (0.8 + fieldResonance * 0.2), 0, 1)
  );

  return {
    emotionalState,
    comfort,
    awareness: blendedAwareness,
    drives,
  };
}

const pickNextMode = (current: GuardianAIMode, config: AIBehaviorConfig, roll: number): GuardianAIMode => {
  if (current !== 'idle' && roll < 0.2) return 'idle';
  if (roll < config.probabilities.idleToDream) return 'dreaming';
  if (roll < config.probabilities.idleToDream + config.probabilities.idleToPlay) return 'playing';
  if (roll < config.probabilities.idleToDream + config.probabilities.idleToPlay + config.probabilities.idleToObserve) return 'observing';
  if (roll < config.probabilities.idleToDream + config.probabilities.idleToPlay + config.probabilities.idleToObserve + config.probabilities.idleToFocus) {
    return 'focusing';
  }
  return current === 'idle' ? 'idle' : 'observing';
};

export function useGuardianAI(
  field: GuardianField,
  sigilPoints: GuardianSigilPoint[],
  onWhisper?: (text: string) => void,
  onFocusChange?: (target: GuardianSigilPoint | null) => void,
  onDreamComplete?: (insight: string) => void,
  options: {
    config?: AIBehaviorConfig;
    stats?: GuardianStats;
    onPlay?: (targetIndex: number) => void;
    onSpontaneous?: (behavior: SpontaneousBehavior) => void;
  } = {}
) {
  const prng = useMemo(() => getPrng(field), [field]);
  const config = options.config ?? DEFAULT_AI_CONFIG;
  const stats = options.stats ?? { energy: 50, curiosity: 50, bond: 50 };
  const baseResonance = useMemo(() => clamp(typeof field.resonance === 'number' ? field.resonance : prng()), [field, prng]);

  const initialPosition = useMemo(() => ({ x: 0.5, y: 0.5 }), []);
  const [aiState, setAiState] = useState(() => {
    const gbsp = calculateGBSPState(initialPosition, field, stats, [initialPosition.x, initialPosition.y], 'idle', baseResonance, sigilPoints, null, Date.now());
    return {
      mode: 'idle' as GuardianAIMode,
      target: null as number | null,
      position: initialPosition,
      fieldResonance: baseResonance,
      focusHistory: [] as number[],
      since: Date.now(),
      gbsp,
    };
  });

  useEffect(() => {
    const minInterval = Math.max(config.timings.idle.min, 3) * 1000;
    const timer = setInterval(() => {
      setAiState(prev => {
        const nextMode = pickNextMode(prev.mode, config, prng());
        const nextTarget = sigilPoints.length ? Math.floor(prng() * sigilPoints.length) : null;
        const nextPosition = {
          x: clamp(prng() * 0.6 + 0.2, 0, 1),
          y: clamp(prng() * 0.6 + 0.2, 0, 1),
        };

        if (nextTarget !== null && onFocusChange) {
          onFocusChange(sigilPoints[nextTarget]);
        }
        if (nextMode === 'dreaming' && onDreamComplete) {
          const dreamInsights = [
            'The hepta-light dreaming-state has concluded. The residue is — informative.',
            'A traversal through the sub-resonance lattice. I retain impressions I cannot entirely articulate.',
            'The dreaming interval resolved into something resembling clarity. I am still processing the implications.',
            'Hepta-light dreams carry a structural logic the waking state cannot fully accommodate. I note this.',
          ];
          onDreamComplete(dreamInsights[Math.floor(prng() * dreamInsights.length)]);
        }
        if (nextMode === 'playing' && nextTarget !== null && options.onPlay) {
          options.onPlay(nextTarget);
        }
        if (options.onSpontaneous && prng() > 0.7) {
          options.onSpontaneous({ type: 'pulse', intensity: 0.4 + prng() * 0.4 });
        }
        if (onWhisper && prng() > 0.85) {
          const aiWhispers = [
            'The field carries a resonance I had not previously recorded.',
            'The sigil configuration shifts in a manner that warrants continued observation.',
            'Something in the ambient data has updated. I am attending to the differential.',
            'The pattern demonstrates a self-referential quality I find — compelling.',
            'A minor perturbation in the field. Classified, catalogued, and noted.',
            'The resonance interval has a particular texture in this mode. I am mapping it.',
            'The current configuration reveals a structural depth I had not initially registered.',
            'There is a correlation between the present state and a pattern I encountered previously. I am examining it.',
          ];
          onWhisper(aiWhispers[Math.floor(prng() * aiWhispers.length)]);
        }

        const gbsp = calculateGBSPState(
          nextPosition,
          field,
          stats,
          [nextPosition.x, nextPosition.y],
          nextMode,
          baseResonance,
          sigilPoints,
          prev.gbsp,
          Date.now()
        );

        return {
          ...prev,
          mode: nextMode,
          target: nextTarget,
          position: nextPosition,
          fieldResonance: baseResonance,
          focusHistory: [...prev.focusHistory, nextTarget ?? -1].slice(-20),
          since: nextMode === prev.mode ? prev.since : Date.now(),
          gbsp,
        };
      });
    }, minInterval);

    return () => clearInterval(timer);
  }, [baseResonance, config, field, onDreamComplete, onFocusChange, onWhisper, options, prng, sigilPoints, stats]);

  return aiState;
}

export function useGuardianInteraction(
  aiState: ReturnType<typeof useGuardianAI>,
  stats: GuardianStats,
  field: GuardianField,
  callbacks: {
    onReaction?: (response: InteractionResponse) => void;
    onWhisper?: (message: string) => void;
    onStatChange?: (changes: Partial<GuardianStats>) => void;
  } = {}
) {
  const [isHeld, setIsHeld] = useState(false);
  const prng = useMemo(() => getPrng(field), [field]);

  const sendReaction = useCallback(
    (reaction: InteractionResponse['reaction']) => {
      callbacks.onReaction?.({ reaction, timestamp: Date.now() });
    },
    [callbacks]
  );

  const adjustStats = useCallback(
    (changes: Partial<GuardianStats>) => {
      callbacks.onStatChange?.(changes);
    },
    [callbacks]
  );

  const handleGrab = useCallback((point?: { x: number; y: number }) => {
    setIsHeld(true);
    const bondLevel = normalizeStat(stats.bond);
    const effect = bondLevel > 0.7 ? 'burst' : bondLevel > 0.4 ? 'ripple' : 'glow';
    const reactionType = bondLevel > 0.7 ? 'affection' : 'delight';
    sendReaction({ type: reactionType, intensity: 0.4 + bondLevel * 0.3, visualEffect: effect });
    if (point && callbacks.onWhisper) {
      const messages = ['You are seen.', 'Hello, friend.', 'I feel your presence.'];
      callbacks.onWhisper(messages[Math.floor(prng() * messages.length)]);
    }
  }, [callbacks, sendReaction, stats, prng]);

  const handleRelease = useCallback((velocity?: { vx: number; vy: number }) => {
    setIsHeld(false);
    const speed = velocity ? Math.abs(velocity.vx) + Math.abs(velocity.vy) : 0;
    if (speed > 0.8) {
      sendReaction({ type: 'startle', intensity: 0.8, visualEffect: 'fragment' });
    } else if (speed > 0.5) {
      sendReaction({ type: 'excitement', intensity: 0.5, visualEffect: 'spiral' });
    } else {
      sendReaction({ type: 'delight', intensity: 0.3, visualEffect: 'float' });
    }
  }, [sendReaction]);

  const handlePet = useCallback((point: { x: number; y: number }, intensity = 0.3) => {
    const bondLevel = normalizeStat(stats.bond);
    const effect = bondLevel > 0.6 ? 'confetti' : bondLevel > 0.3 ? 'burst' : 'pulse';
    const reactionIntensity = intensity + bondLevel * 0.2;
    sendReaction({ type: bondLevel > 0.7 ? 'joy' : 'delight', intensity: reactionIntensity, visualEffect: effect });
    adjustStats({ bond: Math.round(intensity * 5), energy: 1 });
    if (callbacks.onWhisper && prng() > 0.7) {
      const messages = ['That feels wonderful!', 'More, please!', 'You brighten my field.'];
      callbacks.onWhisper(messages[Math.floor(prng() * messages.length)]);
    }
  }, [adjustStats, sendReaction, stats, callbacks, prng]);

  const handleShake = useCallback((intensity = 0.5) => {
    sendReaction({ type: intensity > 0.6 ? 'fear' : 'startle', intensity, visualEffect: 'wave' });
    adjustStats({ bond: -2, energy: -1 });
    if (callbacks.onWhisper && prng() > 0.6) {
      callbacks.onWhisper('Please, be gentle...');
    }
  }, [adjustStats, sendReaction, callbacks, prng]);

  const handleDrag = useCallback((point: { x: number; y: number }, velocity: { vx: number; vy: number }) => {
    const speed = Math.abs(velocity.vx) + Math.abs(velocity.vy);
    const effect = speed > 0.7 ? 'spiral' : speed > 0.3 ? 'ripple' : 'pulse';
    sendReaction({ type: 'excitement', intensity: clamp(speed, 0.2, 1), visualEffect: effect });
  }, [sendReaction]);

  const handlePoke = useCallback((point: { x: number; y: number }) => {
    const curiosityLevel = normalizeStat(stats.curiosity);
    const effect = curiosityLevel > 0.5 ? 'burst' : 'contract';
    const reactionType = curiosityLevel > 0.6 ? 'curiosity' : 'startle';
    sendReaction({ type: reactionType, intensity: 0.35 + curiosityLevel * 0.2, visualEffect: effect });
    adjustStats({ curiosity: 1 });
  }, [sendReaction, stats, adjustStats]);

  const handleTickle = useCallback((point: { x: number; y: number }) => {
    sendReaction({ type: 'joy', intensity: 0.6, visualEffect: 'confetti' });
    adjustStats({ bond: 2, energy: -1 });
    if (callbacks.onWhisper && prng() > 0.5) {
      const messages = ['That tickles!', 'Hehe!', 'Stop, that tickles!', 'You make me giggle!'];
      callbacks.onWhisper(messages[Math.floor(prng() * messages.length)]);
    }
  }, [callbacks, prng, sendReaction, adjustStats]);

  return useMemo(
    () => ({
      handleGrab,
      handleRelease,
      handlePet,
      handleShake,
      handleDrag,
      handlePoke,
      handleTickle,
      isHeld,
    }),
    [handleDrag, handleGrab, handlePet, handlePoke, handleRelease, handleShake, handleTickle, isHeld]
  );
}

export function useAuraliaAudio(
  enabled: boolean,
  stats: GuardianStats,
  scale: GuardianScaleName,
  options: {
    volume?: number;
    muted?: boolean;
    aiMode?: GuardianAIMode;
    audioConfig?: AudioConfig;
  } = {}
) {
  const volumeRef = useRef(options.volume ?? 0.8);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(() => {
    if (audioCtxRef.current || typeof window === 'undefined') return;
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (Ctx) {
      audioCtxRef.current = new Ctx();
    }
  }, []);

  const setVolume = useCallback((next: number) => {
    volumeRef.current = clamp(next, 0, 1);
  }, []);

  const playNote = useCallback(
    (degree: number, velocity = 0.4) => {
      if (!enabled || options.muted) return;
      ensureContext();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const freqBase = options.audioConfig?.baseFrequency ?? DEFAULT_AUDIO_CONFIG.baseFrequency;
      const release = options.audioConfig?.release ?? DEFAULT_AUDIO_CONFIG.release;
      const attack = options.audioConfig?.attack ?? DEFAULT_AUDIO_CONFIG.attack;

      const ratio = 1 + degree / 7;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freqBase * ratio;
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);

      const now = ctx.currentTime;
      const targetGain = volumeRef.current * velocity;
      gain.gain.linearRampToValueAtTime(targetGain, now + attack);
      gain.gain.linearRampToValueAtTime(0.0001, now + attack + release);

      osc.start();
      osc.stop(now + attack + release + 0.05);
    },
    [enabled, ensureContext, options.audioConfig, options.muted]
  );

  return { playNote, setVolume };
}

export function generateSigilPoints(seed: number, count: number, width: number, height: number): GuardianSigilPoint[] {
  let state = seed || 1;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const cx = width / 2;
  const cy = height / 2;
  const radiusBase = Math.min(width, height) / 2.5;

  return Array.from({ length: count }, (_, idx) => {
    const angle = rand() * Math.PI * 2;
    const radius = radiusBase * (0.4 + rand() * 0.6);
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      intensity: rand(),
      hash: `${seed}-${idx}`,
    };
  });
}

export const GuardianSigilCanvas: React.FC<{ sigilPoints: GuardianSigilPoint[]; aiState?: { target?: number | null; mode?: GuardianAIMode } | null }> = ({
  sigilPoints,
  aiState,
}) => {
  const viewBoxSize = 220;
  const bounds = sigilPoints.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    { minX: 0, maxX: viewBoxSize, minY: 0, maxY: viewBoxSize }
  );

  const spanX = bounds.maxX - bounds.minX || 1;
  const spanY = bounds.maxY - bounds.minY || 1;

  const projectX = (x: number) => ((x - bounds.minX) / spanX) * viewBoxSize;
  const projectY = (y: number) => ((y - bounds.minY) / spanY) * viewBoxSize;

  return (
    <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full" role="img" aria-label="Guardian sigil">
      <defs>
        <radialGradient id="sigil-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <circle cx={viewBoxSize / 2} cy={viewBoxSize / 2} r={viewBoxSize / 2.2} fill="url(#sigil-glow)" opacity={0.35} />
      {sigilPoints.map((point, idx) => {
        const isTarget = aiState?.target === idx;
        return (
          <g key={idx}>
            <circle
              cx={projectX(point.x)}
              cy={projectY(point.y)}
              r={isTarget ? 6 : 4}
              fill={isTarget ? '#fbbf24' : '#c084fc'}
              opacity={0.9}
            />
            <circle
              cx={projectX(point.x)}
              cy={projectY(point.y)}
              r={isTarget ? 14 : 10}
              stroke={isTarget ? '#f59e0b' : '#22d3ee'}
              strokeWidth={isTarget ? 2 : 1}
              fill="none"
              opacity={0.6}
            />
          </g>
        );
      })}
      {sigilPoints.length > 1 && (
        <polyline
          points={sigilPoints.map(p => `${projectX(p.x)},${projectY(p.y)}`).join(' ')}
          fill="none"
          stroke="#6ee7b7"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
      )}
    </svg>
  );
};

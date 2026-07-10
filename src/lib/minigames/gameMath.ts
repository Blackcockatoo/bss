/**
 * Game Math Core — the single source of truth that wires every mini-game
 * into the meta-pet's growth.
 *
 * Two jobs:
 *  1. Difficulty scaling: the pet's evolution stage + level drive how hard
 *     each game plays (sequence lengths, tempo, question families, tetris
 *     starting level).
 *  2. Reward consistency: every game routes its session result through
 *     `computeGameReward`, so XP, vitals boosts, and essence always follow
 *     the same curve no matter which game was played.
 */

import type { EvolutionData, EvolutionState } from '../../evolution/types';

// ===== SEEDED RNG =====

/** Deterministic xorshift32 RNG in [0, 1). Genome seeds keep games personal to each pet. */
export function createSeededRng(seed: number): () => number {
  let state = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  if (state === 0) state = 0x1badb002;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

// ===== DIFFICULTY SCALING =====

export type DifficultyTier = 1 | 2 | 3 | 4;

export const STAGE_TIER: Record<EvolutionState, DifficultyTier> = {
  GENETICS: 1,
  NEURO: 2,
  QUANTUM: 3,
  SPECIATION: 4,
};

export const TIER_LABELS: Record<DifficultyTier, string> = {
  1: 'Genetic Patterns',
  2: 'Neural Weaves',
  3: 'Quantum Flows',
  4: 'Speciation Trials',
};

export interface MemoryDifficulty {
  /** Number of sigil pads in the ring. */
  padCount: number;
  /** Sequence length of the first round. */
  startLength: number;
  /** How long each pad flashes when the sequence is shown. */
  showMs: number;
  /** Retries before the run ends. */
  focusShards: number;
}

export interface RhythmDifficulty {
  bpm: number;
  beats: number;
  /** Timing windows as a fraction of the beat period. */
  perfectWindow: number;
  goodWindow: number;
}

export interface SigilDifficulty {
  questions: number;
  families: SequenceFamily[];
  /** Visible terms before the blank. */
  visibleTerms: number;
}

export interface VimanaDifficulty {
  startLevel: number;
}

export interface GameDifficulty {
  tier: DifficultyTier;
  stage: EvolutionState;
  level: number;
  memory: MemoryDifficulty;
  rhythm: RhythmDifficulty;
  sigil: SigilDifficulty;
  vimana: VimanaDifficulty;
}

/**
 * Derive the whole suite's difficulty from the pet's evolution.
 * Stage sets the tier; level adds a slow creep inside the tier.
 */
export function getGameDifficulty(
  evolution: Pick<EvolutionData, 'state' | 'level'>
): GameDifficulty {
  const tier = STAGE_TIER[evolution.state] ?? 1;
  const level = Math.max(1, evolution.level);
  const levelBoost = Math.min(10, Math.floor(level / 3));

  return {
    tier,
    stage: evolution.state,
    level,
    memory: {
      padCount: Math.min(7, 3 + tier),
      startLength: 2 + tier,
      showMs: Math.max(400, 880 - tier * 80 - levelBoost * 20),
      focusShards: 2,
    },
    rhythm: {
      bpm: Math.min(144, 64 + tier * 12 + levelBoost * 2),
      beats: 12 + tier * 4,
      perfectWindow: 0.1,
      goodWindow: 0.22,
    },
    sigil: {
      questions: 5 + tier,
      families: SIGIL_FAMILIES_BY_TIER[tier],
      visibleTerms: 4,
    },
    vimana: {
      startLevel: tier,
    },
  };
}

// ===== SIGIL SEQUENCE (math) GENERATION =====

export type SequenceFamily =
  | 'arithmetic'
  | 'square'
  | 'fibonacci'
  | 'triangular'
  | 'lucas'
  | 'primes'
  | 'geometric'
  | 'golden';

const SIGIL_FAMILIES_BY_TIER: Record<DifficultyTier, SequenceFamily[]> = {
  1: ['arithmetic', 'square', 'fibonacci'],
  2: ['arithmetic', 'square', 'fibonacci', 'triangular', 'lucas'],
  3: ['fibonacci', 'triangular', 'lucas', 'primes', 'geometric'],
  4: ['fibonacci', 'lucas', 'primes', 'geometric', 'golden'],
};

export const FAMILY_LORE: Record<SequenceFamily, string> = {
  arithmetic: 'Each term climbs by the same step.',
  square: 'Each term is a square number: n × n.',
  fibonacci: 'Each term is the sum of the two before it — the Fibonacci flow.',
  triangular: 'Stack dots in triangles: 1, 3, 6, 10… each row adds one more.',
  lucas: 'The Lucas current: starts 2, 1 — then each term is the sum of the two before.',
  primes: 'Only primes flow here — numbers divisible by 1 and themselves alone.',
  geometric: 'Each term multiplies by the same ratio.',
  golden: 'A golden weave: any two seeds, then every term is the sum of the two before.',
};

export interface SigilQuestion {
  family: SequenceFamily;
  /** Terms shown to the player; the blank is at the end. */
  visible: number[];
  answer: number;
  options: number[];
  lore: string;
}

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];

function generateFamilyTerms(
  family: SequenceFamily,
  count: number,
  rng: () => number
): number[] {
  switch (family) {
    case 'arithmetic': {
      const start = 1 + Math.floor(rng() * 9);
      const step = 2 + Math.floor(rng() * 8);
      return Array.from({ length: count }, (_, i) => start + step * i);
    }
    case 'square': {
      const offset = 1 + Math.floor(rng() * 4);
      return Array.from({ length: count }, (_, i) => (offset + i) ** 2);
    }
    case 'triangular': {
      const offset = 1 + Math.floor(rng() * 4);
      return Array.from({ length: count }, (_, i) => {
        const n = offset + i;
        return (n * (n + 1)) / 2;
      });
    }
    case 'fibonacci': {
      const startIndex = Math.floor(rng() * 4);
      const fib = [1, 1];
      while (fib.length < startIndex + count) {
        fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
      }
      return fib.slice(startIndex, startIndex + count);
    }
    case 'lucas': {
      const startIndex = Math.floor(rng() * 3);
      const lucas = [2, 1];
      while (lucas.length < startIndex + count) {
        lucas.push(lucas[lucas.length - 1] + lucas[lucas.length - 2]);
      }
      return lucas.slice(startIndex, startIndex + count);
    }
    case 'primes': {
      const startIndex = Math.floor(rng() * (PRIMES.length - count));
      return PRIMES.slice(startIndex, startIndex + count);
    }
    case 'geometric': {
      const start = 1 + Math.floor(rng() * 3);
      const ratio = 2 + Math.floor(rng() * 2);
      return Array.from({ length: count }, (_, i) => start * ratio ** i);
    }
    case 'golden': {
      const a = 1 + Math.floor(rng() * 5);
      const b = 1 + Math.floor(rng() * 5);
      const terms = [a, b];
      while (terms.length < count) {
        terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
      }
      return terms;
    }
  }
}

function buildOptions(answer: number, rng: () => number): number[] {
  const options = new Set<number>([answer]);
  const spreads = [
    answer + 1 + Math.floor(rng() * 4),
    Math.max(1, answer - 1 - Math.floor(rng() * 4)),
    answer * 2,
    Math.max(1, Math.round(answer / 2)),
    answer + 10,
  ];
  for (const candidate of spreads) {
    if (options.size >= 4) break;
    if (candidate !== answer && candidate > 0) {
      options.add(candidate);
    }
  }
  // Extremely small answers can exhaust the spread list; pad upward.
  let filler = answer + 3;
  while (options.size < 4) {
    options.add(filler);
    filler += 2;
  }
  return shuffle([...options], rng);
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Generate one Sigil Sequence question for the given difficulty. */
export function generateSigilQuestion(
  difficulty: SigilDifficulty,
  rng: () => number
): SigilQuestion {
  const family =
    difficulty.families[Math.floor(rng() * difficulty.families.length)];
  const terms = generateFamilyTerms(family, difficulty.visibleTerms + 1, rng);
  const visible = terms.slice(0, difficulty.visibleTerms);
  const answer = terms[difficulty.visibleTerms];

  return {
    family,
    visible,
    answer,
    options: buildOptions(answer, rng),
    lore: FAMILY_LORE[family],
  };
}

// ===== UNIFIED REWARD PIPELINE =====

export type MiniGameKind = 'memory' | 'rhythm' | 'sigil' | 'vimana' | 'companion';

export interface MiniGameSessionResult {
  game: MiniGameKind;
  /** Game-native score. Memory: total sequence steps recalled. Rhythm: hits + perfect bonus. Sigil: points with streak multiplier. */
  score: number;
  /** 0-100 where the game tracks it (rhythm timing, sigil correctness). */
  accuracy?: number;
  /** Best combo/streak within the run. */
  combo?: number;
  /** Memory: rounds fully completed. */
  roundsCompleted?: number;
  /** Sigil: correct answers this run. */
  correctAnswers?: number;
  /** Vimana passthroughs. */
  lines?: number;
  level?: number;
  /** Companion game flavor: 'sigil-pattern' | 'trivia' | 'snake'. */
  detail?: string;
}

export interface VitalsDelta {
  mood?: number;
  energy?: number;
  hygiene?: number;
}

export interface GameReward {
  xp: number;
  vitals: VitalsDelta;
  essence: number;
  message: string;
}

const BASE_XP: Record<MiniGameKind, number> = {
  memory: 6,
  rhythm: 6,
  sigil: 8,
  vimana: 8,
  companion: 4,
};

/**
 * One reward curve for every game. Higher evolution tiers raise the XP cap so
 * play stays meaningful against the level curve (10 × level²) as the pet grows.
 */
export function computeGameReward(
  result: MiniGameSessionResult,
  evolution: Pick<EvolutionData, 'state' | 'level'>
): GameReward {
  const tier = STAGE_TIER[evolution.state] ?? 1;
  const xpCap = 10 + tier * 5;

  let performanceXp = 0;
  let vitals: VitalsDelta = {};
  let message = '';

  switch (result.game) {
    case 'memory': {
      const rounds = result.roundsCompleted ?? 0;
      performanceXp = rounds * 2;
      vitals = { mood: Math.min(12, 4 + rounds * 2) };
      message = `Memory Shuffle: ${rounds} rounds woven, score ${result.score}.`;
      break;
    }
    case 'rhythm': {
      const accuracy = result.accuracy ?? 0;
      const combo = result.combo ?? 0;
      performanceXp = Math.floor(accuracy / 12) + Math.floor(combo / 4);
      vitals = {
        energy: Math.min(12, 3 + Math.floor(accuracy / 12)),
        mood: Math.min(6, Math.floor(combo / 3)),
      };
      message = `Rhythm Pulse: ${accuracy.toFixed(0)}% sync, best combo ${combo}.`;
      break;
    }
    case 'sigil': {
      const correct = result.correctAnswers ?? 0;
      const perfect = (result.accuracy ?? 0) >= 100;
      performanceXp = correct * 2 + (perfect ? 3 : 0);
      vitals = {
        mood: Math.min(10, 2 + correct),
        energy: Math.min(4, Math.floor(correct / 2)),
      };
      message = perfect
        ? `Sigil Sequence: flawless — every pattern named.`
        : `Sigil Sequence: ${correct} patterns named, score ${result.score}.`;
      break;
    }
    case 'vimana': {
      const lines = result.lines ?? 0;
      const level = result.level ?? 1;
      performanceXp = Math.floor(lines / 2) + level;
      vitals = {
        mood: Math.min(10, Math.floor(lines / 2) + 2),
        energy: Math.min(8, level * 2),
      };
      message = `Vimana field stabilized: ${lines} lines at level ${level}.`;
      break;
    }
    case 'companion': {
      performanceXp = Math.min(6, Math.floor(result.score / 8));
      vitals = { mood: 4 };
      message = `Companion play: ${result.detail ?? 'game'} won.`;
      break;
    }
  }

  const hasProgress = result.score > 0 || performanceXp > 0;
  const xp = hasProgress
    ? Math.min(xpCap, Math.max(3, BASE_XP[result.game] + performanceXp))
    : 0;

  return {
    xp,
    vitals: hasProgress ? vitals : {},
    essence: Math.floor(xp / 3),
    message,
  };
}

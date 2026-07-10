/**
 * Skill Ranks, Grades & Mastery — the premium progression layer.
 *
 * Ranks are earned, not selected freely: each game's higher ranks unlock by
 * proving skill at the previous ones (gates read the same MiniGameProgress
 * stats the achievements use, so unlocks can never drift from real play).
 * Higher ranks harden the game and multiply the score — risk for reward.
 */

import type { MiniGameProgress } from '../../progression/types';
import type { GameDifficulty } from './gameMath';

// ===== RANKS =====

export type GameRank = 'calm' | 'flow' | 'surge' | 'mythic';
export type RankedGame = 'memory' | 'rhythm' | 'sigil' | 'vimana';

export const RANK_ORDER: GameRank[] = ['calm', 'flow', 'surge', 'mythic'];

export interface RankInfo {
  label: string;
  tagline: string;
  /** In-game score multiplier — shown on the rank chip and applied by each game. */
  scoreMult: number;
  color: string;
}

export const RANK_INFO: Record<GameRank, RankInfo> = {
  calm: {
    label: 'Calm',
    tagline: 'The baseline current. Learn the shape of the game.',
    scoreMult: 1,
    color: '#34d399',
  },
  flow: {
    label: 'Flow',
    tagline: 'Faster, longer, sharper. Rewards begin to swell.',
    scoreMult: 1.25,
    color: '#22d3ee',
  },
  surge: {
    label: 'Surge',
    tagline: 'The field pushes back. Only practiced hands hold on.',
    scoreMult: 1.5,
    color: '#a78bfa',
  },
  mythic: {
    label: 'Mythic',
    tagline: 'The pet remembers those who clear this.',
    scoreMult: 2,
    color: '#fbbf24',
  },
};

export const rankIndex = (rank: GameRank): number => RANK_ORDER.indexOf(rank);

// ===== UNLOCK GATES =====

interface RankGate {
  isMet: (p: MiniGameProgress) => boolean;
  hint: string;
}

/** Gates for flow → surge → mythic (calm is always open). */
const RANK_GATES: Record<RankedGame, [RankGate, RankGate, RankGate]> = {
  memory: [
    {
      isMet: (p) => p.shuffleBestRound >= 3,
      hint: 'Fully recall 3 rounds in one run',
    },
    {
      isMet: (p) => p.shuffleBestRound >= 6,
      hint: 'Fully recall 6 rounds in one run',
    },
    {
      isMet: (p) => p.shuffleBestRound >= 9,
      hint: 'Fully recall 9 rounds in one run',
    },
  ],
  rhythm: [
    {
      isMet: (p) => p.pulseBestAccuracy >= 55,
      hint: 'Finish a run at 55% sync',
    },
    {
      isMet: (p) => p.pulseBestAccuracy >= 75,
      hint: 'Finish a run at 75% sync',
    },
    {
      isMet: (p) => p.pulseBestAccuracy >= 90 && p.pulseBestCombo >= 10,
      hint: 'Hit 90% sync with a 10-beat combo',
    },
  ],
  sigil: [
    {
      isMet: (p) => p.sigilTotalCorrect >= 12,
      hint: 'Name 12 patterns in total',
    },
    {
      isMet: (p) => p.sigilHighScore >= 70,
      hint: 'Score 70 in a single run',
    },
    {
      isMet: (p) => p.sigilHighScore >= 110,
      hint: 'Score 110 in a single run',
    },
  ],
  vimana: [
    {
      isMet: (p) => p.vimanaMaxLines >= 8,
      hint: 'Clear 8 lines in one run',
    },
    {
      isMet: (p) => p.vimanaHighScore >= 1500,
      hint: 'Score 1,500 in one run',
    },
    {
      isMet: (p) => p.vimanaMaxLevel >= 6,
      hint: 'Reach level 6',
    },
  ],
};

export function isRankUnlocked(
  game: RankedGame,
  rank: GameRank,
  progress: MiniGameProgress,
): boolean {
  const index = rankIndex(rank);
  if (index <= 0) return true;
  return RANK_GATES[game][(index - 1) as 0 | 1 | 2].isMet(progress);
}

export function getUnlockedRanks(
  game: RankedGame,
  progress: MiniGameProgress,
): GameRank[] {
  return RANK_ORDER.filter((rank) => isRankUnlocked(game, rank, progress));
}

export function highestUnlockedRank(
  game: RankedGame,
  progress: MiniGameProgress,
): GameRank {
  const unlocked = getUnlockedRanks(game, progress);
  return unlocked[unlocked.length - 1] ?? 'calm';
}

export function getRankUnlockHint(game: RankedGame, rank: GameRank): string {
  const index = rankIndex(rank);
  if (index <= 0) return '';
  return RANK_GATES[game][(index - 1) as 0 | 1 | 2].hint;
}

// ===== RANK DIFFICULTY MODIFIERS =====

/**
 * Harden an evolution-derived difficulty for the chosen rank.
 * Evolution sets the floor; rank raises the ceiling.
 */
export function applyRankToDifficulty(
  base: GameDifficulty,
  rank: GameRank,
): GameDifficulty {
  const index = rankIndex(rank);
  if (index <= 0) return base;

  return {
    ...base,
    memory: {
      ...base.memory,
      startLength: base.memory.startLength + index,
      showMs: Math.max(300, Math.round(base.memory.showMs * (1 - index * 0.12))),
      focusShards: rank === 'mythic' ? 1 : base.memory.focusShards,
    },
    rhythm: {
      ...base.rhythm,
      bpm: Math.min(180, base.rhythm.bpm + index * 10),
      beats: base.rhythm.beats + index * 4,
      perfectWindow: base.rhythm.perfectWindow * (1 - index * 0.1),
      goodWindow: base.rhythm.goodWindow * (1 - index * 0.1),
    },
    sigil: {
      ...base.sigil,
      questions: base.sigil.questions + index,
    },
    vimana: {
      ...base.vimana,
      startLevel: base.vimana.startLevel + index,
    },
  };
}

// ===== GRADES =====

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export const GRADE_COLORS: Record<Grade, string> = {
  S: '#fbbf24',
  A: '#34d399',
  B: '#22d3ee',
  C: '#a78bfa',
  D: '#64748b',
};

export const GRADE_LINES: Record<Grade, string> = {
  S: 'Flawless resonance. The field bends to you.',
  A: 'Brilliant run — the pet hums with pride.',
  B: 'Strong current. The pattern is almost yours.',
  C: 'A steady step. Growth is compounding.',
  D: 'The field slipped away — every attempt still feeds the bond.',
};

interface GradeInput {
  game: RankedGame | 'companion';
  score: number;
  accuracy?: number;
  roundsCompleted?: number;
  lines?: number;
}

function gradeFromScale(value: number, scale: [number, number, number, number]): Grade {
  if (value >= scale[0]) return 'S';
  if (value >= scale[1]) return 'A';
  if (value >= scale[2]) return 'B';
  if (value >= scale[3]) return 'C';
  return 'D';
}

export function getGrade(input: GradeInput): Grade {
  switch (input.game) {
    case 'memory':
      return gradeFromScale(input.roundsCompleted ?? 0, [8, 6, 4, 2]);
    case 'rhythm':
      return gradeFromScale(input.accuracy ?? 0, [92, 80, 65, 45]);
    case 'sigil':
      return gradeFromScale(input.accuracy ?? 0, [100, 85, 70, 50]);
    case 'vimana':
      return gradeFromScale(input.lines ?? 0, [20, 12, 6, 2]);
    default:
      return input.score > 0 ? 'B' : 'D';
  }
}

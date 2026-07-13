// The canonical Vimana overworld model (VimanaNode, VimanaState v2, save
// migration, deterministic routes) lives in ./vimana and is re-exported here
// so existing '@/lib/progression/types' importers keep working.
export * from './vimana';
export type { VimanaFieldType as VimanaField } from './vimana';

export interface BattleStats {
  wins: number;
  losses: number;
  streak: number;
  energyShield: number;
  lastResult: 'win' | 'loss' | null;
  lastOpponent: string | null;
}

export interface MiniGameProgress {
  memoryHighScore: number;
  rhythmHighScore: number;
  focusStreak: number;
  vimanaHighScore: number;
  vimanaMaxLines: number;
  vimanaMaxLevel: number;
  vimanaLastScore: number;
  vimanaLastLines: number;
  vimanaLastLevel: number;
  lastPlayedAt: number | null;
  /** Memory Shuffle: most rounds fully recalled in one run. */
  shuffleBestRound: number;
  /** Rhythm Pulse: best combo and best timing accuracy (0-100). */
  pulseBestCombo: number;
  pulseBestAccuracy: number;
  /** Sigil Sequence: best run score, best streak, and lifetime correct answers. */
  sigilHighScore: number;
  sigilBestStreak: number;
  sigilTotalCorrect: number;
  /** Wins from the companion's bond games (sigil pattern, trivia, snake). */
  companionWins: number;
  /** Lifetime completed game sessions across the whole suite. */
  totalPlays: number;
  /** Runs completed at the Mythic skill rank. */
  mythicClears: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt?: number;
  category?: 'vitals' | 'evolution' | 'battle' | 'exploration' | 'social' | 'minigame' | 'breeding';
}

export const ACHIEVEMENT_TARGETS = {
  'explorer-first-step': 1,
  'explorer-anomaly-hunter': 3,
  'battle-first-win': 1,
  'battle-streak': 3,
  'minigame-memory': 10,
  'minigame-rhythm': 12,
  'minigame-vimana-score': 1500,
  'minigame-vimana-lines': 20,
  'breeding-first': 1,
  'minigame-memory-ace': 20,
  'minigame-rhythm-ace': 15,
  'minigame-vimana-level': 5,
  'minigame-focus-streak': 5,
  'minigame-shuffle-adept': 6,
  'minigame-pulse-flow': 12,
  'minigame-pulse-perfect': 95,
  'minigame-sigil-scholar': 70,
  'minigame-sigil-sage': 60,
  'minigame-arcade-devotee': 30,
  'minigame-companion-playmate': 10,
  'minigame-mythic-clear': 1,
  'minigame-star-collector': 8,
  'minigame-grandmaster': 16,
} as const;

export const ACHIEVEMENT_CATALOG: Achievement[] = [
  {
    id: 'explorer-first-step',
    title: 'First Step',
    description: 'Discover your first Vimana field cell.',
    category: 'exploration',
  },
  {
    id: 'explorer-anomaly-hunter',
    title: 'Anomaly Hunter',
    description: `Resolve ${ACHIEVEMENT_TARGETS['explorer-anomaly-hunter']} anomalies on the Vimana grid.`,
    category: 'exploration',
  },
  {
    id: 'battle-first-win',
    title: 'First Victory',
    description: 'Win your first consciousness duel.',
    category: 'battle',
  },
  {
    id: 'battle-streak',
    title: 'Momentum Rising',
    description: `Achieve a win streak of ${ACHIEVEMENT_TARGETS['battle-streak']} battles.`,
    category: 'battle',
  },
  {
    id: 'minigame-memory',
    title: 'Pattern Master',
    description: `Score ${ACHIEVEMENT_TARGETS['minigame-memory']} or more in the memory mini-game.`,
    category: 'minigame',
  },
  {
    id: 'minigame-rhythm',
    title: 'Rhythm Weaver',
    description: `Hit a rhythm score of ${ACHIEVEMENT_TARGETS['minigame-rhythm']} or higher.`,
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-score',
    title: 'Grid Navigator',
    description: `Score ${ACHIEVEMENT_TARGETS['minigame-vimana-score'].toLocaleString()} or more in the Vimana Tetris field.`,
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-lines',
    title: 'Line Harmonizer',
    description: `Clear ${ACHIEVEMENT_TARGETS['minigame-vimana-lines']} lines in a single Vimana Tetris run.`,
    category: 'minigame',
  },
  {
    id: 'breeding-first',
    title: 'New Lineage',
    description: 'Breed two pets to create a new companion.',
    category: 'breeding',
  },
  {
    id: 'evolve-neuro',
    title: 'Neural Awakening',
    description: 'Evolve into the NEURO stage.',
    category: 'evolution',
  },
  {
    id: 'evolve-quantum',
    title: 'Quantum Leap',
    description: 'Evolve into the QUANTUM stage.',
    category: 'evolution',
  },
  {
    id: 'evolve-speciation',
    title: 'Apex Form',
    description: 'Reach SPECIATION and take your branch apex form.',
    category: 'evolution',
  },
  // Additional achievable mini-game milestones
  {
    id: 'minigame-memory-ace',
    title: 'Memory Ace',
    description: `Score ${ACHIEVEMENT_TARGETS['minigame-memory-ace']} or more in the memory mini-game.`,
    category: 'minigame',
  },
  {
    id: 'minigame-rhythm-ace',
    title: 'Rhythm Ace',
    description: `Hit a rhythm score of ${ACHIEVEMENT_TARGETS['minigame-rhythm-ace']} or higher.`,
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-level',
    title: 'Sky Climber',
    description: `Reach level ${ACHIEVEMENT_TARGETS['minigame-vimana-level']} in Vimana Tetris.`,
    category: 'minigame',
  },
  {
    id: 'minigame-focus-streak',
    title: 'Focused Explorer',
    description: `Build a focus streak of ${ACHIEVEMENT_TARGETS['minigame-focus-streak']} mini-game runs.`,
    category: 'minigame',
  },
  // Rebuilt game-suite achievements
  {
    id: 'minigame-shuffle-adept',
    title: 'Shuffle Adept',
    description: `Fully recall ${ACHIEVEMENT_TARGETS['minigame-shuffle-adept']} rounds in one Memory Shuffle run.`,
    category: 'minigame',
  },
  {
    id: 'minigame-pulse-flow',
    title: 'Pulse Flow',
    description: `Chain a ${ACHIEVEMENT_TARGETS['minigame-pulse-flow']}-beat combo in Rhythm Pulse.`,
    category: 'minigame',
  },
  {
    id: 'minigame-pulse-perfect',
    title: 'Pulse Perfect',
    description: `Finish a Rhythm Pulse run at ${ACHIEVEMENT_TARGETS['minigame-pulse-perfect']}% timing accuracy or better.`,
    category: 'minigame',
  },
  {
    id: 'minigame-sigil-scholar',
    title: 'Sigil Scholar',
    description: `Score ${ACHIEVEMENT_TARGETS['minigame-sigil-scholar']} or more in a single Sigil Sequence run.`,
    category: 'minigame',
  },
  {
    id: 'minigame-sigil-sage',
    title: 'Sequence Sage',
    description: `Name ${ACHIEVEMENT_TARGETS['minigame-sigil-sage']} number patterns correctly across all Sigil Sequence runs.`,
    category: 'minigame',
  },
  {
    id: 'minigame-arcade-devotee',
    title: 'Arcade Devotee',
    description: `Complete ${ACHIEVEMENT_TARGETS['minigame-arcade-devotee']} game sessions across the suite.`,
    category: 'minigame',
  },
  {
    id: 'minigame-companion-playmate',
    title: 'Companion Playmate',
    description: `Win ${ACHIEVEMENT_TARGETS['minigame-companion-playmate']} bond games with your companion.`,
    category: 'minigame',
  },
  {
    id: 'minigame-mythic-clear',
    title: 'Mythic Clear',
    description: 'Complete a run at the Mythic skill rank.',
    category: 'minigame',
  },
  {
    id: 'minigame-star-collector',
    title: 'Star Collector',
    description: `Earn ${ACHIEVEMENT_TARGETS['minigame-star-collector']} mastery stars across the arcade.`,
    category: 'minigame',
  },
  {
    id: 'minigame-grandmaster',
    title: 'Arcade Grandmaster',
    description: `Earn ${ACHIEVEMENT_TARGETS['minigame-grandmaster']} of the arcade's 20 mastery stars.`,
    category: 'minigame',
  },
];

// ===== MASTERY STARS =====

export type MasteryGame = 'memory' | 'rhythm' | 'sigil' | 'vimana';

export interface MasteryTrack {
  label: string;
  getValue: (progress: MiniGameProgress) => number;
  /** Five ascending thresholds — one per star. */
  thresholds: [number, number, number, number, number];
}

/**
 * Five mastery stars per game, 20 total. Stars are derived from lifetime
 * stats, never stored — they can't drift from real play.
 */
export const MASTERY_TRACKS: Record<MasteryGame, MasteryTrack> = {
  memory: {
    label: 'Best round fully recalled',
    getValue: (p) => p.shuffleBestRound,
    thresholds: [2, 4, 6, 8, 11],
  },
  rhythm: {
    label: 'Best timing accuracy',
    getValue: (p) => p.pulseBestAccuracy,
    thresholds: [40, 60, 75, 88, 95],
  },
  sigil: {
    label: 'Patterns named in total',
    getValue: (p) => p.sigilTotalCorrect,
    thresholds: [10, 25, 45, 70, 100],
  },
  vimana: {
    label: 'Most lines in one run',
    getValue: (p) => p.vimanaMaxLines,
    thresholds: [4, 8, 14, 20, 28],
  },
};

export function getMasteryStars(progress: MiniGameProgress, game: MasteryGame): number {
  const track = MASTERY_TRACKS[game];
  const value = track.getValue(progress);
  return track.thresholds.filter((threshold) => value >= threshold).length;
}

export function getTotalMasteryStars(progress: MiniGameProgress): number {
  return (Object.keys(MASTERY_TRACKS) as MasteryGame[]).reduce(
    (total, game) => total + getMasteryStars(progress, game),
    0,
  );
}

/**
 * Single source of truth for how mini-game progress maps to achievement
 * targets. The store uses it to unlock; the achievements panel uses it to
 * render progress bars — keeping both consistent by construction.
 */
export const MINIGAME_ACHIEVEMENT_CHECKS: ReadonlyArray<{
  id: keyof typeof ACHIEVEMENT_TARGETS;
  getProgress: (progress: MiniGameProgress) => number;
}> = [
  { id: 'minigame-memory', getProgress: (p) => p.memoryHighScore },
  { id: 'minigame-memory-ace', getProgress: (p) => p.memoryHighScore },
  { id: 'minigame-rhythm', getProgress: (p) => p.rhythmHighScore },
  { id: 'minigame-rhythm-ace', getProgress: (p) => p.rhythmHighScore },
  { id: 'minigame-vimana-score', getProgress: (p) => p.vimanaHighScore },
  { id: 'minigame-vimana-lines', getProgress: (p) => p.vimanaMaxLines },
  { id: 'minigame-vimana-level', getProgress: (p) => p.vimanaMaxLevel },
  { id: 'minigame-focus-streak', getProgress: (p) => p.focusStreak },
  { id: 'minigame-shuffle-adept', getProgress: (p) => p.shuffleBestRound },
  { id: 'minigame-pulse-flow', getProgress: (p) => p.pulseBestCombo },
  { id: 'minigame-pulse-perfect', getProgress: (p) => p.pulseBestAccuracy },
  { id: 'minigame-sigil-scholar', getProgress: (p) => p.sigilHighScore },
  { id: 'minigame-sigil-sage', getProgress: (p) => p.sigilTotalCorrect },
  { id: 'minigame-arcade-devotee', getProgress: (p) => p.totalPlays },
  { id: 'minigame-companion-playmate', getProgress: (p) => p.companionWins },
  { id: 'minigame-mythic-clear', getProgress: (p) => p.mythicClears },
  { id: 'minigame-star-collector', getProgress: getTotalMasteryStars },
  { id: 'minigame-grandmaster', getProgress: getTotalMasteryStars },
];

export interface CreateBattleStatsOptions {
  energyShield?: number;
  lastResult?: 'win' | 'loss' | null;
  lastOpponent?: string | null;
}

export function createDefaultBattleStats(options: CreateBattleStatsOptions = {}): BattleStats {
  return {
    wins: 0,
    losses: 0,
    streak: 0,
    energyShield: options.energyShield ?? 25,
    lastResult: options.lastResult ?? null,
    lastOpponent: options.lastOpponent ?? null,
  };
}

export function createDefaultMiniGameProgress(overrides: Partial<MiniGameProgress> = {}): MiniGameProgress {
  return {
    memoryHighScore: 0,
    rhythmHighScore: 0,
    focusStreak: 0,
    vimanaHighScore: 0,
    vimanaMaxLines: 0,
    vimanaMaxLevel: 0,
    vimanaLastScore: 0,
    vimanaLastLines: 0,
    vimanaLastLevel: 0,
    lastPlayedAt: null,
    shuffleBestRound: 0,
    pulseBestCombo: 0,
    pulseBestAccuracy: 0,
    sigilHighScore: 0,
    sigilBestStreak: 0,
    sigilTotalCorrect: 0,
    companionWins: 0,
    totalPlays: 0,
    mythicClears: 0,
    ...overrides,
  };
}

/**
 * MetaPetProgress — the single persistent source of truth for every wardrobe
 * unlock condition.
 *
 * The live gameplay store (@/lib/store) is authoritative *while it is
 * running*, but it is not persisted; this module folds live snapshots into a
 * durable, monotonic progress record so earned milestones survive reloads.
 * Counters only ever go up, sets only ever grow, and the evolution stage
 * keeps the highest stage ever reached.
 */

import { EVOLUTION_ORDER } from '@/lib/evolution';
import type {
  Achievement,
  BattleStats,
  MiniGameProgress,
  VimanaState,
} from '@/lib/progression/types';
import { discoveryStageRank } from '@/lib/progression/types';

export const METAPET_PROGRESS_VERSION = 1;

/** Energy level the sustained-energy tracker measures against. */
export const HIGH_ENERGY_THRESHOLD = 90;

export interface MetaPetProgress {
  version: number;

  evolution: {
    currentStage: string;
    highestStageReached: string;
  };

  battle: {
    wins: number;
    losses: number;
    totalBattles: number;
  };

  vimana: {
    samplesCollected: number;
    cellsExplored: number;
    anomaliesResolved: number;
    totalCells: number;
  };

  miniGames: {
    totalCompleted: number;
    totalPlayed: number;
    uniqueGamesCompleted: string[];
  };

  breeding: {
    offspringCount: number;
  };

  care: {
    totalFeeds: number;
    totalCleans: number;
    totalPlaySessions: number;
    totalSleepSessions: number;
    trustMilestones: number[];
  };

  sustainedConditions: {
    highEnergyStartedAt?: number;
    longestHighEnergyDurationMs: number;
    /** Heartbeat of the last live energy observation; guards refresh gaps. */
    lastEnergyObservedAt?: number;
  };

  achievements: {
    unlockedIds: string[];
  };

  discoveries: {
    discoveredIds: string[];
  };
}

/** Narrow view of the live game state the progress merge reads from. */
export interface LiveProgressSnapshot {
  evolutionStage: string;
  battle: Pick<BattleStats, 'wins' | 'losses'>;
  vimana: {
    samplesCollected: number;
    cellsExplored: number;
    anomaliesResolved: number;
    totalCells: number;
    discoveredIds: string[];
  };
  miniGames: {
    totalCompleted: number;
    uniqueGamesCompleted: string[];
  };
  achievementIds: string[];
}

export function createDefaultMetaPetProgress(): MetaPetProgress {
  return {
    version: METAPET_PROGRESS_VERSION,
    evolution: {
      currentStage: EVOLUTION_ORDER[0],
      highestStageReached: EVOLUTION_ORDER[0],
    },
    battle: { wins: 0, losses: 0, totalBattles: 0 },
    vimana: {
      samplesCollected: 0,
      cellsExplored: 0,
      anomaliesResolved: 0,
      totalCells: 0,
    },
    miniGames: {
      totalCompleted: 0,
      totalPlayed: 0,
      uniqueGamesCompleted: [],
    },
    breeding: { offspringCount: 0 },
    care: {
      totalFeeds: 0,
      totalCleans: 0,
      totalPlaySessions: 0,
      totalSleepSessions: 0,
      trustMilestones: [],
    },
    sustainedConditions: { longestHighEnergyDurationMs: 0 },
    achievements: { unlockedIds: [] },
    discoveries: { discoveredIds: [] },
  };
}

export function evolutionStageRank(stage: string): number {
  const rank = (EVOLUTION_ORDER as readonly string[]).indexOf(stage);
  return rank === -1 ? 0 : rank;
}

function toCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))];
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (entry): entry is number =>
          typeof entry === 'number' && Number.isFinite(entry),
      ),
    ),
  ];
}

function toOptionalTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return value;
}

/**
 * Normalizes any persisted value (old versions, corrupted storage, partial
 * saves) into a complete, well-formed MetaPetProgress. Never throws.
 */
export function sanitizeMetaPetProgress(raw: unknown): MetaPetProgress {
  const defaults = createDefaultMetaPetProgress();
  if (typeof raw !== 'object' || raw === null) return defaults;

  const source = raw as Record<string, Record<string, unknown> | undefined>;
  const evolution = source.evolution ?? {};
  const battle = source.battle ?? {};
  const vimana = source.vimana ?? {};
  const miniGames = source.miniGames ?? {};
  const breeding = source.breeding ?? {};
  const care = source.care ?? {};
  const sustained = source.sustainedConditions ?? {};
  const achievements = source.achievements ?? {};
  const discoveries = source.discoveries ?? {};

  const currentStage =
    typeof evolution.currentStage === 'string' && evolution.currentStage
      ? evolution.currentStage
      : defaults.evolution.currentStage;
  const highestCandidate =
    typeof evolution.highestStageReached === 'string' &&
    evolution.highestStageReached
      ? evolution.highestStageReached
      : currentStage;
  const highestStageReached =
    evolutionStageRank(highestCandidate) >= evolutionStageRank(currentStage)
      ? highestCandidate
      : currentStage;

  const wins = toCount(battle.wins);
  const losses = toCount(battle.losses);

  return {
    version: METAPET_PROGRESS_VERSION,
    evolution: { currentStage, highestStageReached },
    battle: {
      wins,
      losses,
      totalBattles: Math.max(toCount(battle.totalBattles), wins + losses),
    },
    vimana: {
      samplesCollected: toCount(vimana.samplesCollected),
      cellsExplored: toCount(vimana.cellsExplored),
      anomaliesResolved: toCount(vimana.anomaliesResolved),
      totalCells: toCount(vimana.totalCells),
    },
    miniGames: {
      totalCompleted: toCount(miniGames.totalCompleted),
      totalPlayed: Math.max(
        toCount(miniGames.totalPlayed),
        toCount(miniGames.totalCompleted),
      ),
      uniqueGamesCompleted: toStringArray(miniGames.uniqueGamesCompleted),
    },
    breeding: { offspringCount: toCount(breeding.offspringCount) },
    care: {
      totalFeeds: toCount(care.totalFeeds),
      totalCleans: toCount(care.totalCleans),
      totalPlaySessions: toCount(care.totalPlaySessions),
      totalSleepSessions: toCount(care.totalSleepSessions),
      trustMilestones: toNumberArray(care.trustMilestones),
    },
    sustainedConditions: {
      highEnergyStartedAt: toOptionalTimestamp(sustained.highEnergyStartedAt),
      longestHighEnergyDurationMs: toCount(
        sustained.longestHighEnergyDurationMs,
      ),
      lastEnergyObservedAt: toOptionalTimestamp(sustained.lastEnergyObservedAt),
    },
    achievements: { unlockedIds: toStringArray(achievements.unlockedIds) },
    discoveries: { discoveredIds: toStringArray(discoveries.discoveredIds) },
  };
}

function unionSorted(existing: string[], incoming: string[]): string[] {
  if (incoming.length === 0) return existing;
  const merged = new Set(existing);
  for (const entry of incoming) merged.add(entry);
  return merged.size === existing.length ? existing : [...merged];
}

/**
 * Reads the wardrobe-relevant progress signals out of the live game store
 * state. Kept as a pure projection so it is trivially testable.
 */
export function buildLiveProgressSnapshot(live: {
  evolution: { state: string };
  battle: BattleStats;
  vimana: VimanaState;
  miniGames: MiniGameProgress;
  achievements: Achievement[];
}): LiveProgressSnapshot {
  const discoveredNodes = live.vimana.nodes.filter(
    (node) => discoveryStageRank(node.discoveryStage) >= discoveryStageRank('scanned'),
  );

  const uniqueGamesCompleted: string[] = [];
  if (live.miniGames.memoryHighScore > 0) uniqueGamesCompleted.push('memory');
  if (live.miniGames.rhythmHighScore > 0) uniqueGamesCompleted.push('rhythm');
  if (live.miniGames.sigilHighScore > 0) uniqueGamesCompleted.push('sigil');
  if (live.miniGames.vimanaHighScore > 0) uniqueGamesCompleted.push('vimana');
  if (live.miniGames.companionWins > 0) uniqueGamesCompleted.push('companion');

  return {
    evolutionStage: live.evolution.state,
    battle: { wins: live.battle.wins, losses: live.battle.losses },
    vimana: {
      samplesCollected: live.vimana.nodes.reduce(
        (total, node) => total + node.samples,
        0,
      ),
      cellsExplored: discoveredNodes.length,
      anomaliesResolved: live.vimana.anomaliesResolved,
      totalCells: live.vimana.nodes.length,
      discoveredIds: discoveredNodes.map((node) => node.id),
    },
    miniGames: {
      // recordMiniGameResult only counts sessions with real progress, so
      // totalPlays is genuinely "completions", not "screens opened".
      totalCompleted: live.miniGames.totalPlays,
      uniqueGamesCompleted,
    },
    achievementIds: live.achievements.map((achievement) => achievement.id),
  };
}

/**
 * Folds a live snapshot into persisted progress, monotonically. Returns the
 * same object reference when nothing changed so callers can cheaply detect
 * no-ops.
 */
export function mergeLiveSnapshot(
  progress: MetaPetProgress,
  snapshot: LiveProgressSnapshot,
): MetaPetProgress {
  const highestStageReached =
    evolutionStageRank(snapshot.evolutionStage) >
    evolutionStageRank(progress.evolution.highestStageReached)
      ? snapshot.evolutionStage
      : progress.evolution.highestStageReached;

  const wins = Math.max(progress.battle.wins, snapshot.battle.wins);
  const losses = Math.max(progress.battle.losses, snapshot.battle.losses);

  const next: MetaPetProgress = {
    ...progress,
    evolution: {
      currentStage: snapshot.evolutionStage,
      highestStageReached,
    },
    battle: {
      wins,
      losses,
      totalBattles: Math.max(progress.battle.totalBattles, wins + losses),
    },
    vimana: {
      samplesCollected: Math.max(
        progress.vimana.samplesCollected,
        snapshot.vimana.samplesCollected,
      ),
      cellsExplored: Math.max(
        progress.vimana.cellsExplored,
        snapshot.vimana.cellsExplored,
      ),
      anomaliesResolved: Math.max(
        progress.vimana.anomaliesResolved,
        snapshot.vimana.anomaliesResolved,
      ),
      totalCells: Math.max(
        progress.vimana.totalCells,
        snapshot.vimana.totalCells,
      ),
    },
    miniGames: {
      totalCompleted: Math.max(
        progress.miniGames.totalCompleted,
        snapshot.miniGames.totalCompleted,
      ),
      totalPlayed: Math.max(
        progress.miniGames.totalPlayed,
        snapshot.miniGames.totalCompleted,
      ),
      uniqueGamesCompleted: unionSorted(
        progress.miniGames.uniqueGamesCompleted,
        snapshot.miniGames.uniqueGamesCompleted,
      ),
    },
    achievements: {
      unlockedIds: unionSorted(
        progress.achievements.unlockedIds,
        snapshot.achievementIds,
      ),
    },
    discoveries: {
      discoveredIds: unionSorted(
        progress.discoveries.discoveredIds,
        snapshot.vimana.discoveredIds,
      ),
    },
  };

  return progressEquals(progress, next) ? progress : next;
}

function progressEquals(a: MetaPetProgress, b: MetaPetProgress): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

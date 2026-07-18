/**
 * MetaPetProgress: pure derivation and ratcheting.
 *
 * The core Meta-Pet store holds live session state but is not persisted,
 * so this layer is the durable record. `deriveObservedProgress` reads a
 * snapshot of the live store; `applyObservation` folds it into persisted
 * progress with RATCHET semantics — counters only ever rise, stage/
 * achievement history only ever grows. A session reset (or an old save
 * missing fields) can therefore never take earned progress away.
 */

import { EVOLUTION_ORDER, type EvolutionState } from "@/evolution/types";
import { isVimanaNodeDiscovered } from "@/progression/vimana";
import type {
  Achievement,
  BattleStats,
  MiniGameProgress,
  VimanaState,
} from "@/progression/types";
import type { EvolutionData } from "@/evolution/types";
import {
  METAPET_PROGRESS_VERSION,
  SUSTAINED_ENERGY_MINIMUM,
  SUSTAINED_OBSERVATION_GAP_MS,
  type MetaPetProgress,
} from "./types";

export function createDefaultProgress(): MetaPetProgress {
  return {
    version: METAPET_PROGRESS_VERSION,
    evolution: { currentStage: "GENETICS", highestStageReached: "GENETICS" },
    battle: { wins: 0, losses: 0, totalBattles: 0 },
    vimana: { samplesCollected: 0, cellsExplored: 0, anomaliesResolved: 0, totalCells: 0 },
    miniGames: { totalCompleted: 0, totalPlayed: 0, uniqueGamesCompleted: [] },
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

/** The slice of live store state the progress layer observes. */
export interface ObservedMetaPetState {
  evolution: Pick<EvolutionData, "state">;
  battle: Pick<BattleStats, "wins" | "losses">;
  vimana: Pick<VimanaState, "nodes" | "anomaliesResolved">;
  miniGames: MiniGameProgress;
  achievements: ReadonlyArray<Pick<Achievement, "id">>;
}

function stageRank(stage: EvolutionState): number {
  const rank = EVOLUTION_ORDER.indexOf(stage);
  return rank === -1 ? 0 : rank;
}

export function highestStage(a: EvolutionState, b: EvolutionState): EvolutionState {
  return stageRank(b) > stageRank(a) ? b : a;
}

/**
 * Which games show lifetime evidence of at least one completed session.
 * Derived from real per-game stats rather than a separately maintained
 * counter, so it cannot drift from actual play.
 */
export function deriveUniqueGamesCompleted(miniGames: MiniGameProgress): string[] {
  const games: string[] = [];
  if (miniGames.memoryHighScore > 0 || miniGames.shuffleBestRound > 0) games.push("memory");
  if (miniGames.rhythmHighScore > 0 || miniGames.pulseBestCombo > 0) games.push("rhythm");
  if (miniGames.sigilHighScore > 0 || miniGames.sigilTotalCorrect > 0) games.push("sigil");
  if (miniGames.vimanaHighScore > 0 || miniGames.vimanaMaxLines > 0) games.push("vimana");
  if (miniGames.companionWins > 0) games.push("companion");
  return games;
}

export interface ProgressObservation {
  stage: EvolutionState;
  battleWins: number;
  battleLosses: number;
  vimanaSamples: number;
  vimanaCellsExplored: number;
  vimanaAnomaliesResolved: number;
  vimanaTotalCells: number;
  minigamesCompleted: number;
  uniqueGamesCompleted: string[];
  achievementIds: string[];
  discoveredIds: string[];
}

export function deriveObservedProgress(state: ObservedMetaPetState): ProgressObservation {
  const nodes = state.vimana.nodes ?? [];
  const discoveredNodes = nodes.filter((node) => isVimanaNodeDiscovered(node));
  return {
    stage: state.evolution.state,
    battleWins: state.battle.wins,
    battleLosses: state.battle.losses,
    vimanaSamples: nodes.reduce((total, node) => total + Math.max(0, node.samples), 0),
    vimanaCellsExplored: discoveredNodes.length,
    vimanaAnomaliesResolved: state.vimana.anomaliesResolved,
    vimanaTotalCells: nodes.length,
    // totalPlays already counts only sessions with real progress (see
    // recordMiniGameResult) — completions, not screen opens.
    minigamesCompleted: state.miniGames.totalPlays,
    uniqueGamesCompleted: deriveUniqueGamesCompleted(state.miniGames),
    achievementIds: state.achievements.map((entry) => entry.id),
    discoveredIds: discoveredNodes.map((node) => node.id),
  };
}

function unionSorted(current: readonly string[], incoming: readonly string[]): string[] {
  const merged = new Set(current);
  let changed = false;
  for (const id of incoming) {
    if (!merged.has(id)) {
      merged.add(id);
      changed = true;
    }
  }
  return changed ? [...merged] : [...current];
}

/**
 * Folds one live observation into persisted progress. Pure; returns the
 * previous object when nothing changed so store subscribers can bail out.
 */
export function applyObservation(
  progress: MetaPetProgress,
  observed: ProgressObservation,
): MetaPetProgress {
  const next: MetaPetProgress = {
    ...progress,
    evolution: {
      currentStage: observed.stage,
      highestStageReached: highestStage(progress.evolution.highestStageReached, observed.stage),
    },
    battle: {
      wins: Math.max(progress.battle.wins, observed.battleWins),
      losses: Math.max(progress.battle.losses, observed.battleLosses),
      totalBattles: Math.max(
        progress.battle.totalBattles,
        observed.battleWins + observed.battleLosses,
      ),
    },
    vimana: {
      samplesCollected: Math.max(progress.vimana.samplesCollected, observed.vimanaSamples),
      cellsExplored: Math.max(progress.vimana.cellsExplored, observed.vimanaCellsExplored),
      anomaliesResolved: Math.max(
        progress.vimana.anomaliesResolved,
        observed.vimanaAnomaliesResolved,
      ),
      // The grid size is authoritative from the live game, not ratcheted:
      // a regenerated map may legitimately have a different cell count.
      totalCells: observed.vimanaTotalCells > 0 ? observed.vimanaTotalCells : progress.vimana.totalCells,
    },
    miniGames: {
      totalCompleted: Math.max(progress.miniGames.totalCompleted, observed.minigamesCompleted),
      totalPlayed: Math.max(progress.miniGames.totalPlayed, observed.minigamesCompleted),
      uniqueGamesCompleted: unionSorted(
        progress.miniGames.uniqueGamesCompleted,
        observed.uniqueGamesCompleted,
      ),
    },
    achievements: {
      unlockedIds: unionSorted(progress.achievements.unlockedIds, observed.achievementIds),
    },
    discoveries: {
      discoveredIds: unionSorted(progress.discoveries.discoveredIds, observed.discoveredIds),
    },
  };

  return progressEquals(progress, next) ? progress : next;
}

function progressEquals(a: MetaPetProgress, b: MetaPetProgress): boolean {
  return (
    a.evolution.currentStage === b.evolution.currentStage &&
    a.evolution.highestStageReached === b.evolution.highestStageReached &&
    a.battle.wins === b.battle.wins &&
    a.battle.losses === b.battle.losses &&
    a.battle.totalBattles === b.battle.totalBattles &&
    a.vimana.samplesCollected === b.vimana.samplesCollected &&
    a.vimana.cellsExplored === b.vimana.cellsExplored &&
    a.vimana.anomaliesResolved === b.vimana.anomaliesResolved &&
    a.vimana.totalCells === b.vimana.totalCells &&
    a.miniGames.totalCompleted === b.miniGames.totalCompleted &&
    a.miniGames.uniqueGamesCompleted.length === b.miniGames.uniqueGamesCompleted.length &&
    a.achievements.unlockedIds.length === b.achievements.unlockedIds.length &&
    a.discoveries.discoveredIds.length === b.discoveries.discoveredIds.length
  );
}

/**
 * Advances the sustained high-energy timer from one energy observation.
 *
 * Rules (matching the Flame Aura brief):
 * - the timer runs only while energy >= SUSTAINED_ENERGY_MINIMUM;
 * - any dip below the minimum resets the active run;
 * - an observation gap longer than SUSTAINED_OBSERVATION_GAP_MS (page
 *   closed, tab suspended, clock jumped forward) is an interruption, not
 *   free credit — the run restarts from the current observation;
 * - a clock jump backwards also restarts the run defensively;
 * - the best completed duration ratchets and never decreases.
 */
export function observeEnergy(
  sustained: MetaPetProgress["sustainedConditions"],
  energy: number,
  now: number,
): MetaPetProgress["sustainedConditions"] {
  const previousObservedAt = sustained.lastEnergyObservedAt;

  if (!Number.isFinite(energy) || energy < SUSTAINED_ENERGY_MINIMUM) {
    if (sustained.highEnergyStartedAt === undefined && previousObservedAt === now) {
      return sustained;
    }
    return {
      ...sustained,
      highEnergyStartedAt: undefined,
      lastEnergyObservedAt: now,
    };
  }

  const gapBroken =
    previousObservedAt === undefined ||
    now < previousObservedAt ||
    now - previousObservedAt > SUSTAINED_OBSERVATION_GAP_MS;

  const startedAt =
    sustained.highEnergyStartedAt === undefined || gapBroken
      ? now
      : sustained.highEnergyStartedAt;

  const runDuration = Math.max(0, now - startedAt);

  return {
    highEnergyStartedAt: startedAt,
    lastEnergyObservedAt: now,
    longestHighEnergyDurationMs: Math.max(
      sustained.longestHighEnergyDurationMs,
      runDuration,
    ),
  };
}

/**
 * Normalizes a persisted progress blob of any age into the current shape.
 * Missing fields get defaults; malformed values are clamped; nothing valid
 * is discarded.
 */
export function normalizeProgress(raw: unknown): MetaPetProgress {
  const defaults = createDefaultProgress();
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Partial<MetaPetProgress>;

  const num = (candidate: unknown, fallback: number): number =>
    typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0
      ? candidate
      : fallback;
  const stringArray = (candidate: unknown): string[] =>
    Array.isArray(candidate)
      ? [...new Set(candidate.filter((entry): entry is string => typeof entry === "string"))]
      : [];
  const stage = (candidate: unknown): EvolutionState =>
    typeof candidate === "string" && (EVOLUTION_ORDER as string[]).includes(candidate)
      ? (candidate as EvolutionState)
      : "GENETICS";

  return {
    version: METAPET_PROGRESS_VERSION,
    evolution: {
      currentStage: stage(value.evolution?.currentStage),
      highestStageReached: highestStage(
        stage(value.evolution?.currentStage),
        stage(value.evolution?.highestStageReached),
      ),
    },
    battle: {
      wins: num(value.battle?.wins, 0),
      losses: num(value.battle?.losses, 0),
      totalBattles: num(value.battle?.totalBattles, 0),
    },
    vimana: {
      samplesCollected: num(value.vimana?.samplesCollected, 0),
      cellsExplored: num(value.vimana?.cellsExplored, 0),
      anomaliesResolved: num(value.vimana?.anomaliesResolved, 0),
      totalCells: num(value.vimana?.totalCells, 0),
    },
    miniGames: {
      totalCompleted: num(value.miniGames?.totalCompleted, 0),
      totalPlayed: num(value.miniGames?.totalPlayed, 0),
      uniqueGamesCompleted: stringArray(value.miniGames?.uniqueGamesCompleted),
    },
    breeding: {
      offspringCount: num(value.breeding?.offspringCount, 0),
    },
    care: {
      totalFeeds: num(value.care?.totalFeeds, 0),
      totalCleans: num(value.care?.totalCleans, 0),
      totalPlaySessions: num(value.care?.totalPlaySessions, 0),
      totalSleepSessions: num(value.care?.totalSleepSessions, 0),
      trustMilestones: Array.isArray(value.care?.trustMilestones)
        ? value.care.trustMilestones.filter(
            (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
          )
        : [],
    },
    sustainedConditions: {
      highEnergyStartedAt:
        typeof value.sustainedConditions?.highEnergyStartedAt === "number"
          ? value.sustainedConditions.highEnergyStartedAt
          : undefined,
      lastEnergyObservedAt:
        typeof value.sustainedConditions?.lastEnergyObservedAt === "number"
          ? value.sustainedConditions.lastEnergyObservedAt
          : undefined,
      longestHighEnergyDurationMs: num(
        value.sustainedConditions?.longestHighEnergyDurationMs,
        0,
      ),
    },
    achievements: { unlockedIds: stringArray(value.achievements?.unlockedIds) },
    discoveries: { discoveredIds: stringArray(value.discoveries?.discoveredIds) },
  };
}

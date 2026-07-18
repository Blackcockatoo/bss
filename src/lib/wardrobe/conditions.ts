/**
 * Pure evaluation and description of structured wardrobe unlock conditions.
 *
 * Both the unlock engine and the wardrobe UI read from these two functions,
 * so the requirement a player sees is by construction the requirement the
 * engine checks.
 */

import { ACHIEVEMENT_CATALOG } from '@/lib/progression/types';
import type { MetaPetProgress } from './progress';
import { evolutionStageRank } from './progress';
import type { UnlockCondition } from './types';

export interface ConditionEvaluation {
  met: boolean;
  /** Progress toward the target, clamped to [0, target]. */
  progress: number;
  target: number;
}

const ACHIEVEMENT_TITLES = new Map(
  ACHIEVEMENT_CATALOG.map((achievement) => [achievement.id, achievement.title]),
);

function countEvaluation(current: number, target: number): ConditionEvaluation {
  const safeTarget = Math.max(1, target);
  return {
    met: current >= safeTarget,
    progress: Math.min(current, safeTarget),
    target: safeTarget,
  };
}

export function evaluateUnlockCondition(
  condition: UnlockCondition,
  progress: MetaPetProgress,
): ConditionEvaluation {
  switch (condition.type) {
    case 'default':
      return { met: true, progress: 1, target: 1 };

    case 'evolution_stage': {
      const met =
        evolutionStageRank(progress.evolution.highestStageReached) >=
        evolutionStageRank(condition.stage);
      return { met, progress: met ? 1 : 0, target: 1 };
    }

    case 'battle_wins':
      return countEvaluation(progress.battle.wins, condition.target);

    case 'vimana_samples':
      return countEvaluation(
        progress.vimana.samplesCollected,
        condition.target,
      );

    case 'vimana_cells': {
      // "Explore everything" tracks the real size of the player's map once
      // known, falling back to the catalogue's named constant before then.
      const target =
        condition.requireAllCells && progress.vimana.totalCells > 0
          ? progress.vimana.totalCells
          : condition.target;
      return countEvaluation(progress.vimana.cellsExplored, target);
    }

    case 'offspring_count':
      return countEvaluation(
        progress.breeding.offspringCount,
        condition.target,
      );

    case 'minigames_completed':
      return countEvaluation(
        progress.miniGames.totalCompleted,
        condition.target,
      );

    case 'achievement_set': {
      const unlocked = new Set(progress.achievements.unlockedIds);
      const earned = condition.achievementIds.filter((id) =>
        unlocked.has(id),
      ).length;
      const target = condition.requireAll
        ? Math.max(1, condition.achievementIds.length)
        : 1;
      return { met: earned >= target, progress: Math.min(earned, target), target };
    }

    case 'sustained_stat': {
      // Only energy is continuously tracked today; a catalogue test asserts
      // sustained conditions stay within what the tracker records.
      if (condition.stat !== 'energy') {
        return { met: false, progress: 0, target: condition.durationMs };
      }
      const best = progress.sustainedConditions.longestHighEnergyDurationMs;
      return {
        met: best >= condition.durationMs,
        progress: Math.min(best, condition.durationMs),
        target: condition.durationMs,
      };
    }

    case 'discovery': {
      const met = progress.discoveries.discoveredIds.includes(
        condition.discoveryId,
      );
      return { met, progress: met ? 1 : 0, target: 1 };
    }

    case 'all': {
      const results = condition.conditions.map((sub) =>
        evaluateUnlockCondition(sub, progress),
      );
      const satisfied = results.filter((result) => result.met).length;
      return {
        met: satisfied === results.length && results.length > 0,
        progress: satisfied,
        target: Math.max(1, results.length),
      };
    }

    case 'any': {
      const results = condition.conditions.map((sub) =>
        evaluateUnlockCondition(sub, progress),
      );
      const met = results.some((result) => result.met);
      return { met, progress: met ? 1 : 0, target: 1 };
    }
  }
}

export function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds}s`);
  return parts.length > 0 ? parts.join(' ') : '0s';
}

function achievementTitleList(ids: string[]): string {
  return ids
    .map((id) => ACHIEVEMENT_TITLES.get(id) ?? id)
    .join(', ');
}

/** Generates the player-facing requirement text from the structured condition. */
export function describeUnlockCondition(condition: UnlockCondition): string {
  switch (condition.type) {
    case 'default':
      return 'Unlocked from the start';
    case 'evolution_stage':
      return `Reach the ${condition.stage} stage`;
    case 'battle_wins':
      return `Win ${condition.target} battles`;
    case 'vimana_samples':
      return `Collect ${condition.target} Vimana samples`;
    case 'vimana_cells':
      return condition.requireAllCells
        ? 'Explore every Vimana cell'
        : `Explore ${condition.target} Vimana cells`;
    case 'offspring_count':
      return `Raise ${condition.target} offspring`;
    case 'minigames_completed':
      return `Complete ${condition.target} mini-games`;
    case 'achievement_set':
      return condition.requireAll
        ? `Earn all of: ${achievementTitleList(condition.achievementIds)}`
        : `Earn any of: ${achievementTitleList(condition.achievementIds)}`;
    case 'sustained_stat':
      return `Keep ${condition.stat} at ${condition.minimum}+ for ${formatDurationMs(condition.durationMs)}`;
    case 'discovery':
      return 'Uncover a hidden discovery';
    case 'all':
      return condition.conditions.map(describeUnlockCondition).join(' and ');
    case 'any':
      return condition.conditions.map(describeUnlockCondition).join(' or ');
  }
}

/**
 * Player-facing progress line for a locked item, e.g. "31 / 50 battle wins"
 * or "Best duration: 42m 18s / 1h".
 */
export function describeConditionProgress(
  condition: UnlockCondition,
  progress: MetaPetProgress,
): string | null {
  const evaluation = evaluateUnlockCondition(condition, progress);
  if (evaluation.met) return null;

  switch (condition.type) {
    case 'battle_wins':
      return `${evaluation.progress} / ${evaluation.target} battle wins`;
    case 'vimana_samples':
      return `${evaluation.progress} / ${evaluation.target} Vimana samples`;
    case 'vimana_cells':
      return `${evaluation.progress} / ${evaluation.target} cells explored`;
    case 'offspring_count':
      return `${evaluation.progress} / ${evaluation.target} offspring`;
    case 'minigames_completed':
      return `${evaluation.progress} / ${evaluation.target} mini-games`;
    case 'achievement_set':
      return `${evaluation.progress} / ${evaluation.target} achievements`;
    case 'sustained_stat':
      return `Best duration: ${formatDurationMs(evaluation.progress)} / ${formatDurationMs(evaluation.target)}`;
    case 'all':
      return `${evaluation.progress} / ${evaluation.target} requirements met`;
    default:
      return null;
  }
}

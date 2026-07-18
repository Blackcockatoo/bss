/**
 * Pure unlock evaluation. No store access, no Date.now(), no side effects
 * — everything needed arrives as arguments, which is what makes every
 * threshold unit-testable and keeps unlock logic out of render markup.
 */

import { EVOLUTION_ORDER } from "@/evolution/types";
import { WARDROBE_CATALOG } from "./catalog";
import type {
  MetaPetProgress,
  UnlockCondition,
  WardrobeInventory,
  WardrobeUnlockResult,
} from "./types";

export interface ConditionEvaluation {
  met: boolean;
  /** Progress toward the target in the target's own unit. */
  progress: number;
  target: number;
}

export function evaluateCondition(
  condition: UnlockCondition,
  progress: MetaPetProgress,
): ConditionEvaluation {
  switch (condition.type) {
    case "default":
      return { met: true, progress: 1, target: 1 };

    case "evolution_stage": {
      const reached = EVOLUTION_ORDER.indexOf(progress.evolution.highestStageReached);
      const required = EVOLUTION_ORDER.indexOf(condition.stage);
      return {
        met: required !== -1 && reached >= required,
        progress: Math.max(0, reached),
        target: Math.max(0, required),
      };
    }

    case "battle_wins":
      return {
        met: progress.battle.wins >= condition.target,
        progress: progress.battle.wins,
        target: condition.target,
      };

    case "vimana_samples":
      return {
        met: progress.vimana.samplesCollected >= condition.target,
        progress: progress.vimana.samplesCollected,
        target: condition.target,
      };

    case "vimana_cells":
      return {
        met: progress.vimana.cellsExplored >= condition.target,
        progress: progress.vimana.cellsExplored,
        target: condition.target,
      };

    case "vimana_all_cells": {
      const total = progress.vimana.totalCells;
      return {
        // A zero-size grid (state not yet generated) can never satisfy
        // "explored everything" — that would award the item on first load.
        met: total > 0 && progress.vimana.cellsExplored >= total,
        progress: progress.vimana.cellsExplored,
        target: Math.max(1, total),
      };
    }

    case "offspring_count":
      return {
        met: progress.breeding.offspringCount >= condition.target,
        progress: progress.breeding.offspringCount,
        target: condition.target,
      };

    case "minigames_completed":
      return {
        met: progress.miniGames.totalCompleted >= condition.target,
        progress: progress.miniGames.totalCompleted,
        target: condition.target,
      };

    case "achievement_set": {
      const owned = new Set(progress.achievements.unlockedIds);
      const earned = condition.achievementIds.filter((id) => owned.has(id)).length;
      const target = condition.requireAll ? condition.achievementIds.length : 1;
      return { met: earned >= target, progress: earned, target };
    }

    case "sustained_stat": {
      // Energy is the only sustained stat tracked today; trust/mood are in
      // the schema for future conditions and simply read as no progress.
      const best =
        condition.stat === "energy"
          ? progress.sustainedConditions.longestHighEnergyDurationMs
          : 0;
      return {
        met: best >= condition.durationMs,
        progress: best,
        target: condition.durationMs,
      };
    }

    case "discovery":
      return {
        met: progress.discoveries.discoveredIds.includes(condition.discoveryId),
        progress: progress.discoveries.discoveredIds.includes(condition.discoveryId) ? 1 : 0,
        target: 1,
      };

    case "all": {
      const results = condition.conditions.map((entry) => evaluateCondition(entry, progress));
      const metCount = results.filter((entry) => entry.met).length;
      return {
        met: metCount === results.length && results.length > 0,
        progress: metCount,
        target: results.length,
      };
    }

    case "any": {
      const results = condition.conditions.map((entry) => evaluateCondition(entry, progress));
      return {
        met: results.some((entry) => entry.met),
        progress: results.filter((entry) => entry.met).length > 0 ? 1 : 0,
        target: 1,
      };
    }
  }
}

/**
 * Evaluates the whole catalogue against current progress. Items already
 * owned are never re-granted (permanent ownership lives in the inventory,
 * not in this recalculation), so a stat falling after an unlock changes
 * nothing.
 */
export function evaluateWardrobeUnlocks(
  previousProgress: MetaPetProgress,
  currentProgress: MetaPetProgress,
  inventory: WardrobeInventory,
): WardrobeUnlockResult {
  void previousProgress; // Reserved for delta-aware triggers; evaluation is snapshot-based.
  const owned = new Set(inventory.ownedItemIds);
  const result: WardrobeUnlockResult = { newlyUnlocked: [], alreadyOwned: [], unmet: [] };

  for (const item of WARDROBE_CATALOG) {
    const evaluation = evaluateCondition(item.unlockCondition, currentProgress);
    if (owned.has(item.id)) {
      result.alreadyOwned.push(item.id);
    } else if (evaluation.met) {
      result.newlyUnlocked.push(item.id);
    } else {
      result.unmet.push({
        itemId: item.id,
        progress: evaluation.progress,
        target: evaluation.target,
      });
    }
  }

  return result;
}

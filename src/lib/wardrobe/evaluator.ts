/**
 * Event-driven wardrobe unlock evaluation.
 *
 * Pure: given progress and the current inventory, reports which catalogue
 * items should be granted. Ownership is permanent — an item already owned is
 * never re-granted and never revoked, even if the stat that earned it later
 * falls (the store enforces the same invariant defensively).
 */

import { WARDROBE_CATALOG } from './catalog';
import { evaluateUnlockCondition } from './conditions';
import type { MetaPetProgress } from './progress';
import type { WardrobeInventory, WardrobeUnlockResult } from './types';

export function evaluateWardrobeUnlocks(
  previousProgress: MetaPetProgress,
  currentProgress: MetaPetProgress,
  inventory: Pick<WardrobeInventory, 'ownedItemIds'>,
): WardrobeUnlockResult {
  void previousProgress; // reserved for future incremental evaluation
  const owned = new Set(inventory.ownedItemIds);

  const result: WardrobeUnlockResult = {
    newlyUnlocked: [],
    alreadyOwned: [],
    unmet: [],
  };

  for (const item of WARDROBE_CATALOG) {
    if (owned.has(item.id)) {
      result.alreadyOwned.push(item.id);
      continue;
    }

    const evaluation = evaluateUnlockCondition(
      item.unlockCondition,
      currentProgress,
    );
    if (evaluation.met) {
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

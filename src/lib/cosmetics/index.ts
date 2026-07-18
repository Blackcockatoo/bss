/**
 * @deprecated The cosmetics system moved to `src/lib/wardrobe`, which
 * replaces the old string-parsed unlock conditions and mocked progress
 * values with structured `UnlockCondition` data, a persistent
 * `MetaPetProgress` record, permanent `WardrobeInventory` ownership, and
 * real equip/render mechanics. Item IDs are unchanged.
 *
 * This module re-exports the new catalogue under the old names so any
 * external importer keeps compiling; the old `checkUnlockConditions`
 * text-matcher is intentionally gone — evaluate through
 * `@/lib/wardrobe/unlockEvaluator` instead.
 */

export {
  WARDROBE_CATALOG as COSMETICS_CATALOG,
  describeUnlockCondition,
  getWardrobeItemById as getCosmeticById,
  getWardrobeItemsBySlot as getCosmeticsBySlot,
} from "@/lib/wardrobe/catalog";
export { evaluateCondition, evaluateWardrobeUnlocks } from "@/lib/wardrobe/unlockEvaluator";
export type {
  MetaPetProgress,
  UnlockCondition,
  WardrobeInventory,
  WardrobeItem,
  WardrobeRarity,
  WardrobeSlot,
} from "@/lib/wardrobe/types";

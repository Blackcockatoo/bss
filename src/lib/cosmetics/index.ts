/**
 * Cosmetics — superseded by the unified wardrobe system.
 *
 * The old catalogue here determined unlocks by string-matching readable
 * condition text against mocked game values. That logic has been replaced by
 * structured, machine-readable unlock conditions evaluated against the
 * persistent MetaPetProgress record. Item ids are unchanged, so previously
 * referenced cosmetics map 1:1 onto wardrobe items.
 *
 * Import from '@/lib/wardrobe' in new code; this module re-exports the
 * catalogue for backwards compatibility.
 */

export {
  WARDROBE_CATALOG as COSMETICS_CATALOG,
  getWardrobeItem as getCosmeticById,
  getWardrobeItemsBySlot as getCosmeticsByCategory,
} from '@/lib/wardrobe/catalog';
export type {
  WardrobeItem as Cosmetic,
  WardrobeRarity as CosmeticRarity,
  WardrobeSlot as CosmeticSlot,
} from '@/lib/wardrobe/types';

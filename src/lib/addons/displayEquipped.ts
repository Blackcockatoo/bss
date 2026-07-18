/**
 * Merges the canonical equipped-addon list with a temporary wardrobe
 * preview for *rendering only*. Never writes back to `useAddonStore` —
 * this is what makes preview safe to cancel or discard on an unexpected
 * close (there is nothing to undo in the store).
 */

import type { Addon } from "./types";

export function getDisplayEquippedAddons(
  equipped: Addon[],
  previewAddon: Addon | null,
): Addon[] {
  if (!previewAddon) return equipped;
  const slot = previewAddon.equipSlot ?? previewAddon.category;
  const withoutSlot = equipped.filter((addon) => (addon.equipSlot ?? addon.category) !== slot);
  return [...withoutSlot, previewAddon];
}

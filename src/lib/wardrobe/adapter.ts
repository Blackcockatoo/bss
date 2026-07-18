/**
 * Adapter: gameplay cosmetics + crypto-verified add-ons under one
 * wardrobe-facing view model.
 *
 * The two systems intentionally remain separate equip domains —
 * cosmetics equip through `useWardrobeProgressionStore` (progression
 * rewards, non-transferable), verified add-ons through `useAddonStore`
 * (ownership proofs, transferable). This adapter only NORMALIZES them for
 * shared inventory/equipment UI; it never moves ownership between
 * domains, so the crypto layer stays intact.
 *
 * Documented slot exception: a verified add-on and a gameplay cosmetic
 * mapped to the same slot may be worn together (they render on separate
 * layers). Within each domain, one item per slot is enforced.
 */

import type { Addon, AddonCategory } from "@/lib/addons/types";
import { describeUnlockCondition } from "./catalog";
import type { WardrobeItem, WardrobeRarity, WardrobeSlot } from "./types";

export const ADDON_CATEGORY_TO_SLOT: Record<AddonCategory, WardrobeSlot> = {
  headwear: "head",
  weapon: "held",
  accessory: "face",
  aura: "aura",
  companion: "environment",
  effect: "trail",
};

const ADDON_RARITY_TO_WARDROBE: Record<Addon["rarity"], WardrobeRarity> = {
  common: "common",
  uncommon: "common",
  rare: "rare",
  epic: "epic",
  legendary: "legendary",
  mythic: "legendary",
};

export type UnifiedWardrobeSource = "cosmetic" | "verified-addon";

export interface UnifiedWardrobeEntry {
  source: UnifiedWardrobeSource;
  id: string;
  name: string;
  description: string;
  slot: WardrobeSlot;
  rarity: WardrobeRarity;
  owned: boolean;
  equipped: boolean;
  /** Human-readable requirement (generated, never hand-written). */
  requirement: string | null;
  /** True for crypto-signed, transferable add-ons. */
  verified: boolean;
  transferable: boolean;
}

export function cosmeticToUnifiedEntry(
  item: WardrobeItem,
  options: { owned: boolean; equipped: boolean },
): UnifiedWardrobeEntry {
  return {
    source: "cosmetic",
    id: item.id,
    name: item.name,
    description: item.description,
    slot: item.category,
    rarity: item.rarity,
    owned: options.owned,
    equipped: options.equipped,
    requirement: options.owned ? null : describeUnlockCondition(item.unlockCondition),
    verified: false,
    transferable: false,
  };
}

export function addonToUnifiedEntry(
  addon: Addon,
  options: { equipped: boolean },
): UnifiedWardrobeEntry {
  return {
    source: "verified-addon",
    id: addon.id,
    name: addon.name,
    description: addon.description,
    slot: ADDON_CATEGORY_TO_SLOT[addon.category],
    rarity: ADDON_RARITY_TO_WARDROBE[addon.rarity],
    owned: true, // Add-ons in the inventory store are owned by definition.
    equipped: options.equipped,
    requirement: null,
    verified: true,
    transferable: true,
  };
}

/**
 * Adapters between the wardrobe model, the crypto-verified addon system, and
 * the shared on-pet renderer.
 *
 * Verified add-ons keep their own store, ownership proofs, and six equip
 * slots — nothing here touches their security model. The adapter only
 * projects both systems into one inventory/equipment UI and one renderer.
 */

import type {
  Addon,
  AddonAttachment,
  AddonCategory,
  AddonInventory,
  AddonVisual,
} from '@/lib/addons/types';
import { getWardrobeItem } from './catalog';
import {
  describeConditionProgress,
  describeUnlockCondition,
  evaluateUnlockCondition,
} from './conditions';
import type { MetaPetProgress } from './progress';
import type {
  AttachmentAnchor,
  WardrobeAnimation,
  WardrobeInventory,
  WardrobeItem,
  WardrobeSlot,
} from './types';
import { WARDROBE_CATALOG } from './catalog';

/**
 * The minimal shape the shared AddonRenderer needs. Full verified Addons
 * satisfy it; wardrobe cosmetics are converted into it.
 */
export type RenderableAddon = Pick<
  Addon,
  'id' | 'rarity' | 'attachment' | 'visual'
>;

/**
 * Where each addon category appears in the unified wardrobe UI. Verified
 * add-ons intentionally keep their own parallel equip slots (an addon
 * "headwear" and a cosmetic "head" item can both be worn); this mapping is
 * for display grouping only.
 */
export const ADDON_CATEGORY_TO_SLOT: Record<AddonCategory, WardrobeSlot> = {
  headwear: 'head',
  weapon: 'held',
  accessory: 'held',
  aura: 'aura',
  companion: 'back',
  effect: 'trail',
};

/** Auralia pet-space offsets for each named anchor (body centre 200,210). */
const ANCHOR_ATTACHMENTS: Record<
  AttachmentAnchor,
  { anchorPoint: AddonAttachment['anchorPoint']; offset: { x: number; y: number } }
> = {
  headTop: { anchorPoint: 'head', offset: { x: 0, y: -10 } },
  forehead: { anchorPoint: 'head', offset: { x: 0, y: 0 } },
  faceCenter: { anchorPoint: 'head', offset: { x: 0, y: 8 } },
  backCenter: { anchorPoint: 'back', offset: { x: 0, y: 0 } },
  wingRoots: { anchorPoint: 'back', offset: { x: 0, y: -12 } },
  bodyCenter: { anchorPoint: 'body', offset: { x: 0, y: 0 } },
  hand: { anchorPoint: 'right-hand', offset: { x: 0, y: 0 } },
  auraRing: { anchorPoint: 'aura', offset: { x: 0, y: 0 } },
  ground: { anchorPoint: 'body', offset: { x: 0, y: 58 } },
};

const ANIMATION_MAP: Record<
  WardrobeAnimation,
  NonNullable<AddonVisual['animation']>
> = {
  pulse: { type: 'pulse', duration: 3000 },
  swirl: { type: 'rotate', duration: 9000 },
  flicker: { type: 'glow', duration: 1600 },
  sparkle: { type: 'sparkle', duration: 2400 },
  phase: { type: 'shimmer', duration: 2000 },
  shimmer: { type: 'shimmer', duration: 3200 },
};

/** Converts a wardrobe cosmetic into the shape the shared renderer draws. */
export function wardrobeItemToRenderable(item: WardrobeItem): RenderableAddon {
  const anchor = ANCHOR_ATTACHMENTS[item.visualData.anchor];
  const offset = item.visualData.offset ?? { x: 0, y: 0 };

  return {
    id: `wardrobe:${item.id}`,
    rarity: item.rarity,
    attachment: {
      anchorPoint: anchor.anchorPoint,
      offset: {
        x: anchor.offset.x + offset.x,
        y: anchor.offset.y + offset.y,
      },
      scale: item.visualData.scale ?? 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: {
      svgPath: item.visualData.svgPath,
      colors: {
        primary: item.visualData.color,
        secondary: item.visualData.secondaryColor,
        accent: item.visualData.secondaryColor,
        glow: item.visualData.glowColor,
      },
      animation: item.visualData.animation
        ? ANIMATION_MAP[item.visualData.animation]
        : undefined,
      particles: item.visualData.particles,
    },
  };
}

// ===== Unified inventory entries for the wardrobe UI =====

export type WardrobeEntryStatus = 'locked' | 'owned' | 'equipped';

export interface WardrobeEntry {
  id: string;
  kind: 'cosmetic' | 'verified-addon';
  name: string;
  description: string;
  slot: WardrobeSlot;
  rarity: string;
  status: WardrobeEntryStatus;
  /** True while the unlock ceremony has not shown this item yet. */
  newlyUnlocked: boolean;
  /** Locked hidden-discovery items show a silhouette instead of details. */
  hidden: boolean;
  requirementText: string;
  progressText: string | null;
  /** Fraction 0..1 toward unlock, for progress bars. */
  progressFraction: number;
  /** Verified, cryptographically transferable add-on. */
  transferable: boolean;
  /** Catalogue item for previews (cosmetics only). */
  item?: WardrobeItem;
  /** Native addon category, needed to unequip via the addon store. */
  addonCategory?: AddonCategory;
  previewColor: string;
}

export function buildCosmeticEntries(
  inventory: Pick<
    WardrobeInventory,
    'ownedItemIds' | 'equippedBySlot' | 'newlyUnlockedItemIds'
  >,
  progress: MetaPetProgress,
): WardrobeEntry[] {
  const owned = new Set(inventory.ownedItemIds);
  const equipped = new Set(
    Object.values(inventory.equippedBySlot).filter(
      (id): id is string => typeof id === 'string',
    ),
  );

  return WARDROBE_CATALOG.map((item) => {
    const isOwned = owned.has(item.id);
    const evaluation = evaluateUnlockCondition(item.unlockCondition, progress);
    const status: WardrobeEntryStatus = equipped.has(item.id)
      ? 'equipped'
      : isOwned
        ? 'owned'
        : 'locked';

    return {
      id: item.id,
      kind: 'cosmetic' as const,
      name: item.name,
      description: item.description,
      slot: item.category,
      rarity: item.rarity,
      status,
      newlyUnlocked: inventory.newlyUnlockedItemIds.includes(item.id),
      hidden: !isOwned && item.hiddenUntilUnlocked === true,
      requirementText: describeUnlockCondition(item.unlockCondition),
      progressText: isOwned
        ? null
        : describeConditionProgress(item.unlockCondition, progress),
      progressFraction: isOwned
        ? 1
        : evaluation.target > 0
          ? evaluation.progress / evaluation.target
          : 0,
      transferable: false,
      item,
      previewColor: item.visualData.color,
    };
  });
}

export function buildAddonEntries(
  addons: Record<string, Addon>,
  equipped: AddonInventory['equipped'],
): WardrobeEntry[] {
  const equippedIds = new Set(
    Object.values(equipped).filter(
      (id): id is string => typeof id === 'string',
    ),
  );

  return Object.values(addons).map((addon) => ({
    id: addon.id,
    kind: 'verified-addon' as const,
    name: addon.name,
    description: addon.description,
    slot: ADDON_CATEGORY_TO_SLOT[addon.category],
    rarity: addon.rarity,
    status: equippedIds.has(addon.id) ? 'equipped' : 'owned',
    newlyUnlocked: false,
    hidden: false,
    requirementText: 'Verified add-on',
    progressText: null,
    progressFraction: 1,
    transferable: true,
    addonCategory: addon.category,
    previewColor: addon.visual.colors.primary,
  }));
}

/** Equipped cosmetics as renderables, given the persisted equipment map. */
export function getEquippedCosmeticRenderables(
  equippedBySlot: WardrobeInventory['equippedBySlot'],
): Array<{ item: WardrobeItem; renderable: RenderableAddon }> {
  return Object.values(equippedBySlot)
    .map((itemId) => (itemId ? getWardrobeItem(itemId) : undefined))
    .filter((item): item is WardrobeItem => item !== undefined)
    .map((item) => ({ item, renderable: wardrobeItemToRenderable(item) }));
}

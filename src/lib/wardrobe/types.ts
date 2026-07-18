/**
 * Unified Meta-Pet wardrobe model.
 *
 * One wardrobe-facing item model covers both gameplay cosmetics (earned via
 * structured, machine-readable unlock conditions) and cryptographically
 * verified add-ons (surfaced through an adapter — see ./adapter.ts — without
 * touching their ownership proofs).
 */

export type WardrobeSlot =
  | 'head'
  | 'face'
  | 'horns'
  | 'back'
  | 'wings'
  | 'bodyPattern'
  | 'aura'
  | 'trail'
  | 'held'
  | 'environment';

export type WardrobeRarity = 'common' | 'rare' | 'epic' | 'legendary';

/** Named attachment anchors resolved against the live pet's coordinate space. */
export type AttachmentAnchor =
  | 'headTop'
  | 'forehead'
  | 'faceCenter'
  | 'backCenter'
  | 'wingRoots'
  | 'bodyCenter'
  | 'hand'
  | 'auraRing'
  | 'ground';

/**
 * Machine-readable unlock conditions. The human-readable text shown in the
 * wardrobe is ALWAYS generated from these (see describeUnlockCondition) so
 * copy and logic can never drift apart.
 */
export type UnlockCondition =
  | { type: 'default' }
  | { type: 'evolution_stage'; stage: string }
  | { type: 'battle_wins'; target: number }
  | { type: 'vimana_samples'; target: number }
  | {
      type: 'vimana_cells';
      /** Fallback target used when the live map has not reported its size. */
      target: number;
      /**
       * When true the effective target is the actual cell count of the
       * player's map (progress.vimana.totalCells), so "explore everything"
       * never depends on a magic number.
       */
      requireAllCells?: boolean;
    }
  | { type: 'offspring_count'; target: number }
  | { type: 'minigames_completed'; target: number }
  | { type: 'achievement_set'; achievementIds: string[]; requireAll: boolean }
  | {
      type: 'sustained_stat';
      stat: 'energy' | 'trust' | 'mood';
      minimum: number;
      durationMs: number;
    }
  | { type: 'discovery'; discoveryId: string }
  | { type: 'all'; conditions: UnlockCondition[] }
  | { type: 'any'; conditions: UnlockCondition[] };

export type WardrobeAnimation =
  | 'pulse'
  | 'swirl'
  | 'flicker'
  | 'sparkle'
  | 'phase'
  | 'shimmer';

export interface WardrobeVisualData {
  anchor: AttachmentAnchor;
  color: string;
  secondaryColor?: string;
  glowColor?: string;
  /** SVG path centred on (0,0); rendered by the shared addon renderer. */
  svgPath?: string;
  animation?: WardrobeAnimation;
  particles?: {
    count: number;
    color: string;
    size: number;
    behavior: 'orbit' | 'trail' | 'burst' | 'ambient';
  };
  scale?: number;
  offset?: { x: number; y: number };
}

export interface WardrobeItem {
  id: string;
  name: string;
  description: string;
  category: WardrobeSlot;
  rarity: WardrobeRarity;
  unlockCondition: UnlockCondition;
  hiddenUntilUnlocked?: boolean;
  visualData: WardrobeVisualData;
}

export interface WardrobeUnlockRecord {
  itemId: string;
  unlockedAt: number;
  source: string;
}

/** Persistent, permanent ownership state. Earned items are never revoked. */
export interface WardrobeInventory {
  ownedItemIds: string[];
  equippedBySlot: Partial<Record<WardrobeSlot, string>>;
  newlyUnlockedItemIds: string[];
  unlockHistory: WardrobeUnlockRecord[];
}

export interface WardrobeUnlockResult {
  newlyUnlocked: string[];
  alreadyOwned: string[];
  unmet: Array<{
    itemId: string;
    progress: number;
    target: number;
  }>;
}

export type EquipFailureReason =
  | 'unknown-item'
  | 'not-owned'
  | 'invalid-slot';

export interface EquipResult {
  success: boolean;
  reason?: EquipFailureReason;
  slot?: WardrobeSlot;
  /** Item that previously occupied the slot, when the equip replaced one. */
  replacedItemId?: string;
}

/**
 * Draw order for equipped items, back-to-front. Slots up to and including
 * 'aura' render behind the pet body; the rest render in front of it.
 */
export const WARDROBE_LAYER_ORDER: readonly WardrobeSlot[] = [
  'environment',
  'back',
  'wings',
  'bodyPattern',
  'aura',
  'head',
  'horns',
  'face',
  'held',
  'trail',
];

export const WARDROBE_SLOTS_BEHIND_PET: ReadonlySet<WardrobeSlot> = new Set([
  'environment',
  'back',
  'wings',
  'bodyPattern',
  'aura',
]);

export function isWardrobeSlot(value: unknown): value is WardrobeSlot {
  return (
    typeof value === 'string' &&
    (WARDROBE_LAYER_ORDER as readonly string[]).includes(value)
  );
}

export function wardrobeLayerRank(slot: WardrobeSlot): number {
  return WARDROBE_LAYER_ORDER.indexOf(slot);
}

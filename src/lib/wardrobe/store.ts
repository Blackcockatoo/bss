/**
 * Persistent wardrobe inventory store.
 *
 * Ownership is permanent: once an item id enters ownedItemIds it is never
 * removed by falling stats, re-evaluation, or migration. Equipping is a real,
 * validated state change persisted immediately and read by the live pet
 * renderer.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_WARDROBE_ITEM_IDS,
  WARDROBE_CATALOG,
  getWardrobeItem,
} from './catalog';
import { evaluateWardrobeUnlocks } from './evaluator';
import type { MetaPetProgress } from './progress';
import {
  isWardrobeSlot,
  wardrobeLayerRank,
  type EquipResult,
  type WardrobeInventory,
  type WardrobeItem,
  type WardrobeSlot,
  type WardrobeUnlockRecord,
  type WardrobeUnlockResult,
} from './types';

export const WARDROBE_INVENTORY_STORAGE_KEY = 'metapet-wardrobe-inventory';
export const WARDROBE_INVENTORY_VERSION = 1;

/** Cap so a very long-lived save cannot grow the history without bound. */
const UNLOCK_HISTORY_LIMIT = 200;

/** Unlock-history/ceremony source tags. */
export const UNLOCK_SOURCES = {
  default: 'default',
  progress: 'progress',
  reconciliation: 'reconciliation',
} as const;

export interface WardrobeStore extends WardrobeInventory {
  /**
   * Grants items exactly once. Already-owned and unknown ids are ignored.
   * Announced grants join the newly-unlocked ceremony queue.
   */
  grantWardrobeItems: (
    itemIds: string[],
    source: string,
    options?: { announce?: boolean },
  ) => string[];
  /**
   * Full-catalogue pass: grants defaults, grants anything earned by the
   * given progress, and repairs invalid equipped references. Safe to run on
   * every progress change and once during hydration reconciliation.
   */
  reconcileWithProgress: (
    progress: MetaPetProgress,
    source?: string,
  ) => WardrobeUnlockResult;
  equipWardrobeItem: (itemId: string) => EquipResult;
  unequipWardrobeSlot: (slot: WardrobeSlot) => void;
  isWardrobeItemEquipped: (itemId: string) => boolean;
  getEquippedWardrobeItems: () => WardrobeItem[];
  /** Removes one item from the ceremony queue after it has been shown. */
  consumeNewlyUnlocked: (itemId: string) => void;
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Repairs any persisted inventory shape: duplicate owned ids, equipment
 * pointing at unowned/unknown items or wrong slots, and malformed history.
 * Owned ids are never dropped — even ids unknown to the current catalogue
 * are kept so a future catalogue can honour them.
 */
export function sanitizeWardrobeInventory(raw: unknown): WardrobeInventory {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as {
    ownedItemIds?: unknown;
    equippedBySlot?: unknown;
    newlyUnlockedItemIds?: unknown;
    unlockHistory?: unknown;
  };

  const ownedItemIds = dedupe(
    Array.isArray(source.ownedItemIds)
      ? source.ownedItemIds.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        )
      : [],
  );
  const owned = new Set(ownedItemIds);

  const equippedBySlot: Partial<Record<WardrobeSlot, string>> = {};
  if (typeof source.equippedBySlot === 'object' && source.equippedBySlot !== null) {
    for (const [slot, itemId] of Object.entries(source.equippedBySlot)) {
      if (!isWardrobeSlot(slot) || typeof itemId !== 'string') continue;
      const item = getWardrobeItem(itemId);
      // Equipment must reference an owned catalogue item in its own slot.
      if (!item || item.category !== slot || !owned.has(itemId)) continue;
      equippedBySlot[slot] = itemId;
    }
  }

  const newlyUnlockedItemIds = dedupe(
    Array.isArray(source.newlyUnlockedItemIds)
      ? source.newlyUnlockedItemIds.filter(
          (id): id is string =>
            typeof id === 'string' && owned.has(id) && !!getWardrobeItem(id),
        )
      : [],
  );

  const unlockHistory: WardrobeUnlockRecord[] = Array.isArray(
    source.unlockHistory,
  )
    ? source.unlockHistory
        .filter(
          (entry): entry is WardrobeUnlockRecord =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as WardrobeUnlockRecord).itemId === 'string' &&
            typeof (entry as WardrobeUnlockRecord).unlockedAt === 'number' &&
            typeof (entry as WardrobeUnlockRecord).source === 'string',
        )
        .slice(-UNLOCK_HISTORY_LIMIT)
    : [];

  return { ownedItemIds, equippedBySlot, newlyUnlockedItemIds, unlockHistory };
}

export const useWardrobeStore = create<WardrobeStore>()(
  persist(
    (set, get) => ({
      ownedItemIds: [],
      equippedBySlot: {},
      newlyUnlockedItemIds: [],
      unlockHistory: [],

      grantWardrobeItems(itemIds, source, options = {}) {
        const announce = options.announce ?? true;
        const granted: string[] = [];

        set((state) => {
          const owned = new Set(state.ownedItemIds);
          const now = Date.now();
          const history = [...state.unlockHistory];

          for (const itemId of itemIds) {
            if (owned.has(itemId) || !getWardrobeItem(itemId)) continue;
            owned.add(itemId);
            granted.push(itemId);
            history.push({ itemId, unlockedAt: now, source });
          }

          if (granted.length === 0) return state;

          return {
            ownedItemIds: [...owned],
            unlockHistory: history.slice(-UNLOCK_HISTORY_LIMIT),
            newlyUnlockedItemIds: announce
              ? dedupe([...state.newlyUnlockedItemIds, ...granted])
              : state.newlyUnlockedItemIds,
          };
        });

        return granted;
      },

      reconcileWithProgress(progress, source = UNLOCK_SOURCES.progress) {
        const store = get();

        // Default items are owned by construction and never ceremonied.
        store.grantWardrobeItems(
          [...DEFAULT_WARDROBE_ITEM_IDS],
          UNLOCK_SOURCES.default,
          { announce: false },
        );

        const result = evaluateWardrobeUnlocks(progress, progress, get());
        if (result.newlyUnlocked.length > 0) {
          get().grantWardrobeItems(result.newlyUnlocked, source);
        }

        // Repair equipment that points at anything no longer valid.
        set((state) => {
          const sanitized = sanitizeWardrobeInventory(state);
          const changed =
            JSON.stringify(sanitized.equippedBySlot) !==
            JSON.stringify(state.equippedBySlot);
          return changed ? { equippedBySlot: sanitized.equippedBySlot } : state;
        });

        return result;
      },

      equipWardrobeItem(itemId) {
        const item = getWardrobeItem(itemId);
        if (!item) return { success: false, reason: 'unknown-item' };
        if (!get().ownedItemIds.includes(itemId)) {
          return { success: false, reason: 'not-owned' };
        }
        if (!isWardrobeSlot(item.category)) {
          return { success: false, reason: 'invalid-slot' };
        }

        const slot = item.category;
        const replacedItemId = get().equippedBySlot[slot];
        set((state) => ({
          equippedBySlot: { ...state.equippedBySlot, [slot]: itemId },
        }));

        return {
          success: true,
          slot,
          replacedItemId:
            replacedItemId && replacedItemId !== itemId
              ? replacedItemId
              : undefined,
        };
      },

      unequipWardrobeSlot(slot) {
        set((state) => {
          if (!(slot in state.equippedBySlot)) return state;
          const equippedBySlot = { ...state.equippedBySlot };
          delete equippedBySlot[slot];
          return { equippedBySlot };
        });
      },

      isWardrobeItemEquipped(itemId) {
        return Object.values(get().equippedBySlot).includes(itemId);
      },

      getEquippedWardrobeItems() {
        const { equippedBySlot } = get();
        return Object.values(equippedBySlot)
          .map((itemId) => (itemId ? getWardrobeItem(itemId) : undefined))
          .filter((item): item is WardrobeItem => item !== undefined)
          .sort(
            (a, b) => wardrobeLayerRank(a.category) - wardrobeLayerRank(b.category),
          );
      },

      consumeNewlyUnlocked(itemId) {
        set((state) => {
          if (!state.newlyUnlockedItemIds.includes(itemId)) return state;
          return {
            newlyUnlockedItemIds: state.newlyUnlockedItemIds.filter(
              (id) => id !== itemId,
            ),
          };
        });
      },
    }),
    {
      name: WARDROBE_INVENTORY_STORAGE_KEY,
      version: WARDROBE_INVENTORY_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ownedItemIds: state.ownedItemIds,
        equippedBySlot: state.equippedBySlot,
        newlyUnlockedItemIds: state.newlyUnlockedItemIds,
        unlockHistory: state.unlockHistory,
      }),
      migrate: (persisted) => sanitizeWardrobeInventory(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeWardrobeInventory(persisted),
      }),
    },
  ),
);

/** Total number of catalogue items, for "owned X / Y" UI. */
export const WARDROBE_CATALOG_SIZE = WARDROBE_CATALOG.length;

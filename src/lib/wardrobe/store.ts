"use client";

/**
 * The persistent wardrobe progression store: one durable source of truth
 * for MetaPetProgress + WardrobeInventory.
 *
 * Persistence uses the repo's established zustand `persist` pattern (same
 * as the verified add-on store). Every unlock passes through
 * `grantItems`, which is the single place ownership can grow: it dedupes,
 * records history, queues the unlock ceremony, and never removes anything
 * — earned items survive stats falling, refreshes, and old-save
 * migration.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_OWNED_WARDROBE_IDS, getWardrobeItemById } from "./catalog";
import {
  applyObservation,
  createDefaultProgress,
  normalizeProgress,
  observeEnergy,
  type ProgressObservation,
} from "./progress";
import { evaluateWardrobeUnlocks } from "./unlockEvaluator";
import {
  WARDROBE_SLOTS,
  type EquipResult,
  type MetaPetProgress,
  type WardrobeInventory,
  type WardrobeSlot,
  type WardrobeUnlockResult,
} from "./types";

export const WARDROBE_STORAGE_NAME = "metapet-wardrobe-progression";
export const WARDROBE_STORAGE_VERSION = 1;

function createDefaultInventory(): WardrobeInventory {
  return {
    ownedItemIds: [...DEFAULT_OWNED_WARDROBE_IDS],
    equippedBySlot: {},
    newlyUnlockedItemIds: [],
    unlockHistory: DEFAULT_OWNED_WARDROBE_IDS.map((itemId) => ({
      itemId,
      unlockedAt: 0,
      source: "default",
    })),
  };
}

interface WardrobeProgressionState {
  progress: MetaPetProgress;
  inventory: WardrobeInventory;

  /** Folds a live-store observation in and runs the unlock engine. */
  recordObservation: (observed: ProgressObservation, source?: string) => WardrobeUnlockResult | null;
  /** Advances the sustained high-energy timer (called on vitals ticks). */
  observeEnergyLevel: (energy: number, now?: number) => void;
  recordCareAction: (action: "feed" | "clean" | "play" | "sleep") => void;
  recordOffspring: () => void;
  recordTrustMilestone: (milestone: number) => void;

  equipWardrobeItem: (itemId: string) => EquipResult;
  unequipWardrobeSlot: (slot: WardrobeSlot) => void;
  isWardrobeItemEquipped: (itemId: string) => boolean;
  /** Pops one item id from the newly-unlocked ceremony queue. */
  consumeNewlyUnlocked: (itemId: string) => void;
  /** Repairs inventory invariants (dupes, invalid equipped refs). */
  reconcileInventory: () => void;
}

function grantItems(
  inventory: WardrobeInventory,
  itemIds: readonly string[],
  source: string,
  now: number,
): WardrobeInventory {
  const toGrant = itemIds.filter(
    (id) => getWardrobeItemById(id) !== undefined && !inventory.ownedItemIds.includes(id),
  );
  if (toGrant.length === 0) return inventory;

  return {
    ...inventory,
    ownedItemIds: [...inventory.ownedItemIds, ...toGrant],
    newlyUnlockedItemIds: [
      ...inventory.newlyUnlockedItemIds,
      ...toGrant.filter((id) => !inventory.newlyUnlockedItemIds.includes(id)),
    ],
    unlockHistory: [
      ...inventory.unlockHistory,
      ...toGrant.map((itemId) => ({ itemId, unlockedAt: now, source })),
    ],
  };
}

/** Removes duplicate owned ids, unknown ids, and equipped refs that point
 * at unowned/missing items or sit in a renamed slot. Never removes valid
 * owned entries. */
export function repairInventory(raw: unknown): WardrobeInventory {
  const defaults = createDefaultInventory();
  if (!raw || typeof raw !== "object") return defaults;
  const value = raw as Partial<WardrobeInventory>;

  const ownedItemIds = [
    ...new Set(
      (Array.isArray(value.ownedItemIds) ? value.ownedItemIds : [])
        .filter((id): id is string => typeof id === "string")
        .filter((id) => getWardrobeItemById(id) !== undefined),
    ),
  ];
  for (const id of DEFAULT_OWNED_WARDROBE_IDS) {
    if (!ownedItemIds.includes(id)) ownedItemIds.push(id);
  }

  const equippedBySlot: Partial<Record<WardrobeSlot, string>> = {};
  if (value.equippedBySlot && typeof value.equippedBySlot === "object") {
    for (const slot of WARDROBE_SLOTS) {
      const itemId = (value.equippedBySlot as Record<string, unknown>)[slot];
      if (typeof itemId !== "string") continue;
      const item = getWardrobeItemById(itemId);
      if (item && item.category === slot && ownedItemIds.includes(itemId)) {
        equippedBySlot[slot] = itemId;
      }
    }
  }

  const newlyUnlockedItemIds = [
    ...new Set(
      (Array.isArray(value.newlyUnlockedItemIds) ? value.newlyUnlockedItemIds : [])
        .filter((id): id is string => typeof id === "string")
        .filter((id) => ownedItemIds.includes(id)),
    ),
  ];

  const unlockHistory = Array.isArray(value.unlockHistory)
    ? value.unlockHistory.filter(
        (entry): entry is WardrobeInventory["unlockHistory"][number] =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as { itemId?: unknown }).itemId === "string" &&
          typeof (entry as { unlockedAt?: unknown }).unlockedAt === "number",
      )
    : defaults.unlockHistory;

  return { ownedItemIds, equippedBySlot, newlyUnlockedItemIds, unlockHistory };
}

export const useWardrobeProgressionStore = create<WardrobeProgressionState>()(
  persist(
    (set, get) => ({
      progress: createDefaultProgress(),
      inventory: createDefaultInventory(),

      recordObservation(observed, source = "progress") {
        const { progress, inventory } = get();
        const nextProgress = applyObservation(progress, observed);

        const evaluation = evaluateWardrobeUnlocks(progress, nextProgress, inventory);
        const nextInventory =
          evaluation.newlyUnlocked.length > 0
            ? grantItems(inventory, evaluation.newlyUnlocked, source, Date.now())
            : inventory;

        if (nextProgress === progress && nextInventory === inventory) return null;
        set({ progress: nextProgress, inventory: nextInventory });
        return evaluation;
      },

      observeEnergyLevel(energy, now = Date.now()) {
        const { progress, inventory } = get();
        const sustained = observeEnergy(progress.sustainedConditions, energy, now);
        if (sustained === progress.sustainedConditions) return;

        const nextProgress: MetaPetProgress = { ...progress, sustainedConditions: sustained };
        const evaluation = evaluateWardrobeUnlocks(progress, nextProgress, inventory);
        set({
          progress: nextProgress,
          inventory:
            evaluation.newlyUnlocked.length > 0
              ? grantItems(inventory, evaluation.newlyUnlocked, "sustained-energy", now)
              : inventory,
        });
      },

      recordCareAction(action) {
        set((state) => {
          const care = { ...state.progress.care };
          if (action === "feed") care.totalFeeds += 1;
          else if (action === "clean") care.totalCleans += 1;
          else if (action === "play") care.totalPlaySessions += 1;
          else care.totalSleepSessions += 1;
          return { progress: { ...state.progress, care } };
        });
      },

      recordOffspring() {
        const { progress, inventory } = get();
        const nextProgress: MetaPetProgress = {
          ...progress,
          breeding: { offspringCount: progress.breeding.offspringCount + 1 },
        };
        const evaluation = evaluateWardrobeUnlocks(progress, nextProgress, inventory);
        set({
          progress: nextProgress,
          inventory:
            evaluation.newlyUnlocked.length > 0
              ? grantItems(inventory, evaluation.newlyUnlocked, "breeding", Date.now())
              : inventory,
        });
      },

      recordTrustMilestone(milestone) {
        set((state) => {
          if (state.progress.care.trustMilestones.includes(milestone)) return state;
          return {
            progress: {
              ...state.progress,
              care: {
                ...state.progress.care,
                trustMilestones: [...state.progress.care.trustMilestones, milestone].sort(
                  (a, b) => a - b,
                ),
              },
            },
          };
        });
      },

      equipWardrobeItem(itemId) {
        const item = getWardrobeItemById(itemId);
        if (!item) return { ok: false, reason: "unknown-item" };
        if (!WARDROBE_SLOTS.includes(item.category)) {
          return { ok: false, reason: "invalid-slot" };
        }
        const { inventory } = get();
        if (!inventory.ownedItemIds.includes(itemId)) {
          return { ok: false, reason: "not-owned" };
        }

        const replacedItemId = inventory.equippedBySlot[item.category] ?? null;
        set({
          inventory: {
            ...inventory,
            equippedBySlot: { ...inventory.equippedBySlot, [item.category]: itemId },
          },
        });
        return { ok: true, slot: item.category, replacedItemId };
      },

      unequipWardrobeSlot(slot) {
        set((state) => {
          if (state.inventory.equippedBySlot[slot] === undefined) return state;
          const equippedBySlot = { ...state.inventory.equippedBySlot };
          delete equippedBySlot[slot];
          return { inventory: { ...state.inventory, equippedBySlot } };
        });
      },

      isWardrobeItemEquipped(itemId) {
        return Object.values(get().inventory.equippedBySlot).includes(itemId);
      },

      consumeNewlyUnlocked(itemId) {
        set((state) => ({
          inventory: {
            ...state.inventory,
            newlyUnlockedItemIds: state.inventory.newlyUnlockedItemIds.filter(
              (id) => id !== itemId,
            ),
          },
        }));
      },

      reconcileInventory() {
        set((state) => ({
          progress: normalizeProgress(state.progress),
          inventory: repairInventory(state.inventory),
        }));
      },
    }),
    {
      name: WARDROBE_STORAGE_NAME,
      version: WARDROBE_STORAGE_VERSION,
      partialize: (state) => ({ progress: state.progress, inventory: state.inventory }),
      migrate: (persistedState) => {
        // Version 1 is the first persisted shape; normalization doubles as
        // the forward-compatible repair pass for any malformed blob.
        const raw = persistedState as Partial<
          Pick<WardrobeProgressionState, "progress" | "inventory">
        >;
        return {
          progress: normalizeProgress(raw?.progress),
          inventory: repairInventory(raw?.inventory),
        };
      },
      onRehydrateStorage: () => (state) => {
        // Post-hydration reconciliation: repair invariants and make sure
        // defaults exist even if storage was corrupted or hand-edited.
        state?.reconcileInventory();
      },
    },
  ),
);

/** Equipped items in guaranteed render order (back → front). */
export function getEquippedWardrobeItems(
  inventory: WardrobeInventory,
): ReturnType<typeof collectEquipped> {
  return collectEquipped(inventory);
}

function collectEquipped(inventory: WardrobeInventory) {
  return WARDROBE_SLOTS.map((slot) => inventory.equippedBySlot[slot])
    .filter((id): id is string => typeof id === "string")
    .map((id) => getWardrobeItemById(id))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);
}

/**
 * Unified Meta-Pet wardrobe: types and named constants.
 *
 * This module is the schema for the whole progression → unlock → own →
 * equip → render chain. Three rules hold everywhere:
 *
 * 1. Unlock conditions are structured data (`UnlockCondition`), never
 *    parsed out of display strings. Readable text is GENERATED from the
 *    condition (see catalog.ts), so copy and logic cannot drift.
 * 2. Ownership is persistent state (`WardrobeInventory`), not a boolean
 *    recomputed per render. Once granted, an item stays owned even if the
 *    stat that earned it later falls.
 * 3. Gameplay cosmetics and crypto-verified add-ons remain separate
 *    domains under one wardrobe-facing view model (`adapter.ts`) — the
 *    verified add-on system's ownership proofs are never bypassed.
 */

import type { EvolutionState } from "@/evolution/types";

// ── Slots and layers ───────────────────────────────────────────────────

export type WardrobeSlot =
  | "head"
  | "face"
  | "horns"
  | "back"
  | "wings"
  | "bodyPattern"
  | "aura"
  | "trail"
  | "held"
  | "environment";

export const WARDROBE_SLOTS: readonly WardrobeSlot[] = [
  "head",
  "face",
  "horns",
  "back",
  "wings",
  "bodyPattern",
  "aura",
  "trail",
  "held",
  "environment",
];

/**
 * Back-to-front draw order for equipped wardrobe visuals. Entries earlier
 * in the list render behind the body silhouette; entries at or after
 * `WARDROBE_FIRST_FRONT_LAYER` render in front of it. This mirrors the
 * renderer split PetBodyRenderer exposes (addonsBehind / addonsFront).
 */
export const WARDROBE_LAYER_ORDER: readonly WardrobeSlot[] = [
  "environment",
  "back",
  "wings",
  "aura",
  "bodyPattern",
  "head",
  "horns",
  "face",
  "held",
  "trail",
];

export const WARDROBE_FIRST_FRONT_LAYER: WardrobeSlot = "bodyPattern";

export type AttachmentAnchor =
  | "headTop"
  | "forehead"
  | "faceCenter"
  | "backCenter"
  | "wingRoots"
  | "bodyCenter"
  | "hand"
  | "auraRing"
  | "ground";

export type WardrobeRarity = "common" | "rare" | "epic" | "legendary";

// ── Structured unlock conditions ───────────────────────────────────────

export type UnlockCondition =
  | { type: "default" }
  | { type: "evolution_stage"; stage: EvolutionState }
  | { type: "battle_wins"; target: number }
  | { type: "vimana_samples"; target: number }
  | { type: "vimana_cells"; target: number }
  /** Every currently generated Vimana cell explored — the true cell total
   * comes from the live grid (progress.vimana.totalCells), never a magic
   * number. */
  | { type: "vimana_all_cells" }
  | { type: "offspring_count"; target: number }
  | { type: "minigames_completed"; target: number }
  | { type: "achievement_set"; achievementIds: readonly string[]; requireAll: boolean }
  | {
      type: "sustained_stat";
      stat: "energy" | "trust" | "mood";
      minimum: number;
      durationMs: number;
    }
  | { type: "discovery"; discoveryId: string }
  | { type: "all"; conditions: UnlockCondition[] }
  | { type: "any"; conditions: UnlockCondition[] };

// ── Wardrobe items ─────────────────────────────────────────────────────

export interface WardrobeVisualData {
  color?: string;
  secondaryColor?: string;
  svgPath?: string;
  animation?: "pulse" | "swirl" | "flicker" | "sparkle" | "phase";
  anchor: AttachmentAnchor;
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

// ── Persistent progress (source of truth for unlock conditions) ────────

export interface MetaPetProgress {
  version: number;

  evolution: {
    currentStage: EvolutionState;
    highestStageReached: EvolutionState;
  };

  battle: {
    wins: number;
    losses: number;
    totalBattles: number;
  };

  vimana: {
    samplesCollected: number;
    cellsExplored: number;
    anomaliesResolved: number;
    totalCells: number;
  };

  miniGames: {
    totalCompleted: number;
    totalPlayed: number;
    uniqueGamesCompleted: string[];
  };

  breeding: {
    offspringCount: number;
  };

  care: {
    totalFeeds: number;
    totalCleans: number;
    totalPlaySessions: number;
    totalSleepSessions: number;
    trustMilestones: number[];
  };

  sustainedConditions: {
    highEnergyStartedAt?: number;
    longestHighEnergyDurationMs: number;
    /** Last time energy was observed; gates refresh/clock-jump handling. */
    lastEnergyObservedAt?: number;
  };

  achievements: {
    unlockedIds: string[];
  };

  discoveries: {
    discoveredIds: string[];
  };
}

// ── Persistent inventory ───────────────────────────────────────────────

export interface WardrobeUnlockRecord {
  itemId: string;
  unlockedAt: number;
  source: string;
}

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

export type EquipResult =
  | { ok: true; slot: WardrobeSlot; replacedItemId: string | null }
  | {
      ok: false;
      reason: "unknown-item" | "not-owned" | "invalid-slot";
    };

// ── Named constants (no magic numbers in logic) ────────────────────────

export const SUSTAINED_ENERGY_MINIMUM = 90;
export const SUSTAINED_ENERGY_TARGET_MS = 60 * 60 * 1000; // one hour
/**
 * If no energy observation arrives for this long (page closed, tab
 * suspended, or the system clock jumped), the active sustained-energy run
 * is treated as interrupted rather than silently credited — a single
 * snapshot above the minimum must never award an hour of holding it.
 */
export const SUSTAINED_OBSERVATION_GAP_MS = 2 * 60 * 1000;

export const BATTLE_WINS_SACRED_HALO = 50;
export const VIMANA_SAMPLES_CRYSTAL_HORNS = 100;
export const OFFSPRING_RAINBOW_AURA = 5;
export const MINIGAMES_STARFIELD_PATTERN = 20;

/**
 * The achievement set behind the Sacred Geometry pattern. No dedicated
 * "HeptaCode achievement" IDs exist in the progression catalog today, so
 * this names seven real, stable achievement IDs spanning the seven
 * progression strands (exploration ×2, battle ×2, evolution ×2, lineage).
 * The wardrobe UI generates its requirement text from this list, so the
 * displayed requirement always matches the enforced one.
 */
export const HEPTACODE_ACHIEVEMENT_IDS: readonly string[] = [
  "explorer-first-step",
  "explorer-anomaly-hunter",
  "battle-first-win",
  "battle-streak",
  "evolve-neuro",
  "evolve-quantum",
  "breeding-first",
];

export const METAPET_PROGRESS_VERSION = 1;

/** CustomEvent dispatched by the core store when an offspring is created,
 * so the persistent progress layer can count it without a reverse import. */
export const BREEDING_EVENT_NAME = "bss:metapet:offspring-created";

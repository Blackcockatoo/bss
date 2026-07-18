/**
 * Wardrobe catalogue: every gameplay cosmetic, with structured unlock
 * conditions. Item IDs are unchanged from the legacy cosmetics catalogue
 * (src/lib/cosmetics) so nothing a player references is renamed.
 *
 * Requirement text is GENERATED from the condition via
 * `describeUnlockCondition` — the display copy and the enforced logic are
 * the same data by construction.
 */

import {
  BATTLE_WINS_SACRED_HALO,
  HEPTACODE_ACHIEVEMENT_IDS,
  MINIGAMES_STARFIELD_PATTERN,
  OFFSPRING_RAINBOW_AURA,
  SUSTAINED_ENERGY_MINIMUM,
  SUSTAINED_ENERGY_TARGET_MS,
  VIMANA_SAMPLES_CRYSTAL_HORNS,
  type UnlockCondition,
  type WardrobeItem,
} from "./types";

export const WARDROBE_CATALOG: readonly WardrobeItem[] = [
  {
    id: "effect-sparkle",
    name: "Sparkle Trail",
    description: "Leave sparkling traces of movement",
    category: "trail",
    rarity: "common",
    unlockCondition: { type: "default" },
    visualData: { animation: "sparkle", anchor: "ground", color: "#ffe9a8" },
  },
  {
    id: "crown-gold",
    name: "Golden Crown",
    description: "A crown of pure consciousness energy",
    category: "head",
    rarity: "epic",
    unlockCondition: { type: "evolution_stage", stage: "SPECIATION" },
    visualData: {
      color: "#FFD700",
      svgPath: "M -14 4 L -9 -8 L -4 1 L 0 -11 L 4 1 L 9 -8 L 14 4 Z",
      anchor: "headTop",
    },
  },
  {
    id: "halo-sacred",
    name: "Sacred Halo",
    description: "Radiates pure harmonic resonance",
    category: "head",
    rarity: "legendary",
    unlockCondition: { type: "battle_wins", target: BATTLE_WINS_SACRED_HALO },
    visualData: { color: "#FFFACD", animation: "pulse", anchor: "headTop" },
  },
  {
    id: "horns-crystal",
    name: "Crystal Horns",
    description: "Shimmering crystalline antlers",
    category: "horns",
    rarity: "rare",
    unlockCondition: { type: "vimana_samples", target: VIMANA_SAMPLES_CRYSTAL_HORNS },
    visualData: { color: "#87CEEB", anchor: "headTop" },
  },
  {
    id: "aura-rainbow",
    name: "Rainbow Aura",
    description: "Multi-spectral energy field",
    category: "aura",
    rarity: "epic",
    unlockCondition: { type: "offspring_count", target: OFFSPRING_RAINBOW_AURA },
    visualData: { color: "#ff6ec7", secondaryColor: "#42dfff", animation: "pulse", anchor: "auraRing" },
  },
  {
    id: "aura-void",
    name: "Void Aura",
    description: "Dark energy from quantum depths",
    category: "aura",
    rarity: "legendary",
    unlockCondition: { type: "vimana_all_cells" },
    visualData: { color: "#2a0a3a", secondaryColor: "#7b2ff7", animation: "swirl", anchor: "auraRing" },
  },
  {
    id: "aura-fire",
    name: "Flame Aura",
    description: "Burning life force manifestation",
    category: "aura",
    rarity: "rare",
    unlockCondition: {
      type: "sustained_stat",
      stat: "energy",
      minimum: SUSTAINED_ENERGY_MINIMUM,
      durationMs: SUSTAINED_ENERGY_TARGET_MS,
    },
    visualData: { color: "#FF6B35", secondaryColor: "#ffb35c", animation: "flicker", anchor: "auraRing" },
  },
  {
    id: "pattern-stars",
    name: "Starfield Pattern",
    description: "Cosmic patterns across the body",
    category: "bodyPattern",
    rarity: "rare",
    unlockCondition: { type: "minigames_completed", target: MINIGAMES_STARFIELD_PATTERN },
    visualData: { color: "#cfe8ff", anchor: "bodyCenter" },
  },
  {
    id: "pattern-sacred",
    name: "Sacred Geometry",
    description: "Ancient symbols of power",
    category: "bodyPattern",
    rarity: "epic",
    unlockCondition: {
      type: "achievement_set",
      achievementIds: HEPTACODE_ACHIEVEMENT_IDS,
      requireAll: true,
    },
    visualData: { color: "#f5c451", anchor: "bodyCenter" },
  },
  {
    id: "effect-quantum",
    name: "Quantum Shimmer",
    description: "Phase between realities",
    category: "trail",
    rarity: "legendary",
    unlockCondition: { type: "evolution_stage", stage: "QUANTUM" },
    visualData: { color: "#9c5cff", secondaryColor: "#42dfff", animation: "phase", anchor: "ground" },
  },
];

const CATALOG_BY_ID = new Map(WARDROBE_CATALOG.map((item) => [item.id, item]));

export function getWardrobeItemById(id: string): WardrobeItem | undefined {
  return CATALOG_BY_ID.get(id);
}

export function getWardrobeItemsBySlot(slot: WardrobeItem["category"]): WardrobeItem[] {
  return WARDROBE_CATALOG.filter((item) => item.category === slot);
}

/** IDs owned by every player from their first session. */
export const DEFAULT_OWNED_WARDROBE_IDS: readonly string[] = WARDROBE_CATALOG.filter(
  (item) => item.unlockCondition.type === "default",
).map((item) => item.id);

// ── Generated requirement text ─────────────────────────────────────────

function formatDurationShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  return `${seconds}s`;
}

export function describeUnlockCondition(condition: UnlockCondition): string {
  switch (condition.type) {
    case "default":
      return "Unlocked from the start";
    case "evolution_stage":
      return `Reach the ${condition.stage} stage`;
    case "battle_wins":
      return `Win ${condition.target} battles`;
    case "vimana_samples":
      return `Collect ${condition.target} Vimana samples`;
    case "vimana_cells":
      return `Explore ${condition.target} Vimana cells`;
    case "vimana_all_cells":
      return "Explore every Vimana cell";
    case "offspring_count":
      return `Produce ${condition.target} offspring`;
    case "minigames_completed":
      return `Complete ${condition.target} mini-game sessions`;
    case "achievement_set":
      return condition.requireAll
        ? `Earn all ${condition.achievementIds.length} linked achievements`
        : `Earn any of ${condition.achievementIds.length} linked achievements`;
    case "sustained_stat":
      return `Keep ${condition.stat} at ${condition.minimum}+ for ${formatDurationShort(condition.durationMs)}`;
    case "discovery":
      return "Uncover a hidden discovery";
    case "all":
      return condition.conditions.map(describeUnlockCondition).join(" and ");
    case "any":
      return condition.conditions.map(describeUnlockCondition).join(" or ");
  }
}

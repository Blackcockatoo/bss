import { describe, expect, it } from "vitest";
import { createDefaultProgress } from "./progress";
import { evaluateCondition, evaluateWardrobeUnlocks } from "./unlockEvaluator";
import { DEFAULT_OWNED_WARDROBE_IDS, WARDROBE_CATALOG } from "./catalog";
import {
  BATTLE_WINS_SACRED_HALO,
  HEPTACODE_ACHIEVEMENT_IDS,
  MINIGAMES_STARFIELD_PATTERN,
  OFFSPRING_RAINBOW_AURA,
  SUSTAINED_ENERGY_TARGET_MS,
  VIMANA_SAMPLES_CRYSTAL_HORNS,
  type MetaPetProgress,
  type WardrobeInventory,
} from "./types";

function makeProgress(patch: (progress: MetaPetProgress) => void): MetaPetProgress {
  const progress = createDefaultProgress();
  patch(progress);
  return progress;
}

function makeInventory(overrides: Partial<WardrobeInventory> = {}): WardrobeInventory {
  return {
    ownedItemIds: [...DEFAULT_OWNED_WARDROBE_IDS],
    equippedBySlot: {},
    newlyUnlockedItemIds: [],
    unlockHistory: [],
    ...overrides,
  };
}

describe("evaluateCondition", () => {
  it("default conditions are always met", () => {
    expect(evaluateCondition({ type: "default" }, createDefaultProgress()).met).toBe(true);
  });

  it("battle_wins: below, at, and above the threshold", () => {
    const condition = { type: "battle_wins", target: BATTLE_WINS_SACRED_HALO } as const;
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.battle.wins = 49))),
    ).toMatchObject({ met: false, progress: 49, target: 50 });
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.battle.wins = 50))).met,
    ).toBe(true);
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.battle.wins = 51))).met,
    ).toBe(true);
  });

  it("vimana_samples threshold", () => {
    const condition = { type: "vimana_samples", target: VIMANA_SAMPLES_CRYSTAL_HORNS } as const;
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.vimana.samplesCollected = 99))).met,
    ).toBe(false);
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.vimana.samplesCollected = 100))).met,
    ).toBe(true);
  });

  it("vimana_all_cells uses the live grid total, and a zero-size grid never satisfies it", () => {
    expect(evaluateCondition({ type: "vimana_all_cells" }, createDefaultProgress()).met).toBe(false);
    const met = evaluateCondition(
      { type: "vimana_all_cells" },
      makeProgress((p) => {
        p.vimana.totalCells = 24;
        p.vimana.cellsExplored = 24;
      }),
    );
    expect(met.met).toBe(true);
    const partial = evaluateCondition(
      { type: "vimana_all_cells" },
      makeProgress((p) => {
        p.vimana.totalCells = 24;
        p.vimana.cellsExplored = 23;
      }),
    );
    expect(partial).toMatchObject({ met: false, progress: 23, target: 24 });
  });

  it("evolution_stage uses highest stage reached, so later regression cannot re-lock", () => {
    const condition = { type: "evolution_stage", stage: "QUANTUM" } as const;
    const progress = makeProgress((p) => {
      p.evolution.highestStageReached = "QUANTUM";
      p.evolution.currentStage = "NEURO";
    });
    expect(evaluateCondition(condition, progress).met).toBe(true);
  });

  it("minigames_completed counts completions", () => {
    const condition = { type: "minigames_completed", target: MINIGAMES_STARFIELD_PATTERN } as const;
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.miniGames.totalCompleted = 19))).met,
    ).toBe(false);
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.miniGames.totalCompleted = 20))).met,
    ).toBe(true);
  });

  it("offspring_count threshold", () => {
    const condition = { type: "offspring_count", target: OFFSPRING_RAINBOW_AURA } as const;
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.breeding.offspringCount = 4))).met,
    ).toBe(false);
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.breeding.offspringCount = 5))).met,
    ).toBe(true);
  });

  it("achievement_set requireAll needs every listed id", () => {
    const condition = {
      type: "achievement_set",
      achievementIds: HEPTACODE_ACHIEVEMENT_IDS,
      requireAll: true,
    } as const;
    const partial = makeProgress(
      (p) => void (p.achievements.unlockedIds = HEPTACODE_ACHIEVEMENT_IDS.slice(0, 3) as string[]),
    );
    expect(evaluateCondition(condition, partial)).toMatchObject({
      met: false,
      progress: 3,
      target: HEPTACODE_ACHIEVEMENT_IDS.length,
    });
    const full = makeProgress(
      (p) => void (p.achievements.unlockedIds = [...HEPTACODE_ACHIEVEMENT_IDS]),
    );
    expect(evaluateCondition(condition, full).met).toBe(true);
  });

  it("achievement_set requireAll=false needs any one id", () => {
    const condition = {
      type: "achievement_set",
      achievementIds: ["x", "y"],
      requireAll: false,
    } as const;
    expect(
      evaluateCondition(condition, makeProgress((p) => void (p.achievements.unlockedIds = ["y"]))).met,
    ).toBe(true);
  });

  it("sustained_stat energy reads the best completed duration", () => {
    const condition = {
      type: "sustained_stat",
      stat: "energy",
      minimum: 90,
      durationMs: SUSTAINED_ENERGY_TARGET_MS,
    } as const;
    const short = makeProgress(
      (p) => void (p.sustainedConditions.longestHighEnergyDurationMs = SUSTAINED_ENERGY_TARGET_MS - 1),
    );
    expect(evaluateCondition(condition, short).met).toBe(false);
    const done = makeProgress(
      (p) => void (p.sustainedConditions.longestHighEnergyDurationMs = SUSTAINED_ENERGY_TARGET_MS),
    );
    expect(evaluateCondition(condition, done).met).toBe(true);
  });

  it("all/any combinators", () => {
    const win = { type: "battle_wins", target: 1 } as const;
    const lose = { type: "battle_wins", target: 99 } as const;
    const progress = makeProgress((p) => void (p.battle.wins = 1));
    expect(evaluateCondition({ type: "all", conditions: [win, lose] }, progress).met).toBe(false);
    expect(evaluateCondition({ type: "any", conditions: [win, lose] }, progress).met).toBe(true);
    expect(evaluateCondition({ type: "all", conditions: [win, win] }, progress).met).toBe(true);
  });

  it("discovery condition", () => {
    const condition = { type: "discovery", discoveryId: "cell-7" } as const;
    expect(evaluateCondition(condition, createDefaultProgress()).met).toBe(false);
    expect(
      evaluateCondition(
        condition,
        makeProgress((p) => void (p.discoveries.discoveredIds = ["cell-7"])),
      ).met,
    ).toBe(true);
  });
});

describe("evaluateWardrobeUnlocks", () => {
  it("splits the catalogue into newlyUnlocked / alreadyOwned / unmet", () => {
    const progress = makeProgress((p) => void (p.battle.wins = BATTLE_WINS_SACRED_HALO));
    const result = evaluateWardrobeUnlocks(createDefaultProgress(), progress, makeInventory());
    expect(result.newlyUnlocked).toContain("halo-sacred");
    expect(result.alreadyOwned).toContain("effect-sparkle");
    expect(result.unmet.map((entry) => entry.itemId)).toContain("crown-gold");
    const total =
      result.newlyUnlocked.length + result.alreadyOwned.length + result.unmet.length;
    expect(total).toBe(WARDROBE_CATALOG.length);
  });

  it("never re-grants an owned item (duplicate unlock prevention)", () => {
    const progress = makeProgress((p) => void (p.battle.wins = BATTLE_WINS_SACRED_HALO));
    const inventory = makeInventory({
      ownedItemIds: [...DEFAULT_OWNED_WARDROBE_IDS, "halo-sacred"],
    });
    const result = evaluateWardrobeUnlocks(progress, progress, inventory);
    expect(result.newlyUnlocked).not.toContain("halo-sacred");
    expect(result.alreadyOwned).toContain("halo-sacred");
  });

  it("ownership is permanent: a stat falling after unlock leaves the item owned", () => {
    // Earn while wins are high, then evaluate again after the counter drops.
    const high = makeProgress((p) => void (p.battle.wins = BATTLE_WINS_SACRED_HALO));
    const inventory = makeInventory({
      ownedItemIds: [...DEFAULT_OWNED_WARDROBE_IDS, "halo-sacred"],
    });
    const low = createDefaultProgress(); // wins back to 0
    const result = evaluateWardrobeUnlocks(high, low, inventory);
    expect(result.alreadyOwned).toContain("halo-sacred");
    expect(result.unmet.map((entry) => entry.itemId)).not.toContain("halo-sacred");
  });

  it("reports progress/target pairs for unmet items", () => {
    const progress = makeProgress((p) => void (p.battle.wins = 31));
    const result = evaluateWardrobeUnlocks(createDefaultProgress(), progress, makeInventory());
    const halo = result.unmet.find((entry) => entry.itemId === "halo-sacred");
    expect(halo).toEqual({ itemId: "halo-sacred", progress: 31, target: BATTLE_WINS_SACRED_HALO });
  });
});

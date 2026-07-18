import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultProgress, type ProgressObservation } from "./progress";
import {
  getEquippedWardrobeItems,
  repairInventory,
  useWardrobeProgressionStore,
} from "./store";
import { DEFAULT_OWNED_WARDROBE_IDS } from "./catalog";
import {
  BATTLE_WINS_SACRED_HALO,
  OFFSPRING_RAINBOW_AURA,
  type WardrobeInventory,
} from "./types";

function makeObservation(overrides: Partial<ProgressObservation> = {}): ProgressObservation {
  return {
    stage: "GENETICS",
    battleWins: 0,
    battleLosses: 0,
    vimanaSamples: 0,
    vimanaCellsExplored: 0,
    vimanaAnomaliesResolved: 0,
    vimanaTotalCells: 0,
    minigamesCompleted: 0,
    uniqueGamesCompleted: [],
    achievementIds: [],
    discoveredIds: [],
    ...overrides,
  };
}

function resetStore() {
  useWardrobeProgressionStore.setState({
    progress: createDefaultProgress(),
    inventory: {
      ownedItemIds: [...DEFAULT_OWNED_WARDROBE_IDS],
      equippedBySlot: {},
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    },
  });
}

describe("useWardrobeProgressionStore", () => {
  beforeEach(resetStore);

  it("Sparkle Trail is owned by default on a fresh profile", () => {
    expect(useWardrobeProgressionStore.getState().inventory.ownedItemIds).toContain(
      "effect-sparkle",
    );
  });

  it("progress below a threshold keeps the item locked", () => {
    useWardrobeProgressionStore
      .getState()
      .recordObservation(makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO - 1 }));
    const { inventory } = useWardrobeProgressionStore.getState();
    expect(inventory.ownedItemIds).not.toContain("halo-sacred");
  });

  it("crossing a threshold grants exactly once, records history, and queues one unlock event", () => {
    const store = useWardrobeProgressionStore.getState();
    store.recordObservation(makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO }));

    let state = useWardrobeProgressionStore.getState();
    expect(state.inventory.ownedItemIds).toContain("halo-sacred");
    expect(state.inventory.newlyUnlockedItemIds).toEqual(["halo-sacred"]);
    expect(
      state.inventory.unlockHistory.filter((entry) => entry.itemId === "halo-sacred"),
    ).toHaveLength(1);

    // Re-observing the same (or higher) progress must not duplicate anything.
    useWardrobeProgressionStore
      .getState()
      .recordObservation(makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO + 5 }));
    state = useWardrobeProgressionStore.getState();
    expect(
      state.inventory.ownedItemIds.filter((id) => id === "halo-sacred"),
    ).toHaveLength(1);
    expect(state.inventory.newlyUnlockedItemIds).toEqual(["halo-sacred"]);
  });

  it("ownership survives the stat falling afterwards", () => {
    useWardrobeProgressionStore
      .getState()
      .recordObservation(makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO }));
    useWardrobeProgressionStore.getState().recordObservation(makeObservation({ battleWins: 0 }));
    expect(useWardrobeProgressionStore.getState().inventory.ownedItemIds).toContain("halo-sacred");
  });

  it("recordOffspring reaches the Rainbow Aura threshold through real events", () => {
    const store = useWardrobeProgressionStore.getState();
    for (let i = 0; i < OFFSPRING_RAINBOW_AURA; i++) store.recordOffspring();
    const state = useWardrobeProgressionStore.getState();
    expect(state.progress.breeding.offspringCount).toBe(OFFSPRING_RAINBOW_AURA);
    expect(state.inventory.ownedItemIds).toContain("aura-rainbow");
  });

  it("recordCareAction increments the matching counter", () => {
    const store = useWardrobeProgressionStore.getState();
    store.recordCareAction("feed");
    store.recordCareAction("feed");
    store.recordCareAction("sleep");
    const { care } = useWardrobeProgressionStore.getState().progress;
    expect(care.totalFeeds).toBe(2);
    expect(care.totalSleepSessions).toBe(1);
    expect(care.totalCleans).toBe(0);
  });

  it("equip validates ownership", () => {
    const result = useWardrobeProgressionStore.getState().equipWardrobeItem("crown-gold");
    expect(result).toEqual({ ok: false, reason: "not-owned" });
  });

  it("equip rejects unknown items", () => {
    const result = useWardrobeProgressionStore.getState().equipWardrobeItem("no-such-item");
    expect(result).toEqual({ ok: false, reason: "unknown-item" });
  });

  it("equip occupies the slot; a second equip replaces the first; unequip clears it", () => {
    // Earn both head items.
    useWardrobeProgressionStore
      .getState()
      .recordObservation(
        makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO, stage: "SPECIATION" }),
      );

    let result = useWardrobeProgressionStore.getState().equipWardrobeItem("crown-gold");
    expect(result).toEqual({ ok: true, slot: "head", replacedItemId: null });
    expect(useWardrobeProgressionStore.getState().inventory.equippedBySlot.head).toBe("crown-gold");

    result = useWardrobeProgressionStore.getState().equipWardrobeItem("halo-sacred");
    expect(result).toEqual({ ok: true, slot: "head", replacedItemId: "crown-gold" });
    expect(useWardrobeProgressionStore.getState().inventory.equippedBySlot.head).toBe("halo-sacred");
    expect(useWardrobeProgressionStore.getState().isWardrobeItemEquipped("crown-gold")).toBe(false);

    useWardrobeProgressionStore.getState().unequipWardrobeSlot("head");
    expect(useWardrobeProgressionStore.getState().inventory.equippedBySlot.head).toBeUndefined();
  });

  it("consumeNewlyUnlocked removes exactly one queue entry", () => {
    useWardrobeProgressionStore
      .getState()
      .recordObservation(
        makeObservation({ battleWins: BATTLE_WINS_SACRED_HALO, stage: "QUANTUM" }),
      );
    const before = useWardrobeProgressionStore.getState().inventory.newlyUnlockedItemIds;
    expect(before.length).toBeGreaterThanOrEqual(2);
    useWardrobeProgressionStore.getState().consumeNewlyUnlocked(before[0]);
    const after = useWardrobeProgressionStore.getState().inventory.newlyUnlockedItemIds;
    expect(after).toEqual(before.slice(1));
  });

  it("getEquippedWardrobeItems returns items in back-to-front layer order", () => {
    useWardrobeProgressionStore
      .getState()
      .recordObservation(makeObservation({ stage: "SPECIATION", minigamesCompleted: 20 }));
    useWardrobeProgressionStore.getState().equipWardrobeItem("crown-gold");
    useWardrobeProgressionStore.getState().equipWardrobeItem("pattern-stars");
    useWardrobeProgressionStore.getState().equipWardrobeItem("effect-sparkle");
    const equipped = getEquippedWardrobeItems(
      useWardrobeProgressionStore.getState().inventory,
    );
    expect(equipped.map((item) => item.id)).toEqual([
      "crown-gold",
      "pattern-stars",
      "effect-sparkle",
    ]);
  });
});

describe("repairInventory (migration / hydration reconciliation)", () => {
  it("dedupes owned ids and drops unknown ones without touching valid entries", () => {
    const repaired = repairInventory({
      ownedItemIds: ["crown-gold", "crown-gold", "deleted-item", "halo-sacred"],
      equippedBySlot: {},
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    } satisfies WardrobeInventory);
    expect(repaired.ownedItemIds.filter((id) => id === "crown-gold")).toHaveLength(1);
    expect(repaired.ownedItemIds).toContain("halo-sacred");
    expect(repaired.ownedItemIds).not.toContain("deleted-item");
  });

  it("always restores default-owned items", () => {
    const repaired = repairInventory({
      ownedItemIds: [],
      equippedBySlot: {},
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    } satisfies WardrobeInventory);
    expect(repaired.ownedItemIds).toContain("effect-sparkle");
  });

  it("clears equipped references to unowned items and mismatched slots", () => {
    const repaired = repairInventory({
      ownedItemIds: ["crown-gold"],
      equippedBySlot: {
        head: "halo-sacred", // not owned → cleared
        aura: "crown-gold", // owned but wrong slot → cleared
      },
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    } satisfies WardrobeInventory);
    expect(repaired.equippedBySlot.head).toBeUndefined();
    expect(repaired.equippedBySlot.aura).toBeUndefined();
  });

  it("keeps valid equipped references", () => {
    const repaired = repairInventory({
      ownedItemIds: ["crown-gold"],
      equippedBySlot: { head: "crown-gold" },
      newlyUnlockedItemIds: [],
      unlockHistory: [],
    } satisfies WardrobeInventory);
    expect(repaired.equippedBySlot.head).toBe("crown-gold");
  });

  it("survives corrupted storage blobs", () => {
    const repaired = repairInventory("corrupted-json-string");
    expect(repaired.ownedItemIds).toContain("effect-sparkle");
    expect(repaired.equippedBySlot).toEqual({});
  });
});

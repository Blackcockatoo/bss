/**
 * End-to-end chain test against the REAL core store (no mocks): player
 * action → bridge observation → persistent progress → unlock engine →
 * permanent ownership → equip → persisted equipment.
 *
 * This is the automated version of the manual wardrobe checklist (fresh
 * profile → below threshold → cross threshold → single unlock → equip →
 * persist), driven through the same store actions the UI calls.
 */

import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "@/lib/store";
import { createDefaultProgress } from "./progress";
import { useWardrobeProgressionStore, WARDROBE_STORAGE_NAME } from "./store";
import { DEFAULT_OWNED_WARDROBE_IDS } from "./catalog";
import { BATTLE_WINS_SACRED_HALO } from "./types";
import { WardrobeProgressBridge } from "./WardrobeProgressBridge";

function resetWardrobeStore() {
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

describe("WardrobeProgressBridge (full chain, real core store)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetWardrobeStore();
  });

  it("fresh profile: Sparkle Trail owned, nothing queued", () => {
    render(<WardrobeProgressBridge />);
    const { inventory } = useWardrobeProgressionStore.getState();
    expect(inventory.ownedItemIds).toContain("effect-sparkle");
    expect(inventory.newlyUnlockedItemIds).toEqual([]);
  });

  it("battle wins flow: locked below threshold, granted exactly once at it, persisted", () => {
    render(<WardrobeProgressBridge />);

    act(() => {
      for (let i = 0; i < BATTLE_WINS_SACRED_HALO - 1; i++) {
        useStore.getState().recordBattle("win", "integration-test");
      }
    });
    let state = useWardrobeProgressionStore.getState();
    expect(state.progress.battle.wins).toBe(BATTLE_WINS_SACRED_HALO - 1);
    expect(state.inventory.ownedItemIds).not.toContain("halo-sacred");

    act(() => {
      useStore.getState().recordBattle("win", "integration-test");
    });
    state = useWardrobeProgressionStore.getState();
    expect(state.progress.battle.wins).toBe(BATTLE_WINS_SACRED_HALO);
    expect(state.inventory.ownedItemIds.filter((id) => id === "halo-sacred")).toHaveLength(1);
    expect(state.inventory.newlyUnlockedItemIds).toContain("halo-sacred");
    expect(
      state.inventory.unlockHistory.filter((entry) => entry.itemId === "halo-sacred"),
    ).toHaveLength(1);

    // More wins never duplicate the grant or the ceremony entry.
    act(() => {
      useStore.getState().recordBattle("win", "integration-test");
    });
    state = useWardrobeProgressionStore.getState();
    expect(state.inventory.ownedItemIds.filter((id) => id === "halo-sacred")).toHaveLength(1);
    expect(
      state.inventory.newlyUnlockedItemIds.filter((id) => id === "halo-sacred"),
    ).toHaveLength(1);

    // Equip and confirm the persisted blob carries ownership + equipment.
    const result = useWardrobeProgressionStore.getState().equipWardrobeItem("halo-sacred");
    expect(result.ok).toBe(true);
    const persisted = JSON.parse(window.localStorage.getItem(WARDROBE_STORAGE_NAME) ?? "null");
    expect(persisted?.state?.inventory?.ownedItemIds).toContain("halo-sacred");
    expect(persisted?.state?.inventory?.equippedBySlot?.head).toBe("halo-sacred");
  });

  it("care actions are counted through lastAction transitions", () => {
    render(<WardrobeProgressBridge />);
    act(() => {
      useStore.getState().feed();
      useStore.getState().play();
      useStore.getState().feed();
    });
    const { care } = useWardrobeProgressionStore.getState().progress;
    expect(care.totalFeeds).toBe(2);
    expect(care.totalPlaySessions).toBe(1);
  });

  it("recordBreeding reaches the progress layer through the offspring event", () => {
    render(<WardrobeProgressBridge />);
    act(() => {
      useStore.getState().recordBreeding();
      useStore.getState().recordBreeding();
    });
    expect(useWardrobeProgressionStore.getState().progress.breeding.offspringCount).toBe(2);
  });

  it("hydration reconciliation grants items a returning player already earned", () => {
    // Live state already qualifies before the bridge ever mounts.
    act(() => {
      for (let i = 0; i < 3; i++) {
        useStore.getState().recordBattle("win", "pre-existing");
      }
    });
    resetWardrobeStore();
    render(<WardrobeProgressBridge />);
    const { progress } = useWardrobeProgressionStore.getState();
    // The mount-time observation captured the pre-existing wins.
    expect(progress.battle.wins).toBeGreaterThanOrEqual(3);
    expect(progress.achievements.unlockedIds).toContain("battle-first-win");
  });
});

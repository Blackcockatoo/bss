import { beforeEach, describe, expect, it } from "vitest";
import { migrateAddonStore, useAddonStore } from "./store";
import type { Addon, AddonInventory } from "./types";
import { INITIAL_WALLET_STATE, useWalletStore } from "@/lib/wallet/store";

function makeAddon(id: string, overrides: Partial<Addon> = {}): Addon {
  return {
    id,
    name: id,
    description: "",
    category: "headwear",
    rarity: "common",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#fff" } },
    ownership: {
      ownerPublicKey: "owner-1",
      signature: "sig",
      issuedAt: 5,
      issuerPublicKey: "issuer-1",
      issuerSignature: "isig",
      nonce: "nonce-1",
    },
    metadata: { creator: "test", createdAt: 5 },
    ...overrides,
  };
}

describe("migrateAddonStore (v1 -> v2)", () => {
  it("preserves ownership, ids and equipment untouched while normalizing addons", () => {
    const v1State: AddonInventory = {
      addons: { "hat-1": makeAddon("hat-1") },
      equipped: { headwear: "hat-1" },
      ownerPublicKey: "owner-1",
      positionOverrides: { "hat-1": { x: 10, y: 20, locked: true } },
    };
    const migrated = migrateAddonStore(v1State, 1) as AddonInventory;

    expect(migrated.addons["hat-1"].id).toBe("hat-1");
    expect(migrated.addons["hat-1"].ownership).toEqual(v1State.addons["hat-1"].ownership);
    expect(migrated.equipped).toEqual({ headwear: "hat-1" });
    expect(migrated.positionOverrides).toEqual({ "hat-1": { x: 10, y: 20, locked: true } });
    expect(migrated.ownerPublicKey).toBe("owner-1");
    // And the new schema fields are now present with safe defaults.
    expect(migrated.addons["hat-1"].equipSlot).toBe("headwear");
    expect(migrated.addons["hat-1"].compatibleForms).toEqual(["auralia", "evolved"]);
  });

  it("is a no-op for state already at version 2", () => {
    const v2State: AddonInventory = {
      addons: {},
      equipped: {},
      ownerPublicKey: "owner-1",
    };
    expect(migrateAddonStore(v2State, 2)).toBe(v2State);
  });

  it("handles a v1 payload with no addons at all", () => {
    const migrated = migrateAddonStore(
      { addons: undefined, equipped: {}, ownerPublicKey: "" },
      1,
    ) as AddonInventory;
    expect(migrated.addons).toEqual({});
  });
});

describe("useAddonStore equip flow", () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: {}, equipped: {}, ownerPublicKey: "owner-1", positionOverrides: {} });
    useWalletStore.setState({ ...INITIAL_WALLET_STATE });
  });

  it("equips into the category slot for a normal addon (Auralia regression coverage)", () => {
    useAddonStore.setState({ addons: { "hat-1": makeAddon("hat-1") } });
    const ok = useAddonStore.getState().equipAddon("hat-1");
    expect(ok).toBe(true);
    expect(useAddonStore.getState().equipped.headwear).toBe("hat-1");
  });

  it("equips using an explicit equipSlot override when one differs from category", () => {
    useAddonStore.setState({
      addons: { "hat-1": makeAddon("hat-1", { category: "headwear", equipSlot: "accessory" }) },
    });
    useAddonStore.getState().equipAddon("hat-1");
    expect(useAddonStore.getState().equipped.accessory).toBe("hat-1");
    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
  });

  it("equipping a second item in the same slot replaces the first (single active per slot)", () => {
    useAddonStore.setState({
      addons: { "hat-1": makeAddon("hat-1"), "hat-2": makeAddon("hat-2") },
    });
    useAddonStore.getState().equipAddon("hat-1");
    useAddonStore.getState().equipAddon("hat-2");
    expect(useAddonStore.getState().equipped.headwear).toBe("hat-2");
  });

  it("refuses to equip an item locked by the B$S Vault", () => {
    useAddonStore.setState({ addons: { "hat-1": makeAddon("hat-1") } });
    useWalletStore.setState({ lockedAddonIds: ["hat-1"] });

    expect(useAddonStore.getState().equipAddon("hat-1")).toBe(false);
    expect(useAddonStore.getState().equipped.headwear).toBeUndefined();
  });

  it("refuses a legacy direct transfer while an item is locked by the B$S Vault", async () => {
    useAddonStore.setState({ addons: { "hat-1": makeAddon("hat-1") } });
    useWalletStore.setState({ lockedAddonIds: ["hat-1"] });

    const transfer = await useAddonStore
      .getState()
      .transferAddon("hat-1", "owner-2", "unused-private-key");

    expect(transfer).toBeNull();
    expect(useAddonStore.getState().addons["hat-1"]).toBeDefined();
  });

  it("this equip mechanism is form-agnostic — the Evolved/Body Forge wardrobe uses the exact same equipAddon call as Auralia", () => {
    useAddonStore.setState({ addons: { "staff-1": makeAddon("staff-1", { category: "weapon" }) } });
    // The wardrobe never branches on form when committing an equip — this
    // is the fix for "Evolved cannot properly use the wardrobe".
    const ok = useAddonStore.getState().equipAddon("staff-1");
    expect(ok).toBe(true);
    expect(useAddonStore.getState().equipped.weapon).toBe("staff-1");
  });

  it("position overrides persist through lock/reset independent of equip state", () => {
    useAddonStore.setState({ addons: { "hat-1": makeAddon("hat-1") } });
    useAddonStore.getState().setAddonPosition("hat-1", 12, 34);
    expect(useAddonStore.getState().getAddonPosition("hat-1")).toEqual({ x: 12, y: 34, locked: false });

    useAddonStore.getState().lockAddonPosition("hat-1", true);
    expect(useAddonStore.getState().getAddonPosition("hat-1")?.locked).toBe(true);

    useAddonStore.getState().resetAddonPosition("hat-1");
    expect(useAddonStore.getState().getAddonPosition("hat-1")).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { initializeStarterAddons } from "./starter";
import { useAddonStore } from "./store";

describe("initializeStarterAddons idempotency", () => {
  beforeEach(() => {
    localStorage.clear();
    useAddonStore.setState({
      addons: {},
      equipped: {},
      ownerPublicKey: "",
      positionOverrides: {},
    });
  });

  it("mints starter addons once and reports zero new mints on a repeat call", async () => {
    const first = await initializeStarterAddons();
    expect(first.success).toBe(true);
    expect(first.addonsCreated).toBeGreaterThan(0);

    const ownedAfterFirst = { ...useAddonStore.getState().addons };
    expect(Object.keys(ownedAfterFirst).length).toBe(first.addonsCreated);

    // Regression: the idempotency check used to compare against the bare
    // template id, but mintAddon stores addons under `${templateId}-${edition}`,
    // so it never matched and every call re-minted (and overwrote) every
    // starter addon — silently wiping equip state on every /pet page load.
    const second = await initializeStarterAddons();
    expect(second.addonsCreated).toBe(0);
    expect(useAddonStore.getState().addons).toEqual(ownedAfterFirst);
  });

  it("does not clobber an equipped starter addon on re-initialization", async () => {
    await initializeStarterAddons();
    const [firstAddonId] = Object.keys(useAddonStore.getState().addons);
    useAddonStore.getState().equipAddon(firstAddonId);
    expect(Object.values(useAddonStore.getState().equipped)).toContain(firstAddonId);

    await initializeStarterAddons();

    expect(Object.values(useAddonStore.getState().equipped)).toContain(firstAddonId);
  });
});

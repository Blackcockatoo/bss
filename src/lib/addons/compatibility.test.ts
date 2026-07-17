import { describe, expect, it } from "vitest";
import { getAddonStatus, resolveAddonDefaults } from "./compatibility";
import type { Addon } from "./types";

function makeAddon(overrides: Partial<Addon> = {}): Addon {
  return {
    id: "test-addon-1",
    name: "Test Addon",
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
      ownerPublicKey: "owner",
      signature: "sig",
      issuedAt: 0,
      issuerPublicKey: "issuer",
      issuerSignature: "isig",
      nonce: "nonce",
    },
    metadata: { creator: "test", createdAt: 0 },
    ...overrides,
  };
}

describe("resolveAddonDefaults", () => {
  it("defaults every optional field for a legacy addon that sets none of them", () => {
    const defaults = resolveAddonDefaults(makeAddon());
    expect(defaults).toEqual({
      equipSlot: "headwear",
      compatibleAnchors: null,
      compatibleBodyShapes: null,
      renderLayer: "front",
      followsBody: true,
      reactsToPointer: false,
      reactiveBehaviour: "static",
      tryOnSupported: true,
      unlockMethod: "starter",
    });
  });

  it("honours explicit values when a newer addon sets them", () => {
    const defaults = resolveAddonDefaults(
      makeAddon({
        equipSlot: "aura",
        compatibleBodyShapes: ["bean"],
        renderLayer: "behind",
        interactionProfile: { followsBody: false, reactsToPointer: true },
        unlockMethod: "purchase",
      }),
    );
    expect(defaults.equipSlot).toBe("aura");
    expect(defaults.compatibleBodyShapes).toEqual(["bean"]);
    expect(defaults.renderLayer).toBe("behind");
    expect(defaults.followsBody).toBe(false);
    expect(defaults.reactsToPointer).toBe(true);
    expect(defaults.unlockMethod).toBe("purchase");
  });
});

describe("getAddonStatus", () => {
  it("is incompatible when the addon restricts body shapes and the pet doesn't match", () => {
    const addon = makeAddon({ compatibleBodyShapes: ["bean"] });
    const result = getAddonStatus(addon, {
      owned: true,
      bodyShape: "crystal",
    });
    expect(result.status).toBe("incompatible");
  });

  it("incompatibility overrides ownership", () => {
    const addon = makeAddon({ compatibleBodyShapes: ["bean"] });
    const result = getAddonStatus(addon, {
      owned: false,
      bodyShape: "crystal",
    });
    expect(result.status).toBe("incompatible");
  });

  it("is compatible with an unrestricted addon regardless of shape", () => {
    const addon = makeAddon();
    const result = getAddonStatus(addon, { owned: true, bodyShape: "crystal" });
    expect(result.status).toBe("owned");
  });

  it("is equipped when owned and the equipped id matches", () => {
    const addon = makeAddon();
    const result = getAddonStatus(addon, {
      owned: true,
      equippedId: addon.id,
      bodyShape: null,
    });
    expect(result.status).toBe("equipped");
  });

  it("is available when not owned but starter-unlockable", () => {
    const addon = makeAddon();
    const result = getAddonStatus(addon, { owned: false, bodyShape: null });
    expect(result.status).toBe("available");
  });

  it("is locked when not owned and gated behind a plan", () => {
    const addon = makeAddon({ unlockMethod: "purchase" });
    const result = getAddonStatus(addon, { owned: false, bodyShape: null });
    expect(result.status).toBe("locked");
  });
});

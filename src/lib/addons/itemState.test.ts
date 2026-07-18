import { describe, expect, it } from "vitest";
import { resolveWardrobeItemState } from "./itemState";
import type { Addon } from "./types";

function makeAddon(overrides: Partial<Addon> = {}): Addon {
  return {
    id: "addon-1",
    name: "Test Item",
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
      ownerPublicKey: "",
      signature: "",
      issuedAt: 0,
      issuerPublicKey: "",
      issuerSignature: "",
      nonce: "",
    },
    metadata: { creator: "test", createdAt: 0 },
    compatibleForms: ["auralia", "evolved"],
    ...overrides,
  };
}

const NOW = 1_700_000_000_000;

describe("resolveWardrobeItemState", () => {
  it("returns 'previewing' when this item is the active preview, even if owned and equipped", () => {
    const addon = makeAddon({ id: "x" });
    const result = resolveWardrobeItemState(addon, {
      owned: true,
      equippedId: "x",
      previewingId: "x",
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(result.state).toBe("previewing");
  });

  it("returns 'incompatible' before 'equipped' when the form doesn't support it", () => {
    const addon = makeAddon({ id: "x", compatibleForms: ["auralia"] });
    const result = resolveWardrobeItemState(addon, {
      owned: true,
      equippedId: "x",
      previewingId: null,
      form: "geometry",
      bodyShape: null,
      now: NOW,
    });
    expect(result.state).toBe("incompatible");
    expect(result.incompatibilityMessage).toBeTruthy();
  });

  it("returns 'equipped' when the id matches the equipped map", () => {
    const addon = makeAddon({ id: "x" });
    const result = resolveWardrobeItemState(addon, {
      owned: true,
      equippedId: "x",
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(result.state).toBe("equipped");
  });

  it("returns 'owned' when owned but not equipped", () => {
    const addon = makeAddon({ id: "x" });
    const result = resolveWardrobeItemState(addon, {
      owned: true,
      equippedId: null,
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(result.state).toBe("owned");
  });

  it("returns 'locked' when not owned", () => {
    const addon = makeAddon({ id: "x" });
    const result = resolveWardrobeItemState(addon, {
      owned: false,
      equippedId: null,
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(result.state).toBe("locked");
  });

  it("flags isNew for a recently-owned item, and not for an old one", () => {
    const fresh = makeAddon({ id: "x", metadata: { creator: "t", createdAt: NOW - 1000 } });
    const old = makeAddon({ id: "y", metadata: { creator: "t", createdAt: NOW - 1000 * 60 * 60 * 24 * 30 } });
    const freshResult = resolveWardrobeItemState(fresh, {
      owned: true,
      equippedId: null,
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    const oldResult = resolveWardrobeItemState(old, {
      owned: true,
      equippedId: null,
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(freshResult.isNew).toBe(true);
    expect(oldResult.isNew).toBe(false);
  });

  it("never flags isNew for unowned items", () => {
    const addon = makeAddon({ id: "x", metadata: { creator: "t", createdAt: NOW - 1000 } });
    const result = resolveWardrobeItemState(addon, {
      owned: false,
      equippedId: null,
      previewingId: null,
      form: "auralia",
      bodyShape: null,
      now: NOW,
    });
    expect(result.isNew).toBe(false);
  });

  it("checks body-shape compatibility for the Evolved form", () => {
    const addon = makeAddon({
      id: "x",
      compatibleForms: ["evolved"],
      compatibleBodyShapes: ["crystal"],
    });
    const result = resolveWardrobeItemState(addon, {
      owned: true,
      equippedId: null,
      previewingId: null,
      form: "evolved",
      bodyShape: "bean",
      now: NOW,
    });
    expect(result.state).toBe("incompatible");
  });
});

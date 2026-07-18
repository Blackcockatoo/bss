import { describe, expect, it } from "vitest";
import { normalizeAddon, normalizeAddons } from "./normalize";
import type { Addon } from "./types";

function makeLegacyAddon(overrides: Partial<Addon> = {}): Addon {
  return {
    id: "legacy-hat-001",
    name: "Legacy Hat",
    description: "Minted before the Living Wardrobe schema existed.",
    category: "headwear",
    rarity: "epic",
    attachment: {
      anchorPoint: "head",
      offset: { x: 0, y: -25 },
      scale: 1.2,
      rotation: 0,
      followAnimation: true,
    },
    visual: { colors: { primary: "#fff" } },
    ownership: {
      ownerPublicKey: "owner-key",
      signature: "sig",
      issuedAt: 100,
      issuerPublicKey: "issuer-key",
      issuerSignature: "isig",
      nonce: "nonce-1",
    },
    metadata: { creator: "Auralia Workshop", createdAt: 100, tags: ["hat"] },
    ...overrides,
  };
}

describe("normalizeAddon", () => {
  it("fills equipSlot from category when missing", () => {
    const result = normalizeAddon(makeLegacyAddon());
    expect(result.equipSlot).toBe("headwear");
  });

  it("defaults compatibleForms to auralia + evolved, not geometry", () => {
    const result = normalizeAddon(makeLegacyAddon());
    expect(result.compatibleForms).toEqual(["auralia", "evolved"]);
  });

  it("defaults compatibleAnchors from the existing attachment anchor point", () => {
    const result = normalizeAddon(makeLegacyAddon());
    expect(result.compatibleAnchors).toEqual(["head"]);
  });

  it("defaults renderLayer to front, tryOnSupported to true, reactiveBehaviour to none", () => {
    const result = normalizeAddon(makeLegacyAddon());
    expect(result.renderLayer).toBe("front");
    expect(result.tryOnSupported).toBe(true);
    expect(result.reactiveBehaviour).toBe("none");
    expect(result.unlockMethod).toEqual({ type: "unknown" });
  });

  it("preserves every pre-existing field byte for byte", () => {
    const legacy = makeLegacyAddon();
    const result = normalizeAddon(legacy);
    expect(result.id).toBe(legacy.id);
    expect(result.ownership).toEqual(legacy.ownership);
    expect(result.attachment).toEqual(legacy.attachment);
    expect(result.metadata.createdAt).toBe(legacy.metadata.createdAt);
  });

  it("does not mutate the input object", () => {
    const legacy = Object.freeze(makeLegacyAddon());
    expect(() => normalizeAddon(legacy)).not.toThrow();
  });

  it("is a no-op (same object identity) for an already-normalized addon", () => {
    const once = normalizeAddon(makeLegacyAddon());
    const twice = normalizeAddon(once);
    expect(twice).toBe(once);
  });

  it("respects explicit values instead of overwriting them", () => {
    const result = normalizeAddon(
      makeLegacyAddon({
        equipSlot: "accessory",
        compatibleForms: ["geometry"],
        renderLayer: "behind-body",
        tryOnSupported: false,
      }),
    );
    expect(result.equipSlot).toBe("accessory");
    expect(result.compatibleForms).toEqual(["geometry"]);
    expect(result.renderLayer).toBe("behind-body");
    expect(result.tryOnSupported).toBe(false);
  });
});

describe("normalizeAddons", () => {
  it("normalizes every entry in a keyed map, preserving keys/ids", () => {
    const map = {
      a: makeLegacyAddon({ id: "a" }),
      b: makeLegacyAddon({ id: "b", category: "weapon" }),
    };
    const result = normalizeAddons(map);
    expect(Object.keys(result)).toEqual(["a", "b"]);
    expect(result.a.equipSlot).toBe("headwear");
    expect(result.b.equipSlot).toBe("weapon");
  });

  it("handles an empty map", () => {
    expect(normalizeAddons({})).toEqual({});
  });
});

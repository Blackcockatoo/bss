import { describe, expect, it } from "vitest";
import {
  isAddonCompatibleWithBodyShape,
  isAddonCompatibleWithForm,
  resolveAddonCompatibility,
} from "./compatibility";
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
    ...overrides,
  };
}

describe("isAddonCompatibleWithForm", () => {
  it("is compatible with a form present in compatibleForms", () => {
    const addon = makeAddon({ compatibleForms: ["auralia", "evolved"] });
    expect(isAddonCompatibleWithForm(addon, "auralia").compatible).toBe(true);
    expect(isAddonCompatibleWithForm(addon, "evolved").compatible).toBe(true);
  });

  it("is incompatible with geometry by default (legacy items)", () => {
    const addon = makeAddon(); // no compatibleForms set -> normalized default
    const result = isAddonCompatibleWithForm(addon, "geometry");
    expect(result.compatible).toBe(false);
    expect(result.reason).toBe("form-unsupported");
    expect(result.message).toContain("Geometry / Sri Yantra");
  });

  it("respects an explicit compatibleForms list even if it excludes evolved", () => {
    const addon = makeAddon({ compatibleForms: ["auralia"] });
    expect(isAddonCompatibleWithForm(addon, "evolved").compatible).toBe(false);
  });
});

describe("isAddonCompatibleWithBodyShape", () => {
  it("is compatible when no bodyShape constraint is set", () => {
    const addon = makeAddon();
    expect(isAddonCompatibleWithBodyShape(addon, "bean").compatible).toBe(true);
  });

  it("is compatible when the shape is in the allow-list", () => {
    const addon = makeAddon({ compatibleBodyShapes: ["bean", "orb"] });
    expect(isAddonCompatibleWithBodyShape(addon, "bean").compatible).toBe(true);
  });

  it("is incompatible when the shape is not in the allow-list", () => {
    const addon = makeAddon({ compatibleBodyShapes: ["crystal"] });
    const result = isAddonCompatibleWithBodyShape(addon, "bean");
    expect(result.compatible).toBe(false);
    expect(result.reason).toBe("body-shape-unsupported");
  });

  it("is compatible when no bodyShape is supplied at all (non-Body-Forge forms)", () => {
    const addon = makeAddon({ compatibleBodyShapes: ["crystal"] });
    expect(isAddonCompatibleWithBodyShape(addon, null).compatible).toBe(true);
  });
});

describe("resolveAddonCompatibility", () => {
  it("form incompatibility short-circuits before checking body shape", () => {
    const addon = makeAddon({
      compatibleForms: ["auralia"],
      compatibleBodyShapes: ["bean"],
    });
    const result = resolveAddonCompatibility(addon, "evolved", "crystal");
    expect(result.reason).toBe("form-unsupported");
  });

  it("is fully compatible when both form and shape pass", () => {
    const addon = makeAddon({
      compatibleForms: ["evolved"],
      compatibleBodyShapes: ["bean"],
    });
    const result = resolveAddonCompatibility(addon, "evolved", "bean");
    expect(result.compatible).toBe(true);
  });
});

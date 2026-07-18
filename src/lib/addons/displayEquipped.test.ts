import { describe, expect, it } from "vitest";
import { getDisplayEquippedAddons } from "./displayEquipped";
import type { Addon } from "./types";

function makeAddon(id: string, category: Addon["category"] = "headwear"): Addon {
  return {
    id,
    name: id,
    description: "",
    category,
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
  };
}

describe("getDisplayEquippedAddons", () => {
  it("returns the equipped list unchanged when there is no preview", () => {
    const equipped = [makeAddon("hat"), makeAddon("staff", "weapon")];
    expect(getDisplayEquippedAddons(equipped, null)).toBe(equipped);
  });

  it("replaces the equipped item in the same slot with the preview", () => {
    const equipped = [makeAddon("old-hat"), makeAddon("staff", "weapon")];
    const preview = makeAddon("new-hat");
    const result = getDisplayEquippedAddons(equipped, preview);
    expect(result.map((a) => a.id).sort()).toEqual(["new-hat", "staff"]);
  });

  it("adds the preview alongside other slots when nothing is equipped in that slot", () => {
    const equipped = [makeAddon("staff", "weapon")];
    const preview = makeAddon("new-hat", "headwear");
    const result = getDisplayEquippedAddons(equipped, preview);
    expect(result.map((a) => a.id).sort()).toEqual(["new-hat", "staff"]);
  });

  it("never mutates the input equipped array", () => {
    const equipped = Object.freeze([makeAddon("hat")]);
    expect(() => getDisplayEquippedAddons(equipped as Addon[], makeAddon("new-hat"))).not.toThrow();
  });

  it("respects a custom equipSlot over category when merging", () => {
    const equipped = [{ ...makeAddon("old", "headwear"), equipSlot: "accessory" as const }];
    const preview = { ...makeAddon("new", "accessory") };
    const result = getDisplayEquippedAddons(equipped, preview);
    // Both resolve to the "accessory" slot (old via equipSlot override), so
    // the preview should replace it rather than sit alongside it.
    expect(result.map((a) => a.id)).toEqual(["new"]);
  });
});

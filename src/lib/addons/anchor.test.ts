import { describe, expect, it } from "vitest";
import { resolveAddonAnchor } from "./anchor";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import type { AddonAttachment } from "./types";

function attachment(overrides: Partial<AddonAttachment> = {}): AddonAttachment {
  return {
    anchorPoint: "head",
    offset: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    followAnimation: true,
    ...overrides,
  };
}

describe("resolveAddonAnchor", () => {
  it("places a head anchor above the eye line", () => {
    const pos = resolveAddonAnchor(DEFAULT_BODY_SPEC, attachment({ anchorPoint: "head" }));
    expect(pos.y).toBeLessThan(DEFAULT_BODY_SPEC.eyeHeight);
  });

  it("places body/back/aura anchors at the body center plus scaled offset", () => {
    const body = resolveAddonAnchor(DEFAULT_BODY_SPEC, attachment({ anchorPoint: "body" }));
    expect(body).toEqual({ x: 140, y: 112 });
  });

  it("mirrors left/right hand anchors around the body center", () => {
    const left = resolveAddonAnchor(DEFAULT_BODY_SPEC, attachment({ anchorPoint: "left-hand" }));
    const right = resolveAddonAnchor(DEFAULT_BODY_SPEC, attachment({ anchorPoint: "right-hand" }));
    expect(left.x).toBeLessThan(140);
    expect(right.x).toBeGreaterThan(140);
    expect(140 - left.x).toBeCloseTo(right.x - 140, 5);
  });

  it("scales the attachment offset down from the Auralia (400w) to Body Forge (280w) coordinate space", () => {
    const withOffset = resolveAddonAnchor(
      DEFAULT_BODY_SPEC,
      attachment({ anchorPoint: "body", offset: { x: 100, y: 0 } }),
    );
    // 100 * (280/400) = 70
    expect(withOffset.x).toBeCloseTo(210, 5);
  });

  it("never returns NaN for any anchor point", () => {
    const points: AddonAttachment["anchorPoint"][] = [
      "head",
      "body",
      "left-hand",
      "right-hand",
      "back",
      "floating",
      "aura",
    ];
    for (const anchorPoint of points) {
      const pos = resolveAddonAnchor(DEFAULT_BODY_SPEC, attachment({ anchorPoint }));
      expect(Number.isFinite(pos.x)).toBe(true);
      expect(Number.isFinite(pos.y)).toBe(true);
    }
  });
});

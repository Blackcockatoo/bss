import { describe, expect, it } from "vitest";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import { BODY_FORGE_ADDON_SCALE, resolveBodyForgeAnchor } from "./anchors";

describe("resolveBodyForgeAnchor", () => {
  it("places the head anchor above the eye line", () => {
    const anchor = resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, "head");
    expect(anchor.y).toBeLessThan(DEFAULT_BODY_SPEC.eyeHeight);
    expect(anchor.x).toBe(140);
  });

  it("places left-hand and right-hand symmetrically about the body's vertical axis", () => {
    const left = resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, "left-hand");
    const right = resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, "right-hand");
    expect(left.x).toBeLessThan(140);
    expect(right.x).toBeGreaterThan(140);
    expect(Math.abs(140 - left.x)).toBeCloseTo(Math.abs(right.x - 140));
    expect(left.y).toBe(right.y);
  });

  it("places the floating anchor above the body center", () => {
    const floating = resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, "floating");
    expect(floating.y).toBeLessThan(112);
  });

  it("centers body/back/aura anchors on the body silhouette center", () => {
    for (const anchor of ["body", "back", "aura"] as const) {
      expect(resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, anchor)).toEqual({ x: 140, y: 112 });
    }
  });

  it("stays within the 0..280 x 0..250 PetBodyRenderer viewBox for the default spec", () => {
    for (const anchor of ["head", "body", "left-hand", "right-hand", "back", "floating", "aura"] as const) {
      const { x, y } = resolveBodyForgeAnchor(DEFAULT_BODY_SPEC, anchor);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(280);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(250);
    }
  });
});

describe("BODY_FORGE_ADDON_SCALE", () => {
  it("scales Auralia's 400-wide authoring space down to Body Forge's 280-wide viewBox", () => {
    expect(BODY_FORGE_ADDON_SCALE).toBeCloseTo(0.7);
  });
});

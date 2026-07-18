/**
 * Anchor-point resolution for the Evolved / Body Forge stage.
 *
 * `PetBodyRenderer` draws in a fixed `0 0 280 250` viewBox (see
 * PetBodyRenderer.tsx) with the whole body centred at (140, 112) and the
 * face row at `spec.eyeHeight`. This resolves the same anchor vocabulary
 * Auralia's `AddonRenderer` uses (`head|body|left-hand|right-hand|back|
 * floating|aura`) into that coordinate space, so addons can render inside
 * `PetBodyRenderer`'s own `<svg>` — no separate scale/offset math, no DOM
 * lookup: the addon layer is a sibling drawn in the exact same viewBox.
 */

import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import type { AddonAttachment } from "./types";

/** Auralia's addon offsets/scales were authored for its 400-wide viewBox;
 * Body Forge draws in a 280-wide viewBox. Scaling by the ratio keeps a
 * reused addon proportionate instead of oversized. */
export const BODY_FORGE_ADDON_SCALE = 280 / 400;

export function resolveBodyForgeAnchor(
  spec: BodySpec,
  anchorPoint: AddonAttachment["anchorPoint"],
): { x: number; y: number } {
  const centerX = 140;
  const bodyCenterY = 112;

  switch (anchorPoint) {
    case "head":
      return { x: centerX, y: spec.eyeHeight - spec.eyeSize - 20 };
    case "body":
      return { x: centerX, y: bodyCenterY };
    case "left-hand":
      return { x: centerX - spec.bodyWidth * 0.55, y: bodyCenterY + spec.bodyHeight * 0.28 };
    case "right-hand":
      return { x: centerX + spec.bodyWidth * 0.55, y: bodyCenterY + spec.bodyHeight * 0.28 };
    case "back":
      return { x: centerX, y: bodyCenterY };
    case "floating":
      return { x: centerX, y: bodyCenterY - spec.bodyHeight * 0.66 };
    case "aura":
      return { x: centerX, y: bodyCenterY };
    default:
      return { x: centerX, y: bodyCenterY };
  }
}

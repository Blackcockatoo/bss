/**
 * Resolves an add-on's base render position from a Body Forge BodySpec.
 *
 * AddonRenderer's original `defaultPosition` logic assumes a fixed legacy
 * "Auralia" coordinate system (body center ~(200,210), head ~(200,145)) —
 * see AddonRenderer.tsx. That mapping is untouched and still used by the
 * Auralia renderer. This module provides the equivalent mapping for the
 * canonical Evolved/Body Forge body, whose geometry is procedural
 * (BodySpec-driven, viewBox 0 0 280 250, body center (140,112)) rather than
 * fixed, so anchors must be computed from the spec instead of hard-coded.
 */

import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import type { AddonAttachment } from "./types";

const BODY_CENTER_X = 140;
const BODY_CENTER_Y = 112;

/**
 * AddonAttachment.offset values were tuned against the Auralia renderer's
 * 400x400 viewBox. PetBodyRenderer's viewBox is 280x250. Scaling by the
 * viewBox-width ratio keeps an addon's offset proportionally similar in
 * size across both renderers without needing per-addon retuning.
 */
const AURALIA_VIEWBOX_WIDTH = 400;
const BODY_FORGE_VIEWBOX_WIDTH = 280;
const OFFSET_SCALE = BODY_FORGE_VIEWBOX_WIDTH / AURALIA_VIEWBOX_WIDTH;

export function resolveAddonAnchor(
  spec: BodySpec,
  attachment: AddonAttachment,
): { x: number; y: number } {
  let anchorX = BODY_CENTER_X;
  let anchorY = BODY_CENTER_Y;

  switch (attachment.anchorPoint) {
    case "head":
      anchorY = spec.eyeHeight - spec.eyeSize * 2;
      break;
    case "body":
      anchorY = BODY_CENTER_Y;
      break;
    case "left-hand":
      anchorX = BODY_CENTER_X - spec.bodyWidth * 0.55;
      anchorY = BODY_CENTER_Y + spec.bodyHeight * 0.28;
      break;
    case "right-hand":
      anchorX = BODY_CENTER_X + spec.bodyWidth * 0.55;
      anchorY = BODY_CENTER_Y + spec.bodyHeight * 0.28;
      break;
    case "back":
      anchorX = BODY_CENTER_X;
      anchorY = BODY_CENTER_Y;
      break;
    case "floating":
      anchorX = BODY_CENTER_X;
      anchorY = spec.eyeHeight - spec.eyeSize * 4;
      break;
    case "aura":
      anchorX = BODY_CENTER_X;
      anchorY = BODY_CENTER_Y;
      break;
  }

  return {
    x: anchorX + attachment.offset.x * OFFSET_SCALE,
    y: anchorY + attachment.offset.y * OFFSET_SCALE,
  };
}

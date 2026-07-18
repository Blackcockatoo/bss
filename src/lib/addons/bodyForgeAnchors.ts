/**
 * Body Forge addon anchoring - positions wardrobe addons on the Evolved /
 * Body Forge creature's SVG (viewBox "0 0 280 250", see PetBodyRenderer).
 *
 * Addon attachment offsets/scale in the catalog were authored against
 * Auralia's 400x400 canvas. BODY_FORGE_ADDON_SCALE (280/400) keeps them
 * visually proportionate when reused here instead of re-authoring every
 * template for a second canvas size.
 */

import type { AddonAttachment } from './types';

export const BODY_FORGE_ADDON_SCALE = 280 / 400;

/** Body horizontal center; matches the "140" constant used throughout PetBodyRenderer. */
const CENTER_X = 140;
/** Body vertical center: `y + bodyHeight / 2` where `y = 112 - bodyHeight / 2`, constant for any spec. */
const CENTER_Y = 112;

export interface BodyForgeAnchorSpec {
  bodyWidth: number;
  bodyHeight: number;
}

/** Resolve an addon's anchor point to Body Forge canvas coordinates. */
export function resolveBodyForgeAnchor(
  spec: BodyForgeAnchorSpec,
  anchorPoint: AddonAttachment['anchorPoint'],
  offset: AddonAttachment['offset'],
): { x: number; y: number } {
  const halfW = spec.bodyWidth / 2;
  const halfH = spec.bodyHeight / 2;

  let anchorX = CENTER_X;
  let anchorY = CENTER_Y;

  switch (anchorPoint) {
    case 'head':
      // Above the third-eye/crown feature band (y 38-76) so headwear reads
      // as worn on top of the head rather than colliding with it.
      anchorY = 40;
      break;
    case 'body':
      anchorY = CENTER_Y;
      break;
    case 'left-hand':
      anchorX = CENTER_X - halfW * 0.95;
      anchorY = CENTER_Y - halfH * 0.1;
      break;
    case 'right-hand':
      anchorX = CENTER_X + halfW * 0.95;
      anchorY = CENTER_Y - halfH * 0.1;
      break;
    case 'back':
      anchorX = CENTER_X;
      anchorY = CENTER_Y;
      break;
    case 'floating':
      anchorX = CENTER_X;
      anchorY = CENTER_Y - halfH - 40;
      break;
    case 'aura':
      anchorX = CENTER_X;
      anchorY = CENTER_Y;
      break;
  }

  return {
    x: anchorX + offset.x * BODY_FORGE_ADDON_SCALE,
    y: anchorY + offset.y * BODY_FORGE_ADDON_SCALE,
  };
}

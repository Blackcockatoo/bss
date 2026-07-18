"use client";

/**
 * Draws every equipped gameplay cosmetic on a pet stage, split into the
 * behind-body / in-front-of-body halves the renderers expose, in
 * WARDROBE_LAYER_ORDER. The host supplies anchor resolution in its own
 * coordinate space, so the same layer works on the Body Forge stage and
 * on Auralia without duplicate scale math.
 */

import { CosmeticRenderer } from "./CosmeticRenderer";
import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import {
  WARDROBE_FIRST_FRONT_LAYER,
  WARDROBE_LAYER_ORDER,
  type AttachmentAnchor,
  type WardrobeItem,
} from "@/lib/wardrobe/types";

export function orderWardrobeItems(items: readonly WardrobeItem[]): WardrobeItem[] {
  return [...items].sort(
    (a, b) => WARDROBE_LAYER_ORDER.indexOf(a.category) - WARDROBE_LAYER_ORDER.indexOf(b.category),
  );
}

function isFrontLayer(item: WardrobeItem): boolean {
  return (
    WARDROBE_LAYER_ORDER.indexOf(item.category) >=
    WARDROBE_LAYER_ORDER.indexOf(WARDROBE_FIRST_FRONT_LAYER)
  );
}

export interface WardrobeCosmeticLayerProps {
  items: readonly WardrobeItem[];
  layer: "behind" | "front";
  resolveAnchor: (anchor: AttachmentAnchor) => { x: number; y: number };
  scale?: number;
  reduceMotion?: boolean;
  bodyRadius?: number;
}

export function WardrobeCosmeticLayer({
  items,
  layer,
  resolveAnchor,
  scale = 1,
  reduceMotion = false,
  bodyRadius = 60,
}: WardrobeCosmeticLayerProps) {
  const visible = orderWardrobeItems(items).filter((item) =>
    layer === "front" ? isFrontLayer(item) : !isFrontLayer(item),
  );
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((item) => (
        <CosmeticRenderer
          key={item.id}
          item={item}
          resolveAnchor={resolveAnchor}
          scale={scale}
          reduceMotion={reduceMotion}
          bodyRadius={bodyRadius}
        />
      ))}
    </>
  );
}

/**
 * Anchor resolution for the Body Forge / Evolved stage (PetBodyRenderer's
 * 280×250 viewBox, body centred at 140,112). Reads the live BodySpec so
 * anchors track the forged anatomy instead of fixed offsets.
 */
export function resolveBodyForgeCosmeticAnchor(
  spec: BodySpec,
  anchor: AttachmentAnchor,
): { x: number; y: number } {
  const centerX = 140;
  const centerY = 112;
  switch (anchor) {
    case "headTop":
      return { x: centerX, y: spec.eyeHeight - spec.eyeSize - 22 };
    case "forehead":
      return { x: centerX, y: spec.eyeHeight - spec.eyeSize - 6 };
    case "faceCenter":
      return { x: centerX, y: spec.eyeHeight + 10 };
    case "backCenter":
    case "bodyCenter":
    case "auraRing":
      return { x: centerX, y: centerY };
    case "wingRoots":
      return { x: centerX - spec.bodyWidth * 0.42, y: 103 };
    case "hand":
      return { x: centerX + spec.bodyWidth * 0.55, y: centerY + spec.bodyHeight * 0.28 };
    case "ground":
      return { x: centerX, y: centerY + spec.bodyHeight * 0.62 };
  }
}

/**
 * Anchor resolution for the Auralia stage (400×400 viewBox; body centre
 * 200,210 and head centre 200,145 — same constants AddonRenderer uses).
 */
export function resolveAuraliaCosmeticAnchor(anchor: AttachmentAnchor): {
  x: number;
  y: number;
} {
  switch (anchor) {
    case "headTop":
      return { x: 200, y: 118 };
    case "forehead":
      return { x: 200, y: 136 };
    case "faceCenter":
      return { x: 200, y: 150 };
    case "backCenter":
    case "bodyCenter":
    case "auraRing":
      return { x: 200, y: 210 };
    case "wingRoots":
      return { x: 168, y: 196 };
    case "hand":
      return { x: 236, y: 226 };
    case "ground":
      return { x: 200, y: 262 };
  }
}

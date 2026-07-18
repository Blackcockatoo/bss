"use client";

/**
 * Renders equipped/previewing add-ons on the Evolved / Body Forge body.
 *
 * This is the fix for "the Evolved / Body Forge creature cannot properly
 * use the wardrobe": Auralia was the only form with an addon overlay.
 * Rendered as two slots (`addonsBehind`/`addonsFront`) injected directly
 * into `PetBodyRenderer`'s own `<svg viewBox="0 0 280 250">`, so addon
 * coordinates live in exactly the same space as the body — no separate
 * scale math, and Arrange Mode drag math measures the real stage via
 * `stageRef` (the ref `PetBodyRenderer` forwards to its root `<svg>`)
 * instead of any global DOM lookup.
 */

import type React from "react";
import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import { BODY_FORGE_ADDON_SCALE, resolveBodyForgeAnchor } from "@/lib/addons/anchors";
import type { Addon, AddonPositionOverride } from "@/lib/addons/types";
import { AddonRenderer, AddonSVGDefs } from "./AddonRenderer";

export interface BodyForgeAddonLayerProps {
  addons: Addon[];
  spec: BodySpec;
  layer: "behind-body" | "front";
  animationPhase?: number;
  reduceMotion?: boolean;
  arrangeMode?: boolean;
  stageRef?: React.RefObject<SVGSVGElement | null>;
  positionOverrides?: Record<string, AddonPositionOverride>;
  onPositionChange?: (addonId: string, x: number, y: number) => void;
  onToggleLock?: (addonId: string, locked: boolean) => void;
  onResetPosition?: (addonId: string) => void;
  onAddonTap?: (addon: Addon) => void;
}

export function BodyForgeAddonLayer({
  addons,
  spec,
  layer,
  animationPhase = 0,
  reduceMotion = false,
  arrangeMode = false,
  stageRef,
  positionOverrides,
  onPositionChange,
  onToggleLock,
  onResetPosition,
  onAddonTap,
}: BodyForgeAddonLayerProps) {
  const items = addons.filter((addon) => (addon.renderLayer ?? "front") === layer);
  if (items.length === 0) return null;

  return (
    <>
      {layer === "front" && <AddonSVGDefs />}
      {items.map((addon) => (
        <AddonRenderer
          key={addon.id}
          addon={addon}
          animationPhase={animationPhase}
          reduceMotion={reduceMotion}
          positionOverride={positionOverrides?.[addon.id]}
          draggable={arrangeMode}
          resolveAnchor={(anchor) => resolveBodyForgeAnchor(spec, anchor)}
          scaleMultiplier={BODY_FORGE_ADDON_SCALE}
          stageRef={stageRef}
          viewBoxWidth={280}
          onPositionChange={(x, y) => onPositionChange?.(addon.id, x, y)}
          onToggleLock={(locked) => onToggleLock?.(addon.id, locked)}
          onResetPosition={() => onResetPosition?.(addon.id)}
          onTap={onAddonTap ? () => onAddonTap(addon) : undefined}
        />
      ))}
    </>
  );
}

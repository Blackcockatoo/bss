"use client";

/**
 * Renders equipped (and, during Living Wardrobe try-on, previewed) addons
 * on top of the canonical Evolved/Body Forge body. This is the fix for the
 * add-on system's core disconnect: AddonRenderer previously only mounted
 * inside AuraliaMetaPet, so anything equipped never appeared once a pet
 * moved to the 'evolved' form (which Body Forge always switches to). This
 * component reuses AddonRenderer as-is, supplying a BodySpec-derived anchor
 * instead of the Auralia-coordinate default.
 */

import { useEffect, useRef, useState } from "react";
import { AddonRenderer, AddonSVGDefs } from "@/components/addons/AddonRenderer";
import type { BodySpec } from "@/components/body-forge/PetBodyRenderer";
import { resolveAddonAnchor } from "@/lib/addons/anchor";
import { resolveAddonDefaults } from "@/lib/addons/compatibility";
import { useAddonStore, type Addon } from "@/lib/addons";
import type { MovementPerformance } from "@/pet/performance";

export interface AddonLayerProps {
  spec: BodySpec;
  /** Addon ids to render, e.g. equipped ids merged with any live try-on preview. */
  addonIds: readonly string[];
  performance?: MovementPerformance | null;
  reduceMotion?: boolean;
  /** Arrange Mode: enables drag-to-reposition on each rendered addon. */
  arrangeMode?: boolean;
}

export function AddonLayer({
  spec,
  addonIds,
  performance = null,
  reduceMotion = false,
  arrangeMode = false,
}: AddonLayerProps) {
  const addons = useAddonStore((state) => state.addons);
  const positionOverrides = useAddonStore((state) => state.positionOverrides);
  const setAddonPosition = useAddonStore((state) => state.setAddonPosition);
  const lockAddonPosition = useAddonStore((state) => state.lockAddonPosition);
  const resetAddonPosition = useAddonStore((state) => state.resetAddonPosition);

  const [phase, setPhase] = useState(0);
  const hasAddons = addonIds.length > 0;
  useEffect(() => {
    if (!hasAddons || reduceMotion || typeof window === "undefined") return;
    let raf = 0;
    let last = window.performance.now();
    const tick = () => {
      const now = window.performance.now();
      setPhase((prev) => prev + (now - last));
      last = now;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [hasAddons, reduceMotion]);

  const resolved: Addon[] = addonIds
    .map((id) => addons[id])
    .filter((addon): addon is Addon => Boolean(addon));

  if (resolved.length === 0) return null;

  return (
    <>
      <AddonSVGDefs />
      {resolved.map((addon) => {
        const defaults = resolveAddonDefaults(addon);
        const anchorOverride = resolveAddonAnchor(spec, addon.attachment);
        const bodyTransform =
          defaults.followsBody && performance
            ? { x: performance.bodyX, y: performance.bodyY, rotation: performance.rotation }
            : undefined;
        return (
          <AddonRenderer
            key={addon.id}
            addon={addon}
            animationPhase={phase}
            reduceMotion={reduceMotion}
            anchorOverride={anchorOverride}
            bodyTransform={bodyTransform}
            positionOverride={positionOverrides?.[addon.id]}
            draggable={arrangeMode}
            onPositionChange={(x, y) => setAddonPosition(addon.id, x, y)}
            onToggleLock={(locked) => lockAddonPosition(addon.id, locked)}
            onResetPosition={() => resetAddonPosition(addon.id)}
          />
        );
      })}
    </>
  );
}

'use client';

import { PetRendererRouter } from '@/components/PetRendererRouter';

interface PetRuntimeStageProps {
  addonEditMode?: boolean;
  onAddonEditModeChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
}

/**
 * The one authoritative pet stage used by the canonical /pet route.
 *
 * The three visual forms — Auralia, Evolved (DNA / Body Forge) and Geometry
 * (Sri Yantra) — are all renderers over the same pet. Keeping the routing in
 * PetRendererRouter prevents navigation from silently swapping the active
 * body engine.
 */
export function PetRuntimeStage({
  addonEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
}: PetRuntimeStageProps) {
  return (
    <PetRendererRouter
      variant="stage"
      addonEditMode={addonEditMode}
      onAddonEditModeChange={onAddonEditModeChange}
      showAdvanced={showAdvanced}
    />
  );
}

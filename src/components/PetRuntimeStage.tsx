'use client';

import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { VisualDNAPet } from '@/components/VisualDNAPet';
import { useStore } from '@/lib/store';

interface PetRuntimeStageProps {
  addonEditMode?: boolean;
  onAddonEditModeChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
}

/**
 * The one authoritative pet-stage switch used by the canonical /pet route.
 *
 * `geometric` is the Visual DNA / Body Forge renderer. `auralia` preserves the
 * specialist Guardian experience. Keeping this decision in one component
 * prevents route navigation from silently swapping the active body engine.
 */
export function PetRuntimeStage({
  addonEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
}: PetRuntimeStageProps) {
  const petType = useStore((state) => state.petType);

  if (petType === 'auralia') {
    return (
      <div data-testid="auralia-pet-runtime" className="h-full min-h-[520px]">
        <AuraliaMetaPet
          addonEditMode={addonEditMode}
          onAddonEditModeChange={onAddonEditModeChange}
          showAdvanced={showAdvanced}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="visual-dna-pet-runtime"
      className="flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5"
    >
      <VisualDNAPet className="w-full max-w-3xl" />
    </div>
  );
}

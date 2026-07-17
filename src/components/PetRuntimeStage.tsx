'use client';

import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { SriYantraPetDisplay } from '@/components/SriYantraPetDisplay';
import { VisualDNAPet } from '@/components/VisualDNAPet';
import { PetRuntimeDiagnostics } from '@/components/dev/PetRuntimeDiagnostics';
import { useStore } from '@/lib/store';
import { useSyncExternalStore } from 'react';

const subscribeToClientReady = () => () => {};
const getClientReadySnapshot = () => true;
const getServerReadySnapshot = () => false;

interface PetRuntimeStageProps {
  addonEditMode?: boolean;
  onAddonEditModeChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
}

/**
 * The one authoritative pet-stage switch used by the canonical /pet route.
 *
 * Auralia, Evolved (Visual DNA / Body Forge), and Geometry (Sri Yantra) are
 * three renderers of the same companion state. Moss60 is NOT a renderer: it
 * is the movement/identity performance layer that drives the Evolved body.
 * Keeping this decision in one component prevents route navigation from
 * silently swapping the companion identity or runtime.
 */
export function PetRuntimeStage({
  addonEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
}: PetRuntimeStageProps) {
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );
  const petType = useStore((state) => state.petType);
  const genome = useStore((state) => state.genome);

  // Auralia and the DNA renderers use time, canvas, and reduced-motion state.
  // Keep them out of the server snapshot so hydration is deterministic, then
  // mount exactly one authoritative renderer as soon as the client is ready.
  if (!clientReady) {
    return (
      <div
        data-testid="pet-runtime-loading"
        role="status"
        className="flex min-h-[520px] items-center justify-center text-sm text-cyan-200/75"
      >
        Preparing companion form…
      </div>
    );
  }

  if (petType === 'auralia') {
    return (
      <div
        data-testid="auralia-pet-runtime"
        className="relative h-full min-h-[520px]"
      >
        <PetRuntimeDiagnostics />
        <AuraliaMetaPet
          addonEditMode={addonEditMode}
          onAddonEditModeChange={onAddonEditModeChange}
          showAdvanced={showAdvanced}
        />
      </div>
    );
  }

  if (petType === 'geometry') {
    return (
      <div
        data-testid="geometry-pet-runtime"
        className="relative flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5"
      >
        <PetRuntimeDiagnostics />
        <SriYantraPetDisplay
          red={genome?.red60.join('')}
          blue={genome?.blue60.join('')}
          black={genome?.black60.join('')}
          animated
        />
      </div>
    );
  }

  return (
    <div
      data-testid="visual-dna-pet-runtime"
      className="relative flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5"
    >
      <PetRuntimeDiagnostics />
      <VisualDNAPet className="w-full max-w-3xl" arrangeMode={addonEditMode} />
    </div>
  );
}

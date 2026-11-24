'use client';

import { LearnedCompanionMotion } from './LearnedCompanionMotion';
import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { GeometryAvatarRenderer } from '@/components/GeometryAvatarRenderer';
import { VisualDNAPet } from '@/components/VisualDNAPet';
import { PetRuntimeDiagnostics } from '@/components/dev/PetRuntimeDiagnostics';
import { AliveProvider } from "@/pet/alive/AliveContext";
import { AliveControls } from "@/pet/alive/AliveControls";
import { usePetRegistryStore } from "@/lib/registry/runtime";
import { useStore } from '@/lib/store';
import { useSyncExternalStore } from 'react';

const subscribeToClientReady = () => () => {};
const getClientReadySnapshot = () => true;
const getServerReadySnapshot = () => false;

interface PetRuntimeStageProps {
  compact?: boolean;
  addonEditMode?: boolean;
  onAddonEditModeChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
  interactivePerformance?: boolean;
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
  compact = false,
  addonEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
  interactivePerformance = false,
}: PetRuntimeStageProps) {
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );
  const petType = useStore((state) => state.petType);
  const record = usePetRegistryStore(state => state.activeRecord);

  function withPerformance(children: React.ReactNode) {
    if (!interactivePerformance || !record) return children;
    return <AliveProvider key={`${record.petId}:${petType}`} record={record} form={petType} editing={Boolean(addonEditMode)}>
      {children}
      <AliveControls petId={record.petId} />
    </AliveProvider>;
  }

  // Auralia and the DNA renderers use time, canvas, and reduced-motion state.
  // Keep them out of the server snapshot so hydration is deterministic, then
  // mount exactly one authoritative renderer as soon as the client is ready.
  if (!clientReady || (interactivePerformance && !record)) {
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
    return withPerformance(
      <div
        data-testid="auralia-pet-runtime"
        className="relative h-full min-h-[520px]"
      >
        <PetRuntimeDiagnostics />
        <LearnedCompanionMotion><AuraliaMetaPet
          addonEditMode={addonEditMode}
          onAddonEditModeChange={onAddonEditModeChange}
          showAdvanced={showAdvanced}
        /></LearnedCompanionMotion>
      </div>
    );
  }

  if (petType === 'geometry') {
    return withPerformance(
      <div
        data-testid="geometry-pet-runtime"
        className="relative flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5"
      >
        <PetRuntimeDiagnostics />
        <LearnedCompanionMotion><GeometryAvatarRenderer animated compact={compact} showPersonality={!compact} /></LearnedCompanionMotion>
      </div>
    );
  }

  return withPerformance(
    <div
      data-testid="visual-dna-pet-runtime"
      className="relative flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5"
    >
      <PetRuntimeDiagnostics />
      <LearnedCompanionMotion><VisualDNAPet showReadout={!compact} className="w-full max-w-3xl" /></LearnedCompanionMotion>
    </div>
  );
}

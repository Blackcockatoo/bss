'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { deriveMoss60PetProfile } from '@/lib/moss60/petProfile';
import { SriYantraPetDisplay } from './SriYantraPetDisplay';
import type { PetMovementPreset } from './SriYantraPetEngine';

interface GeometryAvatarRendererProps {
  animated?: boolean;
  compact?: boolean;
  movement?: PetMovementPreset;
}

/**
 * The geometric pet's avatar presentation. Moss60/Sri Yantra (via
 * SriYantraPetDisplay) stays the internal geometry/markings/aura engine;
 * this wrapper is what call sites reach for and is what derives that
 * engine's red/blue/black packets from the live genome layer, instead of
 * each call site talking to SriYantraPetDisplay directly.
 */
export function GeometryAvatarRenderer({
  animated = true,
  compact = false,
  movement = 'idle',
}: GeometryAvatarRendererProps) {
  const genome = useStore((state) => state.genome);
  const petType = useStore((state) => state.petType);

  const petProfile = useMemo(
    () =>
      deriveMoss60PetProfile({
        petType,
        genome,
        source: genome ? 'live' : 'fallback',
      }),
    [genome, petType],
  );

  return (
    <SriYantraPetDisplay
      red={petProfile.strands.red}
      blue={petProfile.strands.blue}
      black={petProfile.strands.black}
      animated={animated}
      compact={compact}
      movement={movement}
    />
  );
}

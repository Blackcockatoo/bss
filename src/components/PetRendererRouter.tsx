'use client';

import { useMemo } from 'react';

import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import AuraliaSprite from '@/components/AuraliaSprite';
import { SriYantraPetDisplay } from '@/components/SriYantraPetDisplay';
import { VisualDNAPet } from '@/components/VisualDNAPet';
import { useStore } from '@/lib/store';

interface PetRendererRouterProps {
  /**
   * 'stage' is the full-height Pet Overview experience; 'compact' fits the
   * renderer into small hero slots such as the app home screen.
   */
  variant?: 'stage' | 'compact';
  addonEditMode?: boolean;
  onAddonEditModeChange?: (enabled: boolean) => void;
  showAdvanced?: boolean;
  staticMode?: boolean;
}

/**
 * The one place that maps the three-form pet state onto a renderer:
 * Auralia (canonical sprite companion), Evolved (DNA / Body Forge body) and
 * Geometry (Sri Yantra manifestation). All three read the same store — pet
 * name, genome, vitals, evolution and inventory — so switching form swaps
 * only the renderer, never the pet.
 */
export function PetRendererRouter({
  variant = 'stage',
  addonEditMode,
  onAddonEditModeChange,
  showAdvanced = false,
  staticMode = false,
}: PetRendererRouterProps) {
  const petType = useStore((state) => state.petType);
  const genome = useStore((state) => state.genome);

  // The Sri Yantra engine reads per-index digits from each strand, so the
  // live 60-digit genome strands drive the Geometry form directly.
  const strandPackets = useMemo(
    () =>
      genome
        ? {
            red: genome.red60.join(''),
            blue: genome.blue60.join(''),
            black: genome.black60.join(''),
          }
        : null,
    [genome],
  );

  if (petType === 'auralia') {
    if (variant === 'compact') {
      return (
        <AuraliaSprite size="large" interactive staticMode={staticMode} />
      );
    }
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

  if (petType === 'geometry') {
    return (
      <div
        data-testid="geometry-pet-runtime"
        className={
          variant === 'compact'
            ? 'flex h-full w-full items-center justify-center'
            : 'flex h-full min-h-[520px] items-center justify-center p-3 sm:p-5'
        }
      >
        <SriYantraPetDisplay
          red={strandPackets?.red}
          blue={strandPackets?.blue}
          black={strandPackets?.black}
          animated={!staticMode}
          compact={variant === 'compact'}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return <VisualDNAPet className="h-full w-full" showReadout={false} />;
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

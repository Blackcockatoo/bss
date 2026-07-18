/**
 * WardrobeEquippedLayer — draws equipped wardrobe cosmetics on the live pet.
 *
 * Rendered twice inside the pet SVG: once with layer="behind" (environment,
 * back, wings, body patterns, auras — drawn under the body) and once with
 * layer="front" (head, horns, face, held, trail — drawn over it). Order
 * within a layer follows WARDROBE_LAYER_ORDER.
 */

'use client';

import { AddonRenderer } from '@/components/addons/AddonRenderer';
import {
  WARDROBE_SLOTS_BEHIND_PET,
  getEquippedCosmeticRenderables,
  useWardrobeStore,
  wardrobeLayerRank,
} from '@/lib/wardrobe';
import type React from 'react';
import { useMemo } from 'react';

interface WardrobeEquippedLayerProps {
  layer: 'behind' | 'front';
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  reduceMotion?: boolean;
}

export const WardrobeEquippedLayer: React.FC<WardrobeEquippedLayerProps> = ({
  layer,
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  reduceMotion = false,
}) => {
  const equippedBySlot = useWardrobeStore((state) => state.equippedBySlot);

  const renderables = useMemo(
    () =>
      getEquippedCosmeticRenderables(equippedBySlot)
        .filter(({ item }) =>
          layer === 'behind'
            ? WARDROBE_SLOTS_BEHIND_PET.has(item.category)
            : !WARDROBE_SLOTS_BEHIND_PET.has(item.category),
        )
        .sort(
          (a, b) =>
            wardrobeLayerRank(a.item.category) -
            wardrobeLayerRank(b.item.category),
        ),
    [equippedBySlot, layer],
  );

  if (renderables.length === 0) return null;

  return (
    <g data-testid={`wardrobe-layer-${layer}`}>
      {renderables.map(({ item, renderable }) => (
        <g key={item.id} data-testid={`wardrobe-equipped-${item.id}`}>
          <AddonRenderer
            addon={renderable}
            petPosition={petPosition}
            animationPhase={animationPhase}
            reduceMotion={reduceMotion}
          />
        </g>
      ))}
    </g>
  );
};

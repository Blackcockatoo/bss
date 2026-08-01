/**
 * The one stage palette every renderer paints evolution with.
 *
 * The stage colours were previously resolved two different ways: the panel
 * and the ceremony overlay used the branch-tinted `getStageVisuals`, while
 * the Visual DNA pipeline carried its own `stageColors` on the phenotype.
 * A Mystic Sage at SPECIATION therefore wore its branch colours in the
 * ceremony and generic stage colours on its body.
 *
 * Renderers call this instead, so the sigil on the creature, the ceremony
 * overlay and the Evolution panel all agree — including the genome branch's
 * tint, which is the whole point of having branches.
 */

import { getEvolutionBranch, getStageVisuals } from '@/evolution/branching';
import type { EvolutionState } from '@/evolution/types';
import type { DerivedTraits } from '@/genome/types';

export interface StagePalette {
  /** Primary stroke/mark colour. */
  color: string;
  /** Alternating accent for the same mark. */
  accentColor: string;
  /** Wash colour for stage glow/aura layers. */
  glowColor: string;
}

export function resolveStagePalette(
  state: EvolutionState,
  traits: DerivedTraits | null | undefined
): StagePalette {
  const { colors } = getStageVisuals(state, getEvolutionBranch(traits));
  const primary = colors[0];
  return {
    color: primary,
    accentColor: colors[2] ?? colors[1] ?? primary,
    glowColor: colors[1] ?? primary,
  };
}

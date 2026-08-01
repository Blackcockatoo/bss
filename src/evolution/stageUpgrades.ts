/**
 * What an evolution stage visibly does to the creature.
 *
 * Evolution used to be almost invisible on the body: two features (third eye
 * at QUANTUM, crown at SPECIATION) and a faint complexity nudge on horns and
 * wings. Reaching NEURO changed nothing you could point at. This module is
 * the one place that answers "what did evolving actually give me?", so the
 * body renderer, the movement layer and the UI all describe the same upgrade.
 *
 * Contract — evolution owns *earned growth*, never identity:
 *
 *  - it only ever ADDS features; it can never remove one the genome or the
 *    Body Forge chose;
 *  - it scales bounded presentation channels (size, outline, glow, horn and
 *    wing reach) — it never rewrites shape, pattern or colour;
 *  - each stage's values are ABSOLUTE for that stage, not compounding, so a
 *    save that lands directly at SPECIATION looks identical to one that
 *    walked every stage.
 *
 * The feature union is kept local rather than imported from the renderer so
 * this stays a pure domain module. `bodyForgeAdapter` assigns it straight
 * into `BodyFeature[]`, which is the compile-time proof the two agree.
 */

import { EVOLUTION_ORDER, type EvolutionState } from './types';

/** Anatomy evolution is allowed to grant. Must stay a subset of `BodyFeature`. */
export type EvolutionGrantedFeature =
  | 'wings'
  | 'horns'
  | 'crown'
  | 'thirdEye'
  | 'tailFlame';

/**
 * The sigil a stage etches onto the body surface. Each one mirrors that
 * stage's aura topology (see `EVOLUTION_PROFILES` in resolveVisualDNA), so
 * the body and the field around it tell the same story.
 */
export type EvolutionMarkShape = 'helix' | 'lattice' | 'phase' | 'crown';

export interface EvolutionStageUpgrade {
  state: EvolutionState;
  /** Features this stage newly grants. Earlier stages' grants still apply. */
  grantsFeatures: readonly EvolutionGrantedFeature[];
  /** Multiplier on the inherited body scale at this stage. */
  bodyScale: number;
  /** Added to the inherited outline width, in body viewBox px. */
  outlineBonus: number;
  /** Added to the inherited glow, 0..1. */
  glowBonus: number;
  /** Multiplier on inherited horn length. */
  hornScale: number;
  /** Multiplier on inherited wing spread. */
  wingScale: number;
  /** Surface sigil for this stage. */
  mark: EvolutionMarkShape;
  /** How many sigil elements the renderer draws. */
  markCount: number;
  /** 0..1 how strongly the sigil reads against the body. */
  markIntensity: number;
  /** Player-facing lines describing what this stage added. */
  summary: readonly string[];
}

export const EVOLUTION_STAGE_UPGRADES: Record<
  EvolutionState,
  EvolutionStageUpgrade
> = {
  GENETICS: {
    state: 'GENETICS',
    grantsFeatures: [],
    bodyScale: 1,
    outlineBonus: 0,
    glowBonus: 0,
    hornScale: 1,
    wingScale: 1,
    mark: 'helix',
    markCount: 2,
    markIntensity: 0.55,
    summary: ['A single genome strand traced across the shell'],
  },
  NEURO: {
    state: 'NEURO',
    grantsFeatures: ['horns'],
    bodyScale: 1.05,
    outlineBonus: 0.5,
    glowBonus: 0.07,
    hornScale: 1,
    wingScale: 1,
    mark: 'lattice',
    markCount: 5,
    markIntensity: 0.68,
    summary: [
      'Neural antennae break through the shell',
      'The body grows and its outline sharpens',
      'A synapse lattice lights up across the surface',
    ],
  },
  QUANTUM: {
    state: 'QUANTUM',
    grantsFeatures: ['thirdEye'],
    bodyScale: 1.1,
    outlineBonus: 0.9,
    glowBonus: 0.14,
    hornScale: 1.12,
    wingScale: 1.08,
    mark: 'phase',
    markCount: 3,
    markIntensity: 0.78,
    summary: [
      'The third eye opens',
      'Horns lengthen and the whole body glows brighter',
      'Phase rings drift out of alignment on the surface',
    ],
  },
  SPECIATION: {
    state: 'SPECIATION',
    grantsFeatures: ['crown', 'wings'],
    bodyScale: 1.16,
    outlineBonus: 1.3,
    glowBonus: 0.22,
    hornScale: 1.22,
    wingScale: 1.2,
    mark: 'crown',
    markCount: 7,
    markIntensity: 0.88,
    summary: [
      'Wings unfurl and the species crown forms',
      'Full-grown frame at its brightest and boldest',
      'A crown of rays radiates from the body',
    ],
  },
};

/** Everything a pet at `state` has earned: this stage plus every earlier one. */
export interface CumulativeEvolutionUpgrade {
  state: EvolutionState;
  /** 0-based position in `EVOLUTION_ORDER`; -1 for an unknown state. */
  stageIndex: number;
  /** Every feature granted up to and including this stage. */
  features: readonly EvolutionGrantedFeature[];
  bodyScale: number;
  outlineBonus: number;
  glowBonus: number;
  hornScale: number;
  wingScale: number;
  mark: EvolutionMarkShape;
  markCount: number;
  markIntensity: number;
}

export function getEvolutionStageUpgrade(
  state: EvolutionState
): EvolutionStageUpgrade {
  return EVOLUTION_STAGE_UPGRADES[state] ?? EVOLUTION_STAGE_UPGRADES.GENETICS;
}

/**
 * Resolves the reached stage into the total upgrade. Scalars come from the
 * reached stage (they are absolute, not compounding); features accumulate.
 */
export function getCumulativeEvolutionUpgrade(
  state: EvolutionState
): CumulativeEvolutionUpgrade {
  const stageIndex = EVOLUTION_ORDER.indexOf(state);
  const reached = getEvolutionStageUpgrade(state);
  const features = new Set<EvolutionGrantedFeature>();

  for (let index = 0; index <= stageIndex; index += 1) {
    for (const feature of getEvolutionStageUpgrade(EVOLUTION_ORDER[index])
      .grantsFeatures) {
      features.add(feature);
    }
  }

  return {
    state,
    stageIndex,
    features: [...features],
    bodyScale: reached.bodyScale,
    outlineBonus: reached.outlineBonus,
    glowBonus: reached.glowBonus,
    hornScale: reached.hornScale,
    wingScale: reached.wingScale,
    mark: reached.mark,
    markCount: reached.markCount,
    markIntensity: reached.markIntensity,
  };
}

/**
 * The lines to show a player when a stage is reached: what changed on the
 * creature they are looking at, not abstract stage lore.
 */
export function describeEvolutionUpgrade(state: EvolutionState): string[] {
  return [...getEvolutionStageUpgrade(state).summary];
}

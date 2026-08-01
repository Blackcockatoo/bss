import type { DerivedTraits } from '../genome/types';
import type { EvolutionState, StageVisuals } from './types';
import { EVOLUTION_ORDER, EVOLUTION_VISUALS } from './types';

/**
 * A branch flavours the shared four-stage ladder with the genome's latent
 * evolution path: titles, accent colours, and the apex form presented at
 * SPECIATION. Branches are derived from traits at runtime, so old saves
 * pick up their branch as soon as a genome exists.
 */
export interface EvolutionBranch {
  id: string;
  label: string;
  /** Accent triad blended into stage visuals; full takeover at the apex. */
  accentColors: [string, string, string];
  /** Short flavour line shown alongside stage info. */
  motto: string;
  /** Name of the branch's final SPECIATION form. */
  apexTitle: string;
}

const NEUTRAL_BRANCH: EvolutionBranch = {
  id: 'unaligned',
  label: 'Unaligned',
  accentColors: ['#94a3b8', '#64748b', '#475569'],
  motto: 'A path not yet written in the genome.',
  apexTitle: 'Prime Apex',
};

const BRANCHES: Record<string, EvolutionBranch> = {
  'Celestial Ascendant': {
    id: 'celestial-ascendant',
    label: 'Celestial Ascendant',
    accentColors: ['#facc15', '#fde68a', '#f59e0b'],
    motto: 'Rises toward the starfield it was seeded from.',
    apexTitle: 'Celestial Ascendant Apex',
  },
  'Primal Beast': {
    id: 'primal-beast',
    label: 'Primal Beast',
    accentColors: ['#f97316', '#ea580c', '#9a3412'],
    motto: 'Raw instinct honed into unstoppable momentum.',
    apexTitle: 'Primal Beast Apex',
  },
  'Mystic Sage': {
    id: 'mystic-sage',
    label: 'Mystic Sage',
    accentColors: ['#a78bfa', '#8b5cf6', '#6d28d9'],
    motto: 'Knows the pattern beneath every pattern.',
    apexTitle: 'Mystic Sage Apex',
  },
  'Guardian Sentinel': {
    id: 'guardian-sentinel',
    label: 'Guardian Sentinel',
    accentColors: ['#34d399', '#10b981', '#047857'],
    motto: 'A shield first, and a shield last.',
    apexTitle: 'Guardian Sentinel Apex',
  },
  'Chaos Trickster': {
    id: 'chaos-trickster',
    label: 'Chaos Trickster',
    accentColors: ['#f472b6', '#ec4899', '#be185d'],
    motto: 'Never the same shape twice.',
    apexTitle: 'Chaos Trickster Apex',
  },
  'Harmonic Healer': {
    id: 'harmonic-healer',
    label: 'Harmonic Healer',
    accentColors: ['#5eead4', '#2dd4bf', '#0d9488'],
    motto: 'Mends what the world frays.',
    apexTitle: 'Harmonic Healer Apex',
  },
  'Void Walker': {
    id: 'void-walker',
    label: 'Void Walker',
    accentColors: ['#818cf8', '#6366f1', '#3730a3'],
    motto: 'At home in the spaces between.',
    apexTitle: 'Void Walker Apex',
  },
};

export function getEvolutionBranch(
  traits: DerivedTraits | null | undefined
): EvolutionBranch {
  const path = traits?.latent.evolutionPath;
  return (path && BRANCHES[path]) || NEUTRAL_BRANCH;
}

/**
 * Stage visuals tinted by branch: earlier stages keep their identity with a
 * branch accent mixed in; the apex stage (end of EVOLUTION_ORDER) is fully
 * painted in branch colours.
 */
export function getStageVisuals(
  state: EvolutionState,
  branch: EvolutionBranch
): StageVisuals {
  const base = EVOLUTION_VISUALS[state];
  const isApex = state === EVOLUTION_ORDER[EVOLUTION_ORDER.length - 1];

  if (isApex) {
    // The unaligned branch's palette is slate: handing it the whole apex
    // would make the final stage read DULLER than the one before it, on the
    // panel, in the ceremony, and on the creature. A pet with no genome
    // keeps the stage's own colours until a real branch claims it.
    if (branch.id === NEUTRAL_BRANCH.id) return base;
    return { ...base, colors: [...branch.accentColors] };
  }

  const colors = [...base.colors];
  colors[colors.length - 1] = branch.accentColors[0];
  return { ...base, colors };
}

/** How many rare abilities are revealed at each stage. */
const ABILITY_REVEAL_COUNT: Record<EvolutionState, number> = {
  GENETICS: 0,
  NEURO: 1,
  QUANTUM: 2,
  SPECIATION: Number.POSITIVE_INFINITY,
};

/**
 * Rare abilities from the genome are revealed progressively as the pet
 * evolves: one at NEURO, two at QUANTUM, all at SPECIATION.
 */
export function getUnlockedAbilities(
  traits: DerivedTraits | null | undefined,
  state: EvolutionState
): string[] {
  const abilities = traits?.latent.rareAbilities ?? [];
  const count = ABILITY_REVEAL_COUNT[state] ?? 0;
  return abilities.slice(0, count === Number.POSITIVE_INFINITY ? abilities.length : count);
}

/** Display title for a stage, using the branch apex name at SPECIATION. */
export function getStageDisplayTitle(
  state: EvolutionState,
  branch: EvolutionBranch,
  baseTitle: string
): string {
  const isApex = state === EVOLUTION_ORDER[EVOLUTION_ORDER.length - 1];
  return isApex ? branch.apexTitle : baseTitle;
}

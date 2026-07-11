import type { DerivedTraits } from '../genome/types';
import type { EvolutionState } from './types';

/**
 * Snapshot of pet progress used to evaluate stage-specific special
 * conditions. Built by the store from live state; callers without access to
 * this data can omit it and special conditions are treated as met (matching
 * the behaviour before conditions existed).
 */
export interface EvolutionContext {
  traits: DerivedTraits | null;
  battleWins: number;
  miniGamesPlayed: number;
  essence: number;
}

export interface SpecialConditionResult {
  met: boolean;
  description: string;
}

interface ConditionSpec {
  description: string;
  isMet: (context: EvolutionContext) => boolean;
}

/** Bond beyond basic care: share at least one activity together. */
const NEURO_CONDITION: ConditionSpec = {
  description:
    'Complete a bonding activity — play a mini-game or spar in the arena.',
  isMet: context => context.miniGamesPlayed >= 1 || context.battleWins >= 1,
};

const QUANTUM_CONDITION: ConditionSpec = {
  description:
    'Achieve quantum coherence — win 3 battles or complete 5 mini-games.',
  isMet: context => context.battleWins >= 3 || context.miniGamesPlayed >= 5,
};

/**
 * The final stage is flavoured by the genome's latent evolution path: each
 * archetype asks for a different mastery before speciation.
 */
const SPECIATION_PATH_CONDITIONS: Record<string, ConditionSpec> = {
  'Celestial Ascendant': {
    description: 'Gather 60 essence to fuel the ascension.',
    isMet: context => context.essence >= 60,
  },
  'Primal Beast': {
    description: 'Prove primal dominance — win 5 battles.',
    isMet: context => context.battleWins >= 5,
  },
  'Mystic Sage': {
    description: 'Master the mind — complete 8 mini-games.',
    isMet: context => context.miniGamesPlayed >= 8,
  },
  'Guardian Sentinel': {
    description: 'Stand guard — win 3 battles and hold 30 essence.',
    isMet: context => context.battleWins >= 3 && context.essence >= 30,
  },
  'Chaos Trickster': {
    description: 'Court chaos — 5 mini-games and 2 battle wins.',
    isMet: context => context.miniGamesPlayed >= 5 && context.battleWins >= 2,
  },
  'Harmonic Healer': {
    description: 'Restore harmony — gather 40 essence.',
    isMet: context => context.essence >= 40,
  },
  'Void Walker': {
    description: 'Walk the void — 3 mini-games and 30 essence.',
    isMet: context => context.miniGamesPlayed >= 3 && context.essence >= 30,
  },
};

const SPECIATION_DEFAULT_CONDITION: ConditionSpec = {
  description:
    'Refine the PrimeTail crest — gather 40 essence or complete 8 activities.',
  isMet: context =>
    context.essence >= 40 ||
    context.battleWins + context.miniGamesPlayed >= 8,
};

function getConditionSpec(
  targetState: EvolutionState,
  context: EvolutionContext
): ConditionSpec | null {
  switch (targetState) {
    case 'NEURO':
      return NEURO_CONDITION;
    case 'QUANTUM':
      return QUANTUM_CONDITION;
    case 'SPECIATION': {
      const path = context.traits?.latent.evolutionPath;
      return (
        (path && SPECIATION_PATH_CONDITIONS[path]) ||
        SPECIATION_DEFAULT_CONDITION
      );
    }
    default:
      return null;
  }
}

/**
 * Evaluate the special condition gating evolution into `targetState`.
 * Returns null when the stage has no special condition (GENETICS).
 */
export function evaluateSpecialCondition(
  targetState: EvolutionState,
  context: EvolutionContext
): SpecialConditionResult | null {
  const spec = getConditionSpec(targetState, context);
  if (!spec) {
    return null;
  }
  return {
    met: spec.isMet(context),
    description: spec.description,
  };
}

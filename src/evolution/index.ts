import type { DerivedTraits } from '../genome/types';
import type { EvolutionData, EvolutionState, EvolutionRequirement } from './types';
import { EVOLUTION_REQUIREMENTS, EVOLUTION_ORDER } from './types';
import type { EvolutionContext } from './conditions';
import { evaluateSpecialCondition } from './conditions';
import { getEvolutionBranch, getUnlockedAbilities } from './branching';

export * from './types';
export * from './conditions';
export * from './branching';

export interface RequirementSnapshot {
  state: EvolutionState;
  requirements: EvolutionRequirement;
}

export interface RequirementProgress {
  nextState: EvolutionState;
  ageProgress: number;
  interactionsProgress: number;
  vitalsProgress: number;
  specialMet: boolean;
  specialDescription?: string;
}

const getElapsedSinceLastEvolution = (evolution: EvolutionData): number =>
  Date.now() - evolution.lastEvolutionTime;

const getNextState = (state: EvolutionState): EvolutionState | null => {
  const currentIndex = EVOLUTION_ORDER.indexOf(state);
  if (currentIndex === -1 || currentIndex === EVOLUTION_ORDER.length - 1) {
    return null;
  }
  return EVOLUTION_ORDER[currentIndex + 1];
};

const getXpRequiredForLevel = (level: number): number => {
  // BaseXP * Level^2
  const BASE_XP = 10;
  return BASE_XP * level * level;
};

const normalizeProgress = (value: number, maximum: number): number => {
  if (maximum <= 0) {
    return 1;
  }
  return Math.min(1, Math.max(0, value / maximum));
};

export function initializeEvolution(): EvolutionData {
  const now = Date.now();
  return {
    state: 'GENETICS',
    birthTime: now,
    lastEvolutionTime: now,
    experience: 0,
    level: 1,
    currentLevelXp: 0,
    totalXp: 0,
    totalInteractions: 0,
    canEvolve: false,
  };
}

function isSpecialConditionMet(
  nextState: EvolutionState,
  requirements: EvolutionRequirement,
  context?: EvolutionContext
): boolean {
  // Without a progress snapshot we cannot evaluate stage conditions, so
  // callers that omit context keep the pre-conditions behaviour.
  if (context) {
    return evaluateSpecialCondition(nextState, context)?.met ?? true;
  }
  return requirements.specialCondition ? requirements.specialCondition() : true;
}

export function checkEvolutionEligibility(
  evolution: EvolutionData,
  vitalsAverage: number,
  context?: EvolutionContext
): boolean {
  const nextState = getNextState(evolution.state);
  if (!nextState) {
    return false;
  }

  const requirements = EVOLUTION_REQUIREMENTS[nextState];

  const ageElapsed = getElapsedSinceLastEvolution(evolution);
  const isAgeMet = ageElapsed >= requirements.minAge;
  const isInteractionsMet = evolution.totalInteractions >= requirements.minInteractions;
  const isVitalsMet = vitalsAverage >= requirements.minVitalsAverage;
  const isLevelMet = evolution.level >= requirements.minLevel;
  const isSpecialMet = isSpecialConditionMet(nextState, requirements, context);

  return isAgeMet && isInteractionsMet && isVitalsMet && isLevelMet && isSpecialMet;
}

export function evolvePet(evolution: EvolutionData): EvolutionData {
  const nextState = getNextState(evolution.state);

  if (!nextState) {
    return evolution;
  }

  return {
    ...evolution,
    state: nextState,
    lastEvolutionTime: Date.now(),
    experience: 0,
    canEvolve: false,
  };
}

/** Uniform boost applied to every vital when a stage is reached. */
export const EVOLUTION_VITALS_BOOST = 10;

const STAGE_ESSENCE_GRANTS: Partial<Record<EvolutionState, number>> = {
  NEURO: 25,
  QUANTUM: 50,
  SPECIATION: 100,
};

const STAGE_ACHIEVEMENT_IDS: Partial<Record<EvolutionState, string>> = {
  NEURO: 'evolve-neuro',
  QUANTUM: 'evolve-quantum',
  SPECIATION: 'evolve-speciation',
};

export interface EvolutionEffects {
  /** Added to every vital, clamped to 0-100 by the caller. */
  vitalsBoost: number;
  essenceGrant: number;
  /** Newly revealed rare abilities (not previously unlocked). */
  abilitiesRevealed: string[];
  achievementId: string | null;
}

export interface ApplyEvolutionResult {
  evolution: EvolutionData;
  /** Null when the pet could not evolve (already at the final stage). */
  effects: EvolutionEffects | null;
}

/**
 * Evolve the pet and compute the stage's concrete payoffs: a vitals boost,
 * an essence grant, newly revealed rare abilities, and the stage
 * achievement. Also stamps the genome branch and unlocked abilities onto the
 * persisted evolution data. `evolvePet` remains the effect-free primitive.
 */
export function applyEvolution(
  evolution: EvolutionData,
  traits: DerivedTraits | null
): ApplyEvolutionResult {
  const evolved = evolvePet(evolution);
  if (evolved === evolution) {
    return { evolution, effects: null };
  }

  const branch = getEvolutionBranch(traits);
  const unlocked = getUnlockedAbilities(traits, evolved.state);
  const previouslyUnlocked = new Set(
    evolution.abilitiesUnlocked ??
      getUnlockedAbilities(traits, evolution.state)
  );
  const abilitiesRevealed = unlocked.filter(
    ability => !previouslyUnlocked.has(ability)
  );

  return {
    evolution: {
      ...evolved,
      branchId: branch.id,
      abilitiesUnlocked: unlocked,
    },
    effects: {
      vitalsBoost: EVOLUTION_VITALS_BOOST,
      essenceGrant: STAGE_ESSENCE_GRANTS[evolved.state] ?? 0,
      abilitiesRevealed,
      achievementId: STAGE_ACHIEVEMENT_IDS[evolved.state] ?? null,
    },
  };
}

export function gainExperience(evolution: EvolutionData, xp: number): EvolutionData {
  // Update experience (capped at 100) for legacy compatibility
  const newExperience = Math.min(100, evolution.experience + xp);

  let newEvolution = {
    ...evolution,
    experience: newExperience,
    totalXp: evolution.totalXp + xp,
    currentLevelXp: evolution.currentLevelXp + xp,
    totalInteractions: evolution.totalInteractions + 1,
  };

  let levelUp = true;
  while (levelUp) {
    const nextLevel = newEvolution.level + 1;
    const xpToNextLevel = getXpRequiredForLevel(nextLevel);

    if (newEvolution.currentLevelXp >= xpToNextLevel) {
      newEvolution = {
        ...newEvolution,
        level: nextLevel,
        currentLevelXp: newEvolution.currentLevelXp - xpToNextLevel,
      };
      // Continue the loop to check for multiple level-ups
    } else {
      levelUp = false;
    }
  }

  return newEvolution;
}

export function getTimeUntilNextEvolution(evolution: EvolutionData): number {
  const nextState = getNextState(evolution.state);

  if (!nextState) {
    return -1;
  }

  const requirements = EVOLUTION_REQUIREMENTS[nextState];
  const ageElapsed = getElapsedSinceLastEvolution(evolution);

  return Math.max(0, requirements.minAge - ageElapsed);
}

export function getEvolutionProgress(
  evolution: EvolutionData,
  vitalsAverage: number
): number {
  const nextState = getNextState(evolution.state);

  if (!nextState) {
    return 100;
  }

  const requirements = EVOLUTION_REQUIREMENTS[nextState];
  const ageElapsed = getElapsedSinceLastEvolution(evolution);

  const ageProgress = normalizeProgress(ageElapsed, requirements.minAge);
  const interactionProgress = normalizeProgress(evolution.totalInteractions, requirements.minInteractions);
  const vitalsProgress = normalizeProgress(vitalsAverage, requirements.minVitalsAverage);

  return ((ageProgress + interactionProgress + vitalsProgress) / 3) * 100;
}

export function getNextEvolutionRequirement(evolution: EvolutionData): RequirementSnapshot | null {
  const nextState = getNextState(evolution.state);

  if (!nextState) {
    return null;
  }

  return {
    state: nextState,
    requirements: EVOLUTION_REQUIREMENTS[nextState],
  };
}

export function getRequirementProgress(
  evolution: EvolutionData,
  vitalsAverage: number,
  snapshot: RequirementSnapshot | null = getNextEvolutionRequirement(evolution),
  context?: EvolutionContext
): RequirementProgress | null {
  if (!snapshot) {
    return null;
  }

  const { requirements, state } = snapshot;
  const ageElapsed = getElapsedSinceLastEvolution(evolution);
  const ageProgress = normalizeProgress(ageElapsed, requirements.minAge);
  const interactionsProgress = normalizeProgress(evolution.totalInteractions, requirements.minInteractions);
  const vitalsProgress = normalizeProgress(vitalsAverage, requirements.minVitalsAverage);
  const special = context ? evaluateSpecialCondition(state, context) : null;
  const specialMet = special
    ? special.met
    : requirements.specialCondition
      ? requirements.specialCondition()
      : true;

  return {
    nextState: state,
    ageProgress,
    interactionsProgress,
    vitalsProgress,
    specialMet,
    specialDescription: special?.description ?? requirements.specialDescription,
  };
}

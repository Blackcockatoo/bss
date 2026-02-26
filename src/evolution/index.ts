import type { EvolutionData, EvolutionState, EvolutionRequirement } from './types';
import { EVOLUTION_REQUIREMENTS, EVOLUTION_ORDER } from './types';

export * from './types';

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

export function checkEvolutionEligibility(
  evolution: EvolutionData,
  vitalsAverage: number
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
  const isSpecialMet = requirements.specialCondition ? requirements.specialCondition() : true;

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
  snapshot: RequirementSnapshot | null = getNextEvolutionRequirement(evolution)
): RequirementProgress | null {
  if (!snapshot) {
    return null;
  }

  const { requirements, state } = snapshot;
  const ageElapsed = getElapsedSinceLastEvolution(evolution);
  const ageProgress = normalizeProgress(ageElapsed, requirements.minAge);
  const interactionsProgress = normalizeProgress(evolution.totalInteractions, requirements.minInteractions);
  const vitalsProgress = normalizeProgress(vitalsAverage, requirements.minVitalsAverage);
  const specialMet = requirements.specialCondition ? requirements.specialCondition() : true;

  return {
    nextState: state,
    ageProgress,
    interactionsProgress,
    vitalsProgress,
    specialMet,
    specialDescription: requirements.specialDescription,
  };
}

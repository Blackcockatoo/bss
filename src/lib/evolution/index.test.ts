import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initializeEvolution,
  checkEvolutionEligibility,
  evolvePet,
  gainExperience,
  getTimeUntilNextEvolution,
  getEvolutionProgress,
  getNextEvolutionRequirement,
  getRequirementProgress,
  type EvolutionData,
} from './index';
import { EVOLUTION_REQUIREMENTS } from './types';

describe('Evolution System', () => {
  describe('initializeEvolution', () => {
    it('should initialize with GENETICS state', () => {
      const evolution = initializeEvolution();

      expect(evolution.state).toBe('GENETICS');
      expect(evolution.experience).toBe(0);
      expect(evolution.totalInteractions).toBe(0);
      expect(evolution.canEvolve).toBe(false);
      expect(evolution.birthTime).toBeGreaterThan(0);
      expect(evolution.lastEvolutionTime).toBe(evolution.birthTime);
    });
  });

  describe('checkEvolutionEligibility', () => {
    it('should return false when pet is too young', () => {
      const evolution = initializeEvolution();
      const vitalsAverage = 80;

      const canEvolve = checkEvolutionEligibility(evolution, vitalsAverage);

      expect(canEvolve).toBe(false);
    });

    it('should return false when interactions are insufficient', () => {
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000_000, // Old enough
        lastEvolutionTime: Date.now() - 100_000_000,
        experience: 50,
        level: 1,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: 0, // Not enough interactions
        canEvolve: false,
      };
      const vitalsAverage = 80;

      const canEvolve = checkEvolutionEligibility(evolution, vitalsAverage);

      expect(canEvolve).toBe(false);
    });

    it('should return false when vitals average is too low', () => {
      const requirements = EVOLUTION_REQUIREMENTS.NEURO;
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000_000,
        lastEvolutionTime: Date.now() - 100_000_000,
        experience: 50,
        level: 1,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: requirements.minInteractions,
        canEvolve: false,
      };
      const vitalsAverage = 30; // Too low

      const canEvolve = checkEvolutionEligibility(evolution, vitalsAverage);

      expect(canEvolve).toBe(false);
    });

    it('should return true when all requirements are met', () => {
      const requirements = EVOLUTION_REQUIREMENTS.NEURO;
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000_000,
        lastEvolutionTime: Date.now() - 100_000_000,
        experience: 50,
        level: requirements.minLevel,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: requirements.minInteractions,
        canEvolve: false,
      };
      const vitalsAverage = requirements.minVitalsAverage;

      const canEvolve = checkEvolutionEligibility(evolution, vitalsAverage);

      expect(canEvolve).toBe(true);
    });

    it('should return false when already at max evolution', () => {
      const evolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now() - 100_000_000,
        lastEvolutionTime: Date.now() - 100_000_000,
        experience: 50,
        level: 15,
        currentLevelXp: 0,
        totalXp: 200,
        totalInteractions: 100,
        canEvolve: false,
      };
      const vitalsAverage = 80;

      const canEvolve = checkEvolutionEligibility(evolution, vitalsAverage);

      expect(canEvolve).toBe(false);
    });
  });

  describe('evolvePet', () => {
    it('should evolve pet to next state', () => {
      const originalEvolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000,
        lastEvolutionTime: Date.now() - 100_000,
        experience: 75,
        level: 1,
        currentLevelXp: 0,
        totalXp: 75,
        totalInteractions: 50,
        canEvolve: true,
      };

      const evolved = evolvePet(originalEvolution);

      expect(evolved.state).toBe('NEURO');
      expect(evolved.experience).toBe(0);
      expect(evolved.canEvolve).toBe(false);
      expect(evolved.lastEvolutionTime).toBeGreaterThan(originalEvolution.lastEvolutionTime);
    });

    it('should not evolve beyond max state', () => {
      const maxEvolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now() - 100_000,
        lastEvolutionTime: Date.now() - 50_000,
        experience: 100,
        level: 15,
        currentLevelXp: 0,
        totalXp: 300,
        totalInteractions: 200,
        canEvolve: false,
      };

      const result = evolvePet(maxEvolution);

      expect(result.state).toBe('SPECIATION');
      expect(result).toBe(maxEvolution);
    });

    it('should preserve birthTime and totalInteractions', () => {
      const originalEvolution: EvolutionData = {
        state: 'NEURO',
        birthTime: 1000,
        lastEvolutionTime: 5000,
        experience: 75,
        level: 5,
        currentLevelXp: 0,
        totalXp: 150,
        totalInteractions: 120,
        canEvolve: true,
      };

      const evolved = evolvePet(originalEvolution);

      expect(evolved.birthTime).toBe(originalEvolution.birthTime);
      expect(evolved.totalInteractions).toBe(originalEvolution.totalInteractions);
    });
  });

  describe('gainExperience', () => {
    it('should add experience and increment interactions', () => {
      const evolution = initializeEvolution();

      const updated = gainExperience(evolution, 10);

      expect(updated.experience).toBe(10);
      expect(updated.totalInteractions).toBe(1);
    });

    it('should cap experience at 100', () => {
      const evolution: EvolutionData = {
        ...initializeEvolution(),
        experience: 95,
      };

      const updated = gainExperience(evolution, 20);

      expect(updated.experience).toBe(100);
    });

    it('should accumulate interactions correctly', () => {
      let evolution = initializeEvolution();

      evolution = gainExperience(evolution, 5);
      evolution = gainExperience(evolution, 5);
      evolution = gainExperience(evolution, 5);

      expect(evolution.totalInteractions).toBe(3);
      expect(evolution.experience).toBe(15);
    });
  });

  describe('getTimeUntilNextEvolution', () => {
    it('should return time remaining when not old enough', () => {
      const requirements = EVOLUTION_REQUIREMENTS.NEURO;
      const timeSince = requirements.minAge - 60_000; // 1 minute short

      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - timeSince,
        lastEvolutionTime: Date.now() - timeSince,
        experience: 50,
        level: 1,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: 10,
        canEvolve: false,
      };

      const timeRemaining = getTimeUntilNextEvolution(evolution);

      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(60_000);
    });

    it('should return 0 when old enough', () => {
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000_000,
        lastEvolutionTime: Date.now() - 100_000_000,
        experience: 50,
        level: 1,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: 10,
        canEvolve: false,
      };

      const timeRemaining = getTimeUntilNextEvolution(evolution);

      expect(timeRemaining).toBe(0);
    });

    it('should return -1 at max evolution', () => {
      const evolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now() - 100_000,
        lastEvolutionTime: Date.now() - 50_000,
        experience: 50,
        level: 15,
        currentLevelXp: 0,
        totalXp: 200,
        totalInteractions: 100,
        canEvolve: false,
      };

      const timeRemaining = getTimeUntilNextEvolution(evolution);

      expect(timeRemaining).toBe(-1);
    });
  });

  describe('getEvolutionProgress', () => {
    it('should return 100 when at max evolution', () => {
      const evolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now() - 100_000,
        lastEvolutionTime: Date.now() - 50_000,
        experience: 50,
        level: 15,
        currentLevelXp: 0,
        totalXp: 200,
        totalInteractions: 100,
        canEvolve: false,
      };

      const progress = getEvolutionProgress(evolution, 80);

      expect(progress).toBe(100);
    });

    it('should return progress between 0 and 100', () => {
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - 100_000,
        lastEvolutionTime: Date.now() - 100_000,
        experience: 25,
        level: 1,
        currentLevelXp: 0,
        totalXp: 25,
        totalInteractions: 5,
        canEvolve: false,
      };

      const progress = getEvolutionProgress(evolution, 40);

      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(100);
    });
  });

  describe('getNextEvolutionRequirement', () => {
    it('should return next state requirements', () => {
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now(),
        lastEvolutionTime: Date.now(),
        experience: 0,
        level: 1,
        currentLevelXp: 0,
        totalXp: 0,
        totalInteractions: 0,
        canEvolve: false,
      };

      const requirement = getNextEvolutionRequirement(evolution);

      expect(requirement).not.toBeNull();
      expect(requirement?.state).toBe('NEURO');
      expect(requirement?.requirements).toBe(EVOLUTION_REQUIREMENTS.NEURO);
    });

    it('should return null at max evolution', () => {
      const evolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now(),
        lastEvolutionTime: Date.now(),
        experience: 0,
        level: 15,
        currentLevelXp: 0,
        totalXp: 0,
        totalInteractions: 0,
        canEvolve: false,
      };

      const requirement = getNextEvolutionRequirement(evolution);

      expect(requirement).toBeNull();
    });
  });

  describe('getRequirementProgress', () => {
    it('should return detailed progress breakdown', () => {
      const requirements = EVOLUTION_REQUIREMENTS.NEURO;
      const evolution: EvolutionData = {
        state: 'GENETICS',
        birthTime: Date.now() - requirements.minAge / 2, // 50% age progress
        lastEvolutionTime: Date.now() - requirements.minAge / 2,
        experience: 50,
        level: 1,
        currentLevelXp: 0,
        totalXp: 50,
        totalInteractions: requirements.minInteractions / 2, // 50% interaction progress
        canEvolve: false,
      };
      const vitalsAverage = requirements.minVitalsAverage / 2; // 50% vitals progress

      const progress = getRequirementProgress(evolution, vitalsAverage);

      expect(progress).not.toBeNull();
      expect(progress?.nextState).toBe('NEURO');
      expect(progress?.ageProgress).toBeCloseTo(0.5, 1);
      expect(progress?.interactionsProgress).toBeCloseTo(0.5, 1);
      expect(progress?.vitalsProgress).toBeCloseTo(0.5, 1);
    });

    it('should return null at max evolution', () => {
      const evolution: EvolutionData = {
        state: 'SPECIATION',
        birthTime: Date.now(),
        lastEvolutionTime: Date.now(),
        experience: 0,
        level: 15,
        currentLevelXp: 0,
        totalXp: 0,
        totalInteractions: 0,
        canEvolve: false,
      };

      const progress = getRequirementProgress(evolution, 80);

      expect(progress).toBeNull();
    });
  });
});

import { describe, expect, it } from 'vitest';

import type { EvolutionState } from '../../evolution/types';
import {
  computeGameReward,
  createSeededRng,
  generateSigilQuestion,
  getGameDifficulty,
  STAGE_TIER,
} from './gameMath';

const evolutionAt = (state: EvolutionState, level = 1) => ({ state, level });

describe('createSeededRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createSeededRng(1234);
    const b = createSeededRng(1234);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it('stays within [0, 1)', () => {
    const rng = createSeededRng(99);
    for (let i = 0; i < 200; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('produces different streams for different seeds', () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    const streamA = Array.from({ length: 5 }, () => a());
    const streamB = Array.from({ length: 5 }, () => b());
    expect(streamA).not.toEqual(streamB);
  });
});

describe('getGameDifficulty', () => {
  it('maps evolution stages to rising tiers', () => {
    expect(STAGE_TIER.GENETICS).toBe(1);
    expect(STAGE_TIER.NEURO).toBe(2);
    expect(STAGE_TIER.QUANTUM).toBe(3);
    expect(STAGE_TIER.SPECIATION).toBe(4);
  });

  it('scales every game up with the evolution stage', () => {
    const genetics = getGameDifficulty(evolutionAt('GENETICS'));
    const speciation = getGameDifficulty(evolutionAt('SPECIATION'));

    expect(speciation.memory.padCount).toBeGreaterThan(genetics.memory.padCount);
    expect(speciation.memory.startLength).toBeGreaterThan(genetics.memory.startLength);
    expect(speciation.memory.showMs).toBeLessThan(genetics.memory.showMs);
    expect(speciation.rhythm.bpm).toBeGreaterThan(genetics.rhythm.bpm);
    expect(speciation.rhythm.beats).toBeGreaterThan(genetics.rhythm.beats);
    expect(speciation.sigil.questions).toBeGreaterThan(genetics.sigil.questions);
    expect(speciation.vimana.startLevel).toBeGreaterThan(genetics.vimana.startLevel);
  });

  it('adds a level-based creep within a stage', () => {
    const fresh = getGameDifficulty(evolutionAt('NEURO', 1));
    const seasoned = getGameDifficulty(evolutionAt('NEURO', 30));
    expect(seasoned.rhythm.bpm).toBeGreaterThan(fresh.rhythm.bpm);
    expect(seasoned.memory.showMs).toBeLessThan(fresh.memory.showMs);
  });

  it('gates sequence families by tier', () => {
    const tier1 = getGameDifficulty(evolutionAt('GENETICS')).sigil.families;
    const tier4 = getGameDifficulty(evolutionAt('SPECIATION')).sigil.families;
    expect(tier1).toContain('arithmetic');
    expect(tier1).not.toContain('golden');
    expect(tier4).toContain('golden');
    expect(tier4).toContain('primes');
  });
});

describe('generateSigilQuestion', () => {
  it('produces solvable questions with the answer among four unique options', () => {
    const difficulty = getGameDifficulty(evolutionAt('SPECIATION')).sigil;
    const rng = createSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const question = generateSigilQuestion(difficulty, rng);
      expect(question.visible).toHaveLength(difficulty.visibleTerms);
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.answer);
      expect(question.lore.length).toBeGreaterThan(0);
      expect(difficulty.families).toContain(question.family);
    }
  });

  it('only draws from the tier-gated families', () => {
    const difficulty = getGameDifficulty(evolutionAt('GENETICS')).sigil;
    const rng = createSeededRng(7);
    for (let i = 0; i < 50; i++) {
      const question = generateSigilQuestion(difficulty, rng);
      expect(['arithmetic', 'square', 'fibonacci']).toContain(question.family);
    }
  });

  it('extends known sequences correctly (fibonacci property)', () => {
    const difficulty = getGameDifficulty(evolutionAt('GENETICS')).sigil;
    const rng = createSeededRng(11);
    for (let i = 0; i < 50; i++) {
      const question = generateSigilQuestion(difficulty, rng);
      if (question.family === 'fibonacci') {
        const terms = [...question.visible, question.answer];
        for (let t = 2; t < terms.length; t++) {
          expect(terms[t]).toBe(terms[t - 1] + terms[t - 2]);
        }
      }
    }
  });
});

describe('computeGameReward', () => {
  it('grants zero XP for no-progress runs', () => {
    const reward = computeGameReward(
      { game: 'memory', score: 0, roundsCompleted: 0 },
      evolutionAt('GENETICS'),
    );
    expect(reward.xp).toBe(0);
    expect(reward.essence).toBe(0);
    expect(reward.vitals).toEqual({});
  });

  it('caps XP by evolution tier so growth stays curve-bound', () => {
    const monster = {
      game: 'sigil' as const,
      score: 999,
      correctAnswers: 50,
      accuracy: 100,
    };
    expect(computeGameReward(monster, evolutionAt('GENETICS')).xp).toBe(15);
    expect(computeGameReward(monster, evolutionAt('SPECIATION')).xp).toBe(30);
  });

  it('rewards better performance with more XP', () => {
    const weak = computeGameReward(
      { game: 'rhythm', score: 5, accuracy: 30, combo: 2 },
      evolutionAt('QUANTUM'),
    );
    const strong = computeGameReward(
      { game: 'rhythm', score: 30, accuracy: 95, combo: 14 },
      evolutionAt('QUANTUM'),
    );
    expect(strong.xp).toBeGreaterThan(weak.xp);
  });

  it('keeps vitals boosts bounded', () => {
    const reward = computeGameReward(
      { game: 'memory', score: 100, roundsCompleted: 20 },
      evolutionAt('SPECIATION'),
    );
    expect(reward.vitals.mood).toBeLessThanOrEqual(12);
  });

  it('derives essence as a fraction of XP', () => {
    const reward = computeGameReward(
      { game: 'vimana', score: 800, lines: 12, level: 3 },
      evolutionAt('NEURO'),
    );
    expect(reward.essence).toBe(Math.floor(reward.xp / 3));
  });
});

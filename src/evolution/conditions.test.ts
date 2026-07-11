import { describe, expect, it } from 'vitest';

import { checkEvolutionEligibility, initializeEvolution } from './index';
import type { EvolutionContext } from './conditions';
import { evaluateSpecialCondition } from './conditions';
import { EVOLUTION_REQUIREMENTS } from './types';
import type { EvolutionData } from './types';
import type { DerivedTraits } from '../genome/types';

function makeContext(overrides: Partial<EvolutionContext> = {}): EvolutionContext {
  return {
    traits: null,
    battleWins: 0,
    miniGamesPlayed: 0,
    essence: 0,
    ...overrides,
  };
}

function makeTraits(evolutionPath: string): DerivedTraits {
  return {
    latent: {
      evolutionPath,
      rareAbilities: ['Star Whisper', 'Echo Step'],
      potential: { physical: 50, mental: 50, social: 50 },
      hiddenGenes: [],
    },
  } as unknown as DerivedTraits;
}

describe('evaluateSpecialCondition', () => {
  it('has no condition for the base stage', () => {
    expect(evaluateSpecialCondition('GENETICS', makeContext())).toBeNull();
  });

  it('requires a bonding activity for NEURO', () => {
    expect(evaluateSpecialCondition('NEURO', makeContext())?.met).toBe(false);
    expect(
      evaluateSpecialCondition('NEURO', makeContext({ miniGamesPlayed: 1 }))?.met,
    ).toBe(true);
    expect(
      evaluateSpecialCondition('NEURO', makeContext({ battleWins: 1 }))?.met,
    ).toBe(true);
  });

  it('requires battles or mini-games for QUANTUM', () => {
    expect(
      evaluateSpecialCondition('QUANTUM', makeContext({ battleWins: 2, miniGamesPlayed: 4 }))?.met,
    ).toBe(false);
    expect(
      evaluateSpecialCondition('QUANTUM', makeContext({ battleWins: 3 }))?.met,
    ).toBe(true);
    expect(
      evaluateSpecialCondition('QUANTUM', makeContext({ miniGamesPlayed: 5 }))?.met,
    ).toBe(true);
  });

  it('keys SPECIATION off the genome evolution path', () => {
    const beastContext = makeContext({
      traits: makeTraits('Primal Beast'),
      battleWins: 5,
    });
    const beast = evaluateSpecialCondition('SPECIATION', beastContext);
    expect(beast?.met).toBe(true);
    expect(beast?.description).toMatch(/primal dominance/i);

    const sageShort = evaluateSpecialCondition(
      'SPECIATION',
      makeContext({ traits: makeTraits('Mystic Sage'), miniGamesPlayed: 7 }),
    );
    expect(sageShort?.met).toBe(false);
    expect(sageShort?.description).toMatch(/8 mini-games/i);
  });

  it('falls back to a default condition without traits or for unknown paths', () => {
    const noTraits = evaluateSpecialCondition(
      'SPECIATION',
      makeContext({ essence: 40 }),
    );
    expect(noTraits?.met).toBe(true);

    const unknownPath = evaluateSpecialCondition(
      'SPECIATION',
      makeContext({ traits: makeTraits('Unmapped Path'), battleWins: 4, miniGamesPlayed: 4 }),
    );
    expect(unknownPath?.met).toBe(true);
  });
});

describe('checkEvolutionEligibility with context', () => {
  function readyForNeuro(): EvolutionData {
    const requirements = EVOLUTION_REQUIREMENTS.NEURO;
    return {
      ...initializeEvolution(),
      birthTime: Date.now() - requirements.minAge * 2,
      lastEvolutionTime: Date.now() - requirements.minAge * 2,
      level: requirements.minLevel,
      totalInteractions: requirements.minInteractions,
    };
  }

  it('blocks evolution when the special condition is unmet', () => {
    const evolution = readyForNeuro();
    const vitalsAverage = EVOLUTION_REQUIREMENTS.NEURO.minVitalsAverage;

    expect(
      checkEvolutionEligibility(evolution, vitalsAverage, makeContext()),
    ).toBe(false);
  });

  it('allows evolution when the special condition is met', () => {
    const evolution = readyForNeuro();
    const vitalsAverage = EVOLUTION_REQUIREMENTS.NEURO.minVitalsAverage;

    expect(
      checkEvolutionEligibility(
        evolution,
        vitalsAverage,
        makeContext({ miniGamesPlayed: 1 }),
      ),
    ).toBe(true);
  });

  it('keeps legacy behaviour when no context is provided', () => {
    const evolution = readyForNeuro();
    const vitalsAverage = EVOLUTION_REQUIREMENTS.NEURO.minVitalsAverage;

    expect(checkEvolutionEligibility(evolution, vitalsAverage)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import type { EvolutionData } from '../evolution/types';
import type { DerivedTraits } from '../genome/types';
import { DEFAULT_VITALS, type Vitals } from '../vitals';
import { resolveDigitalDosha } from './resolveDigitalDosha';

const traits: DerivedTraits = {
  physical: {
    bodyType: 'Crystalline',
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    pattern: 'Gradient',
    texture: 'Glowing',
    size: 0.92,
    proportions: { headRatio: 1, limbRatio: 0.8, tailRatio: 1.15 },
    features: ['Aura', 'Third Eye', 'Tail Flame'],
  },
  personality: {
    temperament: 'Curious',
    energy: 76,
    social: 65,
    curiosity: 88,
    discipline: 52,
    affection: 72,
    independence: 48,
    playfulness: 81,
    loyalty: 79,
    quirks: ['orbits shiny things'],
  },
  latent: {
    evolutionPath: 'Lattice Seraph',
    rareAbilities: ['phase-fold'],
    potential: { physical: 72, mental: 91, social: 75 },
    hiddenGenes: [3, 7, 11, 23],
  },
  elementWeb: {
    usedResidues: [1, 3, 7],
    pairSlots: [2, 8],
    frontierSlots: [5],
    voidSlotsHit: [0],
    coverage: 74,
    frontierAffinity: 22,
    bridgeCount: 6,
    voidDrift: 12,
  },
};

function createVitals(overrides: Partial<Vitals> = {}): Vitals {
  return { ...DEFAULT_VITALS, ...overrides };
}

function createEvolution(overrides: Partial<EvolutionData> = {}): EvolutionData {
  return {
    state: 'GENETICS',
    birthTime: 0,
    lastEvolutionTime: 0,
    experience: 0,
    level: 1,
    currentLevelXp: 0,
    totalXp: 0,
    totalInteractions: 0,
    canEvolve: false,
    ...overrides,
  };
}

function total(vector: { vata: number; pitta: number; kapha: number }): number {
  return vector.vata + vector.pitta + vector.kapha;
}

describe('resolveDigitalDosha', () => {
  it('creates a deterministic inherited constitution that is not forced to equal thirds', () => {
    const input = {
      traits,
      vitals: createVitals(),
      evolution: createEvolution(),
      now: 10_000,
    };
    const first = resolveDigitalDosha(input);
    const second = resolveDigitalDosha(input);

    expect(first).toEqual(second);
    expect(total(first.constitution.baseline)).toBeCloseTo(1, 8);
    expect(new Set(Object.values(first.constitution.baseline).map((value) => value.toFixed(4))).size).toBeGreaterThan(1);
  });

  it('preserves the same baseline while live conditions change the current state', () => {
    const stable = resolveDigitalDosha({
      traits,
      vitals: createVitals(),
      evolution: createEvolution(),
      now: 10_000,
    });
    const strained = resolveDigitalDosha({
      traits,
      vitals: createVitals({ hunger: 96, hygiene: 12, mood: 18 }),
      evolution: createEvolution(),
      now: 10_000,
    });

    expect(strained.constitution.baseline).toEqual(stable.constitution.baseline);
    expect(strained.state.current).not.toEqual(stable.state.current);
    expect(strained.state.coherence).toBeLessThan(stable.state.coherence);
  });

  it('turns recent play into a temporary Flux impulse', () => {
    const resting = resolveDigitalDosha({
      traits,
      vitals: createVitals(),
      evolution: createEvolution({ state: 'NEURO' }),
      now: 10_000,
    });
    const playing = resolveDigitalDosha({
      traits,
      vitals: createVitals(),
      evolution: createEvolution({ state: 'NEURO' }),
      lastAction: 'play',
      lastActionAt: 9_500,
      now: 10_000,
    });

    expect(playing.state.current.vata).toBeGreaterThan(resting.state.current.vata);
  });

  it('turns recent sleep into an Anchor impulse and lower volatility', () => {
    const restless = resolveDigitalDosha({
      traits,
      vitals: createVitals({ energy: 25 }),
      evolution: createEvolution(),
      now: 10_000,
    });
    const sleeping = resolveDigitalDosha({
      traits,
      vitals: createVitals({ energy: 25 }),
      evolution: createEvolution(),
      lastAction: 'sleep',
      lastActionAt: 9_500,
      now: 10_000,
    });

    expect(sleeping.state.current.kapha).toBeGreaterThan(restless.state.current.kapha);
    expect(sleeping.state.volatility).toBeLessThan(restless.state.volatility);
  });

  it('expresses severe unresolved conditions as residue rather than a medical diagnosis', () => {
    const overloaded = resolveDigitalDosha({
      traits,
      vitals: createVitals({
        hunger: 98,
        hygiene: 5,
        energy: 3,
        mood: 5,
        isSick: true,
        sicknessType: 'exhausted',
        sicknessSeverity: 95,
      }),
      evolution: createEvolution({ state: 'QUANTUM' }),
      now: 10_000,
    });

    expect(overloaded.state.residue).toBeGreaterThan(0.7);
    expect(overloaded.guidance.cue).toBe('integrate');
    expect(['fragmented', 'saturated']).toContain(overloaded.state.phase);
  });
});

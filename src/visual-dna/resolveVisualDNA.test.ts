import { describe, expect, it } from 'vitest';

import type { EvolutionData } from '../evolution/types';
import type { DerivedTraits } from '../genome/types';
import { DEFAULT_VITALS, type Vitals } from '../vitals';
import { resolveVisualDNA } from './resolveVisualDNA';

const traits: DerivedTraits = {
  physical: {
    bodyType: 'Crystalline',
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    pattern: 'Gradient',
    texture: 'Glowing',
    size: 0.92,
    proportions: {
      headRatio: 1,
      limbRatio: 0.8,
      tailRatio: 1.15,
    },
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
    potential: {
      physical: 72,
      mental: 91,
      social: 75,
    },
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

describe('resolveVisualDNA', () => {
  it('is deterministic for the same inherited identity and live state', () => {
    const input = {
      traits,
      vitals: createVitals(),
      evolution: createEvolution(),
      now: 10_000,
    };

    expect(resolveVisualDNA(input)).toEqual(resolveVisualDNA(input));
  });

  it('increases aura structure at every evolution stage without replacing inherited colours', () => {
    const stages = ['GENETICS', 'NEURO', 'QUANTUM', 'SPECIATION'] as const;
    const phenotypes = stages.map((state) =>
      resolveVisualDNA({
        traits,
        vitals: createVitals(),
        evolution: createEvolution({ state }),
        now: 10_000,
      }),
    );

    expect(phenotypes.map((item) => item.aura.topology)).toEqual([
      'halo',
      'neural-lattice',
      'phase-torus',
      'speciation-crown',
    ]);
    expect(phenotypes.map((item) => item.aura.rings)).toEqual([1, 2, 3, 4]);
    expect(phenotypes.every((item) => item.identity.baseColor === traits.physical.primaryColor)).toBe(true);
  });

  it('pulls the aura inward and focuses behaviour on food when hunger becomes critical', () => {
    const stable = resolveVisualDNA({
      traits,
      vitals: createVitals({ hunger: 35 }),
      evolution: createEvolution({ state: 'NEURO' }),
      now: 10_000,
    });
    const starving = resolveVisualDNA({
      traits,
      vitals: createVitals({ hunger: 96 }),
      evolution: createEvolution({ state: 'NEURO' }),
      now: 10_000,
    });

    expect(starving.behavior.state).toBe('starving');
    expect(starving.behavior.attention).toBe('food');
    expect(starving.aura.radius).toBeLessThan(stable.aura.radius);
    expect(starving.aura.inwardPull).toBeGreaterThan(0.7);
    expect(starving.particles.mode).toBe('inward');
  });

  it('expands and brightens the phenotype when mood is high', () => {
    const sad = resolveVisualDNA({
      traits,
      vitals: createVitals({ mood: 12 }),
      evolution: createEvolution({ state: 'QUANTUM' }),
      now: 10_000,
    });
    const joyful = resolveVisualDNA({
      traits,
      vitals: createVitals({ mood: 95 }),
      evolution: createEvolution({ state: 'QUANTUM' }),
      now: 10_000,
    });

    expect(joyful.behavior.state).toBe('joyful');
    expect(joyful.aura.radius).toBeGreaterThan(sad.aura.radius);
    expect(joyful.body.bobPixels).toBeGreaterThan(sad.body.bobPixels);
    expect(joyful.body.brightness).toBeGreaterThan(sad.body.brightness);
  });

  it('lets sickness destabilize aura geometry and override the resting state', () => {
    const sick = resolveVisualDNA({
      traits,
      vitals: createVitals({ isSick: true, sicknessType: 'dirty', sicknessSeverity: 82 }),
      evolution: createEvolution({ state: 'SPECIATION' }),
      now: 10_000,
    });

    expect(sick.behavior.state).toBe('sick');
    expect(sick.aura.turbulence).toBeGreaterThan(0.65);
    expect(sick.aura.asymmetry).toBeGreaterThan(0.65);
    expect(sick.particles.mode).toBe('static');
    expect(sick.face.expression).toBe('strained');
  });

  it('turns recent care into a temporary visual impulse and then returns to needs-based behaviour', () => {
    const duringPlay = resolveVisualDNA({
      traits,
      vitals: createVitals({ mood: 80 }),
      evolution: createEvolution({ state: 'NEURO' }),
      lastAction: 'play',
      lastActionAt: 9_500,
      now: 10_000,
    });
    const afterPlay = resolveVisualDNA({
      traits,
      vitals: createVitals({ mood: 80 }),
      evolution: createEvolution({ state: 'NEURO' }),
      lastAction: 'play',
      lastActionAt: 7_000,
      now: 10_000,
    });

    expect(duringPlay.behavior.state).toBe('playing');
    expect(duringPlay.behavior.actionActive).toBe(true);
    expect(afterPlay.behavior.state).toBe('joyful');
    expect(afterPlay.behavior.actionActive).toBe(false);
  });

  it('honours reduced motion without changing the resolved identity', () => {
    const normal = resolveVisualDNA({
      traits,
      vitals: createVitals(),
      evolution: createEvolution({ state: 'QUANTUM' }),
      now: 10_000,
    });
    const reduced = resolveVisualDNA({
      traits,
      vitals: createVitals(),
      evolution: createEvolution({ state: 'QUANTUM' }),
      now: 10_000,
      reducedMotion: true,
    });

    expect(reduced.identity).toEqual(normal.identity);
    expect(reduced.aura.pulseSeconds).toBe(0);
    expect(reduced.aura.rotationSeconds).toBe(0);
    expect(reduced.body.bobPixels).toBe(0);
    expect(reduced.particles.mode).toBe('none');
  });
});

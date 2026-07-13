import { describe, expect, it } from 'vitest';

import type { EvolutionData } from '../evolution/types';
import type { DerivedTraits, Genome } from '../genome/types';
import { DEFAULT_VITALS } from '../vitals';
import { resolveVisualDNA } from './resolveVisualDNA';
import {
  applyLivePhenotype,
  createGenomeBodySpec,
  genomeToVisualGenes,
  getGenomeVisualFingerprint,
  resolveBodySpec,
} from './bodyForgeAdapter';

const traits: DerivedTraits = {
  physical: {
    bodyType: 'Crystalline',
    primaryColor: '#123456',
    secondaryColor: '#abcdef',
    pattern: 'Iridescent',
    texture: 'Metallic',
    size: 0.92,
    proportions: { headRatio: 1, limbRatio: 0.8, tailRatio: 1.15 },
    features: ['Wings', 'Third Eye'],
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
    hiddenGenes: [3, 7, 1, 2, 3, 4, 5, 6, 2, 1, 0, 4, 5, 3, 2],
  },
  elementWeb: {
    usedResidues: [1, 3, 7],
    pairSlots: [2, 8],
    frontierSlots: [5],
    voidSlotsHit: [0],
    coverage: 0.74,
    frontierAffinity: 0.22,
    bridgeCount: 6,
    voidDrift: 0.12,
  },
};

const evolution: EvolutionData = {
  state: 'NEURO',
  birthTime: 0,
  lastEvolutionTime: 0,
  experience: 0,
  level: 1,
  currentLevelXp: 0,
  totalXp: 0,
  totalInteractions: 0,
  canEvolve: false,
};

function emptyGenome(): Genome {
  return {
    red60: Array(60).fill(0),
    blue60: Array(60).fill(0),
    black60: Array(60).fill(0),
  };
}

function changeGene(genome: Genome, geneIndex: number): Genome {
  const copy: Genome = {
    red60: [...genome.red60],
    blue60: [...genome.blue60],
    black60: [...genome.black60],
  };
  const flatIndex = geneIndex * 6;
  const lane = Math.floor(flatIndex / 60);
  const laneIndex = flatIndex % 60;
  [copy.red60, copy.blue60, copy.black60][lane][laneIndex] = 9;
  return copy;
}

function phenotype(hunger = 35) {
  return resolveVisualDNA({
    traits,
    vitals: { ...DEFAULT_VITALS, hunger },
    evolution,
    now: 10_000,
  });
}

describe('Body Forge visual genome bridge', () => {
  it('splits all 180 digits into thirty stable six-digit visual genes', () => {
    const genome: Genome = {
      red60: Array.from({ length: 60 }, (_, index) => index % 10),
      blue60: Array.from({ length: 60 }, (_, index) => (index + 3) % 10),
      black60: Array.from({ length: 60 }, (_, index) => (index + 6) % 10),
    };

    const genes = genomeToVisualGenes(genome);
    expect(genes).toHaveLength(30);
    expect(genes.slice(0, 3)).toEqual([12_345, 678_901, 234_567]);
    expect(genomeToVisualGenes(genome)).toEqual(genes);
  });

  it('lets every six-digit lane influence the permanent body specification', () => {
    const baseGenome = emptyGenome();
    const frame = phenotype();
    const baseBody = createGenomeBodySpec(frame, baseGenome);

    for (let geneIndex = 0; geneIndex < 30; geneIndex += 1) {
      const changedBody = createGenomeBodySpec(frame, changeGene(baseGenome, geneIndex));
      expect(changedBody, `visual gene ${geneIndex} should affect the body`).not.toEqual(baseBody);
    }
  });

  it('keeps forged anatomy inherited while live vitals deform its expression and posture', () => {
    const genome = changeGene(emptyGenome(), 23);
    const stable = phenotype(35);
    const starving = phenotype(96);
    const forged = {
      ...createGenomeBodySpec(stable, genome),
      name: 'Forged witness',
      shape: 'toroid' as const,
      bodyWidth: 138,
      features: ['crown'] as const,
    };

    const stableBody = resolveBodySpec(stable, genome, { ...forged, features: [...forged.features] });
    const starvingBody = applyLivePhenotype({ ...forged, features: [...forged.features] }, starving);

    expect(stableBody.shape).toBe('toroid');
    expect(starvingBody.shape).toBe('toroid');
    expect(starvingBody.bodyHeight).toBeLessThan(stableBody.bodyHeight);
    expect(starvingBody.expression).toBe('focused');
    expect(starvingBody.features).toEqual(['crown']);
  });

  it('changes the visual fingerprint when any genome lane changes', () => {
    const genome = emptyGenome();
    expect(getGenomeVisualFingerprint(changeGene(genome, 0))).not.toBe(getGenomeVisualFingerprint(genome));
    expect(getGenomeVisualFingerprint(changeGene(genome, 10))).not.toBe(getGenomeVisualFingerprint(genome));
    expect(getGenomeVisualFingerprint(changeGene(genome, 20))).not.toBe(getGenomeVisualFingerprint(genome));
  });
});

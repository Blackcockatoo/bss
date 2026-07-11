import { describe, expect, it } from 'vitest';

import type { DerivedTraits } from '../genome/types';
import {
  getEvolutionBranch,
  getStageDisplayTitle,
  getStageVisuals,
  getUnlockedAbilities,
} from './branching';
import { EVOLUTION_VISUALS } from './types';

function makeTraits(
  evolutionPath: string,
  rareAbilities: string[] = ['Star Whisper', 'Echo Step', 'Nova Bloom'],
): DerivedTraits {
  return {
    latent: {
      evolutionPath,
      rareAbilities,
      potential: { physical: 50, mental: 50, social: 50 },
      hiddenGenes: [],
    },
  } as unknown as DerivedTraits;
}

describe('getEvolutionBranch', () => {
  it('maps every genome evolution path to a distinct branch', () => {
    const paths = [
      'Celestial Ascendant',
      'Primal Beast',
      'Mystic Sage',
      'Guardian Sentinel',
      'Chaos Trickster',
      'Harmonic Healer',
      'Void Walker',
    ];

    const ids = paths.map(path => getEvolutionBranch(makeTraits(path)).id);

    expect(new Set(ids).size).toBe(paths.length);
    expect(ids).not.toContain('unaligned');
  });

  it('falls back to the neutral branch without traits or for unknown paths', () => {
    expect(getEvolutionBranch(null).id).toBe('unaligned');
    expect(getEvolutionBranch(makeTraits('Some New Path')).id).toBe('unaligned');
  });
});

describe('getStageVisuals', () => {
  it('keeps stage identity with a branch accent before the apex', () => {
    const branch = getEvolutionBranch(makeTraits('Void Walker'));
    const visuals = getStageVisuals('NEURO', branch);

    expect(visuals.colors[0]).toBe(EVOLUTION_VISUALS.NEURO.colors[0]);
    expect(visuals.colors[visuals.colors.length - 1]).toBe(
      branch.accentColors[0],
    );
  });

  it('paints the apex stage fully in branch colours', () => {
    const branch = getEvolutionBranch(makeTraits('Primal Beast'));
    const visuals = getStageVisuals('SPECIATION', branch);

    expect(visuals.colors).toEqual(branch.accentColors);
  });

  it('does not mutate the shared visuals tables', () => {
    const before = [...EVOLUTION_VISUALS.SPECIATION.colors];
    getStageVisuals('SPECIATION', getEvolutionBranch(makeTraits('Mystic Sage')));

    expect(EVOLUTION_VISUALS.SPECIATION.colors).toEqual(before);
  });
});

describe('getUnlockedAbilities', () => {
  const traits = makeTraits('Harmonic Healer');

  it('reveals abilities progressively by stage', () => {
    expect(getUnlockedAbilities(traits, 'GENETICS')).toEqual([]);
    expect(getUnlockedAbilities(traits, 'NEURO')).toEqual(['Star Whisper']);
    expect(getUnlockedAbilities(traits, 'QUANTUM')).toEqual([
      'Star Whisper',
      'Echo Step',
    ]);
    expect(getUnlockedAbilities(traits, 'SPECIATION')).toEqual([
      'Star Whisper',
      'Echo Step',
      'Nova Bloom',
    ]);
  });

  it('returns empty without traits', () => {
    expect(getUnlockedAbilities(null, 'SPECIATION')).toEqual([]);
  });
});

describe('getStageDisplayTitle', () => {
  it('uses the branch apex title only at the final stage', () => {
    const branch = getEvolutionBranch(makeTraits('Void Walker'));

    expect(getStageDisplayTitle('NEURO', branch, 'NEURO')).toBe('NEURO');
    expect(getStageDisplayTitle('SPECIATION', branch, 'SPECIATION')).toBe(
      'Void Walker Apex',
    );
  });
});

import { describe, expect, it } from 'vitest';

import type { Genome } from '@/lib/genome';
import {
  deriveMoss60PetProfile,
  matchMoss60Genome,
} from '@/lib/moss60/petProfile';

function buildGenome(): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => index),
    blue60: Array.from({ length: 60 }, (_, index) => 59 - index),
    black60: Array.from({ length: 60 }, (_, index) => (index * 7) % 60),
  } as Genome;
}

describe('deriveMoss60PetProfile', () => {
  it('derives fixed-length strands from the pet genome', () => {
    const genome = buildGenome();

    const profile = deriveMoss60PetProfile({
      id: 'pet-123',
      name: 'Nova',
      petType: 'geometric',
      genome,
      source: 'live',
    });

    expect(profile.label).toBe('Nova');
    expect(profile.strands.red).toHaveLength(60);
    expect(profile.strands.blue).toHaveLength(60);
    expect(profile.strands.black).toHaveLength(60);
    expect(profile.strands.combined).toHaveLength(60);
    expect(profile.strands.security).toHaveLength(60);
    expect(profile.strands.red.startsWith('0123456789')).toBe(true);
  });

  it('stays deterministic without a genome', () => {
    const first = deriveMoss60PetProfile({
      id: 'pet-fallback',
      name: 'Fallback',
      petType: 'auralia',
      source: 'fallback',
    });
    const second = deriveMoss60PetProfile({
      id: 'pet-fallback',
      name: 'Fallback',
      petType: 'auralia',
      source: 'fallback',
    });

    expect(first.strands.combined).toBe(second.strands.combined);
    expect(first.digest).toBe(second.digest);
  });
});

describe('matchMoss60Genome', () => {
  it('detects identical genomes', () => {
    const genome = buildGenome();
    const copy = buildGenome();

    expect(matchMoss60Genome(genome, copy)).toBe(true);
  });

  it('detects different genomes', () => {
    const genome = buildGenome();
    const other = buildGenome();
    other.black60[3] = 22;

    expect(matchMoss60Genome(genome, other)).toBe(false);
  });
});


import { describe, expect, it } from 'vitest';

import { decodeGenome } from './decoder';
import type { Genome } from './types';

const PHYSICAL_FEATURE_OPTIONS = [
  'Wings',
  'Horns',
  'Crown',
  'Third Eye',
  'Tail Flame',
  'Fins',
  'Antennae',
  'Crest',
];

const PERSONALITY_QUIRK_OPTIONS = [
  'Loves to spin',
  'Hums melodies',
  'Collects shiny things',
  'Naps in odd places',
  'Mimics sounds',
  'Dances when happy',
  'Scared of shadows',
  'Obsessed with cleanliness',
];

function emptyGenome(): Genome {
  return {
    red60: Array(60).fill(0),
    blue60: Array(60).fill(0),
    black60: Array(60).fill(0),
  };
}

describe('genome decoder physical-feature decoding', () => {
  it('decodes red-genome feature slots into anatomical features, never personality quirk phrases', () => {
    const genome = emptyGenome();
    // Each feature slot triggers when its first digit is >= 5 (indices 45, 48, 51, 54, 57).
    for (const index of [45, 48, 51, 54, 57]) {
      genome.red60[index] = 9;
    }

    const traits = decodeGenome(genome);

    expect(traits.physical.features.length).toBeGreaterThan(0);
    for (const feature of traits.physical.features) {
      expect(PHYSICAL_FEATURE_OPTIONS).toContain(feature);
      expect(PERSONALITY_QUIRK_OPTIONS).not.toContain(feature);
    }
  });

  it('leaves personality quirks decoding from the blue genome as behavioural phrases', () => {
    const genome = emptyGenome();
    // digitSum(blue60.slice(45, 50)) must exceed 20 to register a quirk.
    genome.blue60[45] = 9;
    genome.blue60[46] = 9;
    genome.blue60[47] = 9;

    const traits = decodeGenome(genome);

    expect(traits.personality.quirks.length).toBeGreaterThan(0);
    for (const quirk of traits.personality.quirks) {
      expect(PERSONALITY_QUIRK_OPTIONS).toContain(quirk);
      expect(PHYSICAL_FEATURE_OPTIONS).not.toContain(quirk);
    }
  });

  it('is deterministic for the same genome', () => {
    const genome: Genome = {
      red60: Array.from({ length: 60 }, (_, i) => i % 10),
      blue60: Array.from({ length: 60 }, (_, i) => (i + 3) % 10),
      black60: Array.from({ length: 60 }, (_, i) => (i + 6) % 10),
    };

    expect(decodeGenome(genome)).toEqual(decodeGenome(genome));
  });
});

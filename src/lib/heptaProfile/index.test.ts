import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Genome } from '@/lib/genome';

import {
  buildHeptaMatrix,
  deriveHeptaProfile,
  HEPTA_AXES,
  HEPTA_PROFILE_VERSION,
} from './index';

interface VectorFile {
  version: string;
  vectors: Array<{
    name: string;
    genome: { red60: string; blue60: string; black60: string };
    axes: Record<string, number>;
    dominantAxis: string;
    secondaryAxis: string;
    temperament: string;
  }>;
}

const vectorFile: VectorFile = JSON.parse(
  readFileSync(
    join(process.cwd(), 'docs/protocol/vectors/hepta-profile-v2.json'),
    'utf8',
  ),
);

function genomeFromStrings(strings: {
  red60: string;
  blue60: string;
  black60: string;
}): Genome {
  return {
    red60: strings.red60.split('').map(Number),
    blue60: strings.blue60.split('').map(Number),
    black60: strings.black60.split('').map(Number),
  };
}

describe('deriveHeptaProfile', () => {
  it('reproduces every published protocol vector exactly', () => {
    expect(vectorFile.version).toBe(HEPTA_PROFILE_VERSION);
    expect(vectorFile.vectors.length).toBeGreaterThanOrEqual(3);

    for (const vector of vectorFile.vectors) {
      const profile = deriveHeptaProfile(genomeFromStrings(vector.genome));
      expect(profile.version, vector.name).toBe(HEPTA_PROFILE_VERSION);
      expect(profile.axes, vector.name).toEqual(vector.axes);
      expect(profile.dominantAxis, vector.name).toBe(vector.dominantAxis);
      expect(profile.secondaryAxis, vector.name).toBe(vector.secondaryAxis);
      expect(profile.temperament, vector.name).toBe(vector.temperament);
    }
  });

  it('is deterministic and axis intensities stay within 0-100', () => {
    const genome = genomeFromStrings(vectorFile.vectors[0].genome);
    const first = deriveHeptaProfile(genome);
    const second = deriveHeptaProfile(genome);
    expect(second).toEqual(first);

    for (const axis of HEPTA_AXES) {
      expect(first.axes[axis]).toBeGreaterThanOrEqual(0);
      expect(first.axes[axis]).toBeLessThanOrEqual(100);
    }
    expect(first.dominantAxis).not.toBe(first.secondaryAxis);
  });

  it('is position-aware: the same digits in different lanes profile differently', () => {
    const base = genomeFromStrings(vectorFile.vectors[0].genome);
    // Swap two red digits across different mod-7 lanes without changing the
    // digit multiset. A frequency-only derivation could not tell these apart.
    const swapped = structuredClone(base);
    [swapped.red60[0], swapped.red60[1]] = [swapped.red60[1], swapped.red60[0]];
    expect(swapped.red60[0]).not.toBe(base.red60[0]);

    expect(buildHeptaMatrix(swapped)).not.toEqual(buildHeptaMatrix(base));
  });

  it('incorporates Union and Shadow, not just the raw strands', () => {
    // Swap two red digits within the SAME mod-7 lane (positions 0 and 14):
    // every per-strand lane×family count is identical, so a derivation using
    // only the raw strands could never tell the genomes apart. Union/Shadow
    // pair red with blue per-position, and blue differs at those positions,
    // so the pairings (1+0, 2+5) vs (2+0, 1+5) land in different families.
    const base: Genome = {
      red60: Array.from({ length: 60 }, () => 3),
      blue60: Array.from({ length: 60 }, () => 3),
      black60: Array.from({ length: 60 }, () => 5),
    };
    base.red60[0] = 1;
    base.red60[14] = 2;
    base.blue60[0] = 0;
    base.blue60[14] = 5;

    const swapped = structuredClone(base);
    [swapped.red60[0], swapped.red60[14]] = [
      swapped.red60[14],
      swapped.red60[0],
    ];

    // Per-strand lane counts are unchanged by the in-lane swap...
    expect(
      buildHeptaMatrix({ ...base, blue60: [], black60: [] } as Genome),
    ).toEqual(
      buildHeptaMatrix({ ...swapped, blue60: [], black60: [] } as Genome),
    );
    // ...but the full matrix still differs, via Union/Shadow coupling.
    expect(buildHeptaMatrix(swapped)).not.toEqual(buildHeptaMatrix(base));
  });

  it('behavior weights follow the axes', () => {
    const profile = deriveHeptaProfile(
      genomeFromStrings(vectorFile.vectors[2].genome),
    );
    expect(profile.behaviorWeights.cadence).toBeCloseTo(
      (profile.axes.spark + profile.axes.flux) / 200,
      3,
    );
    expect(profile.behaviorWeights.greeting).toBeCloseTo(
      profile.axes.voice / 100,
      3,
    );
    expect(profile.behaviorWeights.rest).toBeCloseTo(
      profile.axes.void / 100,
      3,
    );
  });
});

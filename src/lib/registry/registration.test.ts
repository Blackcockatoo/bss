import { beforeAll, describe, expect, it } from 'vitest';

import type { Genome } from '@/lib/genome';

import { generateGenomeV2, genomeDnaString } from './genesis';
import { buildPetRecord, deriveGeometryProjectionV1 } from './registration';
import {
  detectGenomeRadix,
  isPetRecordV2,
  PROJECTION_VERSION_V1,
  RULESET_VERSION,
} from './record';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function fixedLegacyGenome(): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => index % 7),
    blue60: Array.from({ length: 60 }, (_, index) => (index * 3) % 7),
    black60: Array.from({ length: 60 }, (_, index) => (index * 5) % 7),
  };
}

function fixedDecimalGenome(): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => index % 10),
    blue60: Array.from({ length: 60 }, (_, index) => (index * 3) % 10),
    black60: Array.from({ length: 60 }, (_, index) => (index * 7) % 10),
  };
}

let hmacKey: CryptoKey;

beforeAll(async () => {
  hmacKey = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
});

describe('generateGenomeV2', () => {
  it('produces three 60-digit decimal strands', () => {
    const genome = generateGenomeV2(seededRandom(42));
    for (const strand of [genome.red60, genome.blue60, genome.black60]) {
      expect(strand).toHaveLength(60);
      expect(strand.every((d) => Number.isInteger(d) && d >= 0 && d <= 9)).toBe(
        true,
      );
    }
    // A decimal genome uses the digit families base-7 rolls never reach.
    const all = [...genome.red60, ...genome.blue60, ...genome.black60];
    expect(all.some((d) => d > 6)).toBe(true);
  });

  it('uses the CSPRNG path when no random source is injected', () => {
    const genome = generateGenomeV2();
    expect(detectGenomeRadix(genome)).toBe(10);
  });
});

describe('detectGenomeRadix', () => {
  it('classifies digits 0-6 as legacy base-7 and anything with 7-9 as decimal', () => {
    expect(detectGenomeRadix(fixedLegacyGenome())).toBe(7);
    expect(detectGenomeRadix(fixedDecimalGenome())).toBe(10);
  });
});

describe('buildPetRecord', () => {
  it('assembles a complete, valid record for a fresh genesis pet', async () => {
    const record = await buildPetRecord({
      random: seededRandom(7),
      hmacKey,
    });

    expect(isPetRecordV2(record)).toBe(true);
    expect(record.rulesetVersion).toBe(RULESET_VERSION);
    expect(record.genomeRadix).toBe(10);
    expect(record.projectionVersion).toBe(PROJECTION_VERSION_V1);
    expect(record.lineage).toEqual({
      generation: 0,
      parentIds: [],
      ancestorIds: [],
    });
    expect(record.mutationLog).toEqual([]);
    expect(record.heptaCode?.digits).toHaveLength(42);
    expect(record.heptaCode?.version).toBe('hepta-ecc/v2');
    expect(record.crest?.signature).toBe(record.registrationSignature);
    expect(record.petId).toMatch(/^mp2-[0-9a-f]{16}$/);
  });

  it('derives the seven-axis Hepta profile at registration', async () => {
    const record = await buildPetRecord({
      genome: fixedDecimalGenome(),
      hmacKey,
    });

    expect(record.heptaProfile?.version).toBe('hepta-profile/v2');
    expect(record.heptaProfile?.dominantAxis).toBeDefined();
    const axes = record.heptaProfile?.axes;
    expect(axes && Object.keys(axes)).toHaveLength(7);

    // The profile is genome-determined, so re-registration reproduces it.
    const again = await buildPetRecord({
      genome: fixedDecimalGenome(),
      hmacKey,
    });
    expect(again.heptaProfile).toEqual(record.heptaProfile);
  });

  it('never modifies an explicit genome and detects its radix', async () => {
    const genome = fixedLegacyGenome();
    const snapshot = structuredClone(genome);
    const record = await buildPetRecord({ genome, hmacKey });

    expect(record.genome).toEqual(snapshot);
    expect(record.genomeRadix).toBe(7);
  });

  it('mints the same identity for the same genome every time', async () => {
    const first = await buildPetRecord({ genome: fixedDecimalGenome(), hmacKey });
    const second = await buildPetRecord({ genome: fixedDecimalGenome(), hmacKey });

    expect(second.petId).toBe(first.petId);
    expect(second.genomeHash).toEqual(first.genomeHash);
    expect(second.geometryFingerprint).toBe(first.geometryFingerprint);
    expect(second.crest?.vault).toBe(first.crest?.vault);
    expect(second.crest?.rotation).toBe(first.crest?.rotation);
    expect(second.crest?.tail).toEqual(first.crest?.tail);
    expect(second.crest?.dnaHash).toBe(first.crest?.dnaHash);
  });

  it('preserves a legacy pet ID and creation time during migration', async () => {
    const record = await buildPetRecord({
      genome: fixedLegacyGenome(),
      petId: 'legacy-pet-1',
      createdAt: 1_700_000_000_000,
      name: 'Old Friend',
      hmacKey,
    });

    expect(record.petId).toBe('legacy-pet-1');
    expect(record.createdAt).toBe(1_700_000_000_000);
    expect(record.name).toBe('Old Friend');
  });
});

describe('deriveGeometryProjectionV1', () => {
  it('is deterministic and sensitive to the genome', async () => {
    const base = await deriveGeometryProjectionV1(fixedDecimalGenome());
    const again = await deriveGeometryProjectionV1(fixedDecimalGenome());
    expect(again.fingerprint).toBe(base.fingerprint);
    expect(again.strands).toEqual(base.strands);

    const mutated = fixedDecimalGenome();
    mutated.red60[0] = (mutated.red60[0] + 1) % 10;
    const other = await deriveGeometryProjectionV1(mutated);
    expect(other.fingerprint).not.toBe(base.fingerprint);
  });

  it('projects full-length strands the engine can sample', async () => {
    const { strands } = await deriveGeometryProjectionV1(fixedDecimalGenome());
    expect(strands.red).toMatch(/^\d{60}$/);
    expect(strands.blue).toMatch(/^\d{60}$/);
    expect(strands.black).toMatch(/^\d{60}$/);
  });
});

describe('genomeDnaString', () => {
  it('joins the strands in canonical order', () => {
    const genome = fixedDecimalGenome();
    const dna = genomeDnaString(genome);
    expect(dna).toBe(
      `${genome.red60.join('')}|${genome.blue60.join('')}|${genome.black60.join('')}`,
    );
  });
});

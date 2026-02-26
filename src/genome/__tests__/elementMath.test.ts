import { describe, expect, it } from 'vitest';

import {
  ELEMENT_RESIDUE_TABLE,
  bridgeFunction,
  bridgeScore,
  chargeVector,
  elementWave,
  frontierWeight,
  genomeBridgeScore,
  genomeChargeVector,
  genomeHeptaSignature,
  heptaSignature,
} from '../elementMath';
import type { Genome } from '../types';

describe('residue table and bridge scoring', () => {
  it('tracks low/high elements per residue and bridge levels', () => {
    const residue1 = ELEMENT_RESIDUE_TABLE[1];

    expect(residue1.low?.z).toBe(1);
    expect(residue1.high?.z).toBe(61);
    expect(residue1.delta).toBe(60);
    expect(residue1.bridgeLevel).toBe(2);
    expect(residue1.averageLayer).toBeCloseTo(0.5);
  });

  it('returns 0 for invalid residues and scores composite inputs', () => {
    expect(bridgeFunction(-1)).toBe(0);
    expect(bridgeFunction(120)).toBe(0);
    expect(bridgeScore([1, 59])).toBe(3); // 2 + 1
  });
});

describe('frontier and charge metrics', () => {
  it('prefers frontier elements when requested', () => {
    const digits = [33, 34]; // 93/94 are both frontier

    const frontierPreferred = frontierWeight(digits, { selectionMode: 'frontier-preferred' });
    const lowOnly = frontierWeight(digits, { selectionMode: 'low' });
    const invalidSafe = frontierWeight([999]);

    expect(frontierPreferred).toBe(2);
    expect(lowOnly).toBe(0);
    expect(invalidSafe).toBe(0);
  });

  it('sums factorization exponents into charge vectors', () => {
    const charges = chargeVector([30]);
    expect(charges).toEqual({ c2: 1, c3: 1, c5: 1 });
  });
});

describe('hepta signatures and waves', () => {
  it('combines base-7 triples across digits', () => {
    const signature = heptaSignature([1, 33]);
    expect(signature.total).toEqual([7, 7, 2]);
    expect(signature.mod7).toEqual([0, 0, 2]);
  });

  it('builds element waves with weighted angles', () => {
    const wave = elementWave([1]);
    expect(wave.real).toBeCloseTo(0.9376, 3);
    expect(wave.imag).toBeCloseTo(0.3476, 3);
    expect(wave.magnitude).toBeCloseTo(1, 3);
    expect(wave.angle).toBeCloseTo(0.3547, 3);
  });
});

describe('genome-level wrappers', () => {
  const genome: Genome = {
    red60: [1],
    blue60: [33],
    black60: [2],
  };

  it('aggregates bridge scores across all strands', () => {
    expect(genomeBridgeScore(genome)).toBe(6);
  });

  it('aggregates charge vectors across all strands', () => {
    expect(genomeChargeVector(genome)).toEqual({ c2: 1, c3: 1, c5: 0 });
  });

  it('aggregates hepta signatures across all strands', () => {
    expect(genomeHeptaSignature(genome)).toEqual({ total: [13, 8, 3], mod7: [6, 1, 3] });
  });
});

/**
 * Tests for Reaction Algebra Module
 */

import { describe, it, expect } from 'vitest';
import {
  addElementsMod60,
  addManyElementsMod60,
  multiplyElementsMod60,
  combineCharges,
  combineManyCharges,
  composeHeptaTriples,
  composeManyHeptaTriples,
  scaleHeptaTriple,
  heptaTriplesEqual,
  inverseHeptaTriple,
  reactElements,
  elementPathway,
  findCycle,
  tensorProduct,
} from '../reactions';

describe('Element Addition (mod 60)', () => {
  it('should add elements mod 60', () => {
    // H (Z=1) + Si (Z=14) → residue 15
    expect(addElementsMod60(1, 14)).toBe(15);

    // F (Z=9) + Ne (Z=10) → residue 19
    expect(addElementsMod60(9, 10)).toBe(19);
  });

  it('should handle wrapping around 60', () => {
    expect(addElementsMod60(50, 20)).toBe(10);
    expect(addElementsMod60(59, 59)).toBe(58);
  });

  it('should add many elements', () => {
    expect(addManyElementsMod60(1, 2, 3, 4, 5)).toBe(15);
    expect(addManyElementsMod60(10, 20, 30)).toBe(0);
  });
});

describe('Element Multiplication (mod 60)', () => {
  it('should multiply elements mod 60', () => {
    // H × Pm ≡ 1 × 61 ≡ 1 (mod 60)
    expect(multiplyElementsMod60(1, 61)).toBe(1);

    // Test from spec examples
    expect(multiplyElementsMod60(2, 30)).toBe(0);
  });
});

describe('Charge Combination', () => {
  it('should combine charge mantles', () => {
    // Zn (Z=30): 2^1 × 3^1 × 5^1 → (1,1,1)
    const znFactors = { alpha: 1, beta: 1, gamma: 1, u: 1 };

    // Th (Z=90): 2^1 × 3^2 × 5^1 → (1,2,1)
    const thFactors = { alpha: 1, beta: 2, gamma: 1, u: 1 };

    const combined = combineCharges(znFactors, thFactors);

    expect(combined.alpha).toBe(2);
    expect(combined.beta).toBe(3);
    expect(combined.gamma).toBe(2);
  });

  it('should combine many charges', () => {
    const f1 = { alpha: 1, beta: 0, gamma: 0, u: 1 };
    const f2 = { alpha: 0, beta: 1, gamma: 0, u: 1 };
    const f3 = { alpha: 0, beta: 0, gamma: 1, u: 1 };

    const combined = combineManyCharges(f1, f2, f3);

    expect(combined.alpha).toBe(1);
    expect(combined.beta).toBe(1);
    expect(combined.gamma).toBe(1);
  });
});

describe('HeptaTriple Composition', () => {
  it('should compose HeptaTriples mod 7', () => {
    // H(1) = (1,0,0)
    const h1 = { d0: 1, d1: 0, d2: 0 };

    // H(61) = (5,1,1)
    const h61 = { d0: 5, d1: 1, d2: 1 };

    const composed = composeHeptaTriples(h1, h61);

    // (1+5, 0+1, 0+1) mod 7 = (6, 1, 1)
    expect(composed.d0).toBe(6);
    expect(composed.d1).toBe(1);
    expect(composed.d2).toBe(1);
  });

  it('should handle mod 7 wrapping', () => {
    const h1 = { d0: 6, d1: 6, d2: 6 };
    const h2 = { d0: 2, d1: 3, d2: 4 };

    const composed = composeHeptaTriples(h1, h2);

    expect(composed.d0).toBe(1); // (6+2) % 7
    expect(composed.d1).toBe(2); // (6+3) % 7
    expect(composed.d2).toBe(3); // (6+4) % 7
  });

  it('should compose many HeptaTriples', () => {
    const h1 = { d0: 1, d1: 0, d2: 0 };
    const h2 = { d0: 2, d1: 1, d2: 0 };
    const h3 = { d0: 3, d1: 2, d2: 1 };

    const composed = composeManyHeptaTriples(h1, h2, h3);

    expect(composed.d0).toBe(6); // (1+2+3) % 7
    expect(composed.d1).toBe(3); // (0+1+2) % 7
    expect(composed.d2).toBe(1); // (0+0+1) % 7
  });

  it('should scale HeptaTriples', () => {
    const h = { d0: 2, d1: 3, d2: 4 };

    const scaled = scaleHeptaTriple(h, 3);

    expect(scaled.d0).toBe(6); // (2*3) % 7
    expect(scaled.d1).toBe(2); // (3*3) % 7 = 9 % 7
    expect(scaled.d2).toBe(5); // (4*3) % 7 = 12 % 7
  });

  it('should check equality', () => {
    const h1 = { d0: 1, d1: 2, d2: 3 };
    const h2 = { d0: 1, d1: 2, d2: 3 };
    const h3 = { d0: 1, d1: 2, d2: 4 };

    expect(heptaTriplesEqual(h1, h2)).toBe(true);
    expect(heptaTriplesEqual(h1, h3)).toBe(false);
  });

  it('should compute inverse', () => {
    const h = { d0: 1, d1: 2, d2: 3 };
    const inverse = inverseHeptaTriple(h);

    expect(inverse.d0).toBe(6); // (7-1) % 7
    expect(inverse.d1).toBe(5); // (7-2) % 7
    expect(inverse.d2).toBe(4); // (7-3) % 7

    // Verify: h + inverse = 0 (mod 7)
    const composed = composeHeptaTriples(h, inverse);
    expect(composed.d0).toBe(0);
    expect(composed.d1).toBe(0);
    expect(composed.d2).toBe(0);
  });
});

describe('Full Element Reaction', () => {
  it('should compute complete reaction product', () => {
    // H (Z=1) + Si (Z=14)
    const reaction = reactElements(1, 14);

    expect(reaction.z1).toBe(1);
    expect(reaction.z2).toBe(14);
    expect(reaction.residueSum).toBe(15);
  });
});

describe('Element Pathways', () => {
  it('should generate pathways around the circle', () => {
    // Starting at 1, step by 7
    const pathway = elementPathway(1, 7, 10);

    expect(pathway[0]).toBe(1);
    expect(pathway[1]).toBe(8);
    expect(pathway[2]).toBe(15);
    expect(pathway[3]).toBe(22);
    expect(pathway.length).toBe(10);
  });

  it('should find cycles', () => {
    // Starting at 0, step by 10
    // 0 → 10 → 20 → 30 → 40 → 50 → 0 (cycle of 6)
    const cycle = findCycle(0, 10, 100);

    expect(cycle[0]).toBe(0);
    expect(cycle.length).toBe(6);
    expect(cycle[cycle.length - 1]).not.toBe(0); // Last element before returning to start
  });

  it('should find unit cycle for step=1', () => {
    const cycle = findCycle(0, 1, 100);
    expect(cycle.length).toBe(60); // Full circle
  });
});

describe('Tensor Product', () => {
  it('should compute tensor product', () => {
    // H (Z=1) ⊗ H (Z=1)
    const tensor = tensorProduct(1, 1);

    expect(tensor.residue).toBe(2); // (1+1) mod 60
    expect(tensor.tier).toBe(0); // 0 + 0
  });

  it('should combine tiers', () => {
    // H (Z=1, b=0) ⊗ Pm (Z=61, b=1)
    const tensor = tensorProduct(1, 61);

    expect(tensor.residue).toBe(2); // (1+1) mod 60
    expect(tensor.tier).toBe(1); // 0 + 1
  });
});

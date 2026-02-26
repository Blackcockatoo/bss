/**
 * Tests for Computational Invariants Module
 */

import { describe, it, expect } from 'vitest';
import {
  chargeMagnitude,
  chargeManhattan,
  chargeMax,
  heptaMagnitude,
  heptaToSeed,
  chargeToSeed,
  frontierWeight,
  frontierCount,
  syntheticCount,
  superheavyCount,
} from '../invariants';
import type { ChargeVector, HeptaSignature } from '../types';
import { generateElementProfile } from '../engine';

describe('Charge Magnitude', () => {
  it('should calculate Euclidean magnitude', () => {
    const charge: ChargeVector = { c2: 3, c3: 4, c5: 0 };
    const mag = chargeMagnitude(charge);

    // √(9 + 16 + 0) = √25 = 5
    expect(mag).toBe(5);
  });

  it('should handle zero charge', () => {
    const charge: ChargeVector = { c2: 0, c3: 0, c5: 0 };
    expect(chargeMagnitude(charge)).toBe(0);
  });

  it('should match specification example: Residue 36 (Kr/Cm)', () => {
    // Kr (Z=36): 2^2 × 3^2 × 1 → (2, 2, 0)
    // Cm (Z=96): 2^5 × 3^1 × 1 → (5, 1, 0)
    // Combined: C = (7, 3, 0)
    const charge: ChargeVector = { c2: 7, c3: 3, c5: 0 };
    const mag = chargeMagnitude(charge);

    // √(49 + 9 + 0) = √58 ≈ 7.616
    expect(mag).toBeCloseTo(7.616, 2);
  });
});

describe('Charge Norms', () => {
  it('should calculate Manhattan distance', () => {
    const charge: ChargeVector = { c2: 2, c3: 3, c5: 2 };
    expect(chargeManhattan(charge)).toBe(7);
  });

  it('should calculate max norm', () => {
    const charge: ChargeVector = { c2: 2, c3: 5, c5: 1 };
    expect(chargeMax(charge)).toBe(5);
  });
});

describe('Hepta Metrics', () => {
  it('should calculate Hepta magnitude', () => {
    const hepta: HeptaSignature = { h0: 3, h1: 4, h2: 0 };
    const mag = heptaMagnitude(hepta);

    // √(9 + 16 + 0) = 5
    expect(mag).toBe(5);
  });

  it('should convert Hepta to seed', () => {
    const hepta: HeptaSignature = { h0: 1, h1: 2, h2: 3 };
    const seed = heptaToSeed(hepta);

    // 1 + 7×2 + 49×3 = 1 + 14 + 147 = 162
    expect(seed).toBe(162);
  });
});

describe('Charge to Seed', () => {
  it('should convert charge to Hepta-weighted seed', () => {
    const charge: ChargeVector = { c2: 1, c3: 2, c5: 3 };
    const seed = chargeToSeed(charge);

    // C₂ + 7·C₃ + 49·C₅ = 1 + 14 + 147 = 162
    expect(seed).toBe(162);
  });

  it('should match specification example', () => {
    // From Section VIII.A: Use charge vector to seed prime generation
    const charge: ChargeVector = { c2: 2, c3: 1, c5: 1 };
    const seed = chargeToSeed(charge);

    expect(seed).toBe(2 + 7 + 49);
    expect(seed).toBe(58);
  });
});

describe('Frontier Metrics', () => {
  it('should calculate frontier weight', () => {
    const h = generateElementProfile(1); // H, b=0
    const pm = generateElementProfile(61); // Pm, b=1

    const weight = frontierWeight([h, pm]);
    expect(weight).toBe(0.5); // (0 + 1) / 2
  });

  it('should count frontier elements', () => {
    const h = generateElementProfile(1); // Z=1, not frontier
    const u = generateElementProfile(92); // Z=92, frontier (Z > 82)
    const pu = generateElementProfile(94); // Z=94, frontier

    expect(frontierCount([h])).toBe(0);
    expect(frontierCount([u, pu])).toBe(2);
    expect(frontierCount([h, u, pu])).toBe(2);
  });

  it('should count synthetic elements', () => {
    const u = generateElementProfile(92); // Uranium, not synthetic
    const np = generateElementProfile(93); // Neptunium, synthetic
    const pu = generateElementProfile(94); // Plutonium, synthetic

    expect(syntheticCount([u])).toBe(0);
    expect(syntheticCount([np, pu])).toBe(2);
    expect(syntheticCount([u, np, pu])).toBe(2);
  });

  it('should count superheavy elements', () => {
    const lr = generateElementProfile(103); // Lawrencium, not superheavy
    const rf = generateElementProfile(104); // Rutherfordium, superheavy
    const db = generateElementProfile(105); // Dubnium, superheavy

    expect(superheavyCount([lr])).toBe(0);
    expect(superheavyCount([rf, db])).toBe(2);
    expect(superheavyCount([lr, rf, db])).toBe(2);
  });
});

describe('Integration: Complete Invariant Calculation', () => {
  it('should handle specification example: Residue 1 (H/Pm)', () => {
    const h = generateElementProfile(1);
    const pm = generateElementProfile(61);

    // Both have (0,0,0) mantle - pure bridges
    expect(h.factors.alpha).toBe(0);
    expect(h.factors.beta).toBe(0);
    expect(h.factors.gamma).toBe(0);

    expect(pm.factors.alpha).toBe(0);
    expect(pm.factors.beta).toBe(0);
    expect(pm.factors.gamma).toBe(0);

    // Average tier: H (b=0) + Pm (b=1) = (0+1)/2 = 0.5
    const avgTier = frontierWeight([h, pm]);
    expect(avgTier).toBeCloseTo(0.5, 2);
  });

  it('should handle specification example: Residue 30 (Zn/Th)', () => {
    const zn = generateElementProfile(30);
    const th = generateElementProfile(90);

    // Zn: 30 = 2^1 × 3^1 × 5^1
    expect(zn.factors.alpha).toBe(1);
    expect(zn.factors.beta).toBe(1);
    expect(zn.factors.gamma).toBe(1);

    // Th: 90 = 2^1 × 3^2 × 5^1
    expect(th.factors.alpha).toBe(1);
    expect(th.factors.beta).toBe(2);
    expect(th.factors.gamma).toBe(1);

    // Combined charge: (2, 3, 2)
    const charge: ChargeVector = {
      c2: zn.factors.alpha + th.factors.alpha,
      c3: zn.factors.beta + th.factors.beta,
      c5: zn.factors.gamma + th.factors.gamma,
    };

    expect(charge.c2).toBe(2);
    expect(charge.c3).toBe(3);
    expect(charge.c5).toBe(2);

    // Magnitude: √(4 + 9 + 4) = √17 ≈ 4.12
    const mag = chargeMagnitude(charge);
    expect(mag).toBeCloseTo(4.123, 2);
  });
});

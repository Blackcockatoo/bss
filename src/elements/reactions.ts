/**
 * Reaction Algebra Module
 *
 * Mathematical operations for combining elements in Jewble number theory:
 * - Element addition (mod 60): Residue arithmetic on the 60-circle
 * - Charge combination: Adding factorization mantles
 * - HeptaTriple composition: Base-7 vector addition
 *
 * From JEWBLE-MATH Section IV: REACTION ALGEBRA
 */

import type {
  ElementProfile,
  SixtyAdicCoord,
  SixtyRelativeFactors,
  HeptaTriple,
  ChargeVector,
} from './types';
import { to60Adic, toHeptaTriple } from './engine';

/**
 * Operation 1: Element Addition (mod 60)
 *
 * For two elements at residues a₁ and a₂:
 * Z₃ ≡ Z₁ + Z₂ (mod 60)
 * → a₃ = (a₁ + a₂) mod 60
 *
 * This creates **elemental pathways** around the circle.
 *
 * Example:
 * H (a=1) + Si (a=14) → residue 15
 * F (a=9) + Ne (a=10) → residue 19 (where Au/K reside!)
 */
export function addElementsMod60(z1: number, z2: number): number {
  const a1 = z1 % 60;
  const a2 = z2 % 60;
  return (a1 + a2) % 60;
}

/**
 * Add multiple elements mod 60 to get resulting residue
 */
export function addManyElementsMod60(...zValues: number[]): number {
  return zValues.reduce((acc, z) => (acc + (z % 60)) % 60, 0);
}

/**
 * Element multiplication (mod 60)
 *
 * Z₃ ≡ Z₁ × Z₂ (mod 60)
 * → a₃ = (a₁ × a₂) mod 60
 *
 * Explores multiplicative structure on the 60-circle.
 */
export function multiplyElementsMod60(z1: number, z2: number): number {
  const a1 = z1 % 60;
  const a2 = z2 % 60;
  return (a1 * a2) % 60;
}

/**
 * Operation 2: Charge Combination
 *
 * When combining elements, their mantles (2-3-5 exponents) add:
 * (α₁,β₁,γ₁) + (α₂,β₂,γ₂) = (α₁+α₂, β₁+β₂, γ₁+γ₂)
 *
 * This determines the **electromagnetic weight** of a residue.
 *
 * Example: Zn + Th at residue 30
 * Zn: (1,1,1)
 * Th: (1,2,1)
 * Combined: (2,3,2) → heavily charged node
 */
export function combineCharges(
  factors1: SixtyRelativeFactors,
  factors2: SixtyRelativeFactors
): SixtyRelativeFactors {
  return {
    alpha: factors1.alpha + factors2.alpha,
    beta: factors1.beta + factors2.beta,
    gamma: factors1.gamma + factors2.gamma,
    u: (factors1.u * factors2.u) % 60, // Units multiply in the group
  };
}

/**
 * Combine charges from multiple elements
 */
export function combineManyCharges(...factors: SixtyRelativeFactors[]): SixtyRelativeFactors {
  if (factors.length === 0) {
    return { alpha: 0, beta: 0, gamma: 0, u: 1 };
  }

  return factors.reduce((acc, f) => combineCharges(acc, f));
}

/**
 * Create a charge vector from factorization
 */
export function chargeVectorFromFactors(factors: SixtyRelativeFactors): ChargeVector {
  return {
    c2: factors.alpha,
    c3: factors.beta,
    c5: factors.gamma,
  };
}

/**
 * Add charge vectors
 */
export function addChargeVectors(c1: ChargeVector, c2: ChargeVector): ChargeVector {
  return {
    c2: c1.c2 + c2.c2,
    c3: c1.c3 + c2.c3,
    c5: c1.c5 + c2.c5,
  };
}

/**
 * Operation 3: HeptaTriple Composition
 *
 * HeptaTriples compose under addition mod 7:
 * H(Z₁) ⊕ H(Z₂) = (d₀¹+d₀², d₁¹+d₁², d₂¹+d₂²) mod 7
 *
 * This creates **rhythmic interference patterns**.
 *
 * Example:
 * H(1) = (1,0,0)
 * H(61) = (5,1,1)
 * H(1) ⊕ H(61) = (6,1,1) mod 7
 */
export function composeHeptaTriples(h1: HeptaTriple, h2: HeptaTriple): HeptaTriple {
  return {
    d0: (h1.d0 + h2.d0) % 7,
    d1: (h1.d1 + h2.d1) % 7,
    d2: (h1.d2 + h2.d2) % 7,
  };
}

/**
 * Compose many HeptaTriples
 */
export function composeManyHeptaTriples(...triples: HeptaTriple[]): HeptaTriple {
  if (triples.length === 0) {
    return { d0: 0, d1: 0, d2: 0 };
  }

  return triples.reduce((acc, t) => composeHeptaTriples(acc, t));
}

/**
 * HeptaTriple scalar multiplication (mod 7)
 * Scales a HeptaTriple by an integer: k * H = (k·d₀, k·d₁, k·d₂) mod 7
 */
export function scaleHeptaTriple(triple: HeptaTriple, scalar: number): HeptaTriple {
  const k = ((scalar % 7) + 7) % 7; // Ensure positive mod
  return {
    d0: (triple.d0 * k) % 7,
    d1: (triple.d1 * k) % 7,
    d2: (triple.d2 * k) % 7,
  };
}

/**
 * Check if two HeptaTriples are equal
 */
export function heptaTriplesEqual(h1: HeptaTriple, h2: HeptaTriple): boolean {
  return h1.d0 === h2.d0 && h1.d1 === h2.d1 && h1.d2 === h2.d2;
}

/**
 * Get the inverse of a HeptaTriple under composition
 * -H = (7-d₀, 7-d₁, 7-d₂) mod 7
 */
export function inverseHeptaTriple(triple: HeptaTriple): HeptaTriple {
  return {
    d0: (7 - triple.d0) % 7,
    d1: (7 - triple.d1) % 7,
    d2: (7 - triple.d2) % 7,
  };
}

/**
 * Reaction Pathway: Full element reaction in all four coordinate systems
 *
 * Combines two atomic numbers and returns the results in:
 * - 60-adic space
 * - Charge space (2-3-5 factorization)
 * - Hepta space (base-7 triples)
 */
export interface ReactionProduct {
  // Input elements
  z1: number;
  z2: number;

  // Additive reactions (mod 60)
  residueSum: number; // (a₁ + a₂) mod 60
  residueProduct: number; // (a₁ × a₂) mod 60

  // 60-adic coordinates of product
  sixtyAdicSum: SixtyAdicCoord;

  // Charge combination
  combinedFactors: SixtyRelativeFactors;
  combinedCharge: ChargeVector;

  // Hepta composition
  composedHepta: HeptaTriple;
}

/**
 * Compute full reaction product between two elements
 */
export function reactElements(z1: number, z2: number): ReactionProduct {
  // Additive reactions mod 60
  const residueSum = addElementsMod60(z1, z2);
  const residueProduct = multiplyElementsMod60(z1, z2);

  // 60-adic for sum
  const sixtyAdicSum = to60Adic(residueSum);

  // We need to get factorizations - import from engine
  // For now, we'll compute inline
  const factor = (z: number): SixtyRelativeFactors => {
    let alpha = 0, beta = 0, gamma = 0, remainder = z;

    while (remainder % 2 === 0) { alpha++; remainder /= 2; }
    while (remainder % 3 === 0) { beta++; remainder /= 3; }
    while (remainder % 5 === 0) { gamma++; remainder /= 5; }

    return { alpha, beta, gamma, u: remainder };
  };

  const f1 = factor(z1);
  const f2 = factor(z2);
  const combinedFactors = combineCharges(f1, f2);
  const combinedCharge = chargeVectorFromFactors(combinedFactors);

  // Hepta composition
  const h1 = toHeptaTriple(z1);
  const h2 = toHeptaTriple(z2);
  const composedHepta = composeHeptaTriples(h1, h2);

  return {
    z1,
    z2,
    residueSum,
    residueProduct,
    sixtyAdicSum,
    combinedFactors,
    combinedCharge,
    composedHepta,
  };
}

/**
 * Find element pathways around the circle
 * Given a starting residue and a step size, generate the sequence of residues
 *
 * Example: Starting at H (a=1) with step 7:
 * 1 → 8 → 15 → 22 → 29 → 36 → 43 → 50 → 57 → 4 → 11 → 18...
 */
export function elementPathway(startResidue: number, step: number, numSteps: number): number[] {
  const pathway: number[] = [];
  let current = startResidue % 60;

  for (let i = 0; i < numSteps; i++) {
    pathway.push(current);
    current = (current + step) % 60;
  }

  return pathway;
}

/**
 * Find cycles on the 60-circle
 * Starting from a residue with a step, find when we return to start
 */
export function findCycle(startResidue: number, step: number, maxLength: number = 60): number[] {
  const start = startResidue % 60;
  const pathway: number[] = [start];
  let current = (start + step) % 60;

  while (current !== start && pathway.length < maxLength) {
    pathway.push(current);
    current = (current + step) % 60;
  }

  return pathway;
}

/**
 * Element tensor product (full 4D fusion)
 *
 * Z₁ ⊗ Z₂ = (a₁+a₂ mod 60, b₁+b₂, H(Z₁)⊕H(Z₂), C(Z₁)+C(Z₂))
 *
 * Combines elements in all four mathematical spaces simultaneously.
 */
export interface ElementTensorProduct {
  residue: number; // (a₁ + a₂) mod 60
  tier: number; // b₁ + b₂
  hepta: HeptaTriple; // H(Z₁) ⊕ H(Z₂)
  charge: ChargeVector; // C(Z₁) + C(Z₂)
}

/**
 * Compute tensor product of two atomic numbers
 */
export function tensorProduct(z1: number, z2: number): ElementTensorProduct {
  // 60-adic coordinates
  const coord1 = to60Adic(z1);
  const coord2 = to60Adic(z2);

  const residue = (coord1.a + coord2.a) % 60;
  const tier = coord1.b + coord2.b;

  // Factorizations
  const factor = (z: number): SixtyRelativeFactors => {
    let alpha = 0, beta = 0, gamma = 0, remainder = z;

    while (remainder % 2 === 0) { alpha++; remainder /= 2; }
    while (remainder % 3 === 0) { beta++; remainder /= 3; }
    while (remainder % 5 === 0) { gamma++; remainder /= 5; }

    return { alpha, beta, gamma, u: remainder };
  };

  const f1 = factor(z1);
  const f2 = factor(z2);
  const charge = addChargeVectors(
    chargeVectorFromFactors(f1),
    chargeVectorFromFactors(f2)
  );

  // Hepta triples
  const h1 = toHeptaTriple(z1);
  const h2 = toHeptaTriple(z2);
  const hepta = composeHeptaTriples(h1, h2);

  return { residue, tier, hepta, charge };
}

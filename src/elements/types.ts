/**
 * Element Number Theory Types
 * Chemical elements fused into base-60/Hepta/prime-factor mathematics
 */

/**
 * 60-adic coordinate representation of an element
 * Z = a + 60b where a = Z mod 60, b = floor(Z/60)
 */
export interface SixtyAdicCoord {
  a: number; // residue mod 60 (position on Jewble circle)
  b: number; // tier/layer (0 = lower shell 1-59, 1 = upper shell 61-118, 2+ = frontier)
}

/**
 * Prime factorization relative to base-60
 * Z = 2^alpha * 3^beta * 5^gamma * u
 * where gcd(u, 60) = 1
 */
export interface SixtyRelativeFactors {
  alpha: number; // exponent of 2
  beta: number; // exponent of 3
  gamma: number; // exponent of 5
  u: number; // unit mod 60 (coprime to 60)
}

/**
 * The 16 units mod 60 that form the multiplicative group (Z/60Z)*
 * These are numbers 1-59 that are coprime to 60
 */
export const UNITS_MOD_60 = [1, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 49, 53, 59] as const;
export type UnitMod60 = (typeof UNITS_MOD_60)[number];

/**
 * 4-bit encoding of units mod 60
 */
export interface UnitCode {
  code: number; // 0-15 index into UNITS_MOD_60
  unit: UnitMod60; // actual unit value
}

/**
 * Base-7 triple representation (HeptaMath)
 * Z = d0 + 7*d1 + 49*d2
 */
export interface HeptaTriple {
  d0: number; // ones digit (0-6)
  d1: number; // sevens digit (0-6)
  d2: number; // forty-nines digit (0-6)
}

/**
 * Complete element number-theoretic profile
 */
export interface ElementProfile {
  z: number; // atomic number
  symbol: string;
  name: string;

  // 60-adic
  sixtyAdic: SixtyAdicCoord;

  // Factorization relative to 60
  factors: SixtyRelativeFactors;
  unitCode: UnitCode;

  // HeptaMath
  hepta: HeptaTriple;

  // Derived values
  isFrontier: boolean; // Z > 82 (beyond lead, radioactive/synthetic)
  isSynthetic: boolean; // Z >= 93 (transuranics)
  isSuperheavy: boolean; // Z >= 104 (transactinides)
}

/**
 * Residue node on the 60-circle
 * Aggregates all elements that share the same residue mod 60
 */
export interface ResidueNode {
  a: number; // residue (0-59)
  elements: ElementProfile[]; // elements at this residue (0, 1, or 2)
  bridgeType: BridgeType;
  zLow: number | null; // lowest Z at this residue
  zHigh: number | null; // highest Z at this residue
  delta: number; // zHigh - zLow (0 or 60 for current elements)
  centerOfMass: number; // average tier (b-value) of elements here
}

/**
 * Bridge classification for residue nodes
 */
export type BridgeType = 'empty' | 'single' | 'bridge';

/**
 * Charge vector from 2-3-5 exponents
 */
export interface ChargeVector {
  c2: number; // sum of alpha values
  c3: number; // sum of beta values
  c5: number; // sum of gamma values
}

/**
 * Hepta signature for a Jewble
 */
export interface HeptaSignature {
  h0: number; // sum of d0's mod 7
  h1: number; // sum of d1's mod 7
  h2: number; // sum of d2's mod 7
}

/**
 * Element wave result (complex amplitude)
 */
export interface ElementWave {
  real: number;
  imag: number;
  magnitude: number;
  phase: number;
}

/**
 * Complete Jewble element analysis
 */
export interface JewbleElementAnalysis {
  // Residues hit by this Jewble's digits
  residuesHit: number[];

  // Element profiles at those residues
  elementsHit: ElementProfile[];

  // Aggregate scores
  bridgeScore: number; // sum of B(a) values
  frontierWeight: number; // count of frontier elements hit

  // Charge vector
  chargeVector: ChargeVector;

  // Hepta signature
  heptaSignature: HeptaSignature;

  // Average tier (vertical position)
  averageTier: number;

  // Element wave at various angles
  elementWave: (theta: number) => ElementWave;
}

/**
 * Element data for all 118 elements
 */
export interface ElementData {
  z: number;
  symbol: string;
  name: string;
}

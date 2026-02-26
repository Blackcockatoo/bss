/**
 * Element Number Theory Engine
 * Mathematical transformations for fusing elements into base-60/Hepta/prime systems
 */

import type {
  SixtyAdicCoord,
  SixtyRelativeFactors,
  UnitCode,
  HeptaTriple,
  ElementProfile,
  ResidueNode,
  BridgeType,
  ChargeVector,
  HeptaSignature,
  ElementWave,
  JewbleElementAnalysis,
} from './types';
import { UNITS_MOD_60 } from './types';
import { ELEMENT_DATA } from './data';

/**
 * Convert atomic number to 60-adic coordinates
 * Z = a + 60b where a ∈ [0,59], b ∈ {0,1,2,...}
 */
export function to60Adic(z: number): SixtyAdicCoord {
  const a = z % 60;
  const b = Math.floor(z / 60);
  return { a, b };
}

/**
 * Convert 60-adic coordinates back to atomic number
 */
export function from60Adic(coord: SixtyAdicCoord): number {
  return coord.a + 60 * coord.b;
}

/**
 * Factorize Z relative to base-60
 * Z = 2^alpha * 3^beta * 5^gamma * u
 * where gcd(u, 60) = 1
 */
export function factorRelativeTo60(z: number): SixtyRelativeFactors {
  let alpha = 0;
  let beta = 0;
  let gamma = 0;
  let remainder = z;

  // Extract powers of 2
  while (remainder % 2 === 0) {
    alpha++;
    remainder /= 2;
  }

  // Extract powers of 3
  while (remainder % 3 === 0) {
    beta++;
    remainder /= 3;
  }

  // Extract powers of 5
  while (remainder % 5 === 0) {
    gamma++;
    remainder /= 5;
  }

  const u = remainder;
  return { alpha, beta, gamma, u };
}

/**
 * Encode a unit (coprime to 60) as a 4-bit code
 */
export function encodeUnit(u: number): UnitCode {
  const uMod60 = u % 60;
  const code = UNITS_MOD_60.indexOf(uMod60 as typeof UNITS_MOD_60[number]);

  if (code === -1) {
    throw new Error(`${u} mod 60 = ${uMod60} is not a unit (not coprime to 60)`);
  }

  return {
    code,
    unit: UNITS_MOD_60[code],
  };
}

/**
 * Decode a 4-bit code to a unit
 */
export function decodeUnit(code: number): number {
  if (code < 0 || code >= UNITS_MOD_60.length) {
    throw new Error(`Unit code ${code} out of range [0, ${UNITS_MOD_60.length - 1}]`);
  }
  return UNITS_MOD_60[code];
}

/**
 * Convert atomic number to base-7 triple
 * Z = d0 + 7*d1 + 49*d2
 */
export function toHeptaTriple(z: number): HeptaTriple {
  const d0 = z % 7;
  const d1 = Math.floor(z / 7) % 7;
  const d2 = Math.floor(z / 49) % 7;

  return { d0, d1, d2 };
}

/**
 * Convert base-7 triple back to number
 */
export function fromHeptaTriple(triple: HeptaTriple): number {
  return triple.d0 + 7 * triple.d1 + 49 * triple.d2;
}

/**
 * Generate complete element profile with all number-theoretic properties
 */
export function generateElementProfile(z: number): ElementProfile {
  const data = ELEMENT_DATA.find((e) => e.z === z);
  if (!data) {
    throw new Error(`No element data for Z=${z}`);
  }

  const sixtyAdic = to60Adic(z);
  const factors = factorRelativeTo60(z);
  const unitCode = encodeUnit(factors.u);
  const hepta = toHeptaTriple(z);

  return {
    z,
    symbol: data.symbol,
    name: data.name,
    sixtyAdic,
    factors,
    unitCode,
    hepta,
    isFrontier: z > 82, // Beyond lead (all radioactive/synthetic)
    isSynthetic: z >= 93, // Transuranics
    isSuperheavy: z >= 104, // Transactinides
  };
}

/**
 * Generate all 118 element profiles
 */
export function generateAllElementProfiles(): ElementProfile[] {
  return ELEMENT_DATA.map((e) => generateElementProfile(e.z));
}

/**
 * Build residue nodes for the 60-circle
 * Groups elements by their residue mod 60
 */
export function buildResidueNodes(): ResidueNode[] {
  const profiles = generateAllElementProfiles();
  const nodes: ResidueNode[] = [];

  for (let a = 0; a < 60; a++) {
    const elements = profiles.filter((p) => p.sixtyAdic.a === a);

    let bridgeType: BridgeType;
    if (elements.length === 0) {
      bridgeType = 'empty';
    } else if (elements.length === 1) {
      bridgeType = 'single';
    } else {
      bridgeType = 'bridge';
    }

    const zLow = elements.length > 0 ? Math.min(...elements.map((e) => e.z)) : null;
    const zHigh = elements.length > 0 ? Math.max(...elements.map((e) => e.z)) : null;
    const delta = zLow !== null && zHigh !== null ? zHigh - zLow : 0;

    // Calculate center of mass (average tier)
    const centerOfMass =
      elements.length > 0
        ? elements.reduce((sum, e) => sum + e.sixtyAdic.b, 0) / elements.length
        : 0;

    nodes.push({
      a,
      elements,
      bridgeType,
      zLow,
      zHigh,
      delta,
      centerOfMass,
    });
  }

  return nodes;
}

/**
 * Get the "bridge score" B(a) for a residue
 * 0 = no element, 1 = single-shell, 2 = bridge (connects two tiers)
 */
export function bridgeScore(node: ResidueNode): number {
  switch (node.bridgeType) {
    case 'empty':
      return 0;
    case 'single':
      return 1;
    case 'bridge':
      return 2;
  }
}

/**
 * Calculate charge vector (sum of 2-3-5 exponents) for elements
 */
export function calculateChargeVector(elements: ElementProfile[]): ChargeVector {
  const c2 = elements.reduce((sum, e) => sum + e.factors.alpha, 0);
  const c3 = elements.reduce((sum, e) => sum + e.factors.beta, 0);
  const c5 = elements.reduce((sum, e) => sum + e.factors.gamma, 0);

  return { c2, c3, c5 };
}

/**
 * Calculate Hepta signature (sum of base-7 digits mod 7)
 */
export function calculateHeptaSignature(elements: ElementProfile[]): HeptaSignature {
  let h0 = 0;
  let h1 = 0;
  let h2 = 0;

  for (const elem of elements) {
    h0 = (h0 + elem.hepta.d0) % 7;
    h1 = (h1 + elem.hepta.d1) % 7;
    h2 = (h2 + elem.hepta.d2) % 7;
  }

  return { h0, h1, h2 };
}

/**
 * Calculate element wave F_J(θ) for a set of elements on the 60-circle
 *
 * F_J(θ) = Σ w(a) · e^(i·2π·a/60) · e^(i·λ·b̄(a))
 *
 * Returns complex amplitude at angle theta
 */
export function calculateElementWave(
  residueNodes: ResidueNode[],
  theta: number,
  lambda: number = 1.0
): ElementWave {
  let real = 0;
  let imag = 0;

  for (const node of residueNodes) {
    if (node.elements.length === 0) continue;

    // Weight based on 2-3-5 factorization
    const chargeVec = calculateChargeVector(node.elements);
    const weight =
      Math.pow(2, chargeVec.c2 / 10) *
      Math.pow(3, chargeVec.c3 / 10) *
      Math.pow(5, chargeVec.c5 / 10);

    // Circle position
    const circlePhase = (2 * Math.PI * node.a) / 60;

    // Frontier coupling (tier-based phase shift)
    const tierPhase = lambda * node.centerOfMass;

    // Total phase
    const phase = circlePhase + tierPhase;

    // Add weighted complex exponential
    real += weight * Math.cos(phase);
    imag += weight * Math.sin(phase);
  }

  const magnitude = Math.sqrt(real * real + imag * imag);
  const phase = Math.atan2(imag, real);

  return { real, imag, magnitude, phase };
}

/**
 * Analyze a Jewble genome for element-theoretic properties
 * Takes digit sequences (red60, blue60, black60) and extracts element math
 */
export function analyzeJewbleElements(
  red60: number[],
  blue60: number[],
  black60: number[]
): JewbleElementAnalysis {
  // Combine all digits to get residues hit
  const allDigits = [...red60, ...blue60, ...black60];
  const residuesHitSet = new Set(allDigits);
  const residuesHit = Array.from(residuesHitSet).sort((a, b) => a - b);

  // Build residue node map
  const allNodes = buildResidueNodes();
  const nodeMap = new Map(allNodes.map((n) => [n.a, n]));

  // Get elements at hit residues
  const elementsHit: ElementProfile[] = [];
  const nodesHit: ResidueNode[] = [];

  for (const a of residuesHit) {
    const node = nodeMap.get(a);
    if (node && node.elements.length > 0) {
      nodesHit.push(node);
      // For analysis, use all elements at this residue
      elementsHit.push(...node.elements);
    }
  }

  // Calculate bridge score
  const bridgeScoreTotal = nodesHit.reduce((sum, n) => sum + bridgeScore(n), 0);

  // Count frontier elements
  const frontierWeight = elementsHit.filter((e) => e.isFrontier).length;

  // Charge vector
  const chargeVector = calculateChargeVector(elementsHit);

  // Hepta signature
  const heptaSignature = calculateHeptaSignature(elementsHit);

  // Average tier
  const averageTier =
    elementsHit.length > 0
      ? elementsHit.reduce((sum, e) => sum + e.sixtyAdic.b, 0) / elementsHit.length
      : 0;

  // Element wave function
  const elementWave = (theta: number) => calculateElementWave(nodesHit, theta);

  return {
    residuesHit,
    elementsHit,
    bridgeScore: bridgeScoreTotal,
    frontierWeight,
    chargeVector,
    heptaSignature,
    averageTier,
    elementWave,
  };
}

/**
 * Sample element wave at N equally-spaced angles around the circle
 * Useful for generating radial envelopes for visualization
 */
export function sampleElementWave(
  analysis: JewbleElementAnalysis,
  numSamples: number = 60
): ElementWave[] {
  const samples: ElementWave[] = [];

  for (let i = 0; i < numSamples; i++) {
    const theta = (2 * Math.PI * i) / numSamples;
    samples.push(analysis.elementWave(theta));
  }

  return samples;
}

/**
 * Format element profile for display
 */
export function formatElementProfile(profile: ElementProfile): string {
  const { z, symbol, name, sixtyAdic, factors, hepta } = profile;

  return [
    `${symbol} (Z=${z}) ${name}`,
    `  60-adic: (${sixtyAdic.a}, ${sixtyAdic.b})`,
    `  Factors: 2^${factors.alpha} × 3^${factors.beta} × 5^${factors.gamma} × ${factors.u}`,
    `  Hepta: (${hepta.d0}, ${hepta.d1}, ${hepta.d2})`,
    `  Frontier: ${profile.isFrontier ? 'YES' : 'no'}`,
  ].join('\n');
}

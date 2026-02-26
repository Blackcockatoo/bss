/**
 * Computational Invariants Module
 *
 * Calculates fundamental invariants for Jewble genomes from element theory:
 * - Total Bridge Score: Measures harmonic connectivity (Z/Z+60 pairs)
 * - Charge Magnitude: Electromagnetic "density" of the genome
 * - Frontier Weight: How classical vs frontier the Jewble is
 * - Hepta Signature: Rhythmic DNA in base-7 space
 *
 * From JEWBLE-MATH Section VI: COMPUTATIONAL INVARIANTS
 */

import type {
  ResidueNode,
  ChargeVector,
  HeptaSignature,
  ElementProfile,
  JewbleElementAnalysis,
} from './types';

/**
 * 1. Total Bridge Score
 *
 * Bridge(J) = Σ B(a) where a ∈ J
 *
 * Measures harmonic connectivity (Z/Z+60 pairs).
 * - B(a) = 0: no element at residue a
 * - B(a) = 1: single-shell element
 * - B(a) = 2: bridge (both Z and Z+60 present)
 */
export function totalBridgeScore(nodes: ResidueNode[]): number {
  return nodes.reduce((sum, node) => {
    switch (node.bridgeType) {
      case 'empty': return sum + 0;
      case 'single': return sum + 1;
      case 'bridge': return sum + 2;
    }
  }, 0);
}

/**
 * 2. Charge Magnitude
 *
 * ‖C_J‖ = √(C₂² + C₃² + C₅²)
 *
 * Electromagnetic "density" of the genome.
 * Higher values indicate more 2-3-5 structure in the elements.
 */
export function chargeMagnitude(charge: ChargeVector): number {
  return Math.sqrt(
    charge.c2 * charge.c2 +
    charge.c3 * charge.c3 +
    charge.c5 * charge.c5
  );
}

/**
 * Manhattan distance for charge vector
 * ‖C‖₁ = |C₂| + |C₃| + |C₅|
 */
export function chargeManhattan(charge: ChargeVector): number {
  return Math.abs(charge.c2) + Math.abs(charge.c3) + Math.abs(charge.c5);
}

/**
 * Max norm for charge vector
 * ‖C‖∞ = max(|C₂|, |C₃|, |C₅|)
 */
export function chargeMax(charge: ChargeVector): number {
  return Math.max(Math.abs(charge.c2), Math.abs(charge.c3), Math.abs(charge.c5));
}

/**
 * 3. Frontier Weight
 *
 * F_J = Σ b̄(a) / |J|
 *
 * Average tier → how "classical" vs "frontier" the Jewble is.
 * - F_J ≈ 0: Grounded in classical elements (Z ≤ 59)
 * - F_J ≈ 0.5: Balanced between tiers
 * - F_J ≈ 1: Frontier-heavy (Z ≥ 60)
 */
export function frontierWeight(elements: ElementProfile[]): number {
  if (elements.length === 0) return 0;

  const totalTier = elements.reduce((sum, elem) => sum + elem.sixtyAdic.b, 0);
  return totalTier / elements.length;
}

/**
 * Frontier element count (Z > 82)
 */
export function frontierCount(elements: ElementProfile[]): number {
  return elements.filter(e => e.isFrontier).length;
}

/**
 * Synthetic element count (Z >= 93)
 */
export function syntheticCount(elements: ElementProfile[]): number {
  return elements.filter(e => e.isSynthetic).length;
}

/**
 * Superheavy element count (Z >= 104)
 */
export function superheavyCount(elements: ElementProfile[]): number {
  return elements.filter(e => e.isSuperheavy).length;
}

/**
 * 4. Hepta Signature Magnitude
 *
 * ‖H_J‖ = √(h₀² + h₁² + h₂²)
 *
 * Euclidean norm of the Hepta signature.
 */
export function heptaMagnitude(hepta: HeptaSignature): number {
  return Math.sqrt(
    hepta.h0 * hepta.h0 +
    hepta.h1 * hepta.h1 +
    hepta.h2 * hepta.h2
  );
}

/**
 * Convert HeptaSignature to a single integer seed (base-7 interpretation)
 * seed = h₀ + 7·h₁ + 49·h₂
 */
export function heptaToSeed(hepta: HeptaSignature): number {
  return hepta.h0 + 7 * hepta.h1 + 49 * hepta.h2;
}

/**
 * Weight charge vector for seeding (Hepta-weighted)
 *
 * seed = C₂ + 7·C₃ + 49·C₅
 *
 * Uses base-7 weighting to create a single integer from charge vector.
 * From Section VIII.A: Deterministic Prime Walks
 */
export function chargeToSeed(charge: ChargeVector): number {
  return charge.c2 + 7 * charge.c3 + 49 * charge.c5;
}

/**
 * Complete genome invariants
 *
 * Computes all fundamental invariants for a Jewble genome analysis.
 */
export interface GenomeInvariants {
  // Bridge connectivity
  bridgeScore: number;
  bridgeNodes: number; // Count of bridge-type nodes

  // Charge metrics
  chargeVector: ChargeVector;
  chargeMagnitude: number;
  chargeManhattan: number;
  chargeMax: number;
  chargeSeed: number; // Hepta-weighted seed

  // Hepta metrics
  heptaSignature: HeptaSignature;
  heptaMagnitude: number;
  heptaSeed: number; // Base-7 seed

  // Frontier metrics
  frontierWeight: number;
  frontierCount: number;
  syntheticCount: number;
  superheavyCount: number;

  // Element statistics
  totalElements: number;
  uniqueElements: number;
  residuesHit: number;
  coverage: number; // Fraction of 60 residues hit
}

/**
 * Calculate all invariants from a Jewble element analysis
 */
export function calculateInvariants(analysis: JewbleElementAnalysis): GenomeInvariants {
  const bridgeNodes = analysis.elementsHit.filter(e => {
    // Count elements that have a Z+60 or Z-60 partner in the hit list
    const partner60Up = e.z + 60;
    const partner60Down = e.z - 60;
    return analysis.elementsHit.some(other =>
      other.z === partner60Up || other.z === partner60Down
    );
  }).length;

  const uniqueElements = new Set(analysis.elementsHit.map(e => e.z)).size;

  return {
    // Bridge
    bridgeScore: analysis.bridgeScore,
    bridgeNodes,

    // Charge
    chargeVector: analysis.chargeVector,
    chargeMagnitude: chargeMagnitude(analysis.chargeVector),
    chargeManhattan: chargeManhattan(analysis.chargeVector),
    chargeMax: chargeMax(analysis.chargeVector),
    chargeSeed: chargeToSeed(analysis.chargeVector),

    // Hepta
    heptaSignature: analysis.heptaSignature,
    heptaMagnitude: heptaMagnitude(analysis.heptaSignature),
    heptaSeed: heptaToSeed(analysis.heptaSignature),

    // Frontier
    frontierWeight: analysis.averageTier,
    frontierCount: frontierCount(analysis.elementsHit),
    syntheticCount: syntheticCount(analysis.elementsHit),
    superheavyCount: superheavyCount(analysis.elementsHit),

    // Statistics
    totalElements: analysis.elementsHit.length,
    uniqueElements,
    residuesHit: analysis.residuesHit.length,
    coverage: analysis.residuesHit.length / 60,
  };
}

/**
 * Format invariants as a human-readable string
 */
export function formatInvariants(inv: GenomeInvariants): string {
  const lines = [
    '='.repeat(80),
    'JEWBLE GENOME INVARIANTS',
    '='.repeat(80),
    '',
    'BRIDGE CONNECTIVITY',
    '-'.repeat(80),
    `  Total Bridge Score: ${inv.bridgeScore}`,
    `  Bridge Nodes: ${inv.bridgeNodes}`,
    '',
    'CHARGE METRICS (2-3-5 Factorization)',
    '-'.repeat(80),
    `  Charge Vector: C = (${inv.chargeVector.c2}, ${inv.chargeVector.c3}, ${inv.chargeVector.c5})`,
    `  ‖C‖₂ (Euclidean): ${inv.chargeMagnitude.toFixed(3)}`,
    `  ‖C‖₁ (Manhattan): ${inv.chargeManhattan}`,
    `  ‖C‖∞ (Max): ${inv.chargeMax}`,
    `  Charge Seed: ${inv.chargeSeed} (C₂ + 7·C₃ + 49·C₅)`,
    '',
    'HEPTA METRICS (Base-7 Structure)',
    '-'.repeat(80),
    `  Hepta Signature: H = (${inv.heptaSignature.h0}, ${inv.heptaSignature.h1}, ${inv.heptaSignature.h2}) mod 7`,
    `  ‖H‖ (Magnitude): ${inv.heptaMagnitude.toFixed(3)}`,
    `  Hepta Seed: ${inv.heptaSeed} (h₀ + 7·h₁ + 49·h₂)`,
    '',
    'FRONTIER METRICS',
    '-'.repeat(80),
    `  Average Tier: ${inv.frontierWeight.toFixed(3)}`,
    `  Frontier Count (Z > 82): ${inv.frontierCount}`,
    `  Synthetic Count (Z ≥ 93): ${inv.syntheticCount}`,
    `  Superheavy Count (Z ≥ 104): ${inv.superheavyCount}`,
    '',
    'ELEMENT STATISTICS',
    '-'.repeat(80),
    `  Total Elements: ${inv.totalElements}`,
    `  Unique Elements: ${inv.uniqueElements}`,
    `  Residues Hit: ${inv.residuesHit} / 60`,
    `  Coverage: ${(inv.coverage * 100).toFixed(1)}%`,
    '',
    '='.repeat(80),
  ];

  return lines.join('\n');
}

/**
 * Compare two genomes by their invariants
 */
export interface GenomeComparison {
  genome1: GenomeInvariants;
  genome2: GenomeInvariants;
  differences: {
    bridgeScoreDiff: number;
    chargeMagnitudeDiff: number;
    heptaMagnitudeDiff: number;
    frontierWeightDiff: number;
    coverageDiff: number;
  };
  similarity: number; // 0-1 score based on normalized metrics
}

/**
 * Compare two genomes and compute similarity score
 */
export function compareGenomes(
  inv1: GenomeInvariants,
  inv2: GenomeInvariants
): GenomeComparison {
  const differences = {
    bridgeScoreDiff: inv2.bridgeScore - inv1.bridgeScore,
    chargeMagnitudeDiff: inv2.chargeMagnitude - inv1.chargeMagnitude,
    heptaMagnitudeDiff: inv2.heptaMagnitude - inv1.heptaMagnitude,
    frontierWeightDiff: inv2.frontierWeight - inv1.frontierWeight,
    coverageDiff: inv2.coverage - inv1.coverage,
  };

  // Simple similarity metric (0-1)
  // Normalize each metric and compute average similarity
  const normalize = (val: number, max: number) => Math.min(Math.abs(val) / max, 1);

  const bridgeSim = 1 - normalize(differences.bridgeScoreDiff, 120);
  const chargeSim = 1 - normalize(differences.chargeMagnitudeDiff, 100);
  const heptaSim = 1 - normalize(differences.heptaMagnitudeDiff, 10);
  const frontierSim = 1 - normalize(differences.frontierWeightDiff, 1);
  const coverageSim = 1 - normalize(differences.coverageDiff, 1);

  const similarity = (bridgeSim + chargeSim + heptaSim + frontierSim + coverageSim) / 5;

  return {
    genome1: inv1,
    genome2: inv2,
    differences,
    similarity,
  };
}

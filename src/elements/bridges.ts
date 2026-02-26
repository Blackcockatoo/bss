/**
 * Bridge Analysis Module
 *
 * Complete bridge positions where elements at Z and Z+60 both exist.
 * Analyzes the "harmonic resonance" between classical and frontier elements.
 *
 * From JEWBLE-MATH Section VII: BRIDGE SCORE ANALYSIS
 */

import type { ChargeVector, ResidueNode } from './types';
import { generateElementProfile, buildResidueNodes } from './engine';

/**
 * Bridge position entry
 */
export interface BridgePosition {
  residue: number; // Residue mod 60
  lowerShell: {
    z: number;
    symbol: string;
    name: string;
  };
  upperShell: {
    z: number;
    symbol: string;
    name: string;
  };
  delta: number; // Always 60 for bridges
  charge: ChargeVector; // Combined charge (C₂, C₃, C₅)
  classification: 'pure' | 'charged'; // Pure if C=(0,0,0), charged otherwise
}

/**
 * Complete bridge positions table
 * From Section VII of the specification
 */
export function getBridgePositions(): BridgePosition[] {
  const nodes = buildResidueNodes();
  const bridges: BridgePosition[] = [];

  for (const node of nodes) {
    if (node.bridgeType === 'bridge' && node.elements.length >= 2) {
      const lower = node.elements[0];
      const upper = node.elements[node.elements.length - 1];

      // Calculate combined charge
      const charge: ChargeVector = {
        c2: lower.factors.alpha + upper.factors.alpha,
        c3: lower.factors.beta + upper.factors.beta,
        c5: lower.factors.gamma + upper.factors.gamma,
      };

      const isPure = charge.c2 === 0 && charge.c3 === 0 && charge.c5 === 0;

      bridges.push({
        residue: node.a,
        lowerShell: {
          z: lower.z,
          symbol: lower.symbol,
          name: lower.name,
        },
        upperShell: {
          z: upper.z,
          symbol: upper.symbol,
          name: upper.name,
        },
        delta: upper.z - lower.z,
        charge,
        classification: isPure ? 'pure' : 'charged',
      });
    }
  }

  return bridges.sort((a, b) => a.residue - b.residue);
}

/**
 * Get all pure bridges (C = (0,0,0))
 *
 * Pure bridges have no 2-3-5 structure change between lower and upper shells.
 * They represent "clean" 60-unit translations.
 *
 * Expected pure bridges: Residues 1, 17, 19, 31
 */
export function getPureBridges(): BridgePosition[] {
  return getBridgePositions().filter(b => b.classification === 'pure');
}

/**
 * Get all charged bridges
 *
 * Charged bridges have electromagnetic transitions (non-zero charge).
 * They represent structural changes in factorization.
 *
 * Expected charged bridges: Residues 9, 10, 14, 25, 30, 33, 36
 */
export function getChargedBridges(): BridgePosition[] {
  return getBridgePositions().filter(b => b.classification === 'charged');
}

/**
 * Get the bridge with maximum charge magnitude
 *
 * Expected: Residue 36 (Kr/Cm) with C=(7,3,0)
 */
export function getMaximumChargeBridge(): BridgePosition | null {
  const bridges = getBridgePositions();
  if (bridges.length === 0) return null;

  return bridges.reduce((max, bridge) => {
    const maxMag = Math.sqrt(
      max.charge.c2 ** 2 + max.charge.c3 ** 2 + max.charge.c5 ** 2
    );
    const bridgeMag = Math.sqrt(
      bridge.charge.c2 ** 2 + bridge.charge.c3 ** 2 + bridge.charge.c5 ** 2
    );

    return bridgeMag > maxMag ? bridge : max;
  });
}

/**
 * Find bridge at specific residue
 */
export function getBridgeAtResidue(residue: number): BridgePosition | null {
  const bridges = getBridgePositions();
  return bridges.find(b => b.residue === residue) || null;
}

/**
 * Format bridge position as string
 */
export function formatBridge(bridge: BridgePosition): string {
  const lines = [
    `Residue ${bridge.residue} [${bridge.classification.toUpperCase()} BRIDGE]`,
    `  Lower Shell: ${bridge.lowerShell.symbol} (Z=${bridge.lowerShell.z}) ${bridge.lowerShell.name}`,
    `  Upper Shell: ${bridge.upperShell.symbol} (Z=${bridge.upperShell.z}) ${bridge.upperShell.name}`,
    `  Delta: Δ = ${bridge.delta}`,
    `  Charge: C = (${bridge.charge.c2}, ${bridge.charge.c3}, ${bridge.charge.c5})`,
  ];

  if (bridge.classification === 'pure') {
    lines.push(`  → Pure translation: no 2-3-5 structure change`);
  } else {
    const mag = Math.sqrt(
      bridge.charge.c2 ** 2 + bridge.charge.c3 ** 2 + bridge.charge.c5 ** 2
    );
    lines.push(`  → Charge magnitude: ‖C‖ = ${mag.toFixed(3)}`);
  }

  return lines.join('\n');
}

/**
 * Generate full bridge analysis table (formatted)
 */
export function generateBridgeTable(): string {
  const bridges = getBridgePositions();

  const lines = [
    '='.repeat(100),
    'COMPLETE BRIDGE POSITIONS (B = 2)',
    '='.repeat(100),
    '',
    'Residue | Lower Shell       | Upper Shell       | Δ  | C=(C₂,C₃,C₅) | Type',
    '-'.repeat(100),
  ];

  for (const bridge of bridges) {
    const residue = bridge.residue.toString().padStart(7);
    const lower = `${bridge.lowerShell.symbol} (${bridge.lowerShell.z})`.padEnd(17);
    const upper = `${bridge.upperShell.symbol} (${bridge.upperShell.z})`.padEnd(17);
    const delta = bridge.delta.toString().padStart(3);
    const charge = `(${bridge.charge.c2},${bridge.charge.c3},${bridge.charge.c5})`.padEnd(13);
    const type = bridge.classification === 'pure' ? 'PURE' : 'CHARGED';

    lines.push(`${residue} | ${lower} | ${upper} | ${delta} | ${charge} | ${type}`);
  }

  lines.push('-'.repeat(100));
  lines.push('');
  lines.push('PATTERN RECOGNITION:');
  lines.push(`  Pure bridges (C=0): ${getPureBridges().length} positions`);
  lines.push(`  Charged bridges: ${getChargedBridges().length} positions`);

  const maxBridge = getMaximumChargeBridge();
  if (maxBridge) {
    const mag = Math.sqrt(
      maxBridge.charge.c2 ** 2 +
      maxBridge.charge.c3 ** 2 +
      maxBridge.charge.c5 ** 2
    );
    lines.push(`  Maximum charge: Residue ${maxBridge.residue} (${maxBridge.lowerShell.symbol}/${maxBridge.upperShell.symbol}) with C=(${maxBridge.charge.c2},${maxBridge.charge.c3},${maxBridge.charge.c5}), ‖C‖=${mag.toFixed(3)}`);
  }

  lines.push('='.repeat(100));

  return lines.join('\n');
}

/**
 * Analyze bridge connectivity in a set of residues
 *
 * Given a list of residues, determine how many bridges are hit
 * and compute the bridge connectivity score.
 */
export interface BridgeConnectivity {
  residuesChecked: number[];
  bridgesHit: BridgePosition[];
  totalBridgeScore: number;
  pureBridges: number;
  chargedBridges: number;
  maxChargeBridge: BridgePosition | null;
}

/**
 * Analyze bridge connectivity for a set of residues
 */
export function analyzeBridgeConnectivity(residues: number[]): BridgeConnectivity {
  const uniqueResidues = Array.from(new Set(residues.map(r => r % 60)));
  const allBridges = getBridgePositions();
  const bridgesHit = allBridges.filter(b => uniqueResidues.includes(b.residue));

  let totalBridgeScore = 0;
  for (const r of uniqueResidues) {
    const bridge = allBridges.find(b => b.residue === r);
    totalBridgeScore += bridge ? 2 : 1; // Bridge = 2, Single = 1
  }

  const pureBridges = bridgesHit.filter(b => b.classification === 'pure').length;
  const chargedBridges = bridgesHit.filter(b => b.classification === 'charged').length;

  const maxChargeBridge = bridgesHit.length > 0
    ? bridgesHit.reduce((max, b) => {
        const maxMag = Math.sqrt(
          max.charge.c2 ** 2 + max.charge.c3 ** 2 + max.charge.c5 ** 2
        );
        const bMag = Math.sqrt(
          b.charge.c2 ** 2 + b.charge.c3 ** 2 + b.charge.c5 ** 2
        );
        return bMag > maxMag ? b : max;
      })
    : null;

  return {
    residuesChecked: uniqueResidues,
    bridgesHit,
    totalBridgeScore,
    pureBridges,
    chargedBridges,
    maxChargeBridge,
  };
}

/**
 * Theorem 1: Bridge Preservation
 *
 * If residues a and a+60k are both occupied, they form a bridge iff k=1.
 *
 * Proof: Z₂-Z₁ = 60k, but |Z|≤118 → k∈{0,1}. k=0 is identity, k=1 creates bridge. ∎
 */
export function verifyBridgePreservation(): boolean {
  const nodes = buildResidueNodes();

  for (const node of nodes) {
    if (node.elements.length >= 2) {
      // Check that all pairs differ by exactly 60
      for (let i = 0; i < node.elements.length - 1; i++) {
        const delta = node.elements[i + 1].z - node.elements[i].z;
        if (delta !== 60) {
          console.error(
            `Bridge preservation violated at residue ${node.a}: ` +
            `${node.elements[i].symbol}(${node.elements[i].z}) and ` +
            `${node.elements[i + 1].symbol}(${node.elements[i + 1].z}) ` +
            `differ by ${delta} instead of 60`
          );
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Tests for Bridge Analysis Module
 */

import { describe, it, expect } from 'vitest';
import {
  getBridgePositions,
  getPureBridges,
  getChargedBridges,
  getMaximumChargeBridge,
  getBridgeAtResidue,
  verifyBridgePreservation,
  analyzeBridgeConnectivity,
} from '../bridges';

describe('Bridge Positions', () => {
  it('should find all bridge positions', () => {
    const bridges = getBridgePositions();

    // All bridges should have delta = 60
    bridges.forEach(bridge => {
      expect(bridge.delta).toBe(60);
    });

    // All bridges should have exactly 2 elements
    bridges.forEach(bridge => {
      expect(bridge.lowerShell.z + 60).toBe(bridge.upperShell.z);
    });
  });

  it('should classify bridges correctly', () => {
    const bridges = getBridgePositions();

    bridges.forEach(bridge => {
      if (bridge.charge.c2 === 0 && bridge.charge.c3 === 0 && bridge.charge.c5 === 0) {
        expect(bridge.classification).toBe('pure');
      } else {
        expect(bridge.classification).toBe('charged');
      }
    });
  });
});

describe('Pure Bridges', () => {
  it('should find all pure bridges', () => {
    const pureBridges = getPureBridges();

    // From specification: Residues 1, 17, 19, 31
    const expectedResidues = [1, 17, 19, 31];
    const actualResidues = pureBridges.map(b => b.residue).sort((a, b) => a - b);

    // Check that we have at least the expected pure bridges
    expectedResidues.forEach(residue => {
      expect(actualResidues).toContain(residue);
    });
  });

  it('pure bridges should have zero charge', () => {
    const pureBridges = getPureBridges();

    pureBridges.forEach(bridge => {
      expect(bridge.charge.c2).toBe(0);
      expect(bridge.charge.c3).toBe(0);
      expect(bridge.charge.c5).toBe(0);
    });
  });

  it('should include residue 1 (H/Pm) as pure bridge', () => {
    const bridge1 = getBridgeAtResidue(1);

    expect(bridge1).not.toBeNull();
    expect(bridge1?.classification).toBe('pure');
    expect(bridge1?.lowerShell.symbol).toBe('H');
    expect(bridge1?.upperShell.symbol).toBe('Pm');
  });
});

describe('Charged Bridges', () => {
  it('should find all charged bridges', () => {
    const chargedBridges = getChargedBridges();

    // From specification: Residues 9, 10, 14, 25, 30, 33, 36
    const expectedResidues = [9, 10, 14, 25, 30, 33, 36];
    const actualResidues = chargedBridges.map(b => b.residue).sort((a, b) => a - b);

    // Check that we have at least the expected charged bridges
    expectedResidues.forEach(residue => {
      expect(actualResidues).toContain(residue);
    });
  });

  it('charged bridges should have non-zero charge', () => {
    const chargedBridges = getChargedBridges();

    chargedBridges.forEach(bridge => {
      const hasCharge =
        bridge.charge.c2 !== 0 ||
        bridge.charge.c3 !== 0 ||
        bridge.charge.c5 !== 0;

      expect(hasCharge).toBe(true);
    });
  });

  it('should include residue 36 (Kr/Cm) as charged bridge', () => {
    const bridge36 = getBridgeAtResidue(36);

    expect(bridge36).not.toBeNull();
    expect(bridge36?.classification).toBe('charged');
    expect(bridge36?.lowerShell.symbol).toBe('Kr');
    expect(bridge36?.upperShell.symbol).toBe('Cm');
  });
});

describe('Maximum Charge Bridge', () => {
  it('should find the bridge with maximum charge', () => {
    const maxBridge = getMaximumChargeBridge();

    expect(maxBridge).not.toBeNull();
  });

  it('should identify residue 4 (Be/Gd) as having maximum charge', () => {
    const maxBridge = getMaximumChargeBridge();

    // Residue 4: Be (Z=4) = 2^2, Gd (Z=64) = 2^6
    // Combined charge: C = (2+6, 0, 0) = (8, 0, 0)
    expect(maxBridge?.residue).toBe(4);
    expect(maxBridge?.charge.c2).toBe(8);
    expect(maxBridge?.charge.c3).toBe(0);
    expect(maxBridge?.charge.c5).toBe(0);
  });

  it('should have correct magnitude for max charge bridge', () => {
    const maxBridge = getMaximumChargeBridge();

    if (maxBridge) {
      const mag = Math.sqrt(
        maxBridge.charge.c2 ** 2 +
        maxBridge.charge.c3 ** 2 +
        maxBridge.charge.c5 ** 2
      );

      // Residue 4: √(64 + 0 + 0) = √64 = 8
      expect(mag).toBeCloseTo(8, 2);
    }
  });
});

describe('Specific Bridge Examples from Specification', () => {
  it('Residue 1: H/Pm - Pure bridge', () => {
    const bridge = getBridgeAtResidue(1);

    expect(bridge?.lowerShell.z).toBe(1);
    expect(bridge?.upperShell.z).toBe(61);
    expect(bridge?.charge.c2).toBe(0);
    expect(bridge?.charge.c3).toBe(0);
    expect(bridge?.charge.c5).toBe(0);
  });

  it('Residue 9: F/Tm - Charged bridge', () => {
    const bridge = getBridgeAtResidue(9);

    expect(bridge?.lowerShell.z).toBe(9);
    expect(bridge?.upperShell.z).toBe(69);
    expect(bridge?.charge.c3).toBeGreaterThan(0); // Has 3-charge per spec
  });

  it('Residue 10: Ne/Yb - Charged bridge', () => {
    const bridge = getBridgeAtResidue(10);

    expect(bridge?.lowerShell.z).toBe(10);
    expect(bridge?.upperShell.z).toBe(70);
  });

  it('Residue 30: Zn/Th - Heavily charged bridge', () => {
    const bridge = getBridgeAtResidue(30);

    expect(bridge?.lowerShell.z).toBe(30);
    expect(bridge?.upperShell.z).toBe(90);
    expect(bridge?.charge.c2).toBe(2);
    expect(bridge?.charge.c3).toBe(3);
    expect(bridge?.charge.c5).toBe(2);
  });
});

describe('Bridge Connectivity Analysis', () => {
  it('should analyze connectivity for given residues', () => {
    const residues = [1, 9, 36]; // Mix of pure and charged bridges
    const analysis = analyzeBridgeConnectivity(residues);

    expect(analysis.residuesChecked).toHaveLength(3);
    expect(analysis.bridgesHit).toHaveLength(3);
    expect(analysis.totalBridgeScore).toBeGreaterThan(0);
  });

  it('should identify pure vs charged bridges', () => {
    const residues = [1, 17, 19, 31]; // All pure bridges
    const analysis = analyzeBridgeConnectivity(residues);

    expect(analysis.pureBridges).toBe(4);
    expect(analysis.chargedBridges).toBe(0);
  });

  it('should handle non-bridge residues', () => {
    const residues = [2, 3, 4]; // Likely not bridges
    const analysis = analyzeBridgeConnectivity(residues);

    // Should handle gracefully even if no bridges
    expect(analysis.residuesChecked).toHaveLength(3);
  });
});

describe('Theorem Verification', () => {
  it('should verify Bridge Preservation theorem', () => {
    // Theorem 1: If residues a and a+60k are both occupied,
    // they form a bridge iff k=1.
    const isValid = verifyBridgePreservation();

    expect(isValid).toBe(true);
  });
});

describe('Bridge Table Generation', () => {
  it('should generate formatted bridge table', () => {
    const bridges = getBridgePositions();

    // Check that all entries have required properties
    bridges.forEach(bridge => {
      expect(bridge.residue).toBeGreaterThanOrEqual(0);
      expect(bridge.residue).toBeLessThan(60);
      expect(bridge.lowerShell.z).toBeGreaterThan(0);
      expect(bridge.upperShell.z).toBeGreaterThan(0);
      expect(bridge.delta).toBe(60);
    });
  });
});

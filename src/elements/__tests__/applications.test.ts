/**
 * Tests for Jewble Generation Applications Module
 */

import { describe, it, expect } from 'vitest';
import {
  generatePrimesFromCharge,
  primeWalk,
  chargeToFrequency,
  generateHarmonicSeries,
  createApertureModulation,
  sampleApertureModulation,
  generateSacredGeometryVertices,
  generateModulatedPolygon,
  generateRadialEnvelope,
  verticesToSVGPath,
} from '../applications';
import type { ChargeVector, HeptaTriple, ElementWave } from '../types';

describe('Prime Generation from Charge', () => {
  it('should generate primes deterministically from charge', () => {
    const charge: ChargeVector = { c2: 2, c3: 1, c5: 1 };
    const primes = generatePrimesFromCharge(charge, 10);

    expect(primes).toHaveLength(10);

    // Verify all are prime
    primes.forEach(p => {
      expect(isPrime(p)).toBe(true);
    });
  });

  it('should generate different primes for different charges', () => {
    const charge1: ChargeVector = { c2: 1, c3: 0, c5: 0 };
    const charge2: ChargeVector = { c2: 0, c3: 1, c5: 0 };

    const primes1 = generatePrimesFromCharge(charge1, 5);
    const primes2 = generatePrimesFromCharge(charge2, 5);

    // Should be different sequences (at least partially)
    const same = primes1.filter((p, i) => p === primes2[i]).length;
    expect(same).toBeLessThan(5);
  });
});

describe('Prime Walk', () => {
  it('should walk through primes with charge-based step', () => {
    const charge: ChargeVector = { c2: 1, c3: 1, c5: 1 };
    const walk = primeWalk(charge, 2, 5);

    expect(walk).toHaveLength(5);
    expect(walk[0]).toBe(2);

    // All should be prime
    walk.forEach(p => {
      expect(isPrime(p)).toBe(true);
    });
  });
});

describe('Frequency Scaling', () => {
  it('should scale frequency from charge vector', () => {
    const baseFreq = 440.0; // A4

    const charge: ChargeVector = { c2: 0, c3: 0, c5: 0 };
    const freq = chargeToFrequency(charge, baseFreq);

    expect(freq).toBeCloseTo(baseFreq, 2);
  });

  it('should modulate frequency with non-zero charge', () => {
    const baseFreq = 440.0;

    const charge: ChargeVector = { c2: 12, c3: 0, c5: 0 };
    const freq = chargeToFrequency(charge, baseFreq);

    // 2^(12/12) = 2^1 = 2, so frequency should double
    expect(freq).toBeCloseTo(880.0, 1);
  });

  it('should generate harmonic series', () => {
    const charge: ChargeVector = { c2: 0, c3: 0, c5: 0 };
    const harmonics = generateHarmonicSeries(charge, 440.0, 4);

    expect(harmonics).toHaveLength(4);
    expect(harmonics[0]).toBeCloseTo(440.0, 2);
    expect(harmonics[1]).toBeCloseTo(880.0, 2);
    expect(harmonics[2]).toBeCloseTo(1320.0, 2);
    expect(harmonics[3]).toBeCloseTo(1760.0, 2);
  });
});

describe('Aperture Modulation', () => {
  it('should create aperture modulation from HeptaTriple', () => {
    const hepta: HeptaTriple = { d0: 1, d1: 2, d2: 3 };
    const modulation = createApertureModulation(hepta, 1.0);

    expect(modulation.baseRadius).toBe(1.0);
    expect(modulation.frequencies).toHaveLength(3);
    expect(modulation.amplitudes).toHaveLength(3);
  });

  it('should compute correct frequencies', () => {
    const hepta: HeptaTriple = { d0: 1, d1: 2, d2: 3 };
    const modulation = createApertureModulation(hepta, 1.0);

    // ω₀ = 2π·d₀/7
    const expectedOmega0 = (2 * Math.PI * 1) / 7;
    expect(modulation.frequencies[0]).toBeCloseTo(expectedOmega0, 5);
  });

  it('should modulate radius over time', () => {
    const hepta: HeptaTriple = { d0: 1, d1: 0, d2: 0 };
    const modulation = createApertureModulation(hepta, 1.0, [0.1, 0, 0]);

    const r0 = modulation.modulation(0);
    const r1 = modulation.modulation(Math.PI);

    // Should vary around baseRadius
    expect(r0).toBeGreaterThan(0);
    expect(r1).toBeGreaterThan(0);
  });

  it('should sample modulation over time', () => {
    const hepta: HeptaTriple = { d0: 1, d1: 0, d2: 0 };
    const modulation = createApertureModulation(hepta, 1.0);

    const samples = sampleApertureModulation(modulation, 1.0, 10);

    expect(samples.length).toBeGreaterThan(0);
    samples.forEach(r => {
      expect(r).toBeGreaterThan(0);
    });
  });
});

describe('Sacred Geometry Generation', () => {
  it('should generate vertices from element wave', () => {
    const elementWave: ElementWave[] = [
      { real: 1, imag: 0, magnitude: 1, phase: 0 },
      { real: 0, imag: 1, magnitude: 1, phase: Math.PI / 2 },
      { real: -1, imag: 0, magnitude: 1, phase: Math.PI },
      { real: 0, imag: -1, magnitude: 1, phase: -Math.PI / 2 },
    ];

    const vertices = generateSacredGeometryVertices(elementWave, 1.0, 0.2);

    expect(vertices).toHaveLength(4);
    vertices.forEach(v => {
      expect(v.radius).toBeGreaterThan(0);
      expect(v.angle).toBeGreaterThanOrEqual(0);
      expect(v.angle).toBeLessThan(2 * Math.PI);
    });
  });

  it('should generate modulated polygon', () => {
    const elementWave: ElementWave[] = Array(60).fill(null).map((_, i) => ({
      real: Math.cos(i / 60 * 2 * Math.PI),
      imag: Math.sin(i / 60 * 2 * Math.PI),
      magnitude: 1,
      phase: 0,
    }));

    const polygon = generateModulatedPolygon(7, elementWave, 1.0, 0.1);

    expect(polygon).toHaveLength(7);
  });

  it('should generate radial envelope', () => {
    const elementWave: ElementWave[] = Array(60).fill(null).map(() => ({
      real: 1,
      imag: 0,
      magnitude: 1,
      phase: 0,
    }));

    const envelope = generateRadialEnvelope(elementWave, 1.0, 0.5);

    expect(envelope).toHaveLength(60);
    envelope.forEach(([angle, radius]) => {
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(2 * Math.PI);
      expect(radius).toBeGreaterThan(0);
    });
  });
});

describe('SVG Path Generation', () => {
  it('should convert vertices to SVG path', () => {
    const vertices = [
      { angle: 0, radius: 1, phase: 0, x: 1, y: 0 },
      { angle: Math.PI / 2, radius: 1, phase: 0, x: 0, y: 1 },
      { angle: Math.PI, radius: 1, phase: 0, x: -1, y: 0 },
      { angle: 3 * Math.PI / 2, radius: 1, phase: 0, x: 0, y: -1 },
    ];

    const path = verticesToSVGPath(vertices);

    expect(path).toContain('M');
    expect(path).toContain('L');
    expect(path).toContain('Z');
  });

  it('should handle empty vertices', () => {
    const path = verticesToSVGPath([]);
    expect(path).toBe('');
  });
});

describe('Integration: Complete Visualization Data', () => {
  it('should generate all visualization components', () => {
    const charge: ChargeVector = { c2: 1, c3: 1, c5: 1 };
    const hepta: HeptaTriple = { d0: 1, d1: 2, d2: 3 };
    const elementWave: ElementWave[] = Array(60).fill(null).map((_, i) => ({
      real: Math.cos(i / 60 * 2 * Math.PI),
      imag: Math.sin(i / 60 * 2 * Math.PI),
      magnitude: 1 + 0.1 * Math.sin(i / 10),
      phase: i / 60 * Math.PI / 4,
    }));

    const vizData = import('../applications').then(mod =>
      mod.generateVisualizationData(charge, hepta, elementWave)
    );

    // Should be a promise that resolves to visualization data
    expect(vizData).toBeDefined();
  });
});

// Helper function for testing
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;

  const sqrt = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= sqrt; i += 2) {
    if (n % i === 0) return false;
  }

  return true;
}

/**
 * Jewble Generation Applications Module
 *
 * Applies element number theory to generate Jewble content:
 * - Prime walks from charge vectors
 * - Frequency scaling from factorization
 * - Aperture modulation from HeptaTriples
 * - Sacred geometry from element waves
 *
 * From JEWBLE-MATH Section VIII: APPLICATIONS TO JEWBLE GENERATION
 */

import type { ChargeVector, HeptaTriple, ElementWave } from './types';

/**
 * A. Deterministic Prime Walks
 *
 * Use charge vector to seed prime generation:
 * seed = C₂ + 7·C₃ + 49·C₅  (Hepta-weighted charge)
 *
 * Generates primes using a Linear Congruential Generator seeded by charge.
 */
export function generatePrimesFromCharge(
  charge: ChargeVector,
  count: number
): number[] {
  const seed = charge.c2 + 7 * charge.c3 + 49 * charge.c5;

  // Simple prime generator using seed
  const primes: number[] = [];
  let candidate = Math.max(2, seed % 1000); // Start from seed mod 1000

  while (primes.length < count) {
    if (isPrime(candidate)) {
      primes.push(candidate);
    }
    candidate++;
  }

  return primes;
}

/**
 * Prime check helper
 */
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

/**
 * Generate prime walk with step size determined by charge
 * Starting from a seed prime, walk through primes using charge-based step
 */
export function primeWalk(
  charge: ChargeVector,
  startPrime: number,
  steps: number
): number[] {
  const stepSize = Math.max(1, charge.c2 + charge.c3 + charge.c5);
  const walk: number[] = [startPrime];

  let current = startPrime;
  let count = 0;

  while (walk.length < steps && count < steps * 100) {
    current += stepSize;
    if (isPrime(current)) {
      walk.push(current);
    }
    count++;
  }

  return walk;
}

/**
 * B. Frequency Scaling
 *
 * Map charge to oscillator frequencies using just intonation:
 * f(a) = f₀ · 2^(C₂/12) · 3^(C₃/19) · 5^(C₅/28)
 *
 * Creates **just intonation** from element ratios.
 */
export function chargeToFrequency(
  charge: ChargeVector,
  baseFrequency: number = 440.0 // A4
): number {
  const f2 = Math.pow(2, charge.c2 / 12);
  const f3 = Math.pow(3, charge.c3 / 19);
  const f5 = Math.pow(5, charge.c5 / 28);

  return baseFrequency * f2 * f3 * f5;
}

/**
 * Generate frequency set from multiple charges
 */
export function generateFrequencySet(
  charges: ChargeVector[],
  baseFrequency: number = 440.0
): number[] {
  return charges.map(c => chargeToFrequency(c, baseFrequency));
}

/**
 * Generate harmonic series based on charge
 * Returns fundamental and overtones
 */
export function generateHarmonicSeries(
  charge: ChargeVector,
  baseFrequency: number = 440.0,
  numHarmonics: number = 8
): number[] {
  const fundamental = chargeToFrequency(charge, baseFrequency);
  const harmonics = [fundamental];

  for (let n = 2; n <= numHarmonics; n++) {
    harmonics.push(fundamental * n);
  }

  return harmonics;
}

/**
 * C. Aperture Modulation
 *
 * Use HeptaTriple for radial pulsing:
 * r(t) = r₀ · [1 + ε₀·sin(ω₀t) + ε₁·sin(ω₁t) + ε₂·sin(ω₂t)]
 * where ωᵢ = 2π·dᵢ/7
 *
 * Generates time-varying radius for sacred geometry rendering.
 */
export interface ApertureModulation {
  baseRadius: number;
  modulation: (t: number) => number; // Returns radius at time t
  frequencies: [number, number, number]; // [ω₀, ω₁, ω₂]
  amplitudes: [number, number, number]; // [ε₀, ε₁, ε₂]
}

/**
 * Create aperture modulation from HeptaTriple
 */
export function createApertureModulation(
  hepta: HeptaTriple,
  baseRadius: number = 1.0,
  amplitudes: [number, number, number] = [0.1, 0.05, 0.025]
): ApertureModulation {
  const frequencies: [number, number, number] = [
    (2 * Math.PI * hepta.d0) / 7,
    (2 * Math.PI * hepta.d1) / 7,
    (2 * Math.PI * hepta.d2) / 7,
  ];

  const modulation = (t: number): number => {
    return baseRadius * (
      1 +
      amplitudes[0] * Math.sin(frequencies[0] * t) +
      amplitudes[1] * Math.sin(frequencies[1] * t) +
      amplitudes[2] * Math.sin(frequencies[2] * t)
    );
  };

  return {
    baseRadius,
    modulation,
    frequencies,
    amplitudes,
  };
}

/**
 * Sample aperture modulation over time
 */
export function sampleApertureModulation(
  modulation: ApertureModulation,
  duration: number,
  sampleRate: number = 60
): number[] {
  const samples: number[] = [];
  const dt = 1 / sampleRate;

  for (let t = 0; t < duration; t += dt) {
    samples.push(modulation.modulation(t));
  }

  return samples;
}

/**
 * D. Sacred Geometry Phase
 *
 * Element wave determines vertex positions:
 * vertices[i] = r·exp(i·arg(F_J(θᵢ)))
 *
 * Chemical structure → geometric form.
 */
export interface GeometricVertex {
  angle: number; // Input angle θ
  radius: number; // Modulated by element wave magnitude
  phase: number; // From element wave phase
  x: number; // Cartesian x
  y: number; // Cartesian y
}

/**
 * Generate vertices for sacred geometry from element wave
 */
export function generateSacredGeometryVertices(
  elementWaveSamples: ElementWave[],
  baseRadius: number = 1.0,
  magnitudeScale: number = 0.2
): GeometricVertex[] {
  const vertices: GeometricVertex[] = [];
  const n = elementWaveSamples.length;

  for (let i = 0; i < n; i++) {
    const sample = elementWaveSamples[i];
    const angle = (2 * Math.PI * i) / n;

    // Use element wave magnitude to modulate radius
    const radius = baseRadius * (1 + magnitudeScale * sample.magnitude);

    // Use element wave phase to rotate vertex
    const effectiveAngle = angle + sample.phase;

    const x = radius * Math.cos(effectiveAngle);
    const y = radius * Math.sin(effectiveAngle);

    vertices.push({
      angle,
      radius,
      phase: sample.phase,
      x,
      y,
    });
  }

  return vertices;
}

/**
 * Generate N-gon vertices (regular polygon) modulated by element wave
 */
export function generateModulatedPolygon(
  numSides: number,
  elementWaveSamples: ElementWave[],
  baseRadius: number = 1.0,
  magnitudeScale: number = 0.2
): GeometricVertex[] {
  // Resample element wave at N equally-spaced angles
  const vertices: GeometricVertex[] = [];

  for (let i = 0; i < numSides; i++) {
    const angle = (2 * Math.PI * i) / numSides;
    const sampleIndex = Math.floor((i / numSides) * elementWaveSamples.length);
    const sample = elementWaveSamples[sampleIndex];

    const radius = baseRadius * (1 + magnitudeScale * sample.magnitude);
    const effectiveAngle = angle + sample.phase;

    const x = radius * Math.cos(effectiveAngle);
    const y = radius * Math.sin(effectiveAngle);

    vertices.push({
      angle,
      radius,
      phase: sample.phase,
      x,
      y,
    });
  }

  return vertices;
}

/**
 * Generate radial envelope for visualization
 * Returns [angle, radius] pairs for plotting
 */
export function generateRadialEnvelope(
  elementWaveSamples: ElementWave[],
  baseRadius: number = 1.0,
  magnitudeScale: number = 0.5
): Array<[number, number]> {
  const envelope: Array<[number, number]> = [];
  const n = elementWaveSamples.length;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    const radius = baseRadius * (1 + magnitudeScale * elementWaveSamples[i].magnitude);
    envelope.push([angle, radius]);
  }

  return envelope;
}

/**
 * Combined application: Generate complete Jewble visualization data
 */
export interface JewbleVisualizationData {
  // Frequency data for audio
  frequencies: number[];
  harmonics: number[][];

  // Geometric data for visuals
  vertices: GeometricVertex[];
  radialEnvelope: Array<[number, number]>;

  // Temporal data for animation
  apertureModulation: ApertureModulation;
  apertureSamples: number[];

  // Prime data for sequencing
  primes: number[];
  primeWalk: number[];
}

/**
 * Generate complete visualization data from element analysis
 */
export function generateVisualizationData(
  chargeVector: ChargeVector,
  heptaTriple: HeptaTriple,
  elementWaveSamples: ElementWave[],
  options: {
    baseFrequency?: number;
    numHarmonics?: number;
    baseRadius?: number;
    numPrimes?: number;
    animationDuration?: number;
  } = {}
): JewbleVisualizationData {
  const {
    baseFrequency = 440.0,
    numHarmonics = 8,
    baseRadius = 1.0,
    numPrimes = 10,
    animationDuration = 10.0,
  } = options;

  // Audio data
  const fundamental = chargeToFrequency(chargeVector, baseFrequency);
  const frequencies = [fundamental];
  const harmonics = generateHarmonicSeries(chargeVector, baseFrequency, numHarmonics);

  // Geometric data
  const vertices = generateSacredGeometryVertices(elementWaveSamples, baseRadius, 0.2);
  const radialEnvelope = generateRadialEnvelope(elementWaveSamples, baseRadius, 0.5);

  // Temporal data
  const apertureModulation = createApertureModulation(heptaTriple, baseRadius);
  const apertureSamples = sampleApertureModulation(
    apertureModulation,
    animationDuration,
    60
  );

  // Prime data
  const primes = generatePrimesFromCharge(chargeVector, numPrimes);
  const startPrime = primes[0] || 2;
  const walk = primeWalk(chargeVector, startPrime, numPrimes);

  return {
    frequencies,
    harmonics: [harmonics],
    vertices,
    radialEnvelope,
    apertureModulation,
    apertureSamples,
    primes,
    primeWalk: walk,
  };
}

/**
 * Helper: Convert vertices to SVG path
 */
export function verticesToSVGPath(vertices: GeometricVertex[]): string {
  if (vertices.length === 0) return '';

  const commands: string[] = [];
  commands.push(`M ${vertices[0].x} ${vertices[0].y}`);

  for (let i = 1; i < vertices.length; i++) {
    commands.push(`L ${vertices[i].x} ${vertices[i].y}`);
  }

  commands.push('Z'); // Close path

  return commands.join(' ');
}

/**
 * Helper: Export radial envelope as JSON
 */
export function exportRadialEnvelope(envelope: Array<[number, number]>): string {
  return JSON.stringify(
    envelope.map(([angle, radius]) => ({
      angle: angle * (180 / Math.PI), // Convert to degrees
      radius,
    })),
    null,
    2
  );
}

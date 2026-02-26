import { Vitals } from '@/lib/store';

// --- 1. Hepta-Chromatic Aura Logic ---

/**
 * Hepta-Chromatic Aura: Maps two vitals (Energy and Hunger) to a 7-point color wheel.
 * This is a simplified 2D color interpolation.
 * @param vitals The pet's vital signs.
 * @returns A hex color string.
 */
export function getHeptaChromaticColor(vitals: Vitals): string {
  // Define 7 key colors (Hepta-Chromatic)
  const colors = [
    '#FF0000', // Red (Low Energy, High Hunger)
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green (High Energy, Low Hunger)
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet (Low Energy, Low Hunger)
  ];

  // Map vitals to a single value (0 to 100) for color wheel position
  // We'll use a combination of Energy and inverse Hunger.
  const energyWeight = 0.6;
  const hungerWeight = 0.4;
  const normalizedValue = vitals.energy * energyWeight + (100 - vitals.hunger) * hungerWeight;

  // Map the normalized value (0-100) to the number of colors (0-6.999)
  const colorIndex = (normalizedValue / 100) * colors.length;
  const nearestIndex = Math.round(colorIndex) % colors.length;

  return colors[nearestIndex];
}

// --- 2. Fractalized Shell Logic ---

/**
 * Fractalized Shell: Generates a simplified fractal-like SVG path (a Koch curve approximation)
 * that warps based on the pet's Hygiene vital.
 * @param hygiene The pet's hygiene vital (0-100).
 * @returns An SVG path string.
 */
export function getFractalizedPath(hygiene: number): string {
  // Base shape: A simple triangle (or a simplified Seed of Life boundary)
  const size = 40;
  const center = 50;
  const height = size * (Math.sqrt(3) / 2);

  // Base points of a hexagon (for a more geometric look)
  const points = [
    { x: center + size, y: center },
    { x: center + size / 2, y: center + height },
    { x: center - size / 2, y: center + height },
    { x: center - size, y: center },
    { x: center - size / 2, y: center - height },
    { x: center + size / 2, y: center - height },
  ];

  // The 'warping' or 'fractalization' is controlled by the iteration depth,
  // which is tied to the inverse of hygiene (low hygiene = more complex/warped)
  const maxIterations = 3;
  const iteration = Math.floor(maxIterations * (1 - hygiene / 100));

  let path = `M ${points[0].x} ${points[0].y}`;

  // Simplified Koch-like iteration for SVG path
  const kochSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }, depth: number): string => {
    if (depth === 0) {
      return ` L ${p2.x} ${p2.y}`;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const pA = { x: p1.x + dx / 3, y: p1.y + dy / 3 };
    const pB = { x: p1.x + (dx * 2) / 3, y: p1.y + (dy * 2) / 3 };

    // Calculate the peak point (rotated 60 degrees)
    const pC = {
      x: pA.x + (pB.x - pA.x) * Math.cos(Math.PI / 3) - (pB.y - pA.y) * Math.sin(Math.PI / 3),
      y: pA.y + (pB.x - pA.x) * Math.sin(Math.PI / 3) + (pB.y - pA.y) * Math.cos(Math.PI / 3),
    };

    let segmentPath = '';
    segmentPath += kochSegment(p1, pA, depth - 1);
    segmentPath += kochSegment(pA, pC, depth - 1);
    segmentPath += kochSegment(pC, pB, depth - 1);
    segmentPath += kochSegment(pB, p2, depth - 1);
    return segmentPath;
  };

  for (let i = 0; i < points.length; i += 1) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    path += kochSegment(p1, p2, iteration);
  }

  return `${path} Z`;
}

// --- 9. Memory Corruption Effect Logic ---

/**
 * Memory Corruption Effect: Generates random offsets for SVG coordinates
 * when hygiene is low, simulating visual corruption.
 * @param hygiene The pet's hygiene vital (0-100).
 * @returns An object with x and y offsets.
 */
export function getMemoryCorruptionOffset(hygiene: number): { x: number; y: number } {
  // Low hygiene = high corruption
  const corruptionAmount = 1 - hygiene / 100;

  // Generate random offsets scaled by corruption amount
  const maxOffset = corruptionAmount * 3; // Max 3 units of offset
  const x = (Math.random() - 0.5) * maxOffset * 2;
  const y = (Math.random() - 0.5) * maxOffset * 2;

  return { x, y };
}

// --- 12. Dynamic Shadow Projection Logic ---

/**
 * Dynamic Shadow Projection: Generates a shadow path based on hunger and rotation.
 * The shadow shape changes based on the pet's hunger level.
 * @param hunger The pet's hunger vital (0-100).
 * @param rotation The pet's current rotation angle.
 * @returns An SVG path string for the shadow.
 */
export function getDynamicShadowPath(hunger: number, rotation: number): string {
  // The shadow is an ellipse that stretches based on hunger
  const centerX = 50;
  const centerY = 65; // Offset below the pet

  // Hunger affects the shadow's size and shape
  const baseRadiusX = 25;
  const baseRadiusY = 15;
  const hungerScale = 0.8 + (hunger / 100) * 0.4; // 0.8 to 1.2

  const radiusX = baseRadiusX * hungerScale;
  const radiusY = baseRadiusY * hungerScale;

  // Create an ellipse path (SVG ellipse approximation using a path)
  // This is a simplified ellipse using cubic Bezier curves
  const kappa = 0.5522848; // Magic number for approximating a circle with Bezier curves
  const ox = radiusX * kappa;
  const oy = radiusY * kappa;

  // rotation is currently unused but kept for potential future transforms
  void rotation;

  return `
    M ${centerX - radiusX} ${centerY}
    C ${centerX - radiusX} ${centerY - oy}, ${centerX - ox} ${centerY - radiusY}, ${centerX} ${centerY - radiusY}
    C ${centerX + ox} ${centerY - radiusY}, ${centerX + radiusX} ${centerY - oy}, ${centerX + radiusX} ${centerY}
    C ${centerX + radiusX} ${centerY + oy}, ${centerX + ox} ${centerY + radiusY}, ${centerX} ${centerY + radiusY}
    C ${centerX - ox} ${centerY + radiusY}, ${centerX - radiusX} ${centerY + oy}, ${centerX - radiusX} ${centerY}
    Z
  `;
}

// --- 8. Predictive State Glitch Logic ---

/**
 * Predictive State Glitch: Predicts the next state based on vitals history.
 * This is a simple linear extrapolation.
 * @param vitalsHistory An array of previous vitals states.
 * @returns Predicted vitals for the next frame.
 */
export function predictNextVitals(vitalsHistory: Vitals[]): Vitals | null {
  if (vitalsHistory.length < 2) return null;

  const current = vitalsHistory[vitalsHistory.length - 1];
  const previous = vitalsHistory[vitalsHistory.length - 2];

  // Simple linear extrapolation
  const energyDelta = current.energy - previous.energy;
  const moodDelta = current.mood - previous.mood;
  const hungerDelta = current.hunger - previous.hunger;
  const hygieneDelta = current.hygiene - previous.hygiene;

  return {
    energy: Math.max(0, Math.min(100, current.energy + energyDelta)),
    mood: Math.max(0, Math.min(100, current.mood + moodDelta)),
    hunger: Math.max(0, Math.min(100, current.hunger + hungerDelta)),
    hygiene: Math.max(0, Math.min(100, current.hygiene + hygieneDelta)),
    isSick: current.isSick,
    sicknessSeverity: current.sicknessSeverity,
    sicknessType: current.sicknessType,
    deathCount: current.deathCount,
  };
}

// --- 10. Procedural Behavior Engine (FSM) ---

export type PetBehaviorState =
  | 'idle-happy'
  | 'idle-neutral'
  | 'idle-sad'
  | 'wander-energetic'
  | 'wander-tired'
  | 'panic-hungry'
  | 'panic-dirty'
  | 'sleep';

/**
 * Procedural Behavior Engine: Determines the pet's behavior state based on vitals.
 * @param vitals The pet's vital signs.
 * @returns The current behavior state.
 */
export function getPetBehaviorState(vitals: Vitals): PetBehaviorState {
  // Priority-based FSM logic

  // Extreme states take priority
  if (vitals.hunger > 80) return 'panic-hungry';
  if (vitals.hygiene < 20) return 'panic-dirty';
  if (vitals.energy < 15) return 'sleep';

  // Mood-based states
  if (vitals.mood > 70) {
    return vitals.energy > 60 ? 'wander-energetic' : 'idle-happy';
  }
  if (vitals.mood > 40) {
    return vitals.energy > 50 ? 'wander-energetic' : 'idle-neutral';
  }
  return vitals.energy > 40 ? 'wander-tired' : 'idle-sad';
}

/**
 * Get animation parameters based on behavior state.
 * @param state The pet's behavior state.
 * @returns Animation parameters (scale, rotation speed, etc.).
 */
export function getAnimationParametersForState(state: PetBehaviorState): {
  scaleAmplitude: number;
  rotationSpeed: number;
  pulseFrequency: number;
} {
  const params = {
    'idle-happy': { scaleAmplitude: 0.3, rotationSpeed: 0.5, pulseFrequency: 1 },
    'idle-neutral': { scaleAmplitude: 0.2, rotationSpeed: 0.3, pulseFrequency: 0.8 },
    'idle-sad': { scaleAmplitude: 0.1, rotationSpeed: 0.1, pulseFrequency: 0.5 },
    'wander-energetic': { scaleAmplitude: 0.5, rotationSpeed: 2, pulseFrequency: 2 },
    'wander-tired': { scaleAmplitude: 0.15, rotationSpeed: 0.5, pulseFrequency: 0.6 },
    'panic-hungry': { scaleAmplitude: 0.6, rotationSpeed: 3, pulseFrequency: 3 },
    'panic-dirty': { scaleAmplitude: 0.4, rotationSpeed: 2.5, pulseFrequency: 2.5 },
    sleep: { scaleAmplitude: 0.05, rotationSpeed: 0, pulseFrequency: 0.2 },
  } as const;

  return params[state];
}

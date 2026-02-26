import { Vitals } from '@/store';

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
  // We'll use a combination of Energy and inverse Hunger: (Energy - Hunger) / 2 + 50
  // This centers the color wheel around the average state.
  const energyWeight = 0.6;
  const hungerWeight = 0.4;
  const normalizedValue = (vitals.energy * energyWeight + (100 - vitals.hunger) * hungerWeight);
  
  // Map the normalized value (0-100) to the number of colors (0-6.999)
  const colorIndex = (normalizedValue / 100) * colors.length;
  
  const index1 = Math.floor(colorIndex) % colors.length;
  const index2 = Math.ceil(colorIndex) % colors.length;
  const ratio = colorIndex - index1;

  // Simple linear interpolation between two colors (for a smoother transition)
  const color1 = colors[index1];
  const color2 = colors[index2];

  // A simple way to blend colors (requires a more complex utility for true hex blending,
  // but for a quick implementation, we'll return the closest color or a simple blend indicator)
  // For simplicity in this utility, we'll return the closest color.
  return colors[Math.round(colorIndex) % colors.length];
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
  const kochSegment = (p1: { x: number, y: number }, p2: { x: number, y: number }, depth: number) => {
    if (depth === 0) {
      return ` L ${p2.x} ${p2.y}`;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    const pA = { x: p1.x + dx / 3, y: p1.y + dy / 3 };
    const pB = { x: p1.x + dx * 2 / 3, y: p1.y + dy * 2 / 3 };
    
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

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    path += kochSegment(p1, p2, iteration);
  }

  return path + ' Z';
}

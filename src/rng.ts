/**
 * Simple deterministic pseudo-random number generator (PRNG).
 * The engine requires a deterministic tick, so the RNG must be seeded and predictable.
 */

let seed = 12345; // Initial seed

export function setSeed(newSeed: number) {
  seed = newSeed;
}

/**
 * Generates a pseudo-random number between 0 (inclusive) and 1 (exclusive).
 */
export function nextRandom(): number {
  // Simple LCG (Linear Congruential Generator)
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

/**
 * Generates a pseudo-random integer between min (inclusive) and max (inclusive).
 */
export function nextInt(min: number, max: number): number {
  return Math.floor(nextRandom() * (max - min + 1)) + min;
}

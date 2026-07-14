/**
 * Prism Storm — pure engine for the "find the stable signal" anomaly
 * encounter. One signal among several pulses at a perfectly steady rate;
 * the rest flicker erratically. A wrong guess never ends the attempt — it
 * just counts, and the player can keep guessing until they find it.
 */

export const PRISM_SIGNAL_COUNT = 5;

export interface PrismSignal {
  id: number;
  /** True for exactly one signal per storm — the stable one to find. */
  stable: boolean;
}

export interface PrismStormState {
  signals: PrismSignal[];
  stableIndex: number;
  guesses: number;
  resolved: boolean;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPrismStorm(
  seed: number,
  count: number = PRISM_SIGNAL_COUNT,
): PrismStormState {
  const random = mulberry32(seed);
  const stableIndex = Math.floor(random() * count);
  const signals: PrismSignal[] = Array.from({ length: count }, (_, id) => ({
    id,
    stable: id === stableIndex,
  }));
  return { signals, stableIndex, guesses: 0, resolved: false };
}

/**
 * Guess one signal index. Correct guesses resolve the storm; wrong guesses
 * just increment the counter — there is no limit and no penalty, the player
 * always gets to keep watching and guessing again.
 */
export function submitPrismGuess(state: PrismStormState, index: number): PrismStormState {
  if (state.resolved) return state;
  const guesses = state.guesses + 1;
  if (index === state.stableIndex) {
    return { ...state, guesses, resolved: true };
  }
  return { ...state, guesses };
}

/**
 * Vimana resonance-ring scan — pure engine for the tap-timing minigame played
 * when scanning a map node. A ring expands toward a target radius three times
 * in sequence; tapping close to each target completion produces a rough,
 * clean, or perfect reading. The component only renders the rings and wires
 * up taps; scoring is fully deterministic and DOM-free here.
 *
 * A scan always produces a result — there is no failure state, so a mistimed
 * tap never costs the player anything beyond a weaker reading.
 */

import { SCAN_TIER_SCORES, type VimanaScanTier } from '@/progression/vimana';

export const SCAN_RING_COUNT = 3;
export const SCAN_RING_DURATION_MS = 1100;
/** Gap between one ring's target and the next ring starting to expand. */
export const SCAN_RING_GAP_MS = 250;

/** Timing windows (ms of drift from the target) for each tier. */
export const SCAN_PERFECT_WINDOW_MS = 90;
export const SCAN_CLEAN_WINDOW_MS = 260;

export interface ScanRingState {
  startedAt: number;
  /** Target completion timestamp for each of the three rings, in order. */
  targets: number[];
  /** Elapsed-ms-from-start of each tap registered so far, in order. */
  taps: number[];
  complete: boolean;
}

export function createScanRing(now: number): ScanRingState {
  const targets = Array.from(
    { length: SCAN_RING_COUNT },
    (_, index) => now + (index + 1) * SCAN_RING_DURATION_MS + index * SCAN_RING_GAP_MS,
  );
  return { startedAt: now, targets, taps: [], complete: false };
}

/** Register a tap at time `now`. Ignored once all rings have been tapped. */
export function registerScanTap(state: ScanRingState, now: number): ScanRingState {
  if (state.complete || state.taps.length >= state.targets.length) return state;
  const taps = [...state.taps, now];
  return { ...state, taps, complete: taps.length >= state.targets.length };
}

/** Per-tap accuracy: 100 at a perfect hit, decaying linearly to 0 by 2x the clean window. */
function tapAccuracy(target: number, tap: number): number {
  const drift = Math.abs(tap - target);
  if (drift <= SCAN_PERFECT_WINDOW_MS) return 100;
  const spread = SCAN_CLEAN_WINDOW_MS * 2;
  return Math.max(0, Math.round(100 * (1 - (drift - SCAN_PERFECT_WINDOW_MS) / spread)));
}

export interface ScanRingResult {
  tier: VimanaScanTier;
  /** Average timing accuracy across every tap, 0-100. */
  accuracy: number;
  /** Numeric score to store on the node (see SCAN_TIER_SCORES). */
  scanQuality: number;
}

/**
 * Score every registered tap against its ring's target time and average
 * them into one result. Untapped rings (the player ran out the clock) count
 * as a zero-accuracy tap rather than being dropped — always a real result,
 * never a crash or an undefined tier.
 */
export function evaluateScanResult(state: ScanRingState): ScanRingResult {
  const accuracies = state.targets.map((target, index) => {
    const tap = state.taps[index];
    return tap === undefined ? 0 : tapAccuracy(target, tap);
  });
  const accuracy = accuracies.length > 0
    ? Math.round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length)
    : 0;

  const worstDrift = state.targets.every((target, index) => {
    const tap = state.taps[index];
    return tap !== undefined && Math.abs(tap - target) <= SCAN_PERFECT_WINDOW_MS;
  });
  const allWithinClean = state.targets.every((target, index) => {
    const tap = state.taps[index];
    return tap !== undefined && Math.abs(tap - target) <= SCAN_CLEAN_WINDOW_MS;
  });

  const tier: VimanaScanTier = worstDrift ? 'perfect' : allWithinClean ? 'clean' : 'rough';

  return { tier, accuracy, scanQuality: SCAN_TIER_SCORES[tier] };
}

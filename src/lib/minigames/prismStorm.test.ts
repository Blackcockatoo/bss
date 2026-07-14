import { describe, expect, it } from 'vitest';

import {
  PRISM_SIGNAL_COUNT,
  createPrismStorm,
  submitPrismGuess,
} from './prismStorm';

describe('createPrismStorm', () => {
  it('is deterministic for the same seed', () => {
    expect(createPrismStorm(7)).toEqual(createPrismStorm(7));
  });

  it('marks exactly one signal as stable among the requested count', () => {
    const state = createPrismStorm(42);
    expect(state.signals).toHaveLength(PRISM_SIGNAL_COUNT);
    const stableSignals = state.signals.filter((signal) => signal.stable);
    expect(stableSignals).toHaveLength(1);
    expect(stableSignals[0].id).toBe(state.stableIndex);
    expect(state.resolved).toBe(false);
    expect(state.guesses).toBe(0);
  });

  it('varies which signal is stable across seeds', () => {
    const indices = new Set(
      Array.from({ length: 20 }, (_, seed) => createPrismStorm(seed).stableIndex),
    );
    expect(indices.size).toBeGreaterThan(1);
  });
});

describe('submitPrismGuess', () => {
  it('resolves on a correct guess', () => {
    const state = createPrismStorm(1);
    const resolved = submitPrismGuess(state, state.stableIndex);
    expect(resolved.resolved).toBe(true);
    expect(resolved.guesses).toBe(1);
  });

  it('never fails on a wrong guess — it just counts and stays open', () => {
    const state = createPrismStorm(1);
    const wrongIndex = (state.stableIndex + 1) % PRISM_SIGNAL_COUNT;
    const afterWrong = submitPrismGuess(state, wrongIndex);
    expect(afterWrong.resolved).toBe(false);
    expect(afterWrong.guesses).toBe(1);

    const afterCorrect = submitPrismGuess(afterWrong, state.stableIndex);
    expect(afterCorrect.resolved).toBe(true);
    expect(afterCorrect.guesses).toBe(2);
  });

  it('is a no-op once resolved', () => {
    const state = createPrismStorm(1);
    const resolved = submitPrismGuess(state, state.stableIndex);
    expect(submitPrismGuess(resolved, 0)).toBe(resolved);
  });
});

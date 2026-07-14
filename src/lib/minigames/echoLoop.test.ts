import { describe, expect, it } from 'vitest';

import {
  ECHO_LOOP_PAD_COUNT,
  ECHO_LOOP_SEQUENCE_LENGTH,
  beginEchoInput,
  createEchoLoop,
  submitEchoTap,
} from './echoLoop';

describe('createEchoLoop', () => {
  it('is deterministic for the same seed', () => {
    expect(createEchoLoop(7).sequence).toEqual(createEchoLoop(7).sequence);
  });

  it('generates a sequence of the requested length within pad range, no immediate repeats', () => {
    const state = createEchoLoop(42);
    expect(state.sequence).toHaveLength(ECHO_LOOP_SEQUENCE_LENGTH);
    expect(state.sequence.every((pad) => pad >= 0 && pad < ECHO_LOOP_PAD_COUNT)).toBe(true);
    for (let i = 1; i < state.sequence.length; i++) {
      expect(state.sequence[i]).not.toBe(state.sequence[i - 1]);
    }
    expect(state.status).toBe('showing');
  });

  it('varies across seeds', () => {
    const a = createEchoLoop(1).sequence;
    const b = createEchoLoop(999).sequence;
    expect(a).not.toEqual(b);
  });
});

describe('beginEchoInput', () => {
  it('moves from showing to input', () => {
    const state = beginEchoInput(createEchoLoop(1));
    expect(state.status).toBe('input');
  });

  it('is a no-op once already in input or success', () => {
    const input = beginEchoInput(createEchoLoop(1));
    expect(beginEchoInput(input)).toBe(input);
  });
});

describe('submitEchoTap', () => {
  it('ignores taps before playback has finished', () => {
    const state = createEchoLoop(1);
    expect(submitEchoTap(state, state.sequence[0])).toBe(state);
  });

  it('advances progress on a correct tap and succeeds on the final one', () => {
    let state = beginEchoInput(createEchoLoop(3));
    for (let i = 0; i < state.sequence.length - 1; i++) {
      state = submitEchoTap(state, state.sequence[i]);
      expect(state.status).toBe('input');
      expect(state.playerInput).toHaveLength(i + 1);
    }
    state = submitEchoTap(state, state.sequence[state.sequence.length - 1]);
    expect(state.status).toBe('success');
    expect(state.playerInput).toEqual(state.sequence);
  });

  it('resets input (never fails) on a wrong tap and lets the player retry', () => {
    let state = beginEchoInput(createEchoLoop(5));
    const correctFirst = state.sequence[0];
    const wrongFirst = (correctFirst + 1) % ECHO_LOOP_PAD_COUNT;

    state = submitEchoTap(state, wrongFirst);
    expect(state.status).toBe('input'); // never a failure state
    expect(state.playerInput).toEqual([]);
    expect(state.mistakes).toBe(1);

    // Retrying with the correct sequence still works after a mistake.
    for (const pad of state.sequence) {
      state = submitEchoTap(state, pad);
    }
    expect(state.status).toBe('success');
  });

  it('ignores taps once already succeeded', () => {
    let state = beginEchoInput(createEchoLoop(2));
    for (const pad of state.sequence) {
      state = submitEchoTap(state, pad);
    }
    expect(state.status).toBe('success');
    const succeeded = state;
    expect(submitEchoTap(state, 0)).toBe(succeeded);
  });
});

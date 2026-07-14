/**
 * Echo Loop — pure engine for the memory-sequence anomaly encounter.
 *
 * A fixed pad sequence is generated once per node (seeded), played back to
 * the player, then replayed by tapping the pads in order. A wrong tap never
 * fails the encounter — it just resets the input and lets the player watch
 * the sequence again, so there is no punishing dead end.
 */

export const ECHO_LOOP_PAD_COUNT = 4;
export const ECHO_LOOP_SEQUENCE_LENGTH = 5;

export type EchoLoopStatus = 'showing' | 'input' | 'success';

export interface EchoLoopState {
  sequence: number[];
  playerInput: number[];
  status: EchoLoopStatus;
  mistakes: number;
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

export function createEchoLoop(
  seed: number,
  length: number = ECHO_LOOP_SEQUENCE_LENGTH,
): EchoLoopState {
  const random = mulberry32(seed);
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    // Avoid immediate repeats so the sequence always reads as distinct beats.
    let pad = Math.floor(random() * ECHO_LOOP_PAD_COUNT);
    if (sequence.length > 0 && pad === sequence[sequence.length - 1]) {
      pad = (pad + 1) % ECHO_LOOP_PAD_COUNT;
    }
    sequence.push(pad);
  }
  return { sequence, playerInput: [], status: 'showing', mistakes: 0 };
}

/** Playback finished; the player may now tap the pads back in order. */
export function beginEchoInput(state: EchoLoopState): EchoLoopState {
  if (state.status !== 'showing') return state;
  return { ...state, status: 'input' };
}

/**
 * Register one pad tap during the input phase. A correct tap advances the
 * player's progress (and completes the encounter on the final pad); a wrong
 * tap resets the input to the start of the same sequence — the player
 * always gets another try, never a hard failure.
 */
export function submitEchoTap(state: EchoLoopState, pad: number): EchoLoopState {
  if (state.status !== 'input') return state;

  const expected = state.sequence[state.playerInput.length];
  if (pad !== expected) {
    return { ...state, playerInput: [], mistakes: state.mistakes + 1 };
  }

  const playerInput = [...state.playerInput, pad];
  if (playerInput.length === state.sequence.length) {
    return { ...state, playerInput, status: 'success' };
  }
  return { ...state, playerInput };
}

import { describe, expect, it } from 'vitest';

import {
  COMBO_BONUS_PER_STEP,
  EXPEDITION_DURATION_MS,
  FLUX_GRAVITY_FACTOR,
  LINE_SCORE_TABLE,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  POWER_COSTS,
  POWER_DURATIONS_MS,
  PREVIEW_COUNT,
  RESONANCE_MAX,
  RESONANCE_PER_LINE,
  SHAPE_LIST,
  STACK_COLS,
  STACK_ROWS,
  activatePower,
  clearLines,
  createStackGame,
  currentGravityIntervalMs,
  drawBag,
  gravityIntervalMs,
  hardDropActive,
  holdActive,
  isInDanger,
  isValidPosition,
  levelForLines,
  makeEmptyBoard,
  moveActive,
  rotateActive,
  scoreForClear,
  shiftStackClock,
  softDropActive,
  tickStack,
  type StackCell,
  type StackPiece,
  type StackState,
} from './vimanaStack';

function filledRow(gapAt?: number): StackCell[] {
  return Array.from({ length: STACK_COLS }, (_, x) => ({
    filled: gapAt === undefined || x !== gapAt,
    color: '#fff',
  }));
}

function withBoard(state: StackState, board: StackCell[][]): StackState {
  return { ...state, board };
}

describe('seven-piece bag randomiser', () => {
  it('every bag contains each of the seven pieces exactly once', () => {
    let rngState = 12345;
    for (let i = 0; i < 10; i++) {
      const result = drawBag(rngState);
      rngState = result.rngState;
      expect([...result.bag].sort()).toEqual([...SHAPE_LIST].sort());
    }
  });

  it('is deterministic for the same seed', () => {
    expect(drawBag(42).bag).toEqual(drawBag(42).bag);
    const gameA = createStackGame(7, 1, 0);
    const gameB = createStackGame(7, 1, 0);
    expect(gameA.active!.shape).toBe(gameB.active!.shape);
    expect(gameA.queue).toEqual(gameB.queue);
  });

  it('never starves the preview: at least three upcoming pieces', () => {
    let state = createStackGame(99, 1, 0);
    for (let i = 0; i < 20 && state.status === 'running'; i++) {
      expect(state.queue.length).toBeGreaterThanOrEqual(PREVIEW_COUNT);
      state = hardDropActive(state, i * 1000).state;
    }
  });

  it('draws pieces so any 14-piece window has each shape at least once', () => {
    let state = createStackGame(3, 1, 0);
    const drawn: string[] = [state.active!.shape];
    while (drawn.length < 14 && state.status === 'running') {
      state = hardDropActive(state, drawn.length * 1000).state;
      if (state.active) drawn.push(state.active.shape);
    }
    for (const shape of SHAPE_LIST) {
      expect(drawn).toContain(shape);
    }
  });
});

describe('wall kicks', () => {
  it('kicks a T piece off the left wall when rotating', () => {
    const state = createStackGame(1, 1, 0);
    // T pointing right, hugging the left wall (a valid resting spot). The
    // raw next rotation pokes through the wall, so a kick must slide it in.
    const piece: StackPiece = { shape: 'T', rotation: 1, pos: { x: 0, y: 5 } };
    expect(isValidPosition(piece, state.board)).toBe(true);
    const pinned = { ...state, active: piece };

    const rotated = rotateActive(pinned, 1, 0);
    expect(rotated.active!.rotation).toBe(2);
    expect(isValidPosition(rotated.active!, rotated.board)).toBe(true);
    expect(rotated.active!.pos.x).toBeGreaterThan(0);
  });

  it('kicks a vertical I piece away from the right wall', () => {
    const state = createStackGame(1, 1, 0);
    const piece: StackPiece = { shape: 'I', rotation: 1, pos: { x: STACK_COLS - 1, y: 5 } };
    expect(isValidPosition(piece, state.board)).toBe(true);
    const pinned = { ...state, active: piece };

    const rotated = rotateActive(pinned, 1, 0);
    expect(rotated.active!.rotation).toBe(2);
    expect(isValidPosition(rotated.active!, rotated.board)).toBe(true);
    // The kick must have pulled the piece leftwards into the field.
    expect(rotated.active!.pos.x).toBeLessThan(STACK_COLS - 1);
  });

  it('keeps the original orientation when no kick fits', () => {
    const state = createStackGame(1, 1, 0);
    // Wall the piece in on all sides so every kick position collides.
    const board = makeEmptyBoard();
    for (let y = 0; y < STACK_ROWS; y++) {
      for (let x = 0; x < STACK_COLS; x++) {
        board[y][x] = { filled: true, color: '#fff' };
      }
    }
    const piece: StackPiece = { shape: 'T', rotation: 0, pos: { x: 4, y: 4 } };
    board[4][3] = { filled: false, color: null };
    board[4][4] = { filled: false, color: null };
    board[4][5] = { filled: false, color: null };
    board[5][4] = { filled: false, color: null };

    const rotated = rotateActive(withBoard({ ...state, active: piece }, board), 1, 0);
    expect(rotated.active).toEqual(piece);
  });
});

describe('hold slot', () => {
  it('stows the active piece and spawns from the queue on first hold', () => {
    const state = createStackGame(5, 1, 0);
    const held = state.active!.shape;
    const expectedNext = state.queue[0];

    const next = holdActive(state, 0);
    expect(next.holdPiece).toBe(held);
    expect(next.active!.shape).toBe(expectedNext);
    expect(next.holdUsed).toBe(true);
  });

  it('cannot hold twice before the piece locks', () => {
    const state = createStackGame(5, 1, 0);
    const once = holdActive(state, 0);
    const twice = holdActive(once, 10);
    expect(twice).toBe(once);
  });

  it('unlocks hold again after the piece locks', () => {
    const state = createStackGame(5, 1, 0);
    const once = holdActive(state, 0);
    const dropped = hardDropActive(once, 20).state;
    expect(dropped.holdUsed).toBe(false);

    const swapped = holdActive(dropped, 30);
    // Second hold swaps with the stored piece rather than the queue.
    expect(swapped.active!.shape).toBe(once.holdPiece);
    expect(swapped.holdPiece).toBe(dropped.active!.shape);
  });
});

describe('line clearing and scoring', () => {
  it('clears full rows and keeps the rest stacked in order', () => {
    const board = makeEmptyBoard();
    board[STACK_ROWS - 1] = filledRow();
    board[STACK_ROWS - 2] = filledRow(3);

    const { board: cleared, cleared: count } = clearLines(board);
    expect(count).toBe(1);
    // The row with the gap dropped to the bottom.
    expect(cleared[STACK_ROWS - 1].filter((cell) => cell.filled)).toHaveLength(STACK_COLS - 1);
    expect(cleared[STACK_ROWS - 1][3].filled).toBe(false);
    expect(cleared[0].every((cell) => !cell.filled)).toBe(true);
  });

  it('scores singles through tetrises using the level multiplier', () => {
    expect(scoreForClear(1, 1)).toBe(LINE_SCORE_TABLE[1]);
    expect(scoreForClear(2, 3)).toBe(LINE_SCORE_TABLE[2] * 3);
    expect(scoreForClear(4, 2)).toBe(LINE_SCORE_TABLE[4] * 2);
  });

  it('awards score and lines when a hard drop completes a row', () => {
    let state = createStackGame(5, 1, 0);
    // Fill the bottom row except where the vertical I piece will land.
    const board = makeEmptyBoard();
    board[STACK_ROWS - 1] = filledRow(0);
    state = withBoard(state, board);
    state = { ...state, active: { shape: 'I', rotation: 1, pos: { x: 0, y: 0 } } };

    const { state: next, events } = hardDropActive(state, 100);
    expect(events.cleared).toBe(1);
    expect(next.lines).toBe(1);
    expect(next.score).toBe(LINE_SCORE_TABLE[1] * 1);
  });

  it('levels up every ten lines from the start level', () => {
    expect(levelForLines(1, 9)).toBe(1);
    expect(levelForLines(1, 10)).toBe(2);
    expect(levelForLines(3, 25)).toBe(5);
    expect(gravityIntervalMs(1)).toBe(1000);
    expect(gravityIntervalMs(2)).toBe(920);
    expect(gravityIntervalMs(99)).toBe(120);
  });
});

describe('gravity and lock delay', () => {
  it('applies gravity steps as time passes', () => {
    const state = createStackGame(5, 1, 0);
    const startY = state.active!.pos.y;

    const after = tickStack(state, 1000).state;
    expect(after.active!.pos.y).toBe(startY + 1);

    const later = tickStack(after, 3000).state;
    expect(later.active!.pos.y).toBe(startY + 3);
  });

  it('does not lock a grounded piece before the delay expires', () => {
    let state = createStackGame(5, 1, 0);
    state = { ...state, active: { shape: 'O', rotation: 0, pos: { x: 4, y: STACK_ROWS - 2 } } };

    // First tick grounds the piece and arms the lock timer.
    const armed = tickStack(state, 100);
    expect(armed.events.locked).toBe(false);
    expect(armed.state.lockDeadline).toBe(100 + LOCK_DELAY_MS);

    // Before the deadline: still active.
    const waiting = tickStack(armed.state, 100 + LOCK_DELAY_MS - 50);
    expect(waiting.events.locked).toBe(false);

    // After the deadline: locked and a new piece spawned.
    const locked = tickStack(waiting.state, 100 + LOCK_DELAY_MS + 1);
    expect(locked.events.locked).toBe(true);
    expect(locked.state.board[STACK_ROWS - 1][4].filled).toBe(true);
  });

  it('movement resets the lock timer up to the reset cap', () => {
    let state = createStackGame(5, 1, 0);
    state = { ...state, active: { shape: 'O', rotation: 0, pos: { x: 4, y: STACK_ROWS - 2 } } };
    state = tickStack(state, 100).state;
    expect(state.lockDeadline).toBe(100 + LOCK_DELAY_MS);

    // Wiggle left/right: each successful move pushes the deadline out.
    let now = 200;
    state = moveActive(state, -1, now);
    expect(state.lockDeadline).toBe(now + LOCK_DELAY_MS);
    expect(state.lockResets).toBe(1);

    for (let i = 0; i < MAX_LOCK_RESETS + 5; i++) {
      now += 10;
      state = moveActive(state, i % 2 === 0 ? 1 : -1, now);
    }
    expect(state.lockResets).toBe(MAX_LOCK_RESETS);
    // Once the cap is reached the deadline no longer moves.
    const frozenDeadline = state.lockDeadline;
    state = moveActive(state, 1, now + 50);
    expect(state.lockDeadline).toBe(frozenDeadline);
  });

  it('soft drop walks the piece down one row per call', () => {
    const state = createStackGame(5, 1, 0);
    const startY = state.active!.pos.y;
    const once = softDropActive(state, 50);
    const twice = softDropActive(once, 80);
    expect(twice.active!.pos.y).toBe(startY + 2);
  });

  it('hard drop locks immediately and spawns the next piece', () => {
    const state = createStackGame(5, 1, 0);
    const nextShape = state.queue[0];
    const { state: after, events } = hardDropActive(state, 60);
    expect(events.locked).toBe(true);
    expect(after.active!.shape).toBe(nextShape);
    expect(after.board.some((row) => row.some((cell) => cell.filled))).toBe(true);
  });

  it('shifts every time anchor when the clock is adjusted after a pause', () => {
    let state = createStackGame(5, 1, 0, { mode: 'expedition' });
    state = {
      ...state,
      lockDeadline: 400,
      power: { kind: 'flux', expiresAt: 900 },
    };
    const shifted = shiftStackClock(state, 1000);
    expect(shifted.lastGravityAt).toBe(state.lastGravityAt + 1000);
    expect(shifted.lockDeadline).toBe(1400);
    expect(shifted.endsAt).toBe(state.endsAt! + 1000);
    expect(shifted.power!.expiresAt).toBe(1900);
  });

  it('ends the game when the spawn position is blocked', () => {
    let state = createStackGame(5, 1, 0);
    const board = makeEmptyBoard();
    // Choke the spawn rows so the next piece cannot appear.
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < STACK_COLS; x++) {
        board[y][x] = { filled: x !== 0, color: '#fff' };
      }
    }
    state = withBoard(state, board);
    state = { ...state, active: { shape: 'I', rotation: 1, pos: { x: 0, y: 4 } } };

    const { state: over, events } = hardDropActive(state, 10);
    expect(events.gameOver).toBe(true);
    expect(over.status).toBe('gameover');
    expect(over.active).toBeNull();
  });
});

// ===== Phase 3: combo, resonance, powers, expedition =====

/** A game whose active piece is a vertical I hovering over column `col`,
 *  with the bottom row full except that column — hard drop clears one line. */
function primedForClear(col = 0): StackState {
  const state = createStackGame(5, 1, 0);
  const board = makeEmptyBoard();
  board[STACK_ROWS - 1] = Array.from({ length: STACK_COLS }, (_, x) => ({
    filled: x !== col,
    color: '#fff',
  }));
  return {
    ...state,
    board,
    active: { shape: 'I', rotation: 1, pos: { x: col, y: 0 } },
  };
}

describe('resonance combo', () => {
  it('builds combo and awards chained bonus score', () => {
    let state = primedForClear(0);
    const first = hardDropActive(state, 100);
    expect(first.events.combo).toBe(1);
    expect(first.state.score).toBe(LINE_SCORE_TABLE[1]);

    // Prime a second clear immediately: combo should chain to 2.
    state = {
      ...primedForClear(1),
      score: first.state.score,
      combo: first.state.combo,
      bestCombo: first.state.bestCombo,
      resonance: first.state.resonance,
    };
    const second = hardDropActive(state, 200);
    expect(second.events.combo).toBe(2);
    expect(second.state.score).toBe(
      first.state.score + LINE_SCORE_TABLE[1] + COMBO_BONUS_PER_STEP,
    );
    expect(second.state.bestCombo).toBe(2);
  });

  it('breaks the combo on a lock without a clear', () => {
    const state = { ...createStackGame(5, 1, 0), combo: 3, bestCombo: 3 };
    const dropped = hardDropActive(state, 100);
    expect(dropped.events.cleared).toBe(0);
    expect(dropped.state.combo).toBe(0);
    expect(dropped.state.bestCombo).toBe(3);
  });

  it('accumulates resonance from clears up to the cap', () => {
    const cleared = hardDropActive(primedForClear(), 100).state;
    expect(cleared.resonance).toBe(RESONANCE_PER_LINE);

    const nearCap = { ...primedForClear(), resonance: RESONANCE_MAX - 2 };
    expect(hardDropActive(nearCap, 100).state.resonance).toBe(RESONANCE_MAX);
  });
});

describe('dosha powers', () => {
  it('flux slows gravity while active and expires on its own', () => {
    let state = { ...createStackGame(5, 1, 0), resonance: RESONANCE_MAX };
    state = activatePower(state, 'flux', 1000);
    expect(state.power?.kind).toBe('flux');
    expect(state.resonance).toBe(RESONANCE_MAX - POWER_COSTS.flux);
    expect(currentGravityIntervalMs(state, 1001)).toBe(
      Math.round(gravityIntervalMs(1) * FLUX_GRAVITY_FACTOR),
    );

    // After the duration the power unloads on the next tick.
    const after = tickStack(state, 1000 + POWER_DURATIONS_MS.flux + 1).state;
    expect(after.power).toBeNull();
    expect(currentGravityIntervalMs(after, 999999)).toBe(gravityIntervalMs(1));
  });

  it('forge repairs the lowest nearly-complete row without scoring', () => {
    let state = { ...createStackGame(5, 1, 0), resonance: RESONANCE_MAX };
    const board = makeEmptyBoard();
    // Bottom row has 8 of 10 filled — eligible for repair.
    board[STACK_ROWS - 1] = Array.from({ length: STACK_COLS }, (_, x) => ({
      filled: x < 8,
      color: '#fff',
    }));
    state = { ...state, board };

    const repaired = activatePower(state, 'forge', 500);
    expect(repaired.resonance).toBe(RESONANCE_MAX - POWER_COSTS.forge);
    expect(repaired.board[STACK_ROWS - 1].every((cell) => !cell.filled)).toBe(true);
    // No free progress: score/lines/combo untouched.
    expect(repaired.score).toBe(0);
    expect(repaired.lines).toBe(0);
  });

  it('forge refuses when no row is close enough to complete', () => {
    const state = { ...createStackGame(5, 1, 0), resonance: RESONANCE_MAX };
    const same = activatePower(state, 'forge', 500);
    expect(same).toBe(state);
  });

  it('anchor lets a blocked piece hop a single-cell bump', () => {
    let state = { ...createStackGame(5, 1, 0), resonance: RESONANCE_MAX };
    const board = makeEmptyBoard();
    // A one-cell bump directly right of the O piece resting on the floor.
    board[STACK_ROWS - 1][6] = { filled: true, color: '#fff' };
    state = {
      ...state,
      board,
      active: { shape: 'O', rotation: 0, pos: { x: 4, y: STACK_ROWS - 2 } },
    };

    // Without anchor the move is blocked.
    expect(moveActive(state, 1, 100).active!.pos).toEqual({ x: 4, y: STACK_ROWS - 2 });

    const empowered = activatePower(state, 'anchor', 100);
    const hopped = moveActive(empowered, 1, 101);
    expect(hopped.active!.pos).toEqual({ x: 5, y: STACK_ROWS - 3 });
  });

  it('rejects activation without enough resonance or while a power runs', () => {
    const broke = createStackGame(5, 1, 0);
    expect(activatePower(broke, 'flux', 0)).toBe(broke);

    let state = { ...createStackGame(5, 1, 0), resonance: RESONANCE_MAX };
    state = activatePower(state, 'flux', 0);
    const doubled = activatePower({ ...state, resonance: RESONANCE_MAX }, 'anchor', 10);
    expect(doubled.power?.kind).toBe('flux');
  });
});

describe('expedition mode', () => {
  it('runs on a 60 second window and ends with a timeUp event', () => {
    const state = createStackGame(5, 1, 0, { mode: 'expedition' });
    expect(state.endsAt).toBe(EXPEDITION_DURATION_MS);

    const before = tickStack(state, EXPEDITION_DURATION_MS - 10);
    expect(before.events.gameOver).toBe(false);

    const done = tickStack(before.state, EXPEDITION_DURATION_MS + 1);
    expect(done.events.gameOver).toBe(true);
    expect(done.events.timeUp).toBe(true);
    expect(done.state.status).toBe('gameover');
  });

  it('endless mode never times out', () => {
    const state = createStackGame(5, 1, 0);
    expect(state.endsAt).toBeNull();
    const later = tickStack(state, 10 * EXPEDITION_DURATION_MS);
    expect(later.state.status).toBe('running');
  });
});

describe('danger detection', () => {
  it('flags the board when the stack reaches the top rows', () => {
    const board = makeEmptyBoard();
    expect(isInDanger(board)).toBe(false);
    board[4][3] = { filled: true, color: '#fff' };
    expect(isInDanger(board)).toBe(true);
  });
});

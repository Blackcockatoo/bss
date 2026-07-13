import { describe, expect, it } from 'vitest';

import {
  LINE_SCORE_TABLE,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  PREVIEW_COUNT,
  SHAPE_LIST,
  STACK_COLS,
  STACK_ROWS,
  clearLines,
  createStackGame,
  drawBag,
  gravityIntervalMs,
  hardDropActive,
  holdActive,
  isValidPosition,
  levelForLines,
  makeEmptyBoard,
  moveActive,
  rotateActive,
  scoreForClear,
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

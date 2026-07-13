/**
 * Vimana Stack Field — pure game engine.
 *
 * All rules (seven-piece bag, SRS-style wall kicks, hold slot, lock delay,
 * gravity, scoring) live here as pure functions over an explicit state so the
 * component layer only translates input events and renders. Times are passed
 * in as `now` millisecond timestamps, which keeps every rule unit-testable.
 */

export type ShapeKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Point {
  x: number;
  y: number;
}

export interface StackCell {
  filled: boolean;
  color: string | null;
}

export interface StackPiece {
  shape: ShapeKey;
  rotation: number;
  pos: Point;
}

export type StackStatus = 'running' | 'paused' | 'gameover';

export type StackMode = 'endless' | 'expedition';

/** Temporary powers keyed to the three doshas (Forge/Flux/Anchor). */
export type StackPowerKind = 'forge' | 'flux' | 'anchor';

export interface StackState {
  board: StackCell[][];
  active: StackPiece | null;
  holdPiece: ShapeKey | null;
  /** True once hold has been used for the current active piece. */
  holdUsed: boolean;
  /** Upcoming pieces; always at least PREVIEW_COUNT long while running. */
  queue: ShapeKey[];
  rngState: number;
  score: number;
  lines: number;
  level: number;
  startLevel: number;
  status: StackStatus;
  mode: StackMode;
  /** Expedition deadline timestamp; null in endless mode. */
  endsAt: number | null;
  /** Consecutive piece locks that cleared lines (0 = chain broken). */
  combo: number;
  bestCombo: number;
  /** Resonance meter 0..RESONANCE_MAX, built by clears, spent on powers. */
  resonance: number;
  /** Currently running timed power, if any (forge resolves instantly). */
  power: { kind: StackPowerKind; expiresAt: number } | null;
  /** Timestamp of the last gravity step. */
  lastGravityAt: number;
  /** When the grounded piece will lock, or null while airborne. */
  lockDeadline: number | null;
  /** Number of lock-delay resets used by the current piece. */
  lockResets: number;
}

export interface StackEvents {
  /** Lines cleared by this transition (0 when none). */
  cleared: number;
  locked: boolean;
  gameOver: boolean;
  /** Combo count after this lock (>=2 means a chain is running). */
  combo: number;
  /** True when an expedition run ended because the timer ran out. */
  timeUp: boolean;
}

export interface StackResult {
  state: StackState;
  events: StackEvents;
}

export const STACK_COLS = 10;
export const STACK_ROWS = 20;
export const PREVIEW_COUNT = 3;
export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const LINE_SCORE_TABLE = [0, 100, 300, 500, 800] as const;
export const EXPEDITION_DURATION_MS = 60_000;

export const RESONANCE_MAX = 100;
/** Resonance gained per cleared line / per combo step beyond the first. */
export const RESONANCE_PER_LINE = 12;
export const RESONANCE_PER_COMBO = 6;
/** Combo bonus: 50 × (combo - 1) × level for every chained clear. */
export const COMBO_BONUS_PER_STEP = 50;

export const POWER_COSTS: Record<StackPowerKind, number> = {
  forge: 90,
  flux: 60,
  anchor: 60,
};
export const POWER_DURATIONS_MS: Record<StackPowerKind, number> = {
  forge: 0, // instant board repair
  flux: 15_000,
  anchor: 10_000,
};
/** Flux stretches the gravity interval — slower fall, never a full stop. */
export const FLUX_GRAVITY_FACTOR = 1.6;
/** Rows from the top that count as the danger zone for UI distortion. */
export const DANGER_ROWS = 5;

const NO_EVENTS: StackEvents = {
  cleared: 0,
  locked: false,
  gameOver: false,
  combo: 0,
  timeUp: false,
};

export const STACK_SHAPES: Record<ShapeKey, Point[][]> = {
  I: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    [{ x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  O: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  ],
  T: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }],
    [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }],
  ],
  S: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  ],
  Z: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
  ],
  J: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: -1 }],
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 1 }],
  ],
  L: [
    [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: -1, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }],
  ],
};

export const STACK_COLORS: Record<ShapeKey, string> = {
  I: '#5bcefa',
  O: '#f9f871',
  T: '#c084fc',
  S: '#4ade80',
  Z: '#fb7185',
  J: '#60a5fa',
  L: '#fbbf24',
};

export const SHAPE_LIST: ShapeKey[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * SRS-style wall-kick offsets tried in order when a rotation collides.
 * `jlstz` covers every piece except I (O never needs kicks).
 * Keys are `${from}>${to}` rotation indices.
 */
const JLSTZ_KICKS: Record<string, Point[]> = {
  '0>1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '1>0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '1>2': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '2>1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '2>3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '3>2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '3>0': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '0>3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

// The I piece uses centre-based offsets (spanning -1..2), so the guideline
// SRS I-kick table does not transfer directly; these generous horizontal
// nudges give the same practical result: rotating against a wall slides the
// piece into the field instead of failing.
const I_KICK_LIST: Point[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: 0, y: -2 },
];

export function getKickOffsets(shape: ShapeKey, from: number, to: number): Point[] {
  if (shape === 'O') return [{ x: 0, y: 0 }];
  if (shape === 'I') return I_KICK_LIST;
  return JLSTZ_KICKS[`${from}>${to}`] ?? [{ x: 0, y: 0 }];
}

// ===== Board helpers =====

export function makeEmptyBoard(): StackCell[][] {
  return Array.from({ length: STACK_ROWS }, () =>
    Array.from({ length: STACK_COLS }, () => ({ filled: false, color: null })),
  );
}

export function getCellPositions(piece: StackPiece): Point[] {
  const definition = STACK_SHAPES[piece.shape][piece.rotation];
  return definition.map((offset) => ({
    x: offset.x + piece.pos.x,
    y: offset.y + piece.pos.y,
  }));
}

export function isValidPosition(piece: StackPiece, board: StackCell[][]): boolean {
  return getCellPositions(piece).every((point) => {
    if (point.x < 0 || point.x >= STACK_COLS || point.y < 0 || point.y >= STACK_ROWS) {
      return false;
    }
    return !board[point.y][point.x].filled;
  });
}

export function mergePiece(piece: StackPiece, board: StackCell[][]): StackCell[][] {
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  for (const point of getCellPositions(piece)) {
    if (point.y >= 0 && point.y < STACK_ROWS && point.x >= 0 && point.x < STACK_COLS) {
      next[point.y][point.x] = { filled: true, color: STACK_COLORS[piece.shape] };
    }
  }
  return next;
}

export function clearLines(board: StackCell[][]): { board: StackCell[][]; cleared: number } {
  const remaining: StackCell[][] = [];
  let cleared = 0;
  for (const row of board) {
    if (row.every((cell) => cell.filled)) {
      cleared += 1;
    } else {
      remaining.push(row);
    }
  }
  while (remaining.length < STACK_ROWS) {
    remaining.unshift(
      Array.from({ length: STACK_COLS }, () => ({ filled: false, color: null })),
    );
  }
  return { board: remaining, cleared };
}

export function computeGhost(piece: StackPiece, board: StackCell[][]): StackPiece {
  let ghost = piece;
  while (isValidPosition({ ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } }, board)) {
    ghost = { ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } };
  }
  return ghost;
}

function isGrounded(piece: StackPiece, board: StackCell[][]): boolean {
  return !isValidPosition({ ...piece, pos: { x: piece.pos.x, y: piece.pos.y + 1 } }, board);
}

// ===== Seven-piece bag randomiser =====

function stepRng(state: number): { value: number; state: number } {
  const next = (1664525 * state + 1013904223) >>> 0;
  return { value: next / 0xffffffff, state: next };
}

/** Draws one full shuffled bag of the seven pieces. */
export function drawBag(rngState: number): { bag: ShapeKey[]; rngState: number } {
  const bag = [...SHAPE_LIST];
  let state = rngState;
  for (let i = bag.length - 1; i > 0; i--) {
    const step = stepRng(state);
    state = step.state;
    const j = Math.floor(step.value * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return { bag, rngState: state };
}

function refillQueue(
  queue: ShapeKey[],
  rngState: number,
  minimum: number,
): { queue: ShapeKey[]; rngState: number } {
  let nextQueue = queue;
  let state = rngState;
  while (nextQueue.length < minimum) {
    const { bag, rngState: nextState } = drawBag(state);
    nextQueue = [...nextQueue, ...bag];
    state = nextState;
  }
  return { queue: nextQueue, rngState: state };
}

// ===== Scoring / pacing =====

export function scoreForClear(cleared: number, level: number): number {
  const base = LINE_SCORE_TABLE[cleared] ?? cleared * 150;
  return base * level;
}

export function levelForLines(startLevel: number, lines: number): number {
  return startLevel + Math.floor(lines / 10);
}

export function gravityIntervalMs(level: number): number {
  return Math.max(120, 1000 - (level - 1) * 80);
}

/** Gravity interval with any active Flux slow-fall applied. */
export function currentGravityIntervalMs(state: StackState, now: number): number {
  const base = gravityIntervalMs(state.level);
  if (state.power?.kind === 'flux' && now < state.power.expiresAt) {
    return Math.round(base * FLUX_GRAVITY_FACTOR);
  }
  return base;
}

/** True when the stack reaches into the top rows — used for UI distortion. */
export function isInDanger(board: StackCell[][]): boolean {
  for (let y = 0; y < DANGER_ROWS; y += 1) {
    if (board[y].some((cell) => cell.filled)) return true;
  }
  return false;
}

// ===== Game lifecycle =====

function spawnPiece(shape: ShapeKey): StackPiece {
  return { shape, rotation: 0, pos: { x: Math.floor(STACK_COLS / 2), y: 0 } };
}

export interface CreateStackGameOptions {
  mode?: StackMode;
}

export function createStackGame(
  seed: number,
  startLevel: number,
  now: number,
  options: CreateStackGameOptions = {},
): StackState {
  const level = Math.max(1, startLevel);
  const mode = options.mode ?? 'endless';
  const initial = refillQueue([], seed >>> 0 || 1, PREVIEW_COUNT + 1);
  const [first, ...rest] = initial.queue;
  return {
    board: makeEmptyBoard(),
    active: spawnPiece(first),
    holdPiece: null,
    holdUsed: false,
    queue: rest,
    rngState: initial.rngState,
    score: 0,
    lines: 0,
    level,
    startLevel: level,
    status: 'running',
    mode,
    endsAt: mode === 'expedition' ? now + EXPEDITION_DURATION_MS : null,
    combo: 0,
    bestCombo: 0,
    resonance: 0,
    power: null,
    lastGravityAt: now,
    lockDeadline: null,
    lockResets: 0,
  };
}

/** Reset the grounded-piece lock timer after a successful move/rotation. */
function afterActiveChange(state: StackState, piece: StackPiece, now: number): StackState {
  const grounded = isGrounded(piece, state.board);
  if (!grounded) {
    return { ...state, active: piece, lockDeadline: null };
  }
  if (state.lockDeadline === null) {
    return { ...state, active: piece, lockDeadline: now + LOCK_DELAY_MS };
  }
  if (state.lockResets < MAX_LOCK_RESETS) {
    return {
      ...state,
      active: piece,
      lockDeadline: now + LOCK_DELAY_MS,
      lockResets: state.lockResets + 1,
    };
  }
  return { ...state, active: piece };
}

function lockActivePiece(state: StackState, piece: StackPiece): StackResult {
  const merged = mergePiece(piece, state.board);
  const { board, cleared } = clearLines(merged);

  let { score, lines, level, resonance } = state;
  const combo = cleared > 0 ? state.combo + 1 : 0;
  const bestCombo = Math.max(state.bestCombo, combo);
  if (cleared > 0) {
    lines += cleared;
    score += scoreForClear(cleared, level);
    if (combo > 1) {
      score += COMBO_BONUS_PER_STEP * (combo - 1) * level;
    }
    level = levelForLines(state.startLevel, lines);
    resonance = Math.min(
      RESONANCE_MAX,
      resonance + cleared * RESONANCE_PER_LINE + Math.max(0, combo - 1) * RESONANCE_PER_COMBO,
    );
  }

  const refill = refillQueue(state.queue, state.rngState, PREVIEW_COUNT + 1);
  const [nextShape, ...rest] = refill.queue;
  const nextPiece = spawnPiece(nextShape);

  if (!isValidPosition(nextPiece, board)) {
    return {
      state: {
        ...state,
        board,
        active: null,
        queue: rest,
        rngState: refill.rngState,
        score,
        lines,
        level,
        combo,
        bestCombo,
        resonance,
        status: 'gameover',
        lockDeadline: null,
        lockResets: 0,
      },
      events: { cleared, locked: true, gameOver: true, combo, timeUp: false },
    };
  }

  return {
    state: {
      ...state,
      board,
      active: nextPiece,
      holdUsed: false,
      queue: rest,
      rngState: refill.rngState,
      score,
      lines,
      level,
      combo,
      bestCombo,
      resonance,
      lockDeadline: null,
      lockResets: 0,
    },
    events: { cleared, locked: true, gameOver: false, combo, timeUp: false },
  };
}

// ===== Player actions (all no-ops unless running with an active piece) =====

function canAct(state: StackState): state is StackState & { active: StackPiece } {
  return state.status === 'running' && state.active !== null;
}

export function moveActive(state: StackState, dx: -1 | 1, now: number): StackState {
  if (!canAct(state)) return state;
  const moved = { ...state.active, pos: { x: state.active.pos.x + dx, y: state.active.pos.y } };
  if (isValidPosition(moved, state.board)) {
    return afterActiveChange(state, moved, now);
  }
  // Anchor phase slide: while active, a blocked sideways move may hop over a
  // single-cell bump. It never tunnels through walls or taller stacks.
  if (state.power?.kind === 'anchor' && now < state.power.expiresAt) {
    const hopped = {
      ...state.active,
      pos: { x: state.active.pos.x + dx, y: state.active.pos.y - 1 },
    };
    if (isValidPosition(hopped, state.board)) {
      return afterActiveChange(state, hopped, now);
    }
  }
  return state;
}

/** Rotate with wall kicks; tries each kick offset until one fits. */
export function rotateActive(state: StackState, direction: 1 | -1, now: number): StackState {
  if (!canAct(state)) return state;
  const from = state.active.rotation;
  const to = (from + (direction === 1 ? 1 : 3)) % 4;
  for (const kick of getKickOffsets(state.active.shape, from, to)) {
    const candidate: StackPiece = {
      ...state.active,
      rotation: to,
      pos: { x: state.active.pos.x + kick.x, y: state.active.pos.y + kick.y },
    };
    if (isValidPosition(candidate, state.board)) {
      return afterActiveChange(state, candidate, now);
    }
  }
  return state;
}

/** One soft-drop step. Locks are still handled by the lock-delay timer. */
export function softDropActive(state: StackState, now: number): StackState {
  if (!canAct(state)) return state;
  const moved = { ...state.active, pos: { x: state.active.pos.x, y: state.active.pos.y + 1 } };
  if (!isValidPosition(moved, state.board)) {
    // Grounded: start the lock timer if it is not already ticking.
    if (state.lockDeadline === null) {
      return { ...state, lockDeadline: now + LOCK_DELAY_MS };
    }
    return state;
  }
  const grounded = isGrounded(moved, state.board);
  return {
    ...state,
    active: moved,
    lastGravityAt: now,
    lockDeadline: grounded ? now + LOCK_DELAY_MS : null,
    lockResets: grounded ? state.lockResets : 0,
  };
}

export function hardDropActive(state: StackState, now: number): StackResult {
  if (!canAct(state)) return { state, events: NO_EVENTS };
  const ghost = computeGhost(state.active, state.board);
  const result = lockActivePiece(state, ghost);
  result.state.lastGravityAt = now;
  return result;
}

/**
 * Hold slot: stows the active piece, bringing out the previous hold (or the
 * next queue piece). Only once per spawned piece.
 */
export function holdActive(state: StackState, now: number): StackState {
  if (!canAct(state) || state.holdUsed) return state;

  const stowed = state.active.shape;
  if (state.holdPiece) {
    const swapped = spawnPiece(state.holdPiece);
    if (!isValidPosition(swapped, state.board)) return state;
    return {
      ...state,
      active: swapped,
      holdPiece: stowed,
      holdUsed: true,
      lastGravityAt: now,
      lockDeadline: null,
      lockResets: 0,
    };
  }

  const refill = refillQueue(state.queue, state.rngState, PREVIEW_COUNT + 1);
  const [nextShape, ...rest] = refill.queue;
  const nextPiece = spawnPiece(nextShape);
  if (!isValidPosition(nextPiece, state.board)) return state;
  return {
    ...state,
    active: nextPiece,
    holdPiece: stowed,
    holdUsed: true,
    queue: rest,
    rngState: refill.rngState,
    lastGravityAt: now,
    lockDeadline: null,
    lockResets: 0,
  };
}

export function setStackStatus(state: StackState, status: StackStatus): StackState {
  if (state.status === 'gameover') return state;
  if (state.status === status) return state;
  return { ...state, status };
}

/**
 * Shift the game's time anchors after a pause so gravity, powers, and the
 * expedition clock do not silently burn while the game was frozen.
 */
export function shiftStackClock(state: StackState, pausedMs: number): StackState {
  if (pausedMs <= 0) return state;
  return {
    ...state,
    lastGravityAt: state.lastGravityAt + pausedMs,
    lockDeadline: state.lockDeadline !== null ? state.lockDeadline + pausedMs : null,
    endsAt: state.endsAt !== null ? state.endsAt + pausedMs : null,
    power: state.power
      ? { ...state.power, expiresAt: state.power.expiresAt + pausedMs }
      : null,
  };
}

/**
 * Forge repair: fills the gaps of the lowest nearly-complete row and removes
 * it. Deliberately grants no score, lines, combo, or resonance — it is board
 * relief bought with resonance earned from real clears.
 */
function applyForgeRepair(state: StackState): StackState | null {
  for (let y = STACK_ROWS - 1; y >= 0; y -= 1) {
    const filledCount = state.board[y].filter((cell) => cell.filled).length;
    if (filledCount >= 5 && filledCount < STACK_COLS) {
      const board = state.board.map((row) => row.map((cell) => ({ ...cell })));
      board.splice(y, 1);
      board.unshift(
        Array.from({ length: STACK_COLS }, () => ({ filled: false, color: null })),
      );
      return { ...state, board };
    }
  }
  return null;
}

/**
 * Spend resonance to activate a dosha power:
 * - forge: instant repair of the lowest nearly-complete row
 * - flux: slower gravity for a while
 * - anchor: phase slide over single-cell bumps for a while
 * No-op when resonance is short, a timed power is already running, or a
 * forge repair has no eligible row.
 */
export function activatePower(
  state: StackState,
  kind: StackPowerKind,
  now: number,
): StackState {
  if (state.status !== 'running') return state;
  if (state.resonance < POWER_COSTS[kind]) return state;
  if (state.power && now < state.power.expiresAt) return state;

  if (kind === 'forge') {
    const repaired = applyForgeRepair(state);
    if (!repaired) return state;
    return {
      ...repaired,
      resonance: state.resonance - POWER_COSTS.forge,
      power: null,
    };
  }

  return {
    ...state,
    resonance: state.resonance - POWER_COSTS[kind],
    power: { kind, expiresAt: now + POWER_DURATIONS_MS[kind] },
  };
}

/**
 * Advance time: applies gravity steps and the lock-delay countdown.
 * Call once per animation frame with the current timestamp.
 */
export function tickStack(state: StackState, now: number): StackResult {
  if (!canAct(state)) return { state, events: NO_EVENTS };

  let current = state;

  // Expedition timer: the run ends cleanly when the repair window closes.
  if (current.endsAt !== null && now >= current.endsAt) {
    return {
      state: { ...current, active: null, status: 'gameover', lockDeadline: null },
      events: { ...NO_EVENTS, gameOver: true, timeUp: true },
    };
  }

  // Timed powers wind down on their own.
  if (current.power && now >= current.power.expiresAt) {
    current = { ...current, power: null };
  }

  // Grounded piece: wait for the lock delay to expire, then lock.
  if (isGrounded(current.active!, current.board)) {
    if (current.lockDeadline === null) {
      return {
        state: { ...current, lockDeadline: now + LOCK_DELAY_MS },
        events: NO_EVENTS,
      };
    }
    if (now >= current.lockDeadline) {
      return lockActivePiece(current, current.active!);
    }
    return { state: current, events: NO_EVENTS };
  }

  // Airborne: apply as many gravity steps as elapsed time allows.
  const interval = currentGravityIntervalMs(current, now);
  let elapsed = now - current.lastGravityAt;
  while (elapsed >= interval && current.active) {
    const moved = {
      ...current.active,
      pos: { x: current.active.pos.x, y: current.active.pos.y + 1 },
    };
    if (!isValidPosition(moved, current.board)) {
      // Landed this frame; the lock timer starts now.
      return {
        state: { ...current, lastGravityAt: now, lockDeadline: now + LOCK_DELAY_MS },
        events: NO_EVENTS,
      };
    }
    current = {
      ...current,
      active: moved,
      lastGravityAt: current.lastGravityAt + interval,
    };
    elapsed -= interval;
  }

  return { state: current, events: NO_EVENTS };
}

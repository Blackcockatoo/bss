'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

interface VimanaTetrisProps {
  petName?: string;
  genomeSeed?: number;
  onExit?: () => void;
  onGameOver?: (score: number, lines: number, level: number) => void;
}

type Cell = {
  filled: boolean;
  color: string | null;
};

type Point = { x: number; y: number };

type ShapeKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface ActivePiece {
  shape: ShapeKey;
  rotation: number;
  pos: Point;
  color: string;
}

const COLS = 10;
const ROWS = 20;

const SHAPES: Record<ShapeKey, Point[][]> = {
  I: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
    [
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
    [
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  ],
  O: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  ],
  T: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ],
    [
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
  S: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
  ],
  Z: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
  J: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: -1 },
    ],
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
    ],
  ],
  L: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
    [
      { x: -1, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
};

const COLORS: Record<ShapeKey, string> = {
  I: '#5bcefa',
  O: '#f9f871',
  T: '#c084fc',
  S: '#4ade80',
  Z: '#fb7185',
  J: '#60a5fa',
  L: '#fbbf24',
};

const SHAPE_LIST: ShapeKey[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ filled: false, color: null }))
  );
}

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function getCellPositions(piece: ActivePiece): Point[] {
  const definition = SHAPES[piece.shape][piece.rotation];
  return definition.map(offset => ({
    x: offset.x + piece.pos.x,
    y: offset.y + piece.pos.y,
  }));
}

function isValidPosition(piece: ActivePiece, board: Cell[][]): boolean {
  const cells = getCellPositions(piece);
  return cells.every(point => {
    if (point.x < 0 || point.x >= COLS || point.y < 0 || point.y >= ROWS) {
      return false;
    }
    return !board[point.y][point.x].filled;
  });
}

function mergePiece(piece: ActivePiece, board: Cell[][]): Cell[][] {
  const nextBoard = board.map(row => row.map(cell => ({ ...cell })));
  for (const point of getCellPositions(piece)) {
    if (point.y >= 0 && point.y < ROWS && point.x >= 0 && point.x < COLS) {
      nextBoard[point.y][point.x] = { filled: true, color: piece.color };
    }
  }
  return nextBoard;
}

function clearLines(board: Cell[][]): { board: Cell[][]; cleared: number } {
  const remaining: Cell[][] = [];
  let cleared = 0;
  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    const row = board[rowIndex];
    const full = row.every(cell => cell.filled);
    if (full) {
      cleared += 1;
    } else {
      remaining.push(row);
    }
  }

  while (remaining.length < ROWS) {
    remaining.unshift(
      Array.from({ length: COLS }, () => ({ filled: false, color: null }))
    );
  }

  return { board: remaining, cleared };
}

function computeGhost(piece: ActivePiece, board: Cell[][]): ActivePiece {
  let next = piece;
  while (
    isValidPosition(
      { ...next, pos: { x: next.pos.x, y: next.pos.y + 1 } },
      board
    )
  ) {
    next = { ...next, pos: { x: next.pos.x, y: next.pos.y + 1 } };
  }
  return next;
}

export function VimanaTetris({
  petName = 'Meta-Pet',
  genomeSeed,
  onExit,
  onGameOver,
}: VimanaTetrisProps) {
  const [board, setBoard] = useState<Cell[][]>(() => makeEmptyBoard());
  const [active, setActive] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<ActivePiece | null>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [state, setState] = useState<'running' | 'paused' | 'gameover'>('running');

  const rngRef = useRef<() => number>(() => Math.random());
  const dropIntervalRef = useRef<number>(1000);
  const lastDropRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    rngRef.current = createRng(genomeSeed ?? Date.now());
  }, [genomeSeed]);

  const randomShape = useCallback((): ShapeKey => {
    const roll = rngRef.current();
    return SHAPE_LIST[Math.floor(roll * SHAPE_LIST.length) % SHAPE_LIST.length];
  }, []);

  const spawnPiece = useCallback(
    (override?: ShapeKey): ActivePiece => {
      const shape = override ?? randomShape();
      return {
        shape,
        rotation: 0,
        pos: { x: Math.floor(COLS / 2), y: 0 },
        color: COLORS[shape],
      };
    },
    [randomShape]
  );

  const resetGame = useCallback(() => {
    const firstPiece = spawnPiece();
    const secondPiece = spawnPiece();
    setBoard(makeEmptyBoard());
    setActive(firstPiece);
    setNextPiece(secondPiece);
    setScore(0);
    setLines(0);
    setLevel(1);
    setState('running');
    dropIntervalRef.current = 1000;
    lastDropRef.current = performance.now();
  }, [spawnPiece]);

  useEffect(() => {
    const id = requestAnimationFrame(() => resetGame());
    return () => cancelAnimationFrame(id);
  }, [resetGame]);

  const lockPiece = useCallback(
    (piece: ActivePiece) => {
      const merged = mergePiece(piece, board);
      const { board: clearedBoard, cleared } = clearLines(merged);

      let nextLines = lines;
      let nextScore = score;
      let nextLevel = level;

      if (cleared > 0) {
        const lineScoreTable = [0, 100, 300, 500, 800];
        const base = lineScoreTable[cleared] ?? cleared * 150;
        nextLines = lines + cleared;
        nextScore = score + base * level;
        nextLevel = 1 + Math.floor(nextLines / 10);
        dropIntervalRef.current = Math.max(120, 1000 - (nextLevel - 1) * 80);
        if (nextLines !== lines) {
          setLines(nextLines);
        }
        if (nextScore !== score) {
          setScore(nextScore);
        }
        if (nextLevel !== level) {
          setLevel(nextLevel);
        }
      }

      setBoard(clearedBoard);

      const pending = nextPiece ?? spawnPiece();
      const spawn = {
        ...pending,
        rotation: 0,
        pos: { x: Math.floor(COLS / 2), y: 0 },
      } satisfies ActivePiece;
      const upcoming = spawnPiece();
      setNextPiece(upcoming);

      if (!isValidPosition(spawn, clearedBoard)) {
        setActive(null);
        setState('gameover');
        onGameOver?.(nextScore, nextLines, nextLevel);
        return;
      }

      setActive(spawn);
      lastDropRef.current = performance.now();
    },
    [board, level, lines, nextPiece, onGameOver, score, spawnPiece]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (state === 'gameover') {
        if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
          event.preventDefault();
          resetGame();
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onExit?.();
        return;
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setState(current => (current === 'paused' ? 'running' : 'paused'));
        return;
      }

      if (state !== 'running' || !active) {
        return;
      }

      let handled = false;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        const moved: ActivePiece = {
          ...active,
          pos: { x: active.pos.x - 1, y: active.pos.y },
        };
        if (isValidPosition(moved, board)) {
          setActive(moved);
        }
        handled = true;
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        const moved: ActivePiece = {
          ...active,
          pos: { x: active.pos.x + 1, y: active.pos.y },
        };
        if (isValidPosition(moved, board)) {
          setActive(moved);
        }
        handled = true;
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        const moved: ActivePiece = {
          ...active,
          pos: { x: active.pos.x, y: active.pos.y + 1 },
        };
        if (isValidPosition(moved, board)) {
          setActive(moved);
        }
        handled = true;
      } else if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        const rotated: ActivePiece = {
          ...active,
          rotation: (active.rotation + 1) % 4,
        };
        if (isValidPosition(rotated, board)) {
          setActive(rotated);
        }
        handled = true;
      } else if (event.key === ' ' || event.key.toLowerCase() === 'x') {
        event.preventDefault();
        let ghost = active;
        while (
          isValidPosition(
            { ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } },
            board
          )
        ) {
          ghost = { ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } };
        }
        lockPiece(ghost);
        handled = true;
      }

      if (handled) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, board, lockPiece, onExit, resetGame, state]);

  // Touch controls - movement functions
  const moveLeft = useCallback(() => {
    if (state !== 'running' || !active) return;
    const moved: ActivePiece = { ...active, pos: { x: active.pos.x - 1, y: active.pos.y } };
    if (isValidPosition(moved, board)) setActive(moved);
  }, [active, board, state]);

  const moveRight = useCallback(() => {
    if (state !== 'running' || !active) return;
    const moved: ActivePiece = { ...active, pos: { x: active.pos.x + 1, y: active.pos.y } };
    if (isValidPosition(moved, board)) setActive(moved);
  }, [active, board, state]);

  const moveDown = useCallback(() => {
    if (state !== 'running' || !active) return;
    const moved: ActivePiece = { ...active, pos: { x: active.pos.x, y: active.pos.y + 1 } };
    if (isValidPosition(moved, board)) setActive(moved);
  }, [active, board, state]);

  const rotate = useCallback(() => {
    if (state !== 'running' || !active) return;
    const rotated: ActivePiece = { ...active, rotation: (active.rotation + 1) % 4 };
    if (isValidPosition(rotated, board)) setActive(rotated);
  }, [active, board, state]);

  const hardDrop = useCallback(() => {
    if (state !== 'running' || !active) return;
    let ghost = active;
    while (isValidPosition({ ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } }, board)) {
      ghost = { ...ghost, pos: { x: ghost.pos.x, y: ghost.pos.y + 1 } };
    }
    lockPiece(ghost);
  }, [active, board, lockPiece, state]);

  // Touch event handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const minSwipe = 30;

    // Detect tap (double tap for hard drop)
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 200) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        hardDrop();
        lastTapRef.current = 0;
      } else {
        rotate();
        lastTapRef.current = now;
      }
      touchStartRef.current = null;
      return;
    }

    // Swipe detection
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
      if (dx > 0) moveRight();
      else moveLeft();
    } else if (Math.abs(dy) > minSwipe) {
      if (dy > 0) moveDown();
      else rotate();
    }
    touchStartRef.current = null;
  }, [hardDrop, moveDown, moveLeft, moveRight, rotate]);

  useEffect(() => {
    const step = (timestamp: number) => {
      if (state === 'running') {
        if (!lastDropRef.current) {
          lastDropRef.current = timestamp;
        }
        const delta = timestamp - lastDropRef.current;
        if (delta >= dropIntervalRef.current) {
          lastDropRef.current = timestamp;
          setActive(current => {
            if (!current) {
              return current;
            }
            const moved: ActivePiece = {
              ...current,
              pos: { x: current.pos.x, y: current.pos.y + 1 },
            };
            if (isValidPosition(moved, board)) {
              return moved;
            }
            lockPiece(current);
            return current;
          });
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [board, lockPiece, state]);

  const ghostCells = useMemo(() => {
    if (!active) {
      return new Set<string>();
    }
    const ghostPiece = computeGhost(active, board);
    const cells = getCellPositions(ghostPiece);
    return new Set(cells.map(cell => `${cell.x},${cell.y}`));
  }, [active, board]);

  const gridCells = useMemo(() => {
    const cells: ReactElement[] = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const base = board[y][x];
        let color = base.color;
        let isActive = false;
        if (active) {
          const occupied = getCellPositions(active).some(
            point => point.x === x && point.y === y
          );
          if (occupied) {
            color = active.color;
            isActive = true;
          }
        }
        const key = `${x}-${y}`;
        const ghostHere = ghostCells.has(`${x},${y}`) && !isActive && !base.filled;
        cells.push(
          <div
            key={key}
            className="relative rounded-[3px] border border-slate-900/40 bg-slate-950/60 overflow-hidden"
          >
            <div
              className="absolute inset-[1px] rounded-[2px]"
              style={{
                background:
                  color && !ghostHere
                    ? `radial-gradient(circle at 30% 20%, #ffffffaa, ${color})`
                    : ghostHere
                    ? 'linear-gradient(to bottom, #ffffff11, #ffffff05)'
                    : 'linear-gradient(to bottom, #020617, #020617)',
                opacity: color || ghostHere ? 1 : 0.75,
              }}
            />
          </div>
        );
      }
    }
    return cells;
  }, [active, board, ghostCells]);

  const nextPreview = useMemo(() => {
    if (!nextPiece) {
      return null;
    }
    const previewSize = 4;
    const previewCells = getCellPositions({
      ...nextPiece,
      pos: { x: 2, y: 1 },
    });
    const blocks: ReactElement[] = [];
    for (let y = 0; y < previewSize; y += 1) {
      for (let x = 0; x < previewSize; x += 1) {
        const filled = previewCells.some(cell => cell.x === x && cell.y === y);
        blocks.push(
          <div
            key={`${x}-${y}`}
            className="relative rounded-[3px] border border-slate-900/40 bg-slate-950/60 overflow-hidden"
          >
            <div
              className="absolute inset-[1px] rounded-[2px]"
              style={{
                background: filled
                  ? `radial-gradient(circle at 30% 20%, #ffffffaa, ${nextPiece.color})`
                  : 'linear-gradient(to bottom, #020617, #020617)',
                opacity: filled ? 1 : 0.5,
              }}
            />
          </div>
        );
      }
    }
    return <div className="grid grid-cols-4 gap-[3px] w-24 h-24">{blocks}</div>;
  }, [nextPiece]);

  return (
    <div
      className="w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="px-4 py-2 flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-400">
            Vimana Tetris Field
          </span>
          <span className="text-slate-200">
            Pilot: <span className="font-semibold text-amber-300">{petName}</span>
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Score</span>
            <span className="font-mono text-base">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Lines</span>
            <span className="font-mono text-base">{lines}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Level</span>
            <span className="font-mono text-base">{level}</span>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 px-2 sm:px-3 pb-2 sm:pb-3 pt-2 overflow-hidden">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="relative aspect-[10/20] max-h-full w-full max-w-[280px] sm:max-w-[360px]">
            <div className="absolute inset-0 grid grid-cols-10 gap-[2px] sm:gap-[3px] p-[3px] sm:p-[4px] bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner shadow-black/60">
              {gridCells}
            </div>
            {state === 'gameover' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <div className="px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/90 text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Run collapsed</div>
                  <div className="mt-1 text-lg font-semibold">Vimana Grid Overloaded</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Score {score} • Lines {lines} • Level {level}
                  </div>
                  <button
                    onClick={resetGame}
                    className="mt-3 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold text-sm active:bg-amber-400"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
            {state === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs">
                <div className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/90 text-slate-100">
                  <button
                    onClick={() => setState('running')}
                    className="px-4 py-2 bg-slate-700 rounded-lg active:bg-slate-600"
                  >
                    Resume
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel - hidden on mobile, shown on larger screens */}
        <aside className="hidden sm:flex w-32 flex-col gap-3 text-xs">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Next piece</div>
            {nextPreview}
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Controls</div>
            <div>←/→ / A/D — move</div>
            <div>↓ / S — soft drop</div>
            <div>↑ / W — rotate</div>
            <div>Space/X — hard drop</div>
            <div>P — pause • Esc — exit</div>
          </div>
        </aside>

        {/* Mobile touch controls */}
        <div className="sm:hidden flex flex-col gap-2">
          {/* Next piece preview - compact */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-slate-500">Next:</span>
              <div className="scale-75 origin-left">{nextPreview}</div>
            </div>
            <button
              onClick={() => setState(s => s === 'paused' ? 'running' : 'paused')}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs active:bg-slate-700"
            >
              {state === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onExit}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs active:bg-slate-700"
            >
              Exit
            </button>
          </div>

          {/* Touch control buttons */}
          <div className="flex justify-center items-center gap-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); moveLeft(); }}
              onClick={moveLeft}
              className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-2xl active:bg-slate-700 select-none touch-manipulation"
            >
              ◀
            </button>
            <div className="flex flex-col gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); rotate(); }}
                onClick={rotate}
                className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl active:bg-slate-700 select-none touch-manipulation"
              >
                ↻
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); moveDown(); }}
                onClick={moveDown}
                className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-2xl active:bg-slate-700 select-none touch-manipulation"
              >
                ▼
              </button>
            </div>
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); moveRight(); }}
              onClick={moveRight}
              className="w-14 h-14 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-2xl active:bg-slate-700 select-none touch-manipulation"
            >
              ▶
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); hardDrop(); }}
              onClick={hardDrop}
              className="w-14 h-14 rounded-xl bg-amber-600/90 border border-amber-500 flex items-center justify-center text-lg font-bold active:bg-amber-500 select-none touch-manipulation ml-2"
            >
              ⬇
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

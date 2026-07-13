'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import {
  PREVIEW_COUNT,
  STACK_COLORS,
  STACK_COLS,
  STACK_ROWS,
  STACK_SHAPES,
  computeGhost,
  createStackGame,
  getCellPositions,
  hardDropActive,
  holdActive,
  moveActive,
  rotateActive,
  setStackStatus,
  softDropActive,
  tickStack,
  type ShapeKey,
  type StackState,
} from '@/lib/minigames/vimanaStack';

interface VimanaTetrisProps {
  petName?: string;
  genomeSeed?: number;
  /** Level the run begins at — the arcade passes the pet's evolution tier here. */
  startLevel?: number;
  onExit?: () => void;
  onGameOver?: (score: number, lines: number, level: number) => void;
}

/** Drag distance (in board cells) that moves the piece one column. */
const DRAG_CELL_RATIO = 1;
/** Minimum downward flick to count as a hard drop. */
const SWIPE_DROP_DISTANCE = 48;
const SWIPE_DROP_VELOCITY = 0.45; // px per ms
/** Tap detection: little movement, short duration. */
const TAP_DISTANCE = 12;
const TAP_DURATION_MS = 260;
/** Held-button repeat pacing. */
const REPEAT_DELAY_MS = 180;
const REPEAT_INTERVAL_MS = 110;

type RepeatAction = 'left' | 'right' | 'soft';

function MiniPiecePreview({ shape, dim = false }: { shape: ShapeKey | null; dim?: boolean }) {
  const blocks = useMemo(() => {
    const cells: ReactElement[] = [];
    const positions = shape
      ? STACK_SHAPES[shape][0].map((offset) => ({ x: offset.x + 1, y: offset.y + 1 }))
      : [];
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const filled = positions.some((cell) => cell.x === x && cell.y === y);
        cells.push(
          <div
            key={`${x}-${y}`}
            className="rounded-[2px]"
            style={{
              background: filled && shape
                ? `radial-gradient(circle at 30% 20%, #ffffff88, ${STACK_COLORS[shape]})`
                : 'transparent',
              opacity: dim ? 0.4 : 1,
            }}
          />
        );
      }
    }
    return cells;
  }, [shape, dim]);

  return <div className="grid h-9 w-12 grid-cols-4 grid-rows-3 gap-[2px]">{blocks}</div>;
}

export function VimanaTetris({
  petName = 'Meta-Pet',
  genomeSeed,
  startLevel = 1,
  onExit,
  onGameOver,
}: VimanaTetrisProps) {
  const initialLevel = Math.max(1, startLevel);

  const gameRef = useRef<StackState | null>(null);
  const [game, setGame] = useState<StackState | null>(null);
  const gameOverSentRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Pointer gesture tracking for the playfield.
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startedAt: number;
    lastX: number;
    lastY: number;
    columnsMoved: number;
    rowsDropped: number;
    consumed: boolean;
  } | null>(null);

  const repeatTimerRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  /** Apply a pure engine transition and publish the new state to React. */
  const apply = useCallback(
    (transition: (state: StackState, now: number) => StackState) => {
      const current = gameRef.current;
      if (!current) return;
      const next = transition(current, performance.now());
      if (next !== current) {
        gameRef.current = next;
        setGame(next);
      }
    },
    []
  );

  const notifyGameOver = useCallback(
    (state: StackState) => {
      if (gameOverSentRef.current) return;
      gameOverSentRef.current = true;
      onGameOver?.(state.score, state.lines, state.level);
    },
    [onGameOver]
  );

  const resetGame = useCallback(() => {
    const seed = (genomeSeed ?? Date.now()) ^ Math.floor(performance.now());
    const fresh = createStackGame(seed >>> 0, initialLevel, performance.now());
    gameOverSentRef.current = false;
    gameRef.current = fresh;
    setGame(fresh);
  }, [genomeSeed, initialLevel]);

  useEffect(() => {
    const id = requestAnimationFrame(() => resetGame());
    return () => cancelAnimationFrame(id);
  }, [resetGame]);

  // Game loop: gravity + lock delay live in the engine tick.
  useEffect(() => {
    const step = (timestamp: number) => {
      const current = gameRef.current;
      if (current && current.status === 'running') {
        const { state: next, events } = tickStack(current, timestamp);
        if (next !== current) {
          gameRef.current = next;
          setGame(next);
        }
        if (events.gameOver) {
          notifyGameOver(next);
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [notifyGameOver]);

  // Pause automatically when the tab or app moves to the background.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        apply((state) => setStackStatus(state, 'paused'));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [apply]);

  const doMove = useCallback(
    (dx: -1 | 1) => apply((state, now) => moveActive(state, dx, now)),
    [apply]
  );
  const doRotate = useCallback(
    () => apply((state, now) => rotateActive(state, 1, now)),
    [apply]
  );
  const doSoftDrop = useCallback(
    () => apply((state, now) => softDropActive(state, now)),
    [apply]
  );
  const doHold = useCallback(
    () => apply((state, now) => holdActive(state, now)),
    [apply]
  );
  const doHardDrop = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    const { state: next, events } = hardDropActive(current, performance.now());
    if (next !== current) {
      gameRef.current = next;
      setGame(next);
    }
    if (events.gameOver) notifyGameOver(next);
  }, [notifyGameOver]);
  const togglePause = useCallback(() => {
    apply((state) =>
      setStackStatus(state, state.status === 'paused' ? 'running' : 'paused')
    );
  }, [apply]);

  // Keyboard controls (desktop parity).
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const current = gameRef.current;
      if (!current) return;

      if (current.status === 'gameover') {
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
        togglePause();
        return;
      }
      if (current.status !== 'running') return;

      const key = event.key.toLowerCase();
      let handled = true;
      if (event.key === 'ArrowLeft' || key === 'a') doMove(-1);
      else if (event.key === 'ArrowRight' || key === 'd') doMove(1);
      else if (event.key === 'ArrowDown' || key === 's') doSoftDrop();
      else if (event.key === 'ArrowUp' || key === 'w') doRotate();
      else if (event.key === ' ' || key === 'x') doHardDrop();
      else if (key === 'c' || event.key === 'Shift') doHold();
      else handled = false;

      if (handled) event.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doHardDrop, doHold, doMove, doRotate, doSoftDrop, onExit, resetGame, togglePause]);

  // ===== Playfield pointer gestures =====

  const cellSize = useCallback(() => {
    const width = boardRef.current?.clientWidth ?? 240;
    return width / STACK_COLS;
  }, []);

  const handleBoardPointerDown = useCallback((event: React.PointerEvent) => {
    if (gestureRef.current) return; // single-pointer game
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      lastX: event.clientX,
      lastY: event.clientY,
      columnsMoved: 0,
      rowsDropped: 0,
      consumed: false,
    };
  }, []);

  const handleBoardPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;

      const cell = cellSize();
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;

      // Horizontal drag: one column per cell-width dragged.
      const targetColumns = Math.trunc(dx / (cell * DRAG_CELL_RATIO));
      while (gesture.columnsMoved < targetColumns) {
        doMove(1);
        gesture.columnsMoved += 1;
        gesture.consumed = true;
      }
      while (gesture.columnsMoved > targetColumns) {
        doMove(-1);
        gesture.columnsMoved -= 1;
        gesture.consumed = true;
      }

      // Slow downward drag: soft drop row by row (fast flicks hard-drop on release).
      const targetRows = Math.trunc(dy / cell);
      while (gesture.rowsDropped < targetRows) {
        doSoftDrop();
        gesture.rowsDropped += 1;
        gesture.consumed = true;
      }
    },
    [cellSize, doMove, doSoftDrop]
  );

  const handleBoardPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      gestureRef.current = null;

      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const duration = performance.now() - gesture.startedAt;
      const distance = Math.hypot(dx, dy);

      // Tap → rotate.
      if (!gesture.consumed && distance < TAP_DISTANCE && duration < TAP_DURATION_MS) {
        doRotate();
        return;
      }

      // Fast downward flick → hard drop.
      const velocity = duration > 0 ? dy / duration : 0;
      if (dy > SWIPE_DROP_DISTANCE && velocity > SWIPE_DROP_VELOCITY && Math.abs(dx) < dy) {
        doHardDrop();
      }
    },
    [doHardDrop, doRotate]
  );

  const handleBoardPointerCancel = useCallback(() => {
    gestureRef.current = null;
  }, []);

  // ===== Held-button repeat (left / right / soft drop) =====

  const stopRepeat = useCallback(() => {
    if (repeatTimerRef.current !== null) {
      window.clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (action: RepeatAction) => {
      stopRepeat();
      const run = () => {
        if (action === 'left') doMove(-1);
        else if (action === 'right') doMove(1);
        else doSoftDrop();
      };
      run();
      repeatTimerRef.current = window.setTimeout(() => {
        repeatIntervalRef.current = window.setInterval(run, REPEAT_INTERVAL_MS);
      }, REPEAT_DELAY_MS);
    },
    [doMove, doSoftDrop, stopRepeat]
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  // ===== Rendering =====

  const ghostCells = useMemo(() => {
    if (!game?.active) return new Set<string>();
    const ghostPiece = computeGhost(game.active, game.board);
    return new Set(getCellPositions(ghostPiece).map((cell) => `${cell.x},${cell.y}`));
  }, [game]);

  const activeCells = useMemo(() => {
    if (!game?.active) return new Map<string, string>();
    const color = STACK_COLORS[game.active.shape];
    return new Map(
      getCellPositions(game.active).map((cell) => [`${cell.x},${cell.y}`, color])
    );
  }, [game]);

  const gridCells = useMemo(() => {
    if (!game) return [];
    const cells: ReactElement[] = [];
    for (let y = 0; y < STACK_ROWS; y += 1) {
      for (let x = 0; x < STACK_COLS; x += 1) {
        const key = `${x},${y}`;
        const base = game.board[y][x];
        const activeColor = activeCells.get(key);
        const color = activeColor ?? base.color;
        const ghostHere = ghostCells.has(key) && !activeColor && !base.filled;
        cells.push(
          <div
            key={key}
            className="relative overflow-hidden rounded-[3px] border border-slate-900/40 bg-slate-950/60"
          >
            <div
              className="absolute inset-[1px] rounded-[2px]"
              style={{
                background: color
                  ? `radial-gradient(circle at 30% 20%, #ffffffaa, ${color})`
                  : ghostHere
                    ? 'linear-gradient(to bottom, #ffffff18, #ffffff08)'
                    : 'linear-gradient(to bottom, #020617, #020617)',
                opacity: color || ghostHere ? 1 : 0.75,
              }}
            />
          </div>
        );
      }
    }
    return cells;
  }, [game, activeCells, ghostCells]);

  const previewShapes: Array<ShapeKey | null> = useMemo(() => {
    const queue = game?.queue ?? [];
    return Array.from({ length: PREVIEW_COUNT }, (_, index) => queue[index] ?? null);
  }, [game]);

  if (!game) return null;

  const controlButtonClass =
    'flex min-h-[56px] min-w-[56px] touch-none select-none items-center justify-center rounded-2xl border text-2xl transition-colors';

  return (
    <div className="flex h-full max-h-[100dvh] w-full flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 shadow-xl">
      <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-3 py-2 text-xs backdrop-blur sm:px-4 sm:text-sm">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Vimana Stack Field
          </span>
          <span className="truncate text-slate-200">
            Pilot: <span className="font-semibold text-amber-300">{petName}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Score</span>
            <span className="font-mono text-sm sm:text-base">{game.score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Lines</span>
            <span className="font-mono text-sm sm:text-base">{game.lines}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Level</span>
            <span className="font-mono text-sm sm:text-base">{game.level}</span>
          </div>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              togglePause();
            }}
            className="min-h-[40px] rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 active:bg-slate-700"
          >
            {game.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
        </div>
      </header>

      {/* Hold + previews strip */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 bg-slate-950/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Hold</span>
          <MiniPiecePreview shape={game.holdPiece} dim={game.holdUsed} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Next</span>
          {previewShapes.map((shape, index) => (
            <MiniPiecePreview key={`${shape}-${index}`} shape={shape} dim={index > 0} />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-1 pt-2 sm:flex-row sm:gap-3 sm:px-3">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative aspect-[10/20] max-h-full w-full max-w-[280px] sm:max-w-[340px]">
            {/* The playfield itself is the gesture surface. */}
            <div
              ref={boardRef}
              onPointerDown={handleBoardPointerDown}
              onPointerMove={handleBoardPointerMove}
              onPointerUp={handleBoardPointerUp}
              onPointerCancel={handleBoardPointerCancel}
              className="absolute inset-0 grid touch-none grid-cols-10 gap-[2px] rounded-xl border border-slate-800/80 bg-slate-950/80 p-[3px] shadow-inner shadow-black/60 sm:gap-[3px] sm:p-[4px]"
            >
              {gridCells}
            </div>
            {game.status === 'gameover' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/70">
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Run collapsed</div>
                  <div className="mt-1 text-lg font-semibold">Vimana Grid Overloaded</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Score {game.score} • Lines {game.lines} • Level {game.level}
                  </div>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        resetGame();
                      }}
                      className="min-h-[44px] rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 active:bg-amber-400"
                    >
                      Play Again
                    </button>
                    {onExit && (
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          onExit();
                        }}
                        className="min-h-[44px] rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-100 active:bg-slate-600"
                      >
                        Exit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {game.status === 'paused' && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    togglePause();
                  }}
                  className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-900/90 px-6 py-3 text-sm text-slate-100 active:bg-slate-800"
                >
                  Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop hint panel */}
        <aside className="hidden w-36 flex-col gap-3 text-xs sm:flex">
          <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Controls</div>
            <div>←/→ / A/D — move</div>
            <div>↓ / S — soft drop</div>
            <div>↑ / W — rotate</div>
            <div>Space/X — hard drop</div>
            <div>C/Shift — hold</div>
            <div>P — pause • Esc — exit</div>
          </div>
          <div className="space-y-1 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 text-slate-400">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Touch</div>
            <div>Drag — steer piece</div>
            <div>Tap — rotate</div>
            <div>Flick down — drop</div>
          </div>
        </aside>
      </div>

      {/* Mobile control deck — kept clear of the Android nav bar. */}
      <div
        className="border-t border-slate-800/60 bg-slate-950/70 px-2 pt-2 sm:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <div className="mx-auto flex max-w-[360px] items-center justify-between gap-1.5">
          <button
            type="button"
            aria-label="Hold piece"
            onPointerDown={(event) => {
              event.preventDefault();
              doHold();
            }}
            className={`${controlButtonClass} border-cyan-700/60 bg-cyan-900/40 text-base font-semibold text-cyan-200 active:bg-cyan-800/50`}
          >
            Hold
          </button>
          <button
            type="button"
            aria-label="Move left"
            onPointerDown={(event) => {
              event.preventDefault();
              startRepeat('left');
            }}
            onPointerUp={stopRepeat}
            onPointerCancel={stopRepeat}
            onPointerLeave={stopRepeat}
            className={`${controlButtonClass} border-slate-700 bg-slate-800/90 active:bg-slate-700`}
          >
            ◀
          </button>
          <button
            type="button"
            aria-label="Soft drop"
            onPointerDown={(event) => {
              event.preventDefault();
              startRepeat('soft');
            }}
            onPointerUp={stopRepeat}
            onPointerCancel={stopRepeat}
            onPointerLeave={stopRepeat}
            className={`${controlButtonClass} border-slate-700 bg-slate-800/90 active:bg-slate-700`}
          >
            ▼
          </button>
          <button
            type="button"
            aria-label="Move right"
            onPointerDown={(event) => {
              event.preventDefault();
              startRepeat('right');
            }}
            onPointerUp={stopRepeat}
            onPointerCancel={stopRepeat}
            onPointerLeave={stopRepeat}
            className={`${controlButtonClass} border-slate-700 bg-slate-800/90 active:bg-slate-700`}
          >
            ▶
          </button>
          <button
            type="button"
            aria-label="Rotate"
            onPointerDown={(event) => {
              event.preventDefault();
              doRotate();
            }}
            className={`${controlButtonClass} border-purple-600/60 bg-purple-900/40 text-purple-200 active:bg-purple-800/50`}
          >
            ↻
          </button>
          <button
            type="button"
            aria-label="Hard drop"
            onPointerDown={(event) => {
              event.preventDefault();
              doHardDrop();
            }}
            className={`${controlButtonClass} border-amber-500 bg-amber-600/90 font-bold text-slate-950 active:bg-amber-500`}
          >
            ⬇
          </button>
        </div>
      </div>
    </div>
  );
}

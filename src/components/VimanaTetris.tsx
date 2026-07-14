'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { triggerHaptic } from '@/lib/haptics';
import {
  EXPEDITION_DURATION_MS,
  POWER_COSTS,
  PREVIEW_COUNT,
  RESONANCE_MAX,
  STACK_COLORS,
  STACK_COLS,
  STACK_ROWS,
  STACK_SHAPES,
  activatePower,
  computeGhost,
  createStackGame,
  getCellPositions,
  hardDropActive,
  holdActive,
  isInDanger,
  moveActive,
  rotateActive,
  setStackStatus,
  shiftStackClock,
  softDropActive,
  tickStack,
  type ShapeKey,
  type StackEvents,
  type StackMode,
  type StackPowerKind,
  type StackState,
} from '@/lib/minigames/vimanaStack';

interface VimanaTetrisProps {
  petName?: string;
  genomeSeed?: number;
  /** Level the run begins at — the arcade passes the pet's evolution tier here. */
  startLevel?: number;
  onExit?: () => void;
  onGameOver?: (
    score: number,
    lines: number,
    level: number,
    extras?: { combo: number; mode: StackMode }
  ) => void;
}

/** Minimum downward flick to count as a hard drop. */
const SWIPE_DROP_DISTANCE = 48;
const SWIPE_DROP_VELOCITY = 0.45; // px per ms
/** Tap detection: little movement, short duration. */
const TAP_DISTANCE = 12;
const TAP_DURATION_MS = 260;
/** Held-button repeat pacing. */
const REPEAT_DELAY_MS = 180;
const REPEAT_INTERVAL_MS = 110;
/** How long clear callouts and pet reactions stay on screen. */
const FX_LIFETIME_MS = 1400;
const REACTION_LIFETIME_MS = 2200;

type RepeatAction = 'left' | 'right' | 'soft';

const CLEAR_TIERS: Record<number, { label: string; scale: string; color: string }> = {
  1: { label: 'Pulse', scale: 'text-base', color: '#7dd3fc' },
  2: { label: 'Echo Clear', scale: 'text-lg', color: '#a78bfa' },
  3: { label: 'Surge Clear', scale: 'text-xl', color: '#fbbf24' },
  4: { label: 'TETRA RESONANCE', scale: 'text-2xl', color: '#f472b6' },
};

const POWER_META: Record<
  StackPowerKind,
  { label: string; blurb: string; className: string; reaction: string }
> = {
  forge: {
    label: 'Forge',
    blurb: 'repair row',
    className: 'border-red-500/70 bg-red-950/60 text-red-200',
    reaction: '🔥 {pet} forges the broken lattice!',
  },
  flux: {
    label: 'Flux',
    blurb: 'slow fall',
    className: 'border-sky-500/70 bg-sky-950/60 text-sky-200',
    reaction: '🌊 {pet} bends the field current!',
  },
  anchor: {
    label: 'Anchor',
    blurb: 'phase slide',
    className: 'border-violet-500/70 bg-violet-950/60 text-violet-200',
    reaction: '🌑 {pet} phases through the noise!',
  },
};

/** Deterministic pseudo-random particle layout so render stays pure. */
function burstParticles(seedId: number, count: number, baseHue: number) {
  const particles: Array<{ dx: number; dy: number; delay: number; hue: number; size: number }> = [];
  let h = (seedId * 2654435761) >>> 0;
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 0xffffffff;
  };
  for (let i = 0; i < count; i += 1) {
    const angle = next() * Math.PI * 2;
    const distance = 40 + next() * 90;
    particles.push({
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 30,
      delay: next() * 120,
      hue: (baseHue + next() * 60 - 30 + 360) % 360,
      size: 4 + next() * 6,
    });
  }
  return particles;
}

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
  /** Genome-derived accent hue for glows, meters, and particles. */
  const accentHue = ((genomeSeed ?? 200) % 360 + 360) % 360;

  const gameRef = useRef<StackState | null>(null);
  const [game, setGame] = useState<StackState | null>(null);
  const [inMenu, setInMenu] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [fx, setFx] = useState<{ id: number; tier: number; combo: number } | null>(null);
  const [reaction, setReaction] = useState<{ id: number; text: string } | null>(null);

  const gameOverSentRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const dangerRef = useRef(false);
  const fxCounterRef = useRef(0);
  const fxTimeoutRef = useRef<number | null>(null);
  const reactionTimeoutRef = useRef<number | null>(null);

  // Pointer gesture tracking for the playfield.
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startedAt: number;
    columnsMoved: number;
    rowsDropped: number;
    consumed: boolean;
  } | null>(null);

  const repeatTimerRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  const buzz = useCallback(
    (pattern: Parameters<typeof triggerHaptic>[0]) => {
      if (hapticsOn) triggerHaptic(pattern);
    },
    [hapticsOn]
  );

  const showReaction = useCallback((text: string) => {
    if (reactionTimeoutRef.current !== null) window.clearTimeout(reactionTimeoutRef.current);
    const id = (fxCounterRef.current += 1);
    setReaction({ id, text });
    reactionTimeoutRef.current = window.setTimeout(
      () => setReaction((current) => (current?.id === id ? null : current)),
      REACTION_LIFETIME_MS
    );
  }, []);

  /** Translate engine events into juice: callouts, particles, haptics, pet mood. */
  const handleEvents = useCallback(
    (events: StackEvents, next: StackState) => {
      if (events.cleared > 0) {
        if (fxTimeoutRef.current !== null) window.clearTimeout(fxTimeoutRef.current);
        const id = (fxCounterRef.current += 1);
        setFx({ id, tier: events.cleared, combo: events.combo });
        fxTimeoutRef.current = window.setTimeout(
          () => setFx((current) => (current?.id === id ? null : current)),
          FX_LIFETIME_MS
        );

        buzz(events.cleared >= 3 ? 'heavy' : 'success');
        if (events.cleared >= 4) {
          showReaction(`🌟 ${petName} rides the resonance wave!`);
        } else if (events.combo >= 3) {
          showReaction(`⚡ ${petName} chains the field ×${events.combo}!`);
        }
      }

      const danger = isInDanger(next.board);
      if (danger && !dangerRef.current) {
        buzz('warning');
        showReaction(`😰 ${petName} grips the console!`);
      }
      dangerRef.current = danger;

      if (events.gameOver) {
        buzz(events.timeUp ? 'success' : 'error');
        showReaction(
          events.timeUp
            ? `🛠️ ${petName} sealed the hull in time!`
            : `💫 ${petName} tumbles out of the field...`
        );
      }
    },
    [buzz, petName, showReaction]
  );

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
      onGameOver?.(state.score, state.lines, state.level, {
        combo: state.bestCombo,
        mode: state.mode,
      });
    },
    [onGameOver]
  );

  const startGame = useCallback(
    (mode: StackMode) => {
      const seed = ((genomeSeed ?? Date.now()) ^ Math.floor(performance.now())) >>> 0;
      const fresh = createStackGame(seed, initialLevel, performance.now(), { mode });
      gameOverSentRef.current = false;
      pausedAtRef.current = null;
      dangerRef.current = false;
      gameRef.current = fresh;
      setGame(fresh);
      setInMenu(false);
      setFx(null);
      setTimeLeft(mode === 'expedition' ? Math.ceil(EXPEDITION_DURATION_MS / 1000) : null);
      showReaction(
        mode === 'expedition'
          ? `🚀 ${petName} begins a 60s hull repair!`
          : `🛸 ${petName} enters the stack field.`
      );
    },
    [genomeSeed, initialLevel, petName, showReaction]
  );

  // Game loop: gravity + lock delay + expedition timer live in the engine.
  useEffect(() => {
    const step = (timestamp: number) => {
      const current = gameRef.current;
      if (current && current.status === 'running') {
        const { state: next, events } = tickStack(current, timestamp);
        if (next !== current) {
          gameRef.current = next;
          setGame(next);
          handleEvents(events, next);
        }
        if (events.gameOver) notifyGameOver(next);

        // Expedition countdown, updated only when the visible second changes.
        if (next.endsAt !== null) {
          const seconds = Math.max(0, Math.ceil((next.endsAt - timestamp) / 1000));
          setTimeLeft((prev) => (prev === seconds ? prev : seconds));
        }
      }
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [handleEvents, notifyGameOver]);

  const pauseGame = useCallback(() => {
    const current = gameRef.current;
    if (!current || current.status !== 'running') return;
    pausedAtRef.current = performance.now();
    apply((state) => setStackStatus(state, 'paused'));
  }, [apply]);

  const resumeGame = useCallback(() => {
    const current = gameRef.current;
    if (!current || current.status !== 'paused') return;
    const pausedMs = pausedAtRef.current !== null ? performance.now() - pausedAtRef.current : 0;
    pausedAtRef.current = null;
    // Shift the clocks so pause time never burns gravity, powers, or timer.
    apply((state) => setStackStatus(shiftStackClock(state, pausedMs), 'running'));
  }, [apply]);

  const togglePause = useCallback(() => {
    const current = gameRef.current;
    if (!current) return;
    if (current.status === 'paused') resumeGame();
    else pauseGame();
  }, [pauseGame, resumeGame]);

  // Pause automatically when the tab or app moves to the background.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) pauseGame();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pauseGame]);

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
      buzz('light');
      handleEvents(events, next);
    }
    if (events.gameOver) notifyGameOver(next);
  }, [buzz, handleEvents, notifyGameOver]);

  const doPower = useCallback(
    (kind: StackPowerKind) => {
      const current = gameRef.current;
      if (!current) return;
      const next = activatePower(current, kind, performance.now());
      if (next !== current) {
        gameRef.current = next;
        setGame(next);
        buzz('medium');
        showReaction(POWER_META[kind].reaction.replace('{pet}', petName));
      }
    },
    [buzz, petName, showReaction]
  );

  // Keyboard controls (desktop parity).
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (inMenu) {
        if (event.key === 'Escape') {
          event.preventDefault();
          onExit?.();
        }
        return;
      }
      const current = gameRef.current;
      if (!current) return;

      if (current.status === 'gameover') {
        if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
          event.preventDefault();
          startGame(current.mode);
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
      else if (key === '1') doPower('forge');
      else if (key === '2') doPower('flux');
      else if (key === '3') doPower('anchor');
      else handled = false;

      if (handled) event.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [doHardDrop, doHold, doMove, doPower, doRotate, doSoftDrop, inMenu, onExit, startGame, togglePause]);

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
      columnsMoved: 0,
      rowsDropped: 0,
      consumed: false,
    };
  }, []);

  const handleBoardPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      const cell = cellSize();
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;

      // Horizontal drag: one column per cell-width dragged.
      const targetColumns = Math.trunc(dx / cell);
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

  const danger = game ? isInDanger(game.board) : false;

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
                // High-contrast piece fill: bright core, saturated edge.
                background: color
                  ? `radial-gradient(circle at 30% 20%, #ffffffcc, ${color} 70%)`
                  : ghostHere
                    ? 'linear-gradient(to bottom, #ffffff20, #ffffff0a)'
                    : 'linear-gradient(to bottom, #020617, #020617)',
                boxShadow: color ? `inset 0 0 0 1px ${color}` : undefined,
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

  const particles = useMemo(
    () => (fx ? burstParticles(fx.id, 8 + fx.tier * 4, accentHue) : []),
    [fx, accentHue]
  );

  const controlButtonClass =
    'flex min-h-[56px] min-w-[52px] touch-none select-none items-center justify-center rounded-2xl border text-2xl transition-colors';

  const powerButton = (kind: StackPowerKind) => {
    const meta = POWER_META[kind];
    const affordable = (game?.resonance ?? 0) >= POWER_COSTS[kind];
    const running = game?.power?.kind === kind;
    return (
      <button
        key={kind}
        type="button"
        aria-label={`${meta.label} power`}
        disabled={!affordable && !running}
        onPointerDown={(event) => {
          event.preventDefault();
          doPower(kind);
        }}
        className={`flex min-h-[40px] flex-col items-center justify-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-opacity ${meta.className} ${
          running ? 'ring-2 ring-white/60' : ''
        } ${affordable || running ? 'opacity-100' : 'opacity-35'}`}
      >
        <span>{meta.label}</span>
        <span className="font-normal normal-case tracking-normal text-[9px] opacity-80">
          {running ? 'active' : meta.blurb}
        </span>
      </button>
    );
  };

  return (
    <div
      className="relative flex h-full max-h-[100dvh] w-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 shadow-xl"
      style={{
        borderColor: `hsl(${accentHue} 60% 45% / 0.6)`,
        boxShadow: danger
          ? '0 0 32px rgba(248,113,113,0.35), inset 0 0 24px rgba(248,113,113,0.12)'
          : `0 0 24px hsl(${accentHue} 70% 50% / 0.15)`,
      }}
    >
      {/* Component-scoped keyframes for pulse / particles / danger shake. */}
      <style>{`
        @keyframes vimana-pulse {
          0% { transform: scale(1); filter: brightness(1); }
          25% { transform: scale(1.02); filter: brightness(1.35); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @keyframes vimana-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
        }
        @keyframes vimana-callout {
          0% { transform: translateY(8px) scale(0.85); opacity: 0; }
          20% { transform: translateY(0) scale(1.05); opacity: 1; }
          80% { transform: translateY(-6px) scale(1); opacity: 1; }
          100% { transform: translateY(-14px) scale(0.95); opacity: 0; }
        }
        @keyframes vimana-danger {
          0%, 100% { transform: translateX(0); filter: hue-rotate(0deg); }
          25% { transform: translateX(-1px); filter: hue-rotate(-12deg); }
          75% { transform: translateX(1px); filter: hue-rotate(12deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vimana-fx { animation: none !important; }
        }
      `}</style>

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
          {game && timeLeft !== null && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Time</span>
              <span
                className={`font-mono text-sm sm:text-base ${timeLeft <= 10 ? 'text-red-300' : 'text-emerald-300'}`}
              >
                {timeLeft}s
              </span>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Score</span>
            <span className="font-mono text-sm sm:text-base">{game?.score ?? 0}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Lines</span>
            <span className="font-mono text-sm sm:text-base">{game?.lines ?? 0}</span>
          </div>
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Level</span>
            <span className="font-mono text-sm sm:text-base">{game?.level ?? initialLevel}</span>
          </div>
          <button
            type="button"
            aria-label={hapticsOn ? 'Disable vibration' : 'Enable vibration'}
            onPointerDown={(event) => {
              event.preventDefault();
              setHapticsOn((value) => !value);
            }}
            className={`min-h-[40px] rounded-lg px-2 py-1 text-sm ${hapticsOn ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-slate-600'}`}
          >
            📳
          </button>
          {!inMenu && (
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                togglePause();
              }}
              className="min-h-[40px] rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 active:bg-slate-700"
            >
              {game?.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>
      </header>

      {/* Hold + previews + resonance strip */}
      {!inMenu && game && (
        <div className="border-b border-slate-800/60 bg-slate-950/50 px-3 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Hold</span>
              <MiniPiecePreview shape={game.holdPiece} dim={game.holdUsed} />
            </div>
            {game.combo > 1 && (
              <span
                className="vimana-fx font-mono text-sm font-bold text-amber-300"
                style={{ animation: 'vimana-pulse 400ms ease-out' }}
              >
                ×{game.combo}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Next</span>
              {previewShapes.map((shape, index) => (
                <MiniPiecePreview key={`${shape}-${index}`} shape={shape} dim={index > 0} />
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
              role="meter"
              aria-label="Resonance"
              aria-valuenow={Math.round(game.resonance)}
              aria-valuemin={0}
              aria-valuemax={RESONANCE_MAX}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${(game.resonance / RESONANCE_MAX) * 100}%`,
                  background: `linear-gradient(90deg, hsl(${accentHue} 80% 55%), hsl(${(accentHue + 60) % 360} 80% 65%))`,
                }}
              />
            </div>
            <div className="flex gap-1">
              {(['forge', 'flux', 'anchor'] as StackPowerKind[]).map(powerButton)}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-1 pt-2 sm:flex-row sm:gap-3 sm:px-3">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative aspect-[10/20] max-h-full w-full max-w-[280px] sm:max-w-[340px]">
            {/* Screen pulse wrapper — re-triggers per clear via the fx key. */}
            <div
              key={fx?.id ?? 'steady'}
              className="vimana-fx absolute inset-0"
              style={{
                animation: fx
                  ? `vimana-pulse ${300 + fx.tier * 120}ms ease-out`
                  : danger
                    ? 'vimana-danger 320ms ease-in-out infinite'
                    : undefined,
              }}
            >
              <div
                ref={boardRef}
                onPointerDown={handleBoardPointerDown}
                onPointerMove={handleBoardPointerMove}
                onPointerUp={handleBoardPointerUp}
                onPointerCancel={handleBoardPointerCancel}
                className={`absolute inset-0 grid touch-none grid-cols-10 gap-[2px] rounded-xl border p-[3px] shadow-inner shadow-black/60 sm:gap-[3px] sm:p-[4px] ${
                  danger ? 'border-red-500/70 bg-red-950/30' : 'border-slate-800/80 bg-slate-950/80'
                }`}
              >
                {gridCells}
              </div>
            </div>

            {/* Particle burst on clears (genome-tinted). */}
            {fx && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                {particles.map((particle, index) => (
                  <span
                    key={`${fx.id}-${index}`}
                    className="vimana-fx absolute rounded-full"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      background: `hsl(${particle.hue} 90% 65%)`,
                      ['--dx' as string]: `${particle.dx}px`,
                      ['--dy' as string]: `${particle.dy}px`,
                      animation: `vimana-particle ${600 + fx.tier * 150}ms ease-out ${particle.delay}ms forwards`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Clear-tier callout */}
            {fx && CLEAR_TIERS[fx.tier] && (
              <div className="pointer-events-none absolute inset-x-0 top-1/4 flex justify-center">
                <span
                  className={`vimana-fx font-bold tracking-wide ${CLEAR_TIERS[fx.tier].scale}`}
                  style={{
                    color: CLEAR_TIERS[fx.tier].color,
                    textShadow: `0 0 18px ${CLEAR_TIERS[fx.tier].color}`,
                    animation: `vimana-callout ${FX_LIFETIME_MS}ms ease-out forwards`,
                  }}
                >
                  {CLEAR_TIERS[fx.tier].label}
                  {fx.combo > 1 ? ` ×${fx.combo}` : ''}
                </span>
              </div>
            )}

            {/* Pet reaction bubble */}
            {reaction && (
              <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-center">
                <span
                  key={reaction.id}
                  className="vimana-fx rounded-full border border-slate-700/80 bg-slate-950/85 px-3 py-1 text-[11px] text-slate-100"
                  style={{ animation: `vimana-callout ${REACTION_LIFETIME_MS}ms ease-out forwards` }}
                >
                  {reaction.text}
                </span>
              </div>
            )}

            {/* Mode select menu */}
            {inMenu && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/70 px-4">
                <div className="text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Vimana Stack Field</div>
                  <div className="mt-1 text-lg font-semibold">Choose a flight plan</div>
                </div>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    startGame('endless');
                  }}
                  className="w-full max-w-[240px] rounded-xl border border-cyan-600/60 bg-cyan-950/60 px-4 py-3 text-left active:bg-cyan-900/60"
                >
                  <div className="text-sm font-semibold text-cyan-200">Endless Flight</div>
                  <div className="text-[11px] text-slate-400">Stack until the field overloads.</div>
                </button>
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    startGame('expedition');
                  }}
                  className="w-full max-w-[240px] rounded-xl border border-amber-600/60 bg-amber-950/50 px-4 py-3 text-left active:bg-amber-900/50"
                >
                  <div className="text-sm font-semibold text-amber-200">Expedition Repair · 60s</div>
                  <div className="text-[11px] text-slate-400">Patch as much hull as the window allows.</div>
                </button>
              </div>
            )}

            {game?.status === 'gameover' && !inMenu && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/70">
                <div className="rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {game.mode === 'expedition' ? 'Repair window closed' : 'Run collapsed'}
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {game.mode === 'expedition' ? 'Expedition Complete' : 'Vimana Grid Overloaded'}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Score {game.score} • Lines {game.lines} • Level {game.level}
                    {game.bestCombo > 1 ? ` • Best combo ×${game.bestCombo}` : ''}
                  </div>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startGame('endless');
                      }}
                      className="min-h-[44px] rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-slate-950 active:bg-cyan-500"
                    >
                      Endless
                    </button>
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        startGame('expedition');
                      }}
                      className="min-h-[44px] rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 active:bg-amber-400"
                    >
                      60s Repair
                    </button>
                    {onExit && (
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          onExit();
                        }}
                        className="min-h-[44px] rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 active:bg-slate-600"
                      >
                        Exit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {game?.status === 'paused' && !inMenu && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    resumeGame();
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
            <div>1/2/3 — powers</div>
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
      {!inMenu && (
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
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { triggerHaptic } from '@/lib/haptics';

interface SafeCrackMiniProps {
  petName?: string;
  genomeSeed?: number;
  onExit?: () => void;
  onGameOver?: (success: boolean, score: number, attempts: number) => void;
}

type Band = 'COOL' | 'NEUTRAL' | 'HOT';
type Direction = 'R' | 'L'; // R = clockwise, L = counter-clockwise
type GameState = 'S1_R' | 'S2_L' | 'S3_R' | 'UNLOCK' | 'FAIL' | 'IDLE';

interface Combo {
  n1: number;
  n2: number;
  n3: number;
}

interface BandConfig {
  baseTolerance: number;
  minTolerance: number;
  dwellTime: number;
  maxSpeed: number;
  decoyCount: number;
}

interface DecoyPosition {
  tick: number;
  isDecoy: true;
}

interface GameStateData {
  state: GameState;
  step: 1 | 2 | 3;
  strikes: number;
  crossedZero: boolean;
  dwellStart: number | null;
  readyToCommit: boolean;
  currentAngle: number;
  currentTick: number;
  angularVelocity: number;
  combo: Combo;
  band: Band;
  decoys: DecoyPosition[];
  startTime: number;
  distanceLog: number[];
}

const TICKS = 60;
const DEGREES_PER_TICK = 6;
const RED_GATES = [0, 10, 20, 30, 40, 50];
const MAX_STRIKES = 3;

// Band configurations
const BAND_CONFIGS: Record<Band, BandConfig> = {
  COOL: {
    baseTolerance: 3,
    minTolerance: 1.5,
    dwellTime: 220,
    maxSpeed: 60, // degrees/sec
    decoyCount: 0,
  },
  NEUTRAL: {
    baseTolerance: 2.5,
    minTolerance: 1.2,
    dwellTime: 260,
    maxSpeed: 45,
    decoyCount: 2,
  },
  HOT: {
    baseTolerance: 2,
    minTolerance: 1,
    dwellTime: 300,
    maxSpeed: 30,
    decoyCount: 4,
  },
};

const TOLERANCE_DECAY_K = 0.1;

// Simple LCG random number generator
function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

// Generate combo from seed
function generateCombo(rng: () => number): Combo {
  const roll = rng();
  const index = Math.floor(roll * RED_GATES.length) % RED_GATES.length;
  const n1 = RED_GATES[index];
  const n2 = (n1 + 12) % TICKS;
  const n3 = (TICKS - n1) % TICKS;
  return { n1, n2, n3 };
}

// Generate band from seed
function generateBand(rng: () => number): Band {
  const roll = rng();
  if (roll < 0.33) return 'COOL';
  if (roll < 0.66) return 'NEUTRAL';
  return 'HOT';
}

// Generate decoy positions
function generateDecoys(combo: Combo, band: Band, rng: () => number): DecoyPosition[] {
  const config = BAND_CONFIGS[band];
  const decoys: DecoyPosition[] = [];
  const targetTicks = new Set([combo.n1, combo.n2, combo.n3]);

  if (config.decoyCount === 0) return decoys;

  // Place decoys near red gates that aren't targets
  for (const gate of RED_GATES) {
    if (targetTicks.has(gate)) continue;

    if (band === 'HOT') {
      // ±2 ticks for HOT
      decoys.push({ tick: (gate - 2 + TICKS) % TICKS, isDecoy: true });
      decoys.push({ tick: (gate + 2) % TICKS, isDecoy: true });
    } else if (band === 'NEUTRAL' && rng() > 0.5) {
      // Random ±1 or ±2 for NEUTRAL
      const offset = rng() > 0.5 ? 1 : 2;
      if (rng() > 0.5) {
        decoys.push({ tick: (gate - offset + TICKS) % TICKS, isDecoy: true });
      } else {
        decoys.push({ tick: (gate + offset) % TICKS, isDecoy: true });
      }
    }

    if (decoys.length >= config.decoyCount) break;
  }

  return decoys.slice(0, config.decoyCount);
}

// Calculate shortest distance on circular dial
function circularDistance(from: number, to: number): number {
  const diff = Math.abs(from - to);
  return Math.min(diff, TICKS - diff);
}

// Calculate effective tolerance based on speed
function effectiveTolerance(band: Band, speed: number): number {
  const config = BAND_CONFIGS[band];
  const speedInTicksPerSec = speed / DEGREES_PER_TICK;
  const tolerance = config.baseTolerance - TOLERANCE_DECAY_K * Math.abs(speedInTicksPerSec);
  return Math.max(config.minTolerance, Math.min(config.baseTolerance, tolerance));
}

export function SafeCrackMini({
  petName = 'Meta-Pet',
  genomeSeed,
  onExit,
  onGameOver,
}: SafeCrackMiniProps) {
  const rngRef = useRef<() => number>(() => Math.random());
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseAngle, setLastMouseAngle] = useState<number | null>(null);
  const [velocityHistory, setVelocityHistory] = useState<number[]>([0, 0, 0]);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const dialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevAngleRef = useRef<number>(0);
  const [wobbleAnimation, setWobbleAnimation] = useState(false);
  const [successParticles, setSuccessParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [nearMissGlow, setNearMissGlow] = useState(false);

  // Initialize RNG and game state
  useEffect(() => {
    rngRef.current = createRng(genomeSeed ?? Date.now());
  }, [genomeSeed]);

  const resetGame = useCallback(() => {
    const rng = rngRef.current;
    const combo = generateCombo(rng);
    const band = generateBand(rng);
    const decoys = generateDecoys(combo, band, rng);

    setGameState({
      state: 'S1_R',
      step: 1,
      strikes: 0,
      crossedZero: false,
      dwellStart: null,
      readyToCommit: false,
      currentAngle: 0,
      currentTick: 0,
      angularVelocity: 0,
      combo,
      band,
      decoys,
      startTime: performance.now(),
      distanceLog: [],
    });
    setVelocityHistory([0, 0, 0]);
    lastFrameTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Get current target based on step
  const currentTarget = useMemo(() => {
    if (!gameState) return null;
    if (gameState.step === 1) return gameState.combo.n1;
    if (gameState.step === 2) return gameState.combo.n2;
    if (gameState.step === 3) return gameState.combo.n3;
    return null;
  }, [gameState]);

  // Get required direction based on state
  const requiredDirection = useMemo((): Direction | null => {
    if (!gameState) return null;
    if (gameState.state === 'S1_R') return 'R';
    if (gameState.state === 'S2_L') return 'L';
    if (gameState.state === 'S3_R') return 'R';
    return null;
  }, [gameState]);

  // Update dial angle from mouse/touch position
  const updateDialFromPointer = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - dialCenterRef.current.x;
    const dy = clientY - dialCenterRef.current.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = ((angleRad * 180) / Math.PI + 90 + 360) % 360;
    return angleDeg;
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      dialCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setIsDragging(true);
      const angle = updateDialFromPointer(e.clientX, e.clientY);
      setLastMouseAngle(angle);
    },
    [updateDialFromPointer]
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !gameState) return;
      const newAngle = updateDialFromPointer(e.clientX, e.clientY);

      if (lastMouseAngle !== null) {
        let delta = newAngle - lastMouseAngle;
        // Handle wrap-around
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        setGameState(prev => {
          if (!prev) return prev;
          const nextAngle = (prev.currentAngle + delta + 360) % 360;
          const prevTick = prev.currentTick;
          const nextTick = Math.floor(nextAngle / DEGREES_PER_TICK);

          // Detect zero crossing
          let crossedZero = prev.crossedZero;
          if (
            (prevTick === TICKS - 1 && nextTick === 0) ||
            (prevTick === 0 && nextTick === TICKS - 1)
          ) {
            crossedZero = true;
          }

          return {
            ...prev,
            currentAngle: nextAngle,
            currentTick: nextTick,
            crossedZero,
          };
        });
      }

      setLastMouseAngle(newAngle);
    },
    [isDragging, gameState, lastMouseAngle, updateDialFromPointer]
  );

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setLastMouseAngle(null);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!gameState) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onExit?.();
        return;
      }

      if (gameState.state === 'UNLOCK' || gameState.state === 'FAIL') {
        if (event.key === 'Enter' || event.key.toLowerCase() === 'r') {
          event.preventDefault();
          resetGame();
        }
        return;
      }

      // Nudge dial with arrow keys
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setGameState(prev => {
          if (!prev) return prev;
          const nextAngle = (prev.currentAngle - DEGREES_PER_TICK + 360) % 360;
          const prevTick = prev.currentTick;
          const nextTick = Math.floor(nextAngle / DEGREES_PER_TICK);
          let crossedZero = prev.crossedZero;
          if (prevTick === 0 && nextTick === TICKS - 1) crossedZero = true;
          return { ...prev, currentAngle: nextAngle, currentTick: nextTick, crossedZero };
        });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setGameState(prev => {
          if (!prev) return prev;
          const nextAngle = (prev.currentAngle + DEGREES_PER_TICK) % 360;
          const prevTick = prev.currentTick;
          const nextTick = Math.floor(nextAngle / DEGREES_PER_TICK);
          let crossedZero = prev.crossedZero;
          if (prevTick === TICKS - 1 && nextTick === 0) crossedZero = true;
          return { ...prev, currentAngle: nextAngle, currentTick: nextTick, crossedZero };
        });
      }

      // Commit with Space or Enter
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        setGameState(prev => {
          if (!prev) return prev;

          // Check if in decoy zone
          const inDecoyZone = prev.decoys.some(decoy => {
            const distance = circularDistance(prev.currentTick, decoy.tick);
            const tolerance = effectiveTolerance(prev.band, Math.abs(prev.angularVelocity));
            return distance <= tolerance;
          });

          if (inDecoyZone) {
            // False click - add strike and reset
            const nextStrikes = prev.strikes + 1;
            triggerHaptic('error');
            setWobbleAnimation(true);
            setTimeout(() => setWobbleAnimation(false), 500);
            if (nextStrikes >= MAX_STRIKES) {
              onGameOver?.(false, 0, nextStrikes);
              return { ...prev, state: 'FAIL', strikes: nextStrikes };
            }
            return {
              ...prev,
              strikes: nextStrikes,
              dwellStart: null,
              readyToCommit: false,
            };
          }

          // Check if ready to commit
          if (prev.readyToCommit) {
            // Success - advance step
            if (prev.step === 3) {
              // UNLOCK!
              triggerHaptic('success');
              // Generate success particles
              const particles = Array.from({ length: 20 }, (_, i) => ({
                id: Date.now() + i,
                x: 200 + (Math.random() - 0.5) * 100,
                y: 200 + (Math.random() - 0.5) * 100,
              }));
              setSuccessParticles(particles);
              setTimeout(() => setSuccessParticles([]), 2000);

              const totalTime = (performance.now() - prev.startTime) / 1000;
              const avgDistance =
                prev.distanceLog.length > 0
                  ? prev.distanceLog.reduce((a, b) => a + b, 0) / prev.distanceLog.length
                  : 0;
              const score = calculateScore(prev.band, avgDistance, totalTime);
              onGameOver?.(true, score, prev.strikes);
              return { ...prev, state: 'UNLOCK' };
            } else {
              // Advance to next step
              triggerHaptic('medium');
              const nextStep = (prev.step + 1) as 1 | 2 | 3;
              let nextState: GameState = 'IDLE';
              if (nextStep === 2) nextState = 'S2_L';
              if (nextStep === 3) nextState = 'S3_R';

              return {
                ...prev,
                state: nextState,
                step: nextStep,
                crossedZero: false,
                dwellStart: null,
                readyToCommit: false,
                distanceLog: [],
              };
            }
          } else {
            // Failed commit - add strike
            triggerHaptic('warning');
            setWobbleAnimation(true);
            setTimeout(() => setWobbleAnimation(false), 500);
            const nextStrikes = prev.strikes + 1;
            if (nextStrikes >= MAX_STRIKES) {
              triggerHaptic('error');
              onGameOver?.(false, 0, nextStrikes);
              return { ...prev, state: 'FAIL', strikes: nextStrikes };
            }
            return {
              ...prev,
              strikes: nextStrikes,
              dwellStart: null,
              readyToCommit: false,
            };
          }
        });
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, onExit, onGameOver, resetGame]);

  // Game loop: update velocity, check cone conditions, dwell timing
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!gameState || gameState.state === 'UNLOCK' || gameState.state === 'FAIL') {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const dt = timestamp - lastFrameTimeRef.current;
      if (dt === 0) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      setGameState(prev => {
        if (!prev || currentTarget === null || !requiredDirection) return prev;

        // Calculate angular velocity from angle delta
        let angleDelta = prev.currentAngle - prevAngleRef.current;
        // Handle wrap-around
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;
        const instantVelocity = (angleDelta / dt) * 1000; // degrees per second
        prevAngleRef.current = prev.currentAngle;

        const newVelocityHistory = [...velocityHistory.slice(1), instantVelocity];
        setVelocityHistory(newVelocityHistory);
        const smoothedVelocity =
          newVelocityHistory.reduce((a, b) => a + b, 0) / newVelocityHistory.length;

        const distance = circularDistance(prev.currentTick, currentTarget);
        const tolerance = effectiveTolerance(prev.band, Math.abs(smoothedVelocity));
        const insideCone = distance <= tolerance;

        const config = BAND_CONFIGS[prev.band];
        const speedOk = Math.abs(smoothedVelocity) <= config.maxSpeed;

        // Near-miss detection for visual/haptic feedback
        const nearMiss = distance <= tolerance + 1 && distance > tolerance;
        if (nearMiss && !insideCone) {
          setNearMissGlow(true);
          setTimeout(() => setNearMissGlow(false), 100);
        }

        let dwellStart = prev.dwellStart;
        let readyToCommit = prev.readyToCommit;

        if (insideCone && prev.crossedZero && speedOk) {
          if (dwellStart === null) {
            dwellStart = timestamp;
            triggerHaptic('light'); // Haptic when entering target zone
          } else {
            const dwellDuration = timestamp - dwellStart;
            if (dwellDuration >= config.dwellTime) {
              if (!readyToCommit) {
                triggerHaptic('success'); // Haptic when ready to commit
              }
              readyToCommit = true;
              // Log distance for scoring
              if (!prev.distanceLog.includes(distance)) {
                prev.distanceLog.push(distance);
              }
            }
          }
        } else {
          if (dwellStart !== null) {
            triggerHaptic('selection'); // Haptic when leaving target zone
          }
          dwellStart = null;
          readyToCommit = false;
        }

        return {
          ...prev,
          angularVelocity: smoothedVelocity,
          dwellStart,
          readyToCommit,
        };
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameState, currentTarget, requiredDirection, velocityHistory]);

  // Commit function for mobile button - must be before early return to follow React rules of hooks
  const handleCommit = useCallback(() => {
    setGameState(prev => {
      if (!prev) return prev;
      if (prev.state === 'UNLOCK' || prev.state === 'FAIL') return prev;

      // Check if in decoy zone
      const inDecoyZone = prev.decoys.some(decoy => {
        const distance = circularDistance(prev.currentTick, decoy.tick);
        const tolerance = effectiveTolerance(prev.band, Math.abs(prev.angularVelocity));
        return distance <= tolerance;
      });

      if (inDecoyZone) {
        triggerHaptic('error');
        setWobbleAnimation(true);
        setTimeout(() => setWobbleAnimation(false), 500);
        const nextStrikes = prev.strikes + 1;
        if (nextStrikes >= MAX_STRIKES) {
          onGameOver?.(false, 0, nextStrikes);
          return { ...prev, state: 'FAIL', strikes: nextStrikes };
        }
        return {
          ...prev,
          strikes: nextStrikes,
          dwellStart: null,
          readyToCommit: false,
        };
      }

      if (prev.readyToCommit) {
        if (prev.step === 3) {
          triggerHaptic('success');
          const particles = Array.from({ length: 20 }, (_, i) => ({
            id: Date.now() + i,
            x: 200 + (Math.random() - 0.5) * 100,
            y: 200 + (Math.random() - 0.5) * 100,
          }));
          setSuccessParticles(particles);
          setTimeout(() => setSuccessParticles([]), 2000);

          const totalTime = (performance.now() - prev.startTime) / 1000;
          const avgDistance =
            prev.distanceLog.length > 0
              ? prev.distanceLog.reduce((a, b) => a + b, 0) / prev.distanceLog.length
              : 0;
          const score = calculateScore(prev.band, avgDistance, totalTime);
          onGameOver?.(true, score, prev.strikes);
          return { ...prev, state: 'UNLOCK' };
        } else {
          triggerHaptic('medium');
          const nextStep = (prev.step + 1) as 1 | 2 | 3;
          let nextState: GameState = 'IDLE';
          if (nextStep === 2) nextState = 'S2_L';
          if (nextStep === 3) nextState = 'S3_R';

          return {
            ...prev,
            state: nextState,
            step: nextStep,
            crossedZero: false,
            dwellStart: null,
            readyToCommit: false,
            distanceLog: [],
          };
        }
      } else {
        triggerHaptic('warning');
        setWobbleAnimation(true);
        setTimeout(() => setWobbleAnimation(false), 500);
        const nextStrikes = prev.strikes + 1;
        if (nextStrikes >= MAX_STRIKES) {
          triggerHaptic('error');
          onGameOver?.(false, 0, nextStrikes);
          return { ...prev, state: 'FAIL', strikes: nextStrikes };
        }
        return {
          ...prev,
          strikes: nextStrikes,
          dwellStart: null,
          readyToCommit: false,
        };
      }
    });
  }, [onGameOver]);

  // Nudge functions for mobile - must be before early return
  const nudgeLeft = useCallback(() => {
    triggerHaptic('selection');
    setGameState(prev => {
      if (!prev || prev.state === 'UNLOCK' || prev.state === 'FAIL') return prev;
      const nextAngle = (prev.currentAngle - DEGREES_PER_TICK + 360) % 360;
      const prevTick = prev.currentTick;
      const nextTick = Math.floor(nextAngle / DEGREES_PER_TICK);
      let crossedZero = prev.crossedZero;
      if (prevTick === 0 && nextTick === TICKS - 1) crossedZero = true;
      return { ...prev, currentAngle: nextAngle, currentTick: nextTick, crossedZero };
    });
  }, []);

  const nudgeRight = useCallback(() => {
    triggerHaptic('selection');
    setGameState(prev => {
      if (!prev || prev.state === 'UNLOCK' || prev.state === 'FAIL') return prev;
      const nextAngle = (prev.currentAngle + DEGREES_PER_TICK) % 360;
      const prevTick = prev.currentTick;
      const nextTick = Math.floor(nextAngle / DEGREES_PER_TICK);
      let crossedZero = prev.crossedZero;
      if (prevTick === TICKS - 1 && nextTick === 0) crossedZero = true;
      return { ...prev, currentAngle: nextAngle, currentTick: nextTick, crossedZero };
    });
  }, []);

  if (!gameState) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-slate-400">Initializing safe...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden touch-none">
      {/* Header */}
      <header className="px-4 py-2 flex items-center justify-between text-xs sm:text-sm border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-400">
            Safe Crack Challenge
          </span>
          <span className="text-slate-200">
            Operator: <span className="font-semibold text-amber-300">{petName}</span>
          </span>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Band</span>
            <span className={`font-mono text-base ${
              gameState.band === 'COOL' ? 'text-blue-300' :
              gameState.band === 'NEUTRAL' ? 'text-yellow-300' :
              'text-red-300'
            }`}>
              {gameState.band}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Step</span>
            <span className="font-mono text-base">{gameState.step}/3</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Strikes</span>
            <span className="font-mono text-base text-red-400">{gameState.strikes}/{MAX_STRIKES}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 px-2 sm:px-3 pb-2 sm:pb-3 pt-2 overflow-hidden">
        <div className="flex-1 flex items-center justify-center min-h-0">
          {/* Dial */}
          <div
            className={`relative aspect-square max-h-full w-full max-w-[400px] cursor-pointer transition-transform ${
              wobbleAnimation ? 'animate-[wobble_0.5s_ease-in-out]' : ''
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              filter: nearMissGlow ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))' : 'none',
            }}
          >
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {/* Glow effect when ready to commit */}
              {gameState.readyToCommit && (
                <circle
                  cx="200"
                  cy="200"
                  r="190"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  opacity="0.6"
                  className="animate-pulse"
                />
              )}
              {/* Background circle */}
              <circle cx="200" cy="200" r="180" fill="#0f172a" stroke="#334155" strokeWidth="2" />

              {/* Tick marks */}
              {Array.from({ length: TICKS }).map((_, i) => {
                const angle = (i * DEGREES_PER_TICK - 90) * (Math.PI / 180);
                const isRedGate = RED_GATES.includes(i);
                const isMajor = i % 5 === 0;
                const outerR = 175;
                const innerR = isRedGate ? 150 : isMajor ? 160 : 165;
                const x1 = 200 + outerR * Math.cos(angle);
                const y1 = 200 + outerR * Math.sin(angle);
                const x2 = 200 + innerR * Math.cos(angle);
                const y2 = 200 + innerR * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isRedGate ? '#ef4444' : isMajor ? '#94a3b8' : '#475569'}
                    strokeWidth={isRedGate ? 3 : isMajor ? 2 : 1}
                  />
                );
              })}

              {/* Decoy indicators (visible during gameplay) */}
              {gameState.state !== 'UNLOCK' && gameState.state !== 'FAIL' && (
                <>
                  {gameState.decoys.map((decoy, idx) => {
                    const angle = (decoy.tick * DEGREES_PER_TICK - 90) * (Math.PI / 180);
                    const r = 140;
                    const x = 200 + r * Math.cos(angle);
                    const y = 200 + r * Math.sin(angle);
                    return (
                      <circle
                        key={`decoy-${idx}`}
                        cx={x}
                        cy={y}
                        r="6"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                        opacity="0.5"
                      />
                    );
                  })}
                </>
              )}

              {/* Target indicators (after unlock, show combo) */}
              {gameState.state === 'UNLOCK' && (
                <>
                  {[gameState.combo.n1, gameState.combo.n2, gameState.combo.n3].map((tick, idx) => {
                    const angle = (tick * DEGREES_PER_TICK - 90) * (Math.PI / 180);
                    const r = 140;
                    const x = 200 + r * Math.cos(angle);
                    const y = 200 + r * Math.sin(angle);
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="8"
                        fill={idx === 0 ? '#22c55e' : idx === 1 ? '#3b82f6' : '#a855f7'}
                        stroke="#fff"
                        strokeWidth="2"
                      />
                    );
                  })}
                </>
              )}

              {/* Success particles */}
              {successParticles.map((particle) => (
                <circle
                  key={particle.id}
                  cx={particle.x}
                  cy={particle.y}
                  r="4"
                  fill="#fbbf24"
                  className="animate-[ping_1s_ease-out]"
                  opacity="0"
                />
              ))}

              {/* Current position indicator (needle) */}
              <g transform={`rotate(${gameState.currentAngle} 200 200)`}>
                <line
                  x1="200"
                  y1="200"
                  x2="200"
                  y2="50"
                  stroke={gameState.readyToCommit ? '#22c55e' : '#fbbf24'}
                  strokeWidth="4"
                  className={gameState.readyToCommit ? 'transition-colors duration-300' : ''}
                />
                <circle
                  cx="200"
                  cy="200"
                  r="12"
                  fill={gameState.readyToCommit ? '#22c55e' : '#fbbf24'}
                  stroke="#fff"
                  strokeWidth="2"
                  className={gameState.readyToCommit ? 'transition-colors duration-300' : ''}
                />
              </g>

              {/* Center display */}
              <text
                x="200"
                y="210"
                textAnchor="middle"
                fontSize="24"
                fill="#e2e8f0"
                fontWeight="bold"
              >
                {gameState.currentTick}
              </text>

              {/* Ready indicator */}
              {gameState.readyToCommit && (
                <text
                  x="200"
                  y="240"
                  textAnchor="middle"
                  fontSize="14"
                  fill="#22c55e"
                  fontWeight="bold"
                >
                  READY
                </text>
              )}
            </svg>

            {/* Overlays */}
            {gameState.state === 'UNLOCK' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <div className="px-4 py-3 rounded-xl border border-green-700 bg-slate-900/90 text-center">
                  <div className="text-xs uppercase tracking-wide text-green-400">Success</div>
                  <div className="mt-1 text-lg font-semibold text-green-300">Safe Unlocked!</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Combo: {gameState.combo.n1} → {gameState.combo.n2} → {gameState.combo.n3}
                  </div>
                  <button
                    onClick={resetGame}
                    className="mt-3 px-4 py-2 bg-green-500 text-slate-900 rounded-lg font-semibold text-sm active:bg-green-400"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}

            {gameState.state === 'FAIL' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <div className="px-4 py-3 rounded-xl border border-red-700 bg-slate-900/90 text-center">
                  <div className="text-xs uppercase tracking-wide text-red-400">Failed</div>
                  <div className="mt-1 text-lg font-semibold text-red-300">Lock Jammed</div>
                  <div className="mt-2 text-xs text-slate-400">
                    Too many strikes: {gameState.strikes}/{MAX_STRIKES}
                  </div>
                  <button
                    onClick={resetGame}
                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm active:bg-red-400"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - hidden on mobile */}
        <aside className="hidden sm:flex w-32 flex-col gap-3 text-xs">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Instructions</div>
            <div className="space-y-1 text-[11px]">
              <div>Step {gameState.step}: Rotate {requiredDirection === 'R' ? '→ CW' : '← CCW'}</div>
              <div className="text-slate-400">Must cross 0</div>
              <div className="text-slate-400">Hold steady</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Status</div>
            <div className="space-y-1 text-[11px]">
              <div>0-cross: {gameState.crossedZero ? '✓' : '✗'}</div>
              <div>Speed: {Math.abs(gameState.angularVelocity).toFixed(1)}°/s</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Controls</div>
            <div>← / → — nudge dial</div>
            <div>Drag — spin dial</div>
            <div>Space/Enter — commit</div>
            <div>Esc — exit</div>
          </div>
        </aside>

        {/* Mobile touch controls */}
        <div className="sm:hidden flex flex-col gap-2">
          {/* Status row */}
          <div className="flex items-center justify-between gap-2 px-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Step {gameState.step}: {requiredDirection === 'R' ? '→ CW' : '← CCW'}
              </span>
              <span className={gameState.crossedZero ? 'text-green-400' : 'text-slate-500'}>
                0-cross: {gameState.crossedZero ? '✓' : '✗'}
              </span>
            </div>
            <button
              onClick={onExit}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs active:bg-slate-700"
            >
              Exit
            </button>
          </div>

          {/* Touch control buttons */}
          <div className="flex justify-center items-center gap-4 px-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); nudgeLeft(); }}
              onClick={nudgeLeft}
              className="w-20 h-20 rounded-xl bg-slate-800/90 border-2 border-slate-700 flex items-center justify-center text-3xl active:bg-slate-700 active:scale-95 transition-all select-none shadow-lg touch-manipulation"
            >
              ◀
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleCommit(); }}
              onClick={handleCommit}
              className={`w-24 h-20 rounded-xl border-2 flex items-center justify-center text-base font-bold select-none shadow-lg active:scale-95 transition-all touch-manipulation ${
                gameState.readyToCommit
                  ? 'bg-green-600/90 border-green-500 text-white active:bg-green-500 animate-pulse'
                  : 'bg-amber-600/90 border-amber-500 text-slate-900 active:bg-amber-500'
              }`}
            >
              {gameState.readyToCommit ? 'COMMIT' : 'TRY'}
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); nudgeRight(); }}
              onClick={nudgeRight}
              className="w-20 h-20 rounded-xl bg-slate-800/90 border-2 border-slate-700 flex items-center justify-center text-3xl active:bg-slate-700 active:scale-95 transition-all select-none shadow-lg touch-manipulation"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calculate final score based on precision, tempo, and band
function calculateScore(band: Band, avgDistance: number, totalTime: number): number {
  const config = BAND_CONFIGS[band];
  const precisionScore = Math.max(0, 1 - avgDistance / config.baseTolerance);
  const timeLimit = 30; // 30 seconds ideal
  const tempoScore = Math.max(0, 1 - totalTime / timeLimit);

  const baseMultiplier = 1.1;
  const precisionBonus = 0.15 * precisionScore;
  const tempoBonus = 0.1 * tempoScore;

  return baseMultiplier + precisionBonus + tempoBonus;
}

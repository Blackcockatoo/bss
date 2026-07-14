"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

import { useStore } from "@/lib/store";
import {
  PetBodyRenderer,
  type BodySpec,
} from "@/components/body-forge/PetBodyRenderer";
import {
  clearForgedBody,
  getGenomeVisualFingerprint,
  loadForgedBody,
  resolveBodySpec,
} from "@/visual-dna/bodyForgeAdapter";
import {
  resolveVisualDNA,
  type ParticleMode,
  type VisualPhenotype,
} from "@/visual-dna";
import {
  interpretMovement,
  useMovementController,
  type CareActionId,
  type MovementBodyContext,
} from "@/pet/movement";
import { resolveBodyPerformance } from "@/pet/performance";

const ACTION_WINDOW_MS = 1_600;
/** Press shorter than this (without travel) reads as an affectionate tap. */
const TAP_MS = 340;
/** Press longer than this reads as a hold (charge/love). */
const HOLD_MS = 620;
/** Pointer travel beyond this many px reads as a swipe. */
const SWIPE_PX = 42;

function clampValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function particleAnimation(
  mode: ParticleMode,
  x: number,
  y: number,
  index: number,
) {
  const delay = index * 0.08;
  switch (mode) {
    case "inward":
      return {
        animate: { cx: [x, 110], cy: [y, 105], opacity: [0, 0.8, 0] },
        transition: {
          duration: 1.6,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut" as const,
        },
      };
    case "rise":
      return {
        animate: {
          cy: [y + 8, y - 30],
          opacity: [0, 0.72, 0],
          scale: [0.6, 1, 0.7],
        },
        transition: {
          duration: 2.4,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeOut" as const,
        },
      };
    case "fall":
    case "dust":
      return {
        animate: {
          cy: [y - 10, y + 25],
          opacity: [0, 0.55, 0],
          x: [0, index % 2 === 0 ? 8 : -8],
        },
        transition: {
          duration: 2.8,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear" as const,
        },
      };
    case "static":
      return {
        animate: {
          x: [0, 3, -4, 1, 0],
          y: [0, -2, 3, -1, 0],
          opacity: [0.2, 0.8, 0.35],
        },
        transition: {
          duration: 0.7 + (index % 3) * 0.15,
          delay,
          repeat: Number.POSITIVE_INFINITY,
        },
      };
    case "spark":
      return {
        animate: { scale: [0.3, 1.4, 0.3], opacity: [0.15, 0.9, 0.15] },
        transition: {
          duration: 1.2 + (index % 4) * 0.25,
          delay,
          repeat: Number.POSITIVE_INFINITY,
        },
      };
    case "orbit":
      return {
        animate: { opacity: [0.25, 0.8, 0.25], scale: [0.8, 1.2, 0.8] },
        transition: {
          duration: 2 + (index % 5) * 0.3,
          delay,
          repeat: Number.POSITIVE_INFINITY,
        },
      };
    default:
      return { animate: {}, transition: { duration: 0 } };
  }
}

export function VisualDNAPet({
  className = "",
  showReadout = true,
}: {
  className?: string;
  showReadout?: boolean;
}) {
  const genome = useStore((state) => state.genome);
  const traits = useStore((state) => state.traits);
  const vitals = useStore((state) => state.vitals);
  const evolution = useStore((state) => state.evolution);
  const lastAction = useStore((state) => state.lastAction);
  const lastActionAt = useStore((state) => state.lastActionAt);
  const systemState = useStore((state) => state.systemState);
  const essence = useStore((state) => state.essence);
  const vimanaNodes = useStore((state) => state.vimana?.nodes);
  const reducedMotion = useReducedMotion();
  const sealed = systemState === "sealed";
  // Tracks which action timestamp has aged past the reaction window. Keeps
  // render pure (no Date.now during render): while an action is fresh the
  // memo is fed now=lastActionAt (full reaction), after the timer fires it is
  // fed a time past the window (pose settled).
  const [settledActionAt, setSettledActionAt] = useState<number | null>(null);
  const [forgedBody, setForgedBody] = useState<BodySpec | null>(null);
  const rawId = useId();
  const id = sanitizeId(rawId);

  useEffect(() => {
    const sync = () => setForgedBody(loadForgedBody());
    // Deferred so the initial load happens outside the effect body.
    const initialLoad = window.setTimeout(sync, 0);
    window.addEventListener("bss:body-forge:updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("bss:body-forge:updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!lastAction || !lastActionAt) return;
    const remaining = ACTION_WINDOW_MS - (Date.now() - lastActionAt);
    const timeout = window.setTimeout(
      () => setSettledActionAt(lastActionAt),
      Math.max(0, remaining + 20),
    );
    return () => window.clearTimeout(timeout);
  }, [lastAction, lastActionAt]);

  const actionSettled = !lastActionAt || settledActionAt === lastActionAt;

  const phenotype = useMemo(() => {
    if (!traits) return null;
    return resolveVisualDNA({
      traits,
      vitals,
      evolution,
      lastAction,
      lastActionAt,
      now: actionSettled ? lastActionAt + ACTION_WINDOW_MS : lastActionAt,
      reducedMotion: Boolean(reducedMotion),
    });
  }, [
    actionSettled,
    evolution,
    lastAction,
    lastActionAt,
    reducedMotion,
    traits,
    vitals,
  ]);

  const resolvedBody = useMemo(
    () => (phenotype ? resolveBodySpec(phenotype, genome, forgedBody) : null),
    [forgedBody, genome, phenotype],
  );

  // The Forge owns the inherited field material; evolution/Vimana still own
  // topology and live behaviour. Blending here keeps both systems visible
  // instead of allowing either renderer to replace the other.
  const runtimeAura = useMemo(() => {
    if (!phenotype) return null;
    if (!forgedBody) return phenotype.aura;
    return {
      ...phenotype.aura,
      colors: [
        forgedBody.auraColor,
        forgedBody.auraSecondary,
        phenotype.aura.colors[2],
        phenotype.aura.colors[3],
      ] as const,
      radius: Math.max(
        30,
        Math.min(
          100,
          phenotype.aura.radius * 0.58 + forgedBody.auraRadius * 0.42,
        ),
      ),
      nodes: Math.max(
        3,
        Math.min(
          48,
          Math.round(
            phenotype.aura.nodes * 0.6 + forgedBody.auraDensity * 0.16,
          ),
        ),
      ),
      turbulence: Math.max(
        0,
        Math.min(
          1,
          phenotype.aura.turbulence * 0.65 + forgedBody.auraTurbulence / 285,
        ),
      ),
      rotationSeconds:
        forgedBody.auraMotion === "orbit"
          ? Math.max(2, 10 - forgedBody.auraSpeed / 13)
          : phenotype.aura.rotationSeconds,
    };
  }, [forgedBody, phenotype]);

  const fingerprint = useMemo(
    () => getGenomeVisualFingerprint(genome, phenotype?.identity.seed ?? 0),
    [genome, phenotype?.identity.seed],
  );

  // ── Living-body performance layer ─────────────────────────────────────
  const anomalyActive = useMemo(
    () =>
      (vimanaNodes ?? []).some(
        (node) => node.anomaly !== null && node.anomaly.state === "active",
      ),
    [vimanaNodes],
  );

  const living = useMemo(
    () =>
      resolveBodyPerformance({
        vitals,
        personality: traits?.personality ?? null,
        essence,
        anomalyActive,
        reducedMotion: Boolean(reducedMotion),
      }),
    [vitals, traits, essence, anomalyActive, reducedMotion],
  );

  const movement = useMovementController({
    mood: vitals.mood,
    energy: vitals.energy,
    curiosity: traits?.personality.curiosity ?? 50,
    hunger: vitals.hunger,
    isSick: vitals.isSick,
    evolutionState: evolution.state,
    identityKey: fingerprint,
    reduceMotion: Boolean(reducedMotion),
    paused: sealed,
  });

  // Dev-only: surface the active Moss60 clip for the diagnostics readout.
  const activeClipId = movement.active.clip.id;
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    window.dispatchEvent(
      new CustomEvent("bss:moss60:active-clip", { detail: activeClipId }),
    );
  }, [activeClipId]);

  // Care actions choreograph movement sequences. Keyed on lastActionAt so
  // repeating the same action (feed, feed) still reacts each time.
  const { playAction, onAnomaly } = movement;
  useEffect(() => {
    if (sealed || !lastAction || !lastActionAt) return;
    if (Date.now() - lastActionAt > ACTION_WINDOW_MS) return;
    playAction(lastAction as CareActionId);
  }, [sealed, lastAction, lastActionAt, playAction]);

  // A newly surfaced Vimana anomaly earns an omen-class reaction.
  const anomalyRef = useRef(anomalyActive);
  useEffect(() => {
    if (sealed) return;
    if (anomalyActive && !anomalyRef.current) onAnomaly();
    anomalyRef.current = anomalyActive;
  }, [sealed, anomalyActive, onAnomaly]);

  // ── Direct interaction: gaze-follow + affectionate touch ─────────────
  const stageRef = useRef<HTMLDivElement>(null);
  // Quantised so pointer movement only re-renders on visible gaze change.
  const [pointerGaze, setPointerGaze] = useState({ x: 0, y: 0 });
  const pressRef = useRef<{
    x: number;
    y: number;
    at: number;
    holdTimer: number;
    held: boolean;
  } | null>(null);

  const updateGaze = useCallback(
    (clientX: number, clientY: number) => {
      if (sealed) return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const quantise = (value: number) => Math.round(value * 40) / 40;
      const next = {
        x: quantise(
          clampValue(
            (clientX - (rect.left + rect.width / 2)) / (rect.width / 2),
            -1,
            1,
          ),
        ),
        y: quantise(
          clampValue(
            (clientY - (rect.top + rect.height / 2)) / (rect.height / 2),
            -1,
            1,
          ),
        ),
      };
      setPointerGaze((current) =>
        current.x === next.x && current.y === next.y ? current : next,
      );
    },
    [sealed],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      updateGaze(event.clientX, event.clientY);
      const press = pressRef.current;
      if (press && !press.held) {
        const travel = Math.hypot(
          event.clientX - press.x,
          event.clientY - press.y,
        );
        if (travel > SWIPE_PX) {
          window.clearTimeout(press.holdTimer);
          pressRef.current = null;
          if (!sealed) movement.onGesture("swipe");
        }
      }
    },
    [movement, sealed, updateGaze],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (sealed) return;
      updateGaze(event.clientX, event.clientY);
      const holdTimer = window.setTimeout(() => {
        if (pressRef.current) {
          pressRef.current.held = true;
          movement.onGesture("hold");
        }
      }, HOLD_MS);
      pressRef.current = {
        x: event.clientX,
        y: event.clientY,
        at: Date.now(),
        holdTimer,
        held: false,
      };
    },
    [movement, sealed, updateGaze],
  );

  const handlePointerUp = useCallback(() => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press) return;
    window.clearTimeout(press.holdTimer);
    if (sealed) return;
    const heldFor = Date.now() - press.at;
    if (press.held) {
      // Long affectionate press settles into the love response.
      movement.onAffection();
    } else if (heldFor <= TAP_MS) {
      movement.onGesture("tap");
    }
  }, [movement, sealed]);

  const handlePointerLeave = useCallback(() => {
    setPointerGaze((current) =>
      current.x === 0 && current.y === 0 ? current : { x: 0, y: 0 },
    );
    const press = pressRef.current;
    if (press) {
      window.clearTimeout(press.holdTimer);
      pressRef.current = null;
    }
  }, []);

  const bodyContext = useMemo<MovementBodyContext | null>(() => {
    if (!resolvedBody) return null;
    return {
      hasWings: resolvedBody.features.includes("wings"),
      wingStyle: resolvedBody.wingStyle,
      wingPurpose: resolvedBody.wingPurpose,
      hasThirdEye: resolvedBody.features.includes("thirdEye"),
      hasTailFlame: resolvedBody.features.includes("tailFlame"),
      hasHorns: resolvedBody.features.includes("horns"),
      hasCrown: resolvedBody.features.includes("crown"),
    };
  }, [resolvedBody]);

  // One movement frame per render. `movement.progress` advances every
  // animation frame, so this stays live without extra timers. The state
  // layer (applyLivePhenotype) already baked slow eyelid/pupil values into
  // the spec, so the frame's lid/pupil channels are made relative to the
  // living baseline to avoid double application.
  const performanceFrame = useMemo(() => {
    if (!bodyContext || sealed) return null;
    const raw = interpretMovement(movement.active.clip.id, movement.progress, {
      body: bodyContext,
      performance: living,
      intensity: movement.active.clip.intensity,
      reducedMotion: Boolean(reducedMotion),
      seed: movement.seed,
    });
    const gaze = pointerGaze;
    return {
      ...raw,
      eyelidOpen: clampValue(
        raw.eyelidOpen / Math.max(0.08, living.eyelidOpen),
        0.04,
        1.15,
      ),
      pupilScale: clampValue(
        raw.pupilScale / Math.max(0.5, living.pupilDilation),
        0.5,
        1.6,
      ),
      gazeX: clampValue(raw.gazeX + gaze.x * living.gazeTracking, -1, 1),
      gazeY: clampValue(
        raw.gazeY + gaze.y * living.gazeTracking * 0.7,
        -1,
        1,
      ),
    };
  }, [
    bodyContext,
    living,
    movement.active.clip.id,
    movement.active.clip.intensity,
    movement.progress,
    movement.seed,
    pointerGaze,
    reducedMotion,
    sealed,
  ]);

  const particles = useMemo(() => {
    if (!phenotype || !runtimeAura) return [];
    const count = phenotype.particles.count;
    return Array.from({ length: count }, (_, index) => {
      const fraction = index / Math.max(1, count);
      const angle =
        ((phenotype.identity.seed % 360) +
          fraction * 360 +
          runtimeAura.phaseOffset) *
        (Math.PI / 180);
      const jitter =
        (((phenotype.identity.seed * (index + 3) * 2_654_435_761) >>> 0) %
          1_000) /
        1_000;
      const radius = runtimeAura.radius * (0.72 + jitter * 0.34);
      return {
        x: 110 + Math.cos(angle) * radius,
        y:
          105 +
          Math.sin(angle) * radius * (0.72 + runtimeAura.asymmetry * 0.15),
      };
    });
  }, [phenotype, runtimeAura]);

  const glowId = `visual-dna-glow-${id}`;
  const auraGradientId = `visual-dna-aura-${id}`;

  // The aura and particle layers only change when state changes, not per
  // movement frame. Memoising them as elements lets React bail out of these
  // subtrees during the ~30fps movement re-renders, which keeps the living
  // body affordable on mobile.
  const auraLayer = useMemo(() => {
    if (!phenotype || !runtimeAura) return null;
    const aura = runtimeAura;
    const pulse =
      aura.pulseSeconds > 0
        ? {
            scale: [0.97, 1.03, 0.97],
            opacity: [aura.opacity * 0.72, aura.opacity, aura.opacity * 0.72],
          }
        : { scale: 1, opacity: aura.opacity };
    const pulseTransition =
      aura.pulseSeconds > 0
        ? {
            duration: aura.pulseSeconds,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut" as const,
          }
        : { duration: 0 };
    return (
      <>
        <motion.circle
          cx="110"
          cy="105"
          r={aura.radius + 28}
          fill={`url(#${auraGradientId})`}
          animate={pulse}
          transition={pulseTransition}
        />

        <motion.g
          style={{ transformOrigin: "110px 105px" }}
          animate={aura.rotationSeconds > 0 ? { rotate: [0, 360] } : undefined}
          transition={
            aura.rotationSeconds > 0
              ? {
                  duration: aura.rotationSeconds,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
              : undefined
          }
          filter={`url(#${glowId})`}
        >
          {Array.from({ length: aura.rings }, (_, index) => {
            const radius = Math.max(30, aura.radius - index * 10);
            const stroke = aura.colors[index % aura.colors.length];
            const dash =
              aura.topology === "halo"
                ? undefined
                : `${5 + index * 2} ${7 + index * 3}`;
            if (
              aura.topology === "neural-lattice" ||
              aura.topology === "phase-torus"
            ) {
              return (
                <motion.ellipse
                  key={index}
                  cx="110"
                  cy="105"
                  rx={radius}
                  ry={
                    radius *
                    (aura.topology === "phase-torus"
                      ? 0.38 + index * 0.08
                      : 0.68)
                  }
                  fill="none"
                  stroke={stroke}
                  strokeWidth={aura.thickness}
                  strokeDasharray={dash}
                  opacity={aura.opacity}
                  transform={`rotate(${aura.phaseOffset + index * (aura.topology === "phase-torus" ? 48 : 72)} 110 105)`}
                  animate={
                    aura.turbulence > 0.05
                      ? {
                          pathLength: [0.72, 1, 0.72],
                          opacity: [
                            aura.opacity * 0.55,
                            aura.opacity,
                            aura.opacity * 0.55,
                          ],
                        }
                      : undefined
                  }
                  transition={{
                    duration: 2 + index * 0.35,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              );
            }
            return (
              <motion.circle
                key={index}
                cx="110"
                cy="105"
                r={radius}
                fill="none"
                stroke={stroke}
                strokeWidth={aura.thickness}
                strokeDasharray={
                  aura.topology === "speciation-crown"
                    ? `${3 + index} ${8 - Math.min(index, 4)}`
                    : dash
                }
                opacity={aura.opacity}
              />
            );
          })}

          {Array.from({ length: aura.nodes }, (_, index) => {
            const angle =
              ((index / aura.nodes) * 360 + aura.phaseOffset) *
              (Math.PI / 180);
            const radius = aura.radius - (index % Math.max(1, aura.rings)) * 7;
            return (
              <motion.circle
                key={`node-${index}`}
                cx={110 + Math.cos(angle) * radius}
                cy={
                  105 +
                  Math.sin(angle) * radius * (0.72 + aura.asymmetry * 0.12)
                }
                r={1.4 + phenotype.evolution.complexity * 1.2}
                fill={aura.colors[(index + 1) % aura.colors.length]}
                opacity={aura.opacity + 0.12}
                animate={
                  reducedMotion
                    ? undefined
                    : { scale: [0.7, 1.35, 0.7], opacity: [0.3, 0.9, 0.3] }
                }
                transition={{
                  duration: 1.4 + (index % 5) * 0.22,
                  delay: index * 0.035,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            );
          })}
        </motion.g>
      </>
    );
  }, [phenotype, runtimeAura, reducedMotion, auraGradientId, glowId]);

  const particleLayer = useMemo(() => {
    if (!phenotype || !runtimeAura) return null;
    const aura = runtimeAura;
    return (
      <>
        {particles.map((particle, index) => {
          const animation = particleAnimation(
            phenotype.particles.mode,
            particle.x,
            particle.y,
            index,
          );
          return (
            <motion.circle
              key={`particle-${index}`}
              cx={particle.x}
              cy={particle.y}
              r={phenotype.particles.size * (0.7 + (index % 4) * 0.12)}
              fill={aura.colors[index % aura.colors.length]}
              opacity={phenotype.particles.opacity}
              animate={animation.animate}
              transition={animation.transition}
            />
          );
        })}
      </>
    );
  }, [particles, phenotype, runtimeAura]);

  if (!phenotype) {
    return (
      <div
        className={`flex min-h-72 items-center justify-center rounded-3xl border border-cyan-900/50 bg-slate-950/70 ${className}`}
      >
        <motion.svg
          viewBox="0 0 80 80"
          className="h-20 w-20"
          role="img"
          aria-label="Genome forming"
          animate={
            reducedMotion
              ? undefined
              : { scale: [1, 1.06, 1], rotate: [0, 5, -5, 0] }
          }
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
        >
          {/* A forming seed-orb: the pre-genome state, no emoji. */}
          <circle
            cx="40"
            cy="40"
            r="22"
            fill="none"
            stroke="#42dfff"
            strokeWidth="1.6"
            strokeDasharray="5 7"
            opacity="0.8"
          />
          <circle
            cx="40"
            cy="40"
            r="13"
            fill="none"
            stroke="#9c5cff"
            strokeWidth="1.4"
            strokeDasharray="3 5"
            opacity="0.75"
          />
          <circle cx="40" cy="40" r="5" fill="#f5c451" opacity="0.85" />
        </motion.svg>
      </div>
    );
  }

  const aura = runtimeAura ?? phenotype.aura;

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[radial-gradient(circle_at_center,_rgba(8,47,73,0.42),_rgba(2,6,23,0.96)_72%)] p-4 ${className}`}
    >
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        {/* touch-action pan-y keeps page scrolling alive on mobile while
            taps, holds and horizontal swipes reach the pet. */}
        <div
          ref={stageRef}
          className="relative min-h-[360px] select-none"
          style={{ touchAction: "pan-y" }}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerLeave}
          onPointerLeave={handlePointerLeave}
        >
          <motion.svg
            viewBox="0 0 220 220"
            className="absolute inset-0 h-full w-full overflow-visible"
            role="img"
            aria-label={`${phenotype.evolution.state} visual DNA pet, ${phenotype.behavior.label}`}
          >
            <defs>
              <radialGradient id={auraGradientId} cx="50%" cy="50%" r="55%">
                <stop
                  offset="0%"
                  stopColor={aura.colors[3]}
                  stopOpacity="0.76"
                />
                <stop
                  offset="45%"
                  stopColor={aura.colors[2]}
                  stopOpacity="0.42"
                />
                <stop
                  offset="100%"
                  stopColor={aura.colors[0]}
                  stopOpacity="0"
                />
              </radialGradient>
              <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation={aura.blur / 4} result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* The movement layer adds transient scale/rotation accents on
                top of the aura's own slow behaviour (clip-driven pulses,
                orbit sweeps). At idle this is the identity transform. */}
            <g
              transform={
                performanceFrame
                  ? `translate(110 105) rotate(${performanceFrame.auraRotation * 0.25}) scale(${performanceFrame.auraScale}) translate(-110 -105)`
                  : undefined
              }
            >
            {auraLayer}
            </g>

            {particleLayer}

            {resolvedBody && (
              <motion.g
                transform="translate(40 42) scale(.5)"
                opacity={phenotype.body.opacity}
                animate={
                  !reducedMotion && phenotype.body.shiver > 0
                    ? {
                        x: [
                          0,
                          phenotype.body.shiver,
                          -phenotype.body.shiver,
                          0,
                        ],
                      }
                    : undefined
                }
                transition={{
                  duration: 0.42,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <PetBodyRenderer
                  spec={resolvedBody}
                  animate={!reducedMotion}
                  className="overflow-visible"
                  performance={performanceFrame}
                  living={sealed ? null : living}
                  activeClipId={sealed ? null : movement.active.clip.id}
                />
              </motion.g>
            )}
          </motion.svg>
        </div>

        {showReadout && (
          <aside className="rounded-2xl border border-slate-800 bg-slate-950/72 p-4 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                Visual DNA live readout
              </p>
              {forgedBody && (
                <button
                  type="button"
                  onClick={() => {
                    clearForgedBody();
                    setForgedBody(null);
                  }}
                  className="rounded-full border border-amber-500/40 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-200"
                >
                  Use pure DNA body
                </button>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">
              {phenotype.behavior.state.replace("-", " ")}
            </h2>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              {phenotype.behavior.label}
            </p>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt>Body source</dt>
                <dd className={forgedBody ? "text-amber-200" : "text-cyan-200"}>
                  {forgedBody ? "Forge + live DNA" : "180-digit DNA"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Visual genome</dt>
                <dd
                  className="max-w-[130px] truncate font-mono text-[10px] text-cyan-200"
                  title={fingerprint}
                >
                  {fingerprint}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Evolution</dt>
                <dd className="text-cyan-200">{phenotype.evolution.state}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Aura</dt>
                <dd className="text-cyan-200">{aura.topology}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Rings / nodes</dt>
                <dd>
                  {aura.rings} / {aura.nodes}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Urgency</dt>
                <dd>{Math.round(phenotype.behavior.urgency * 100)}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Field pull</dt>
                <dd>{Math.round(aura.inwardPull * 100)}%</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Turbulence</dt>
                <dd>{Math.round(aura.turbulence * 100)}%</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>
    </section>
  );
}

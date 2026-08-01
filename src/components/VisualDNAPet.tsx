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
  type EvolutionMark,
} from "@/components/body-forge/PetBodyRenderer";
import { getCumulativeEvolutionUpgrade } from "@/evolution/stageUpgrades";
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
import { useTouchNervousSystem } from "@/pet/interaction";
import { BodyForgeAddonLayer } from "@/components/addons/BodyForgeAddonOverlay";
import { useAddonStore } from "@/lib/addons/store";
import { useWardrobeStore } from "@/lib/addons/wardrobeStore";
import { getDisplayEquippedAddons } from "@/lib/addons/displayEquipped";
import {
  WardrobeCosmeticLayer,
  resolveBodyForgeCosmeticAnchor,
} from "@/components/wardrobe/WardrobeCosmeticLayer";
import {
  getEquippedWardrobeItems,
  useWardrobeProgressionStore,
} from "@/lib/wardrobe/store";

const ACTION_WINDOW_MS = 1_600;

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

  // Before a genome exists the forged body still IS the creature: it renders
  // as-forged (with the living movement layer) instead of hiding behind the
  // forming-orb placeholder. Live phenotype deformation joins once traits do.
  const resolvedBody = useMemo(
    () =>
      phenotype ? resolveBodySpec(phenotype, genome, forgedBody) : forgedBody,
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

  // Reaching a stage must be something you SEE on the creature, not just a
  // panel overlay: the body performs the ceremony and then the emergence
  // beat that shows off whatever anatomy the stage just granted. Keyed on
  // the stage itself, and skipped on first mount so loading an already
  // evolved save does not replay a ceremony the player already had.
  const { playCeremony } = movement;
  const knownStageRef = useRef<string | null>(null);
  useEffect(() => {
    const previous = knownStageRef.current;
    knownStageRef.current = evolution.state;
    if (sealed || previous === null || previous === evolution.state) return;
    playCeremony();
  }, [sealed, evolution.state, playCeremony]);

  // A newly surfaced Vimana anomaly earns an omen-class reaction.
  const anomalyRef = useRef(anomalyActive);
  useEffect(() => {
    if (sealed) return;
    if (anomalyActive && !anomalyRef.current) onAnomaly();
    anomalyRef.current = anomalyActive;
  }, [sealed, anomalyActive, onAnomaly]);

  // ── Direct interaction: the touch-native nervous system ──────────────
  // Coordinates eyes/gaze → head → eyelids/brows → mouth → body lean → aura
  // as one reusable controller (mouse, touch and pen via Pointer Events).
  // See src/pet/interaction for the state machine and priority docs.
  const stageRef = useRef<HTMLDivElement>(null);
  const interaction = useTouchNervousSystem({
    stageRef,
    sealed,
    reducedMotion: Boolean(reducedMotion),
    trust: living.trust,
    stress: living.stress,
    activeClipPriority: movement.active.clip.priority,
    onGesture: (gesture) => movement.onGesture(gesture),
    onAffection: () => movement.onAffection(),
  });
  const livingWithTouch = useMemo(
    () => interaction.applyOverlay(living),
    [interaction, living],
  );

  // The stage sigil etched on the body. It uses the stage's own aura colours
  // rather than the genome's, so every reached stage is legible at a glance
  // even on a creature whose body colours are close to its aura.
  const evolutionMark = useMemo<EvolutionMark | null>(() => {
    if (!phenotype) return null;
    const upgrade = getCumulativeEvolutionUpgrade(phenotype.evolution.state);
    return {
      shape: upgrade.mark,
      count: upgrade.markCount,
      intensity: upgrade.markIntensity,
      color: phenotype.evolution.stageColors[0],
      accentColor: phenotype.evolution.stageColors[2],
    };
  }, [phenotype]);

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

  // ── Living Wardrobe: equipped + previewing add-ons on this body ──────
  // Extends the wardrobe to the Evolved/Body Forge form (previously
  // Auralia-only). The addon layer renders inside PetBodyRenderer's own
  // SVG (see addonsBehind/addonsFront), so it shares that coordinate space
  // exactly — Arrange Mode drag math measures `bodyStageRef` (the real
  // rendered stage) instead of any global DOM lookup.
  const bodyStageRef = useRef<SVGSVGElement>(null);
  const {
    getEquippedAddons: getEquippedAddonsRaw,
    positionOverrides,
    setAddonPosition,
    lockAddonPosition,
    resetAddonPosition,
  } = useAddonStore();
  const wardrobePreviewAddon = useWardrobeStore((s) =>
    s.previewForm === "evolved" ? s.previewAddon : null,
  );
  const wardrobeArrangeMode = useWardrobeStore((s) => s.arrangeMode);
  const displayAddons = useMemo(
    () => getDisplayEquippedAddons(getEquippedAddonsRaw(), wardrobePreviewAddon),
    [getEquippedAddonsRaw, wardrobePreviewAddon],
  );

  // Decorative addon float/rotate/pulse effects read a monotonic ms clock
  // (matching Auralia's `addonAnimationPhase`). Committed at ~10fps — far
  // below the movement/interaction commit rate — since it only feeds slow,
  // multi-second particle cycles, never a per-frame re-render cost driver.
  const [addonClockMs, setAddonClockMs] = useState(0);
  useEffect(() => {
    if (displayAddons.length === 0 || sealed || typeof window === "undefined") return;
    let raf = 0;
    let lastCommit = 0;
    const start = window.performance.now();
    const tick = () => {
      const now = window.performance.now();
      if (now - lastCommit >= 100) {
        lastCommit = now;
        setAddonClockMs(now - start);
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [displayAddons.length, sealed]);

  // Equipped gameplay cosmetics (wardrobe progression rewards) render on
  // the same stage as the verified add-ons, on their own layers.
  const wardrobeInventory = useWardrobeProgressionStore((s) => s.inventory);
  const equippedCosmetics = useMemo(
    () => getEquippedWardrobeItems(wardrobeInventory),
    [wardrobeInventory],
  );

  const addonLayers = useMemo(() => {
    if (!resolvedBody) return null;
    if (displayAddons.length === 0 && equippedCosmetics.length === 0) return null;
    const shared = {
      addons: displayAddons,
      spec: resolvedBody,
      animationPhase: addonClockMs,
      reduceMotion: Boolean(reducedMotion),
      arrangeMode: wardrobeArrangeMode,
      stageRef: bodyStageRef,
      positionOverrides,
      onPositionChange: setAddonPosition,
      onToggleLock: lockAddonPosition,
      onResetPosition: resetAddonPosition,
    };
    const cosmeticShared = {
      items: equippedCosmetics,
      resolveAnchor: (anchor: Parameters<typeof resolveBodyForgeCosmeticAnchor>[1]) =>
        resolveBodyForgeCosmeticAnchor(resolvedBody, anchor),
      reduceMotion: Boolean(reducedMotion),
      bodyRadius: Math.max(resolvedBody.bodyWidth, resolvedBody.bodyHeight) / 2,
    };
    return {
      behind: (
        <>
          <WardrobeCosmeticLayer {...cosmeticShared} layer="behind" />
          {displayAddons.length > 0 && (
            <BodyForgeAddonLayer {...shared} layer="behind-body" />
          )}
        </>
      ),
      front: (
        <>
          <WardrobeCosmeticLayer {...cosmeticShared} layer="front" />
          {displayAddons.length > 0 && <BodyForgeAddonLayer {...shared} layer="front" />}
        </>
      ),
    };
  }, [
    resolvedBody,
    displayAddons,
    equippedCosmetics,
    addonClockMs,
    reducedMotion,
    wardrobeArrangeMode,
    positionOverrides,
    setAddonPosition,
    lockAddonPosition,
    resetAddonPosition,
  ]);

  // One movement frame per render. `movement.progress` advances every
  // animation frame, so this stays live without extra timers. The state
  // layer (applyLivePhenotype) already baked slow eyelid/pupil values into
  // the spec, so the frame's lid/pupil channels are made relative to the
  // living baseline to avoid double application.
  const performanceFrame = useMemo(() => {
    if (!bodyContext || sealed) return null;
    const raw = interpretMovement(movement.active.clip.id, movement.progress, {
      body: bodyContext,
      performance: livingWithTouch,
      intensity: movement.active.clip.intensity,
      reducedMotion: Boolean(reducedMotion),
      seed: movement.seed,
    });
    const gaze = interaction.gaze;
    return {
      ...raw,
      eyelidOpen: clampValue(
        raw.eyelidOpen / Math.max(0.08, livingWithTouch.eyelidOpen),
        0.04,
        1.15,
      ),
      pupilScale: clampValue(
        raw.pupilScale / Math.max(0.5, livingWithTouch.pupilDilation),
        0.5,
        1.6,
      ),
      gazeX: clampValue(
        raw.gazeX + gaze.x * livingWithTouch.gazeTracking,
        -1,
        1,
      ),
      gazeY: clampValue(
        raw.gazeY + gaze.y * livingWithTouch.gazeTracking * 0.7,
        -1,
        1,
      ),
    };
  }, [
    bodyContext,
    livingWithTouch,
    interaction.gaze,
    movement.active.clip.id,
    movement.active.clip.intensity,
    movement.progress,
    movement.seed,
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

  if (!phenotype && resolvedBody) {
    // Forged body, no genome yet: the inherited creature performs the Moss60
    // living layer on its own forge aura until a genome adds live phenotype.
    return (
      <section
        data-testid="forged-body-pregenome-stage"
        className={`relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-[radial-gradient(circle_at_center,_rgba(8,47,73,0.42),_rgba(2,6,23,0.96)_72%)] p-4 ${className}`}
      >
        <div
          ref={stageRef}
          className="relative min-h-[360px] select-none"
          style={interaction.stageStyle}
          data-interaction-state={interaction.state}
          {...interaction.pointerHandlers}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <PetBodyRenderer
              ref={bodyStageRef}
              spec={resolvedBody}
              animate={!reducedMotion}
              className="h-auto w-full max-w-xl overflow-visible"
              showForgeAura
              performance={performanceFrame}
              living={sealed ? null : livingWithTouch}
              activeClipId={sealed ? null : movement.active.clip.id}
              evolutionMark={evolutionMark}
              addonsBehind={addonLayers?.behind}
              addonsFront={addonLayers?.front}
            />
          </div>
        </div>
        {showReadout && (
          <p className="mt-2 text-center text-xs text-zinc-400">
            Inherited Body Forge creature · no DNA imprint yet — visit the DNA
            route to add live phenotype
          </p>
        )}
      </section>
    );
  }

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
          style={interaction.stageStyle}
          data-interaction-state={interaction.state}
          {...interaction.pointerHandlers}
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
                  ref={bodyStageRef}
                  spec={resolvedBody}
                  animate={!reducedMotion}
                  className="overflow-visible"
                  performance={performanceFrame}
                  living={sealed ? null : livingWithTouch}
                  activeClipId={sealed ? null : movement.active.clip.id}
                  evolutionMark={evolutionMark}
                  addonsBehind={addonLayers?.behind}
                  addonsFront={addonLayers?.front}
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

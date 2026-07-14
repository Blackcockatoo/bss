"use client";

/**
 * MovementParade — a development-only QA harness that plays the complete
 * Moss60 movement vocabulary, clip by clip, against representative forged
 * bodies. It lives inside the existing dev visual-evaluation tooling; it is
 * NOT another pet page and holds no pet state of its own. In production
 * builds it renders nothing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_BODY_SPEC,
  PetBodyRenderer,
  type BodySpec,
} from "@/components/body-forge/PetBodyRenderer";
import {
  MOVEMENT_CLIPS,
  MovementPriority,
  interpretMovement,
  type MovementBodyContext,
  type MovementClip,
} from "@/pet/movement";
import { resolveBodyPerformance } from "@/pet/performance";
import { DEFAULT_VITALS } from "@/vitals";

/** Clips whose primary channel needs wings; shown with a fallback badge on wingless bodies. */
const WING_DEPENDENT_CLIPS = new Set([
  "wing_flutter",
  "black_wing_bloom",
  "folded_wing_hide",
]);
/** Clips that read best with a third eye. */
const THIRD_EYE_CLIPS = new Set(["oracle_blink", "omen_twitch"]);

interface ParadeBody {
  label: string;
  spec: BodySpec;
}

/**
 * Representative inherited bodies covering every wing style/purpose and the
 * no-wings fallback path. Built from the default spec — never loaded from,
 * or saved to, real pet state.
 */
export const PARADE_BODIES: ParadeBody[] = [
  {
    label: "Feather / flight",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Feather",
      wingStyle: "feather",
      wingPurpose: "flight",
    },
  },
  {
    label: "Moth / attract",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Moth",
      shape: "bell",
      wingStyle: "moth",
      wingPurpose: "attract",
      primaryColor: "#7c3aed",
      auraStyle: "sparkle",
    },
  },
  {
    label: "Blade / attack",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Blade",
      shape: "crystal",
      wingStyle: "blade",
      wingPurpose: "attack",
      primaryColor: "#0e7490",
      pattern: "chrome",
      features: ["wings", "horns", "tailFlame"],
    },
  },
  {
    label: "Veil / defend",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Veil",
      shape: "droplet",
      wingStyle: "veil",
      wingPurpose: "defend",
      pattern: "glass",
      auraStyle: "void",
    },
  },
  {
    label: "Feather / decorative",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Decorative",
      shape: "round",
      wingStyle: "feather",
      wingPurpose: "decorative",
      pattern: "pearl",
    },
  },
  {
    label: "Wingless oracle",
    spec: {
      ...DEFAULT_BODY_SPEC,
      name: "Parade Wingless",
      shape: "lantern",
      features: ["thirdEye", "crown"],
      pattern: "velvet",
      auraStyle: "5d",
    },
  },
];

const PRIORITY_LABELS: Record<number, string> = {
  [MovementPriority.IdleBreathing]: "Idle breathing",
  [MovementPriority.MoodExpression]: "Mood expression",
  [MovementPriority.Attention]: "Attention",
  [MovementPriority.TouchReaction]: "Touch reaction",
  [MovementPriority.AddonReaction]: "Add-on reaction",
  [MovementPriority.AudioBeat]: "Audio beat",
  [MovementPriority.BigEmotion]: "Big emotion",
  [MovementPriority.EvolutionCeremony]: "Evolution ceremony",
  [MovementPriority.SecretMove]: "Secret move",
};

function bodyContextFor(spec: BodySpec): MovementBodyContext {
  return {
    hasWings: spec.features.includes("wings"),
    wingStyle: spec.wingStyle,
    wingPurpose: spec.wingPurpose,
    hasThirdEye: spec.features.includes("thirdEye"),
    hasTailFlame: spec.features.includes("tailFlame"),
    hasHorns: spec.features.includes("horns"),
    hasCrown: spec.features.includes("crown"),
  };
}

export function MovementParade() {
  const clips = useMemo<MovementClip[]>(
    () => Object.values(MOVEMENT_CLIPS),
    [],
  );
  const [clipIndex, setClipIndex] = useState(0);
  const [bodyIndex, setBodyIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [previewReducedMotion, setPreviewReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playToken, setPlayToken] = useState(0);
  const startRef = useRef<number | null>(null);

  const clip = clips[clipIndex % clips.length];
  const body = PARADE_BODIES[bodyIndex % PARADE_BODIES.length];

  const living = useMemo(
    () =>
      resolveBodyPerformance({
        vitals: DEFAULT_VITALS,
        reducedMotion: previewReducedMotion,
      }),
    [previewReducedMotion],
  );

  const advance = useCallback(() => {
    setClipIndex((index) => (index + 1) % clips.length);
    setPlayToken((token) => token + 1);
  }, [clips.length]);

  // Drive clip progress with a local RAF loop; auto mode advances to the
  // next clip after a short rest so the settle is visible.
  useEffect(() => {
    startRef.current = null;
    let raf = 0;
    let advanceTimer = 0;
    const step = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / clip.duration);
      setProgress(t);
      if (t >= 1) {
        if (auto) {
          advanceTimer = window.setTimeout(advance, 650);
          return;
        }
        return;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(advanceTimer);
    };
  }, [clip, auto, advance, playToken, bodyIndex]);

  const bodyContext = useMemo(() => bodyContextFor(body.spec), [body.spec]);
  const frame = useMemo(
    () =>
      interpretMovement(clip.id, progress, {
        body: bodyContext,
        performance: living,
        intensity: clip.intensity,
        reducedMotion: previewReducedMotion,
        seed: 1337,
      }),
    [clip, progress, bodyContext, living, previewReducedMotion],
  );

  // Dev tooling only — never part of a production bundle's UI.
  if (process.env.NODE_ENV === "production") return null;

  const wingFallback =
    WING_DEPENDENT_CLIPS.has(clip.id) && !bodyContext.hasWings;
  const thirdEyeFallback =
    THIRD_EYE_CLIPS.has(clip.id) && !bodyContext.hasThirdEye;
  const reducedMotionGated =
    previewReducedMotion && !clip.reducedMotionSafe;

  return (
    <section
      data-testid="movement-parade"
      className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-slate-200"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Movement Parade · dev QA
        </h2>
        <span className="text-[10px] text-slate-500">
          {clipIndex + 1} / {clips.length}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_center,#132945_0%,#050814_60%,#010207_100%)]">
          <PetBodyRenderer
            spec={body.spec}
            className="h-auto w-full max-w-[420px]"
            showForgeAura
            performance={frame}
            living={living}
            activeClipId={clip.id}
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {wingFallback && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                no wings — fallback active
              </span>
            )}
            {thirdEyeFallback && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">
                no third eye — soft signal
              </span>
            )}
            {reducedMotionGated && (
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-200">
                gated in production under reduced motion
              </span>
            )}
          </div>
        </div>

        <aside className="space-y-3 text-xs">
          <div>
            <p className="text-lg font-semibold text-white">{clip.label}</p>
            <p className="font-mono text-[10px] text-cyan-300">{clip.id}</p>
          </div>
          <dl className="space-y-1">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Priority</dt>
              <dd>
                {PRIORITY_LABELS[clip.priority]} ({clip.priority})
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Duration</dt>
              <dd>{clip.duration} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Tags</dt>
              <dd>{clip.tags.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Reduced motion</dt>
              <dd>{clip.reducedMotionSafe ? "safe" : "gated"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Progress</dt>
              <dd className="font-mono">{progress.toFixed(2)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setClipIndex(
                  (index) => (index - 1 + clips.length) % clips.length,
                );
                setPlayToken((token) => token + 1);
              }}
              className="min-h-[38px] rounded border border-slate-600 px-3 py-1 hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPlayToken((token) => token + 1)}
              className="min-h-[38px] rounded border border-slate-600 px-3 py-1 hover:bg-slate-800"
            >
              Replay
            </button>
            <button
              type="button"
              onClick={advance}
              className="min-h-[38px] rounded border border-slate-600 px-3 py-1 hover:bg-slate-800"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setAuto((value) => !value)}
              className={`min-h-[38px] rounded border px-3 py-1 ${auto ? "border-cyan-400 bg-cyan-500/20 text-cyan-100" : "border-slate-600 hover:bg-slate-800"}`}
            >
              {auto ? "Auto: on" : "Auto-parade"}
            </button>
            <button
              type="button"
              onClick={() => setPreviewReducedMotion((value) => !value)}
              className={`min-h-[38px] rounded border px-3 py-1 ${previewReducedMotion ? "border-violet-400 bg-violet-500/20 text-violet-100" : "border-slate-600 hover:bg-slate-800"}`}
            >
              {previewReducedMotion ? "Reduced motion: on" : "Reduced motion"}
            </button>
          </div>

          <div>
            <p className="mb-1 text-slate-400">Body</p>
            <div className="flex flex-wrap gap-1">
              {PARADE_BODIES.map((candidate, index) => (
                <button
                  key={candidate.label}
                  type="button"
                  onClick={() => setBodyIndex(index)}
                  className={`rounded-full border px-2 py-1 text-[10px] ${index === bodyIndex ? "border-cyan-300 bg-cyan-300/15 text-cyan-200" : "border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

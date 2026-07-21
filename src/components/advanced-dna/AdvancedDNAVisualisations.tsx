"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dna, ShieldCheck, Sparkles } from "lucide-react";
import { decodeGenome, type Genome } from "@/lib/genome";
import { MOSS_STRANDS } from "@/lib/moss60/strandSequences";
import { usePetRegistryStore } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePetProfileStore } from "@/lib/teacher-lessons/petProfile";
import {
  AdvancedDNACanvas,
  type AdvancedDNACanvasHandle,
} from "./AdvancedDNACanvas";
import { AdvancedDNAControls } from "./AdvancedDNAControls";
import {
  DNA_BASE_COLORS,
  DNA_BASE_LABELS,
  buildDnaVisualModel,
} from "./dnaMapper";
import {
  detectDevicePerformance,
  resolvePerformanceProfile,
} from "./performance";
import { useAdvancedDNAState } from "./useAdvancedDNAState";
import type { AdvancedDnaMode, DnaBase, DnaVisualSource } from "./types";

const FALLBACK_GENOME: Genome = {
  red60: MOSS_STRANDS.red.split("").map(Number),
  blue60: MOSS_STRANDS.blue.split("").map(Number),
  black60: MOSS_STRANDS.black.split("").map(Number),
};

const MODE_COPY: Record<
  AdvancedDnaMode,
  { title: string; purpose: string; interaction: string }
> = {
  sigil: {
    title: "Living Genetic Seal",
    purpose:
      "A stable emblem built from mirrored loci, trait weight, symmetry and mutation history.",
    interaction:
      "Tap a sector to inspect a gene group. The seal breathes, but its identity does not drift.",
  },
  cascade: {
    title: "Genomic Cascade",
    purpose:
      "Twelve related gene lanes show inherited information flowing through the pet's living state.",
    interaction:
      "Mood, health and energy alter the flow; mutation pressure splits selected channels.",
  },
  fourD: {
    title: "Higher-Dimensional Genome",
    purpose:
      "Inherited, expressed, dormant and mutated versions fold through nested Möbius helices.",
    interaction:
      "Move the dimension control from a flat 2D slice through 3D and into 4D abstraction.",
  },
  vortex: {
    title: "Genetic Singularity",
    purpose:
      "Stable genes orbit wide, mutation-prone genes fall inward and rare traits resist the core.",
    interaction:
      "Tap to send a controlled shockwave through the genome eye; drag to change orbital depth.",
  },
};

const BASE_SHAPES: Record<DnaBase, string> = {
  A: "●",
  T: "▲",
  C: "◆",
  G: "■",
};

export function AdvancedDNAVisualisations() {
  const runtimeGenome = useStore((state) => state.genome);
  const runtimeTraits = useStore((state) => state.traits);
  const runtimeVitals = useStore((state) => state.vitals);
  const activeRecord = usePetRegistryStore((state) => state.activeRecord);
  const registryStatus = usePetRegistryStore((state) => state.status);
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<AdvancedDNACanvasHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const detectedPerformance = useMemo(() => detectDevicePerformance(), []);
  // Start on the student's saved preferred DNA view when they have one (a
  // lesson preference; it never changes the genome and the teacher-facing
  // controls can still switch modes freely).
  const preferredDnaView = usePetProfileStore((s) => s.preferredDnaView);
  const state = useAdvancedDNAState(reducedMotion, preferredDnaView ?? undefined);

  const source = useMemo<DnaVisualSource>(() => {
    const genome = activeRecord?.genome ?? runtimeGenome ?? FALLBACK_GENOME;
    const traits =
      activeRecord?.traits ?? runtimeTraits ?? decodeGenome(genome);
    const isFallback = !activeRecord && !runtimeGenome;
    return {
      genome,
      traits,
      vitals: runtimeVitals ?? activeRecord?.vitals,
      mutationLog: activeRecord?.mutationLog ?? [],
      petId:
        activeRecord?.petId ?? (isFallback ? "moss60-fallback" : "runtime-pet"),
      petName:
        activeRecord?.name ?? (isFallback ? "Moss60 fallback" : "Meta-Pet"),
      isFallback,
    };
  }, [activeRecord, runtimeGenome, runtimeTraits, runtimeVitals]);
  const model = useMemo(() => buildDnaVisualModel(source), [source]);
  const performanceProfile = useMemo(
    () =>
      resolvePerformanceProfile(
        state.controls.performanceMode,
        detectedPerformance,
        reducedMotion,
      ),
    [detectedPerformance, reducedMotion, state.controls.performanceMode],
  );
  const modeCopy = MODE_COPY[state.controls.mode];

  useEffect(() => {
    const sync = () =>
      setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await stageRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.warn("[advanced-dna] fullscreen unavailable", error);
    }
  };

  return (
    <section
      ref={stageRef}
      className="overflow-y-auto rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_50%_0%,rgba(13,84,91,0.28),rgba(2,6,23,0.97)_48%)] p-3 text-white shadow-[0_26px_90px_rgba(0,0,0,0.38)] sm:p-6"
      aria-labelledby="advanced-dna-title"
      data-testid="advanced-dna-visualisations"
    >
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Dna size={14} aria-hidden /> Advanced DNA instrument
          </div>
          <h2
            id="advanced-dna-title"
            className="text-2xl font-black tracking-tight text-white sm:text-4xl"
          >
            Four readings. One genome.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
            Sigil creates identity. Cascade shows flow. 4D reveals dimensional
            structure. Vortex exposes force and instability. Every reading below
            is generated from the same 180-locus Meta-Pet DNA.
          </p>
        </div>

        <div className="grid min-w-[min(100%,22rem)] grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2.5 text-emerald-100">
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300/70">
              DNA source
            </span>
            <span className="mt-1 flex items-center gap-1.5 font-bold">
              <ShieldCheck size={14} aria-hidden />
              {model.isFallback
                ? registryStatus === "loading"
                  ? "Loading registered pet"
                  : "Safe Moss60 fallback"
                : `${model.petName} · registered`}
            </span>
          </div>
          <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2.5 text-fuchsia-100">
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/70">
              Mutation history
            </span>
            <span className="mt-1 flex items-center gap-1.5 font-bold">
              <Sparkles size={14} aria-hidden /> {model.mutationCount} recorded
              · 180 loci
            </span>
          </div>
        </div>
      </div>

      <div
        className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="DNA base colour and shape key"
      >
        {(Object.keys(DNA_BASE_COLORS) as DnaBase[]).map((base) => (
          <div
            key={base}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2"
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center text-lg font-black"
              style={{ color: DNA_BASE_COLORS[base] }}
              aria-hidden
            >
              {BASE_SHAPES[base]}
            </span>
            <span>
              <span
                className="block text-xs font-black"
                style={{ color: DNA_BASE_COLORS[base] }}
              >
                {base}
              </span>
              <span className="block text-[9px] uppercase tracking-[0.14em] text-slate-500">
                {DNA_BASE_LABELS[base]}
              </span>
            </span>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {model.baseCounts[base]}
            </span>
          </div>
        ))}
      </div>

      <AdvancedDNAControls
        controls={state.controls}
        reducedMotion={reducedMotion}
        isFullscreen={isFullscreen}
        onModeChange={state.setMode}
        onNumberChange={state.setNumber}
        onSymmetryChange={state.setSymmetry}
        onPerformanceModeChange={state.setPerformanceMode}
        onTogglePlaying={state.togglePlaying}
        onResetView={state.resetView}
        onRandomiseAnimation={state.randomiseAnimation}
        onFullscreen={() => void toggleFullscreen()}
        onExport={() => canvasRef.current?.exportPng()}
      />

      <div className="my-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/75">
            {state.controls.mode === "fourD" ? "4D" : state.controls.mode}{" "}
            reading
          </p>
          <h3 className="mt-1 text-lg font-bold text-white">
            {modeCopy.title}
          </h3>
        </div>
        <div className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:mt-0 sm:text-right">
          <p>{modeCopy.purpose}</p>
          <p className="text-slate-500">{modeCopy.interaction}</p>
        </div>
      </div>

      <AdvancedDNACanvas
        ref={canvasRef}
        model={model}
        controls={state.controls}
        performance={performanceProfile}
        reducedMotion={reducedMotion}
        resetViewToken={state.resetViewToken}
      />

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-slate-600">
        Identity {model.fingerprint} · same genome, deterministic geometry ·
        animation phase does not alter the DNA mapping
      </p>
    </section>
  );
}

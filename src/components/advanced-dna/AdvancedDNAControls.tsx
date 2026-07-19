"use client";

import { useId } from "react";
import {
  Camera,
  Download,
  Expand,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import type {
  AdvancedDnaControlsState,
  AdvancedDnaMode,
  PerformanceMode,
} from "./types";

const MODE_OPTIONS: Array<{
  id: AdvancedDnaMode;
  label: string;
  purpose: string;
}> = [
  { id: "sigil", label: "Sigil", purpose: "Identity seal" },
  { id: "cascade", label: "Cascade", purpose: "Genetic flow" },
  { id: "fourD", label: "4D", purpose: "Dimensional states" },
  { id: "vortex", label: "Vortex", purpose: "Force + instability" },
];

type AdvancedDNAControlsProps = {
  controls: AdvancedDnaControlsState;
  reducedMotion: boolean;
  isFullscreen: boolean;
  onModeChange: (mode: AdvancedDnaMode) => void;
  onNumberChange: (
    key:
      | "speed"
      | "intensity"
      | "mutationLevel"
      | "particleDensity"
      | "cameraDepth"
      | "dimension",
    value: number,
  ) => void;
  onSymmetryChange: (symmetry: 6 | 8 | 12 | 60) => void;
  onPerformanceModeChange: (mode: PerformanceMode) => void;
  onTogglePlaying: () => void;
  onResetView: () => void;
  onRandomiseAnimation: () => void;
  onFullscreen: () => void;
  onExport: () => void;
};

function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step,
  output,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  output: string;
  onChange: (value: number) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="block rounded-xl border border-slate-700/65 bg-slate-950/55 px-3 py-2.5"
    >
      <span className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-300">
        <span>{label}</span>
        <output htmlFor={id} className="font-mono text-cyan-200">
          {output}
        </output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-8 w-full cursor-pointer appearance-none bg-transparent accent-cyan-400"
        aria-label={label}
      />
    </label>
  );
}

export function AdvancedDNAControls({
  controls,
  reducedMotion,
  isFullscreen,
  onModeChange,
  onNumberChange,
  onSymmetryChange,
  onPerformanceModeChange,
  onTogglePlaying,
  onResetView,
  onRandomiseAnimation,
  onFullscreen,
  onExport,
}: AdvancedDNAControlsProps) {
  const id = useId();
  const actionClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300";

  return (
    <div className="space-y-3" aria-label="Advanced DNA visualisation controls">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="Visual mode"
      >
        {MODE_OPTIONS.map((mode) => {
          const active = controls.mode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              aria-pressed={active}
              className={`min-h-[54px] rounded-xl border px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                active
                  ? "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(92,242,214,0.18)]"
                  : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-cyan-400/45 hover:bg-slate-900"
              }`}
            >
              <span className="block text-sm font-black uppercase tracking-[0.14em]">
                {mode.label}
              </span>
              <span
                className={`mt-0.5 block text-[10px] ${active ? "text-slate-700" : "text-slate-500"}`}
              >
                {mode.purpose}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <button
          type="button"
          onClick={onTogglePlaying}
          className={`${actionClass} border-emerald-400/35 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20`}
          aria-label={
            controls.playing ? "Pause DNA animation" : "Play DNA animation"
          }
        >
          {controls.playing ? (
            <Pause size={16} aria-hidden />
          ) : (
            <Play size={16} aria-hidden />
          )}
          {controls.playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onResetView}
          className={`${actionClass} border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800`}
          aria-label="Reset DNA camera view"
        >
          <RotateCcw size={16} aria-hidden /> Reset view
        </button>
        <button
          type="button"
          onClick={onRandomiseAnimation}
          className={`${actionClass} border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100 hover:bg-fuchsia-400/20`}
          aria-label="Randomise animation state without changing DNA"
        >
          <Shuffle size={16} aria-hidden /> Randomise
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          className={`${actionClass} border-blue-400/30 bg-blue-400/10 text-blue-100 hover:bg-blue-400/20`}
          aria-label={
            isFullscreen ? "Exit DNA fullscreen" : "Open DNA fullscreen"
          }
        >
          <Expand size={16} aria-hidden />{" "}
          {isFullscreen ? "Exit full" : "Fullscreen"}
        </button>
        <button
          type="button"
          onClick={onExport}
          className={`${actionClass} border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20`}
          aria-label="Export DNA visualisation screenshot"
        >
          <Download size={16} aria-hidden /> Export PNG
        </button>
        <label
          className={`${actionClass} border-slate-600 bg-slate-900/70 text-slate-200`}
        >
          <Gauge size={16} aria-hidden />
          <span className="sr-only">Performance mode</span>
          <select
            value={controls.performanceMode}
            onChange={(event) =>
              onPerformanceModeChange(event.target.value as PerformanceMode)
            }
            className="min-h-8 min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-100 outline-none"
            aria-label="Performance mode"
          >
            <option value="auto" className="bg-slate-950">
              Auto
            </option>
            <option value="quality" className="bg-slate-950">
              Quality
            </option>
            <option value="performance" className="bg-slate-950">
              Performance
            </option>
          </select>
        </label>
      </div>

      <details className="group rounded-xl border border-slate-700/65 bg-slate-950/35">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-2 text-sm font-bold text-slate-200">
          <span className="inline-flex items-center gap-2">
            <Camera size={16} aria-hidden /> Tune the field
          </span>
          <span
            className="text-cyan-300 transition-transform group-open:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </summary>
        <div className="grid gap-2 border-t border-slate-800 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <SliderControl
            id={`${id}-speed`}
            label="Speed"
            value={controls.speed}
            min={0.15}
            max={2}
            step={0.05}
            output={`${controls.speed.toFixed(2)}×`}
            onChange={(value) => onNumberChange("speed", value)}
          />
          <SliderControl
            id={`${id}-intensity`}
            label="Intensity"
            value={controls.intensity}
            min={0.2}
            max={1.4}
            step={0.05}
            output={`${Math.round(controls.intensity * 100)}%`}
            onChange={(value) => onNumberChange("intensity", value)}
          />
          <SliderControl
            id={`${id}-mutation`}
            label="Mutation expression"
            value={controls.mutationLevel}
            min={0}
            max={1}
            step={0.02}
            output={`${Math.round(controls.mutationLevel * 100)}%`}
            onChange={(value) => onNumberChange("mutationLevel", value)}
          />
          <SliderControl
            id={`${id}-density`}
            label="Particle density"
            value={controls.particleDensity}
            min={0.2}
            max={1}
            step={0.05}
            output={`${Math.round(controls.particleDensity * 100)}%`}
            onChange={(value) => onNumberChange("particleDensity", value)}
          />
          <SliderControl
            id={`${id}-depth`}
            label="Camera depth"
            value={controls.cameraDepth}
            min={0.5}
            max={1.6}
            step={0.05}
            output={controls.cameraDepth.toFixed(2)}
            onChange={(value) => onNumberChange("cameraDepth", value)}
          />
          {controls.mode === "fourD" && (
            <SliderControl
              id={`${id}-dimension`}
              label="Dimension slice"
              value={controls.dimension}
              min={2}
              max={4}
              step={0.1}
              output={`${controls.dimension.toFixed(1)}D`}
              onChange={(value) => onNumberChange("dimension", value)}
            />
          )}
          {controls.mode === "sigil" && (
            <fieldset className="rounded-xl border border-slate-700/65 bg-slate-950/55 px-3 py-2.5">
              <legend className="px-1 text-xs font-semibold text-slate-300">
                Symmetry
              </legend>
              <div className="mt-1 grid grid-cols-4 gap-1.5">
                {([6, 8, 12, 60] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onSymmetryChange(value)}
                    aria-pressed={controls.symmetry === value}
                    className={`min-h-10 rounded-lg border text-xs font-black ${
                      controls.symmetry === value
                        ? "border-cyan-300 bg-cyan-300 text-slate-950"
                        : "border-slate-700 bg-slate-900 text-slate-300"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </details>

      {reducedMotion && !controls.playing && (
        <p className="text-xs leading-5 text-slate-400" role="status">
          Reduced motion is active. The genetic identity is shown as a still
          frame; press Play to animate it.
        </p>
      )}
    </div>
  );
}

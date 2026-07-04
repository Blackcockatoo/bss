"use client";

/**
 * VisualEvaluationPanel — a dev-only heads-up panel for judging animation
 * quality and mobile readiness at a glance. Deliberately rough: it exists
 * to surface problems (too many particles, tiny tap targets, horizontal
 * overflow) rather than to be a precise profiler.
 *
 * Mount it on demo pages or behind a toggle; never ship it in primary UI.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface VisualEvaluationInputs {
  /** Approximate live particle count across visible effects. */
  particleCount?: number;
  /** 0..1 overall motion intensity (amplitudes, speed). */
  motionIntensity?: number;
  /** Movement clip currently playing, if a movement controller runs. */
  activeMovement?: string;
  /** Current evolution stage. */
  evolutionStage?: string;
  /** Names of currently equipped add-ons. */
  equippedAddons?: string[];
  /** Anchor points in use, to flag collision risk (e.g. two "head" items). */
  addonAnchors?: string[];
  /** Rendering quality level in effect (e.g. of a visualizer). */
  qualityLevel?: "low" | "medium" | "high";
  /** DNA Music Hub layout mode, if the hub is on screen. */
  dnaHubMode?: "compact" | "full";
  /** AudioContext state, if audio exists ("running" | "suspended" | ...). */
  audioContextState?: string;
}

type Verdict = "ok" | "warn" | "bad" | "info";

interface CheckRow {
  label: string;
  value: string;
  verdict: Verdict;
}

const PARTICLE_WARN = 60;
const PARTICLE_BAD = 150;
const TOUCH_TARGET_MIN_PX = 44;
const MAX_SCANNED_TARGETS = 300;
const MOBILE_WIDTH_PX = 480;

function subscribeResize(onChange: () => void): () => void {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useViewportWidth(): number {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 0,
  );
}

interface DomScanResult {
  smallTargets: number;
  scannedTargets: number;
  hasHorizontalOverflow: boolean;
  oversizedPanels: number;
}

function scanDom(): DomScanResult {
  const root = document.documentElement;
  const hasHorizontalOverflow = root.scrollWidth > root.clientWidth + 1;

  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("button, a, input, select, [role='button']"),
  ).slice(0, MAX_SCANNED_TARGETS);
  let smallTargets = 0;
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue; // hidden
    if (rect.width < TOUCH_TARGET_MIN_PX - 4 || rect.height < TOUCH_TARGET_MIN_PX - 16) {
      smallTargets++;
    }
  }

  // Rough "bulky panel" heuristic: bordered boxes much taller than the screen.
  const panels = Array.from(
    document.querySelectorAll<HTMLElement>("section, [class*='rounded']"),
  ).slice(0, MAX_SCANNED_TARGETS);
  let oversizedPanels = 0;
  for (const el of panels) {
    if (el.clientHeight > window.innerHeight * 1.6) oversizedPanels++;
  }

  return {
    smallTargets,
    scannedTargets: candidates.length,
    hasHorizontalOverflow,
    oversizedPanels,
  };
}

const VERDICT_STYLE: Record<Verdict, string> = {
  ok: "text-emerald-300",
  warn: "text-amber-300",
  bad: "text-red-400",
  info: "text-sky-300",
};

const VERDICT_DOT: Record<Verdict, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  bad: "bg-red-500",
  info: "bg-sky-400",
};

export function VisualEvaluationPanel({
  particleCount,
  motionIntensity,
  activeMovement,
  evolutionStage,
  equippedAddons,
  addonAnchors,
  qualityLevel,
  dnaHubMode,
  audioContextState,
}: VisualEvaluationInputs) {
  const reducedMotion = useReducedMotion();
  const viewportWidth = useViewportWidth();
  const [scan, setScan] = useState<DomScanResult | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const runScan = useCallback(() => {
    setScan(scanDom());
  }, []);

  // Initial scan, deferred so it never blocks the first paint.
  useEffect(() => {
    const timer = window.setTimeout(runScan, 400);
    return () => window.clearTimeout(timer);
  }, [runScan]);

  const rows: CheckRow[] = [];

  if (typeof particleCount === "number") {
    rows.push({
      label: "Particle count",
      value: String(particleCount),
      verdict:
        particleCount > PARTICLE_BAD ? "bad" : particleCount > PARTICLE_WARN ? "warn" : "ok",
    });
  }
  if (typeof motionIntensity === "number") {
    rows.push({
      label: "Motion intensity",
      value: motionIntensity.toFixed(2),
      verdict: motionIntensity > 0.85 ? "warn" : "ok",
    });
  }
  rows.push({
    label: "Reduced motion",
    value: reducedMotion ? "on" : "off",
    verdict: "info",
  });
  rows.push({
    label: "Viewport width",
    value: `${viewportWidth}px${viewportWidth > 0 && viewportWidth < MOBILE_WIDTH_PX ? " (mobile)" : ""}`,
    verdict: "info",
  });
  if (qualityLevel) {
    rows.push({
      label: "Quality level",
      value: qualityLevel,
      verdict:
        viewportWidth > 0 && viewportWidth < MOBILE_WIDTH_PX && qualityLevel === "high"
          ? "warn"
          : "ok",
    });
  }
  if (dnaHubMode) {
    rows.push({
      label: "DNA Hub mode",
      value: dnaHubMode,
      verdict:
        viewportWidth > 0 && viewportWidth < MOBILE_WIDTH_PX && dnaHubMode === "full"
          ? "warn"
          : "ok",
    });
  }
  if (audioContextState) {
    rows.push({
      label: "AudioContext",
      value: audioContextState,
      verdict: audioContextState === "running" ? "ok" : "warn",
    });
  }
  if (activeMovement) {
    rows.push({ label: "Active movement", value: activeMovement, verdict: "info" });
  }
  if (evolutionStage) {
    rows.push({ label: "Evolution stage", value: evolutionStage, verdict: "info" });
  }
  if (equippedAddons && equippedAddons.length > 0) {
    rows.push({
      label: "Equipped add-ons",
      value: `${equippedAddons.length}: ${equippedAddons.slice(0, 3).join(", ")}${equippedAddons.length > 3 ? "…" : ""}`,
      verdict: equippedAddons.length > 4 ? "warn" : "info",
    });
  }
  if (addonAnchors && addonAnchors.length > 0) {
    const duplicates = addonAnchors.length - new Set(addonAnchors).size;
    rows.push({
      label: "Anchor collision risk",
      value: duplicates > 0 ? `${duplicates} shared anchor(s)` : "none",
      verdict: duplicates > 0 ? "warn" : "ok",
    });
  }
  if (scan) {
    rows.push({
      label: "Horizontal overflow",
      value: scan.hasHorizontalOverflow ? "detected" : "none",
      verdict: scan.hasHorizontalOverflow ? "bad" : "ok",
    });
    rows.push({
      label: "Small tap targets",
      value: `${scan.smallTargets}/${scan.scannedTargets}`,
      verdict: scan.smallTargets > 10 ? "bad" : scan.smallTargets > 3 ? "warn" : "ok",
    });
    rows.push({
      label: "Bulky panels",
      value: String(scan.oversizedPanels),
      verdict: scan.oversizedPanels > 2 ? "warn" : "ok",
    });
  }

  return (
    <aside
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-[90] w-64 max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-700 bg-slate-950/92 text-xs text-slate-200 shadow-xl backdrop-blur sm:bottom-3"
      aria-label="Visual evaluation dev panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
        <span className="font-semibold tracking-wide text-slate-100">
          Visual Eval
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={runScan}
            className="rounded-md border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-300 hover:bg-slate-800"
            aria-label="Re-run DOM scan"
          >
            Rescan
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          >
            {collapsed ? "+" : "−"}
          </button>
        </div>
      </div>
      {!collapsed && (
        <ul className="max-h-[45dvh] space-y-1 overflow-y-auto px-3 py-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${VERDICT_DOT[row.verdict]}`} />
                {row.label}
              </span>
              <span className={`text-right font-mono ${VERDICT_STYLE[row.verdict]}`}>
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default VisualEvaluationPanel;

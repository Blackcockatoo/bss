"use client";

import { projectFutures, type EnvironmentChoice } from "../../../../../backend/src/routes/genome/futures";
import { useEffect, useMemo, useState } from "react";

const STAGES = ["puppy/kitten", "adolescent", "adult", "senior"] as const;

type Stage = (typeof STAGES)[number];

type FutureBranch = ReturnType<typeof projectFutures>[number];

type PersistedState = {
  bookmarks: string[];
  compareSelection: string[];
};

type AnalyticsEvent = {
  event: "stage_change" | "driver_change" | "bookmark_toggle" | "compare_toggle";
  petId: string;
  stage: Stage;
  timestamp: string;
  details: Record<string, string | number | boolean>;
};

type Props = {
  petId: string;
};

const DEFAULT_ENV_BY_STAGE: Record<Stage, EnvironmentChoice> = {
  "puppy/kitten": { diet: "balanced", activity: "medium", enrichment: "high" },
  adolescent: { diet: "high-protein", activity: "high", enrichment: "medium" },
  adult: { diet: "balanced", activity: "medium", enrichment: "medium" },
  senior: { diet: "standard", activity: "low", enrichment: "medium" },
};

export function GenomeTimeline({ petId }: Props) {
  const [currentStage, setCurrentStage] = useState<Stage>("adult");
  const [envByStage, setEnvByStage] = useState<Record<Stage, EnvironmentChoice>>(DEFAULT_ENV_BY_STAGE);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);

  const storageKey = `genome-timeline:${petId}`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = window.localStorage.getItem(storageKey);
    if (!persisted) {
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as PersistedState;
      setBookmarks(parsed.bookmarks ?? []);
      setCompareSelection(parsed.compareSelection ?? []);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedState = { bookmarks, compareSelection };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [bookmarks, compareSelection, storageKey]);

  function trackAnalytics(event: AnalyticsEvent) {
    if (typeof window === "undefined") {
      return;
    }

    const key = "genome-timeline:analytics";
    const existing = window.localStorage.getItem(key);
    const events = existing ? (JSON.parse(existing) as AnalyticsEvent[]) : [];
    const trimmed = [...events.slice(-199), event];
    window.localStorage.setItem(key, JSON.stringify(trimmed));
  }

  const branchesByStage = useMemo(
    () =>
      STAGES.reduce<Record<Stage, FutureBranch[]>>((acc, stage) => {
        acc[stage] = projectFutures(petId, envByStage[stage], stage);
        return acc;
      }, {} as Record<Stage, FutureBranch[]>),
    [envByStage, petId],
  );

  const branches = branchesByStage[currentStage] ?? [];

  function handleStageChange(stage: Stage) {
    setCurrentStage(stage);
    trackAnalytics({
      event: "stage_change",
      petId,
      stage,
      timestamp: new Date().toISOString(),
      details: { branchCount: branchesByStage[stage]?.length ?? 0 },
    });
  }

  function updateDriver(stage: Stage, driver: keyof EnvironmentChoice, value: string) {
    setEnvByStage((state) => ({
      ...state,
      [stage]: {
        ...state[stage],
        [driver]: value,
      },
    }));

    trackAnalytics({
      event: "driver_change",
      petId,
      stage,
      timestamp: new Date().toISOString(),
      details: { driver, value },
    });
  }

  function toggleBookmark(branchId: string) {
    setBookmarks((state) =>
      state.includes(branchId) ? state.filter((id) => id !== branchId) : [...state, branchId],
    );

    trackAnalytics({
      event: "bookmark_toggle",
      petId,
      stage: currentStage,
      timestamp: new Date().toISOString(),
      details: { branchId, bookmarked: !bookmarks.includes(branchId) },
    });
  }

  function toggleCompare(branchId: string) {
    setCompareSelection((state) => {
      const updated = state.includes(branchId)
        ? state.filter((id) => id !== branchId)
        : [...state.slice(-1), branchId];

      trackAnalytics({
        event: "compare_toggle",
        petId,
        stage: currentStage,
        timestamp: new Date().toISOString(),
        details: { branchId, selected: updated.includes(branchId), comparedCount: updated.length },
      });

      return updated;
    });
  }

  function confidenceTooltip(branch: FutureBranch) {
    return branch.confidenceSignals
      .map((signal) => `${signal.signal}: ${(signal.strength * 100).toFixed(0)}% · ${signal.rationale}`)
      .join("\n");
  }

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">Genome Timeline</h3>
      <div className="mt-2 flex gap-2 text-xs">
        {STAGES.map((stage) => (
          <button
            className={`rounded px-2 py-1 ${stage === currentStage ? "bg-slate-700" : "border"}`}
            key={stage}
            onClick={() => handleStageChange(stage)}
            type="button"
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 rounded border border-slate-800 p-3 text-xs md:grid-cols-3">
        <label className="block">
          Diet
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-1"
            onChange={(event) => updateDriver(currentStage, "diet", event.target.value)}
            value={envByStage[currentStage].diet}
          >
            <option value="standard">Standard</option>
            <option value="high-protein">High Protein</option>
            <option value="balanced">Balanced</option>
          </select>
        </label>
        <label className="block">
          Activity
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-1"
            onChange={(event) => updateDriver(currentStage, "activity", event.target.value)}
            value={envByStage[currentStage].activity}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block">
          Enrichment
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-1"
            onChange={(event) => updateDriver(currentStage, "enrichment", event.target.value)}
            value={envByStage[currentStage].enrichment}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {branches.map((branch) => (
          <article className="rounded border border-slate-700 p-2 text-xs" key={branch.id}>
            <div className="font-medium">{branch.label}</div>
            <div className="flex items-center gap-1">
              Confidence: {(branch.confidence * 100).toFixed(0)}%
              <span className="cursor-help rounded border border-slate-600 px-1" title={confidenceTooltip(branch)}>
                ?
              </span>
            </div>
            <div>{branch.divergenceSummary}</div>

            <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
              {branch.branchDrivers.map((driver) => (
                <li key={`${branch.id}-${driver.driver}`}>
                  <strong className="text-slate-300">{driver.driver}</strong>: {driver.selectedValue} · {driver.provenanceLabel}
                </li>
              ))}
            </ul>

            <div className="mt-2 flex gap-2">
              <button className="underline" onClick={() => toggleBookmark(branch.id)} type="button">
                {bookmarks.includes(branch.id) ? "Unbookmark" : "Bookmark"}
              </button>
              <button className="underline" onClick={() => toggleCompare(branch.id)} type="button">
                {compareSelection.includes(branch.id) ? "Remove Compare" : "Add Compare"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Bookmarked branch points: {bookmarks.join(", ") || "none"}</p>
      <p className="mt-1 text-xs text-slate-500">Side-by-side compare: {compareSelection.join(" vs ") || "select up to 2"}</p>
    </section>
  );
}

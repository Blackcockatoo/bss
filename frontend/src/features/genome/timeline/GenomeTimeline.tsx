"use client";

import { useEffect, useMemo, useState } from "react";
import { bookmarkBranch, listBookmarks } from "../data/genomePersistenceClient";

const STAGES = ["puppy/kitten", "adolescent", "adult", "senior"] as const;
const DRIVERS = ["diet", "activity", "enrichment"] as const;

type Stage = (typeof STAGES)[number];
type DriverName = (typeof DRIVERS)[number];
type EnvironmentValue = "low" | "medium" | "high" | "standard" | "balanced" | "high-protein";

type EnvironmentChoice = Record<DriverName, EnvironmentValue>;

type FutureBranch = ReturnType<typeof projectFutures>[number];

type AnalyticsEvent = {
  event: "stage_change" | "driver_change" | "bookmark_toggle" | "compare_toggle";
  petId: string;
  stage: Stage;
  timestamp: string;
  details: Record<string, string | number | boolean>;
};

type Props = {
  petId?: string;
  branchesByStage?: Partial<Record<Stage, Array<Pick<FutureBranch, "id" | "label" | "confidence" | "divergenceSummary">>>>;
};

const DEFAULT_ENV_BY_STAGE: Record<Stage, EnvironmentChoice> = {
  "puppy/kitten": { diet: "balanced", activity: "medium", enrichment: "high" },
  adolescent: { diet: "high-protein", activity: "high", enrichment: "medium" },
  adult: { diet: "balanced", activity: "medium", enrichment: "medium" },
  senior: { diet: "standard", activity: "low", enrichment: "medium" },
};

function scoreValue(value: EnvironmentValue) {
  if (value === "high" || value === "high-protein") return 1;
  if (value === "medium" || value === "balanced") return 0.7;
  return 0.45;
}

function projectFutures(stage: Stage, choice: EnvironmentChoice) {
  const activityScore = scoreValue(choice.activity);
  const dietScore = scoreValue(choice.diet);
  const enrichmentScore = scoreValue(choice.enrichment);

  const resilience = Math.min(0.99, 0.35 + activityScore * 0.2 + enrichmentScore * 0.25 + dietScore * 0.15);
  const weight = Math.min(0.99, 0.2 + dietScore * 0.45 + activityScore * 0.2 + enrichmentScore * 0.1);
  const cognition = Math.min(0.99, 0.25 + enrichmentScore * 0.45 + activityScore * 0.2 + dietScore * 0.1);

  return [
    {
      id: `${stage}-resilience`,
      label: "Resilience-leaning trajectory",
      confidence: resilience,
      divergenceSummary: "Projected immune and stress response remains comparatively stable.",
      branchDrivers: [
        { driver: "diet", selectedValue: choice.diet, provenanceLabel: "nutrition model" },
        { driver: "enrichment", selectedValue: choice.enrichment, provenanceLabel: "home telemetry" },
      ],
    },
    {
      id: `${stage}-weight`,
      label: "Weight-management branch",
      confidence: weight,
      divergenceSummary: "Body composition trends suggest periodic intervention checkpoints.",
      branchDrivers: [
        { driver: "diet", selectedValue: choice.diet, provenanceLabel: "nutrition model" },
        { driver: "activity", selectedValue: choice.activity, provenanceLabel: "activity tracker" },
      ],
    },
    {
      id: `${stage}-cognition`,
      label: "Cognitive vitality path",
      confidence: cognition,
      divergenceSummary: "Behavioral and enrichment signals indicate future cognition outcomes.",
      branchDrivers: [
        { driver: "enrichment", selectedValue: choice.enrichment, provenanceLabel: "engagement classifier" },
        { driver: "activity", selectedValue: choice.activity, provenanceLabel: "activity tracker" },
      ],
    },
  ];
}

function confidenceTooltip(branch: FutureBranch) {
  return `${(branch.confidence * 100).toFixed(0)}% confidence based on selected drivers.`;
}

export function GenomeTimeline({ petId = "unknown-pet", branchesByStage: providedBranchesByStage }: Props) {
  const [currentStage, setCurrentStage] = useState<Stage>("adult");
  const [envByStage, setEnvByStage] = useState<Record<Stage, EnvironmentChoice>>(DEFAULT_ENV_BY_STAGE);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const branchesByStage = useMemo(
    () =>
      STAGES.reduce<Record<Stage, FutureBranch[]>>((acc, stage) => {
        const projected = projectFutures(stage, envByStage[stage]);
        const provided = providedBranchesByStage?.[stage];

        acc[stage] = provided
          ? provided.map((branch) => ({
              ...branch,
              branchDrivers: projected[0]?.branchDrivers ?? [],
            }))
          : projected;

        return acc;
      }, {} as Record<Stage, FutureBranch[]>),
    [envByStage, providedBranchesByStage],
  );

  const branches = branchesByStage[currentStage] ?? [];

  useEffect(() => {
    listBookmarks().then(setBookmarks).catch(() => setError("Unable to load bookmarks."));
  }, []);

  function emitAnalytics(event: AnalyticsEvent) {
    void event;
  }

  function handleStageChange(stage: Stage) {
    setCurrentStage(stage);
    emitAnalytics({
      event: "stage_change",
      petId,
      stage,
      timestamp: new Date().toISOString(),
      details: { source: "timeline_tab" },
    });
  }

  function updateDriver(stage: Stage, driver: DriverName, value: string) {
    const nextValue = value as EnvironmentValue;
    setEnvByStage((previous) => ({
      ...previous,
      [stage]: {
        ...previous[stage],
        [driver]: nextValue,
      },
    }));
    emitAnalytics({
      event: "driver_change",
      petId,
      stage,
      timestamp: new Date().toISOString(),
      details: { driver, value: nextValue },
    });
  }

  async function toggleBookmark(branchId: string) {
    setError(null);
    const previous = bookmarks;
    const optimistic = previous.includes(branchId)
      ? previous.filter((id) => id !== branchId)
      : [...previous, branchId];
    setBookmarks(optimistic);

    try {
      const persisted = await bookmarkBranch(branchId);
      setBookmarks(persisted);
      emitAnalytics({
        event: "bookmark_toggle",
        petId,
        stage: currentStage,
        timestamp: new Date().toISOString(),
        details: { branchId, bookmarked: persisted.includes(branchId) },
      });
    } catch {
      setBookmarks(previous);
      setError("Bookmark update failed. Changes were rolled back.");
    }
  }

  function toggleCompare(branchId: string) {
    setCompareSelection((previous) => {
      const next = previous.includes(branchId)
        ? previous.filter((id) => id !== branchId)
        : [...previous, branchId].slice(-2);

      emitAnalytics({
        event: "compare_toggle",
        petId,
        stage: currentStage,
        timestamp: new Date().toISOString(),
        details: { branchId, selected: next.includes(branchId), compareCount: next.length },
      });

      return next;
    });
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
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </section>
  );
}

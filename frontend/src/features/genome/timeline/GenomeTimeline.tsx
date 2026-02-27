"use client";

import { useState } from "react";

const STAGES = ["puppy/kitten", "adolescent", "adult", "senior"] as const;

type FutureBranch = {
  id: string;
  label: string;
  confidence: number;
  divergenceSummary: string;
};

type Props = {
  branchesByStage: Record<string, FutureBranch[]>;
};

export function GenomeTimeline({ branchesByStage }: Props) {
  const [currentStage, setCurrentStage] = useState<(typeof STAGES)[number]>("adult");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const branches = branchesByStage[currentStage] ?? [];

  function toggleBookmark(branchId: string) {
    setBookmarks((state) =>
      state.includes(branchId) ? state.filter((id) => id !== branchId) : [...state, branchId],
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 p-4">
      <h3 className="font-semibold">Genome Timeline</h3>
      <div className="mt-2 flex gap-2 text-xs">
        {STAGES.map((stage) => (
          <button
            className={`rounded px-2 py-1 ${stage === currentStage ? "bg-slate-700" : "border"}`}
            key={stage}
            onClick={() => setCurrentStage(stage)}
            type="button"
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {branches.map((branch) => (
          <article className="rounded border border-slate-700 p-2 text-xs" key={branch.id}>
            <div className="font-medium">{branch.label}</div>
            <div>Confidence: {(branch.confidence * 100).toFixed(0)}%</div>
            <div>{branch.divergenceSummary}</div>
            <button className="mt-1 underline" onClick={() => toggleBookmark(branch.id)} type="button">
              {bookmarks.includes(branch.id) ? "Unbookmark" : "Bookmark"}
            </button>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Bookmarked branch points: {bookmarks.join(", ") || "none"}</p>
    </section>
  );
}

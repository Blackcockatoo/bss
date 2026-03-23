"use client";

import {
  CURRICULUM_FIT_BADGE_CLASSNAMES,
  CURRICULUM_FIT_INFO,
  CURRICULUM_FIT_TAGS,
} from "@/lib/education/curriculum-fit";
import { Compass } from "lucide-react";
import { useState } from "react";

export function CurriculumFitPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Compass className="h-4 w-4 text-slate-400" />
          Where it fits
        </h3>
        <span className="text-xs text-slate-500">
          {expanded ? "collapse" : "expand"}
        </span>
      </button>

      <div className="flex flex-wrap gap-1.5">
        {CURRICULUM_FIT_TAGS.map((tag) => {
          const info = CURRICULUM_FIT_INFO[tag];
          return (
            <span
              key={tag}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CURRICULUM_FIT_BADGE_CLASSNAMES[tag]}`}
            >
              {info.label}
            </span>
          );
        })}
      </div>

      {expanded && (
        <ul className="space-y-2 text-xs text-slate-400">
          {CURRICULUM_FIT_TAGS.map((tag) => {
            const info = CURRICULUM_FIT_INFO[tag];
            return (
              <li key={tag}>
                <span className="font-medium text-slate-300">{info.label}</span>
                {" — "}
                {info.useCases[0]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

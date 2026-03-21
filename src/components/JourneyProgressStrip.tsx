"use client";

import { usePathname } from "next/navigation";

import { useJourneyProgressTracker } from "@/lib/journeyProgress";
import {
  ROUTE_PROGRESSION_SEQUENCE,
  getRouteProgression,
  getRouteProgressionKeyByPathname,
} from "@/lib/routeProgression";

export function JourneyProgressStrip() {
  const pathname = usePathname();
  const currentRouteKey = pathname
    ? getRouteProgressionKeyByPathname(pathname)
    : null;
  const shouldRender = pathname === "/" || currentRouteKey !== null;
  const { progress } = useJourneyProgressTracker();

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="mx-auto mt-3 flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
        Journey Progress
      </p>
      <div className="scrollbar-hide -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {ROUTE_PROGRESSION_SEQUENCE.map((routeKey, index) => {
          const step = getRouteProgression(routeKey);
          const routeState = progress[routeKey];
          const isActive = currentRouteKey === routeKey;
          const isCompleted = Boolean(routeState.completedAt);
          const isVisited = Boolean(routeState.visitedAt);

          return (
            <span
              key={routeKey}
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] sm:text-[11px] ${
                isActive
                  ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                  : isCompleted
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200"
                    : isVisited
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                      : "border-slate-800 bg-slate-900/70 text-slate-500"
              }`}
            >
              {index + 1}. {step.shortLabel}
            </span>
          );
        })}
      </div>
    </div>
  );
}

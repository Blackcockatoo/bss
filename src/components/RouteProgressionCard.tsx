import Link from "next/link";

import {
  ROUTE_PROGRESSION_SEQUENCE,
  getRouteProgression,
  type RouteProgressionKey,
} from "@/lib/routeProgression";

type RouteProgressionCardProps = {
  route: RouteProgressionKey;
  showAdvanced?: boolean;
  className?: string;
};

export function RouteProgressionCard({
  route,
  showAdvanced = false,
  className = "",
}: RouteProgressionCardProps) {
  const step = getRouteProgression(route);

  return (
    <section
      className={`rounded-[2rem] border border-slate-800 bg-slate-950/75 p-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.4)] ${className}`.trim()}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-300/80">
            Progression Ladder
          </p>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            {ROUTE_PROGRESSION_SEQUENCE.map((item, index) => {
              const label = getRouteProgression(item).shortLabel;
              const isActive = item === route;
              return (
                <span
                  key={item}
                  className={`rounded-full border px-3 py-1 ${
                    isActive
                      ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-200"
                      : "border-slate-800 bg-slate-900/80 text-slate-500"
                  }`}
                >
                  {index + 1}. {label}
                </span>
              );
            })}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/75">
              First move: {step.entryCta.label}
            </p>
            <p className="text-sm font-semibold text-cyan-200">
              Step {step.step}: {step.shortLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{step.role}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step.summary}
            </p>
          </div>
        </div>

        {(step.next || (showAdvanced && step.advanced)) && (
          <div className="grid w-full gap-3 lg:max-w-md">
            {step.next && (
              <Link
                href={step.next.href}
                className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4 transition-colors hover:border-emerald-300/40 hover:bg-emerald-500/15"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/75">
                  {step.next.title}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {step.next.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                  {step.next.description}
                </p>
              </Link>
            )}

            {showAdvanced && step.advanced && (
              <Link
                href={step.advanced.href}
                className="rounded-[1.5rem] border border-violet-400/20 bg-violet-500/10 p-4 transition-colors hover:border-violet-300/40 hover:bg-violet-500/15"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200/75">
                  {step.advanced.title}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {step.advanced.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-violet-100/80">
                  {step.advanced.description}
                </p>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

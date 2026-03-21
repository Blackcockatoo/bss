type RouteShellLoadingProps = {
  eyebrow?: string;
  title?: string;
  detail?: string;
  compact?: boolean;
};

export function RouteShellLoading({
  eyebrow = "Meta-Pet",
  title = "Opening the next layer",
  detail = "Keeping the route shell visible while the destination catches up.",
  compact = false,
}: RouteShellLoadingProps) {
  return (
    <div
      className={`${compact ? "text-slate-100" : "min-h-[60vh] bg-slate-950 text-slate-100"}`}
    >
      <div
        className={`mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 ${compact ? "py-8" : "py-16"}`}
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            {detail}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="h-2 w-20 animate-pulse rounded-full bg-slate-800" />
                  <div className="mt-5 h-20 animate-pulse rounded-[1.5rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                  <div className="mt-4 h-3 w-28 animate-pulse rounded-full bg-slate-800" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-950/15 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Route Chrome
            </p>
            <div className="mt-4 space-y-3">
              <div className="h-3 w-28 animate-pulse rounded-full bg-cyan-500/20" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-800" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-800" />
              <div className="flex gap-2 pt-2">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300/60"
                    style={{ animationDelay: `${index * 140}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

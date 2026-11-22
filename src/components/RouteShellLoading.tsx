type RouteShellLoadingProps = {
  eyebrow?: string;
  title?: string;
  detail?: string;
  compact?: boolean;
  variant?: "dark" | "light";
};

export function RouteShellLoading({
  eyebrow = "MetaPet",
  title = "Loading",
  detail = "The next page is opening.",
  compact = false,
  variant = "dark",
}: RouteShellLoadingProps) {
  const isLight = variant === "light";

  return (
    <div
      className={`${
        compact
          ? isLight
            ? "text-slate-800"
            : "text-slate-100"
          : isLight
            ? "min-h-[30vh] bg-slate-50 text-slate-900"
            : "min-h-[60vh] bg-slate-950 text-slate-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 ${compact ? "py-8" : "py-12"}`}
      >
        <div className="space-y-3">
          <p
            className={`text-xs uppercase tracking-[0.32em] ${
              isLight ? "text-emerald-800" : "text-cyan-300/80"
            }`}
          >
            {eyebrow}
          </p>
          <p
            className={`text-2xl font-semibold tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            {title}
          </p>
          <p
            className={`max-w-2xl text-sm leading-6 ${
              isLight ? "text-slate-600" : "text-slate-400"
            }`}
          >
            {detail}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`rounded-2xl border p-4 ${
                isLight
                  ? "border-slate-200 bg-white"
                  : "border-slate-800 bg-slate-950/70"
              }`}
            >
              <div
                className={`h-2 w-20 animate-pulse rounded-full ${
                  isLight ? "bg-slate-200" : "bg-slate-800"
                }`}
              />
              <div
                className={`mt-5 h-16 animate-pulse rounded-[1.5rem] ${
                  isLight ? "bg-slate-100" : "bg-slate-800"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

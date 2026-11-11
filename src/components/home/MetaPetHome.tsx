import Link from "next/link";

import { ARCADE_GAMES, ARCADE_ROUTE } from "@/lib/games/arcade";
import { HOME_COPY, type HomeLocale } from "@/lib/homeCopy";
import { STUDIO_PORTAL_URL } from "@/lib/productSurfaces";

/*
 * The MetaPet home page, rendered in English at `/` and in Japanese and Hindi
 * at `/ja` and `/hi`. Routes, cards and the arcade registry are shared; only
 * the copy in `@/lib/homeCopy` changes per language.
 */
const PRODUCT_AREAS = [
  { href: "/pet" },
  { href: "/body-forge" },
  { href: "/digital-dna" },
  { href: "/app/activities" },
  { href: ARCADE_ROUTE },
] as const;

const FULL_PRODUCT_LINKS = [
  { key: "pet", href: "/pet" },
  { key: "identity", href: "/identity" },
  { key: "dna", href: "/digital-dna" },
  { key: "bodyForge", href: "/body-forge" },
  { key: "activities", href: "/app/activities" },
  { key: "wellness", href: "/app/wellness" },
  { key: "arcade", href: ARCADE_ROUTE },
  { key: "studio", href: STUDIO_PORTAL_URL },
] as const;

export function MetaPetHome({ locale }: { locale: HomeLocale }) {
  const t = HOME_COPY[locale];
  const productAreas = PRODUCT_AREAS.map((area, index) => ({ ...area, ...t.areas[index] }));
  return (
    <main className="min-h-screen bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-100 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_34%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              {t.eyebrow}
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                {t.title}
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-slate-300 md:text-2xl md:leading-9">
                {t.lead}
              </p>
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                {t.body}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pet"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
              >
                {t.ctaPet}
              </Link>
              <Link
                href="/digital-dna"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                {t.ctaDna}
              </Link>
              <Link
                href={ARCADE_ROUTE}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-300/50 hover:bg-orange-400/15"
              >
                {t.ctaArcade}
              </Link>
              <a
                href="/teach"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/50 hover:bg-amber-400/15"
              >
                {t.ctaTeach}
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {t.mapLabel}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {FULL_PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  {t.mapLinks[item.key]}
                </Link>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                {t.twoProductsTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {t.twoProductsBody}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
            {t.exploreEyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {t.exploreTitle}
          </h2>
          <p className="text-base leading-7 text-slate-400">
            {t.exploreBody}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {productAreas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group rounded-3xl border border-slate-800 bg-slate-900/45 p-6 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-900/75 md:p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {area.eyebrow}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                {area.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {area.description}
              </p>
              <p className="mt-6 text-sm font-semibold text-cyan-300 transition-transform group-hover:translate-x-1">
                {area.action} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* The arcade gets a real showcase rather than one line in a link grid. */}
      <section className="border-y border-slate-800 bg-slate-900/35">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300/80">
                B$S Arcade
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {t.arcadeTitle}
              </h2>
              <p className="text-base leading-7 text-slate-400">
                {t.arcadeBody}
              </p>
            </div>
            <Link
              href={ARCADE_ROUTE}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-300/50 hover:bg-orange-400/15"
            >
              {t.arcadeAll}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {ARCADE_GAMES.map((game) => (
              <article
                key={game.id}
                className={`relative overflow-hidden rounded-3xl border ${
                  game.status === "live" ? game.theme.border : "border-slate-800"
                } bg-slate-950/50 p-6`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.theme.glow}`}
                />
                <div className="relative space-y-3">
                  <span className="text-3xl" aria-hidden="true">
                    {game.theme.emoji}
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    {game.title}
                  </h3>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${game.theme.text}`}
                  >
                    {t.gameTaglines[game.id] ?? game.tagline}
                  </p>
                  {game.href ? (
                    game.external ? (
                      <a
                        href={game.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex pt-1 text-sm font-semibold text-slate-200 hover:text-white"
                      >
                        {t.play} ↗
                      </a>
                    ) : (
                      <Link
                        href={game.href}
                        className="inline-flex pt-1 text-sm font-semibold text-slate-200 hover:text-white"
                      >
                        {t.play} →
                      </Link>
                    )
                  ) : (
                    <p className="pt-1 text-sm font-semibold text-slate-500">
                      {t.comingSoon}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-10">
          <div><h2 className="text-2xl font-semibold">{t.teachersTitle}</h2>
            <p className="mt-2 text-base text-slate-300">{t.teachersBody}</p></div>
          <div className="flex flex-wrap gap-3">
            <a href="https://www.metapet.school" className="inline-flex min-h-12 items-center rounded-xl border border-amber-300/30 px-5 py-3 text-sm font-semibold text-amber-200">{t.teachersPilot}</a>
            <Link href="/teach" className="inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">{t.teachersWorkspace}</Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <a href={STUDIO_PORTAL_URL}>{t.footerPortal}</a>
        <p>{t.footerLine}</p>
      </footer>
    </main>
  );
}

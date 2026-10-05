import type { Metadata } from "next";
import Link from "next/link";

import { ARCADE_GAMES, ARCADE_ROUTE } from "@/lib/games/arcade";
import { STUDIO_PORTAL_URL } from "@/lib/productSurfaces";

export const metadata: Metadata = {
  title: "MetaPet — by Blue $nake Studios",
  description:
    "Enter the complete MetaPet world: digital companions, DNA, Body Forge, activities, wellness and the separate MetaPet Schools classroom edition.",
  openGraph: {
    title: "MetaPet — by Blue $nake Studios",
    description:
      "The complete MetaPet creative system, with MetaPet Schools kept as a focused classroom product on its own domain.",
  },
  twitter: {
    card: "summary",
    title: "MetaPet — by Blue $nake Studios",
    description:
      "Digital companions, DNA, Body Forge, activities, wellness and a clearly separated school edition.",
  },
};

const PRODUCT_AREAS = [
  {
    eyebrow: "Living companion",
    title: "MetaPet",
    description:
      "Raise, care for and explore a persistent digital companion shaped by its own genome, state and history.",
    href: "/pet",
    action: "Enter MetaPet",
  },
  {
    eyebrow: "Creature design",
    title: "Body Forge",
    description:
      "Build distinctive bodies, silhouettes, wings, surfaces and expressive systems without flattening every pet into the same template.",
    href: "/body-forge",
    action: "Open Body Forge",
  },
  {
    eyebrow: "Generative identity",
    title: "DNA Lab",
    description:
      "Inspect the deeper genetic identity behind a pet through visual, musical and symbolic interpretations of the same seed.",
    href: "/digital-dna",
    action: "Explore DNA",
  },
  {
    eyebrow: "Play and regulation",
    title: "Activities & Wellness",
    description:
      "Move between games, experiments, care loops and calm experiences that make the companion feel alive rather than decorative.",
    href: "/app/activities",
    action: "Explore activities",
  },
  {
    eyebrow: "Arcade",
    title: "Games",
    description:
      "Monkey Invaders, Bubble Hex and the progression-linked mini-game tracks, collected in one room instead of hidden behind the navigator.",
    href: ARCADE_ROUTE,
    action: "Open the arcade",
  },
] as const;

const FULL_PRODUCT_LINKS = [
  { label: "Pet", href: "/pet" },
  { label: "Identity", href: "/identity" },
  { label: "DNA", href: "/digital-dna" },
  { label: "Body Forge", href: "/body-forge" },
  { label: "Activities", href: "/app/activities" },
  { label: "Wellness", href: "/app/wellness" },
  { label: "Arcade", href: ARCADE_ROUTE },
  { label: "The Studio", href: STUDIO_PORTAL_URL },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-100 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.1),transparent_34%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-7">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-300/80">
              MetaPet · by Blue $nake Studios
            </p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                The whole MetaPet world lives here.
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-slate-300 md:text-2xl md:leading-9">
                A living companion system built from DNA, care, play, body design,
                identity and strange creative experiments.
              </p>
              <p className="max-w-2xl text-base leading-7 text-slate-400">
                One living MetaPet world. Play and explore here, start with the
                classroom lessons at MetaPet.school, or enter the teacher workspace
                when you want to teach with the deeper systems.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pet"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200"
              >
                Enter MetaPet
              </Link>
              <Link
                href="/digital-dna"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                Explore the DNA Lab
              </Link>
              <Link
                href={ARCADE_ROUTE}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-300/50 hover:bg-orange-400/15"
              >
                Enter the Arcade
              </Link>
              <a
                href="/teach"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/50 hover:bg-amber-400/15"
              >
                Teach with MetaPet
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              Full product map
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {FULL_PRODUCT_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/30 hover:text-cyan-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-sm font-semibold text-emerald-200">
                One codebase. Two clear products.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Shared engineering underneath, separate entry points and safety
                boundaries above it.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
            Explore the system
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Different parts of one living product
          </h2>
          <p className="text-base leading-7 text-slate-400">
            Each area changes how the same MetaPet identity looks, behaves, learns
            or expresses itself.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {PRODUCT_AREAS.map((area) => (
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
                And then there are the games.
              </h2>
              <p className="text-base leading-7 text-slate-400">
                Loud, self-contained, and built to be played rather than
                demonstrated.
              </p>
            </div>
            <Link
              href={ARCADE_ROUTE}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-300/50 hover:bg-orange-400/15"
            >
              See all games →
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
                    {game.tagline}
                  </p>
                  {game.href ? (
                    game.external ? (
                      <a
                        href={game.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex pt-1 text-sm font-semibold text-slate-200 hover:text-white"
                      >
                        Play ↗
                      </a>
                    ) : (
                      <Link
                        href={game.href}
                        className="inline-flex pt-1 text-sm font-semibold text-slate-200 hover:text-white"
                      >
                        Play →
                      </Link>
                    )
                  ) : (
                    <p className="pt-1 text-sm font-semibold text-slate-500">
                      Coming to the arcade
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
          <div><h2 className="text-2xl font-semibold">For teachers and schools</h2>
            <p className="mt-2 text-base text-slate-300">Seven guided classroom lessons to start. The full MetaPet toolkit when you are ready.</p></div>
          <div className="flex flex-wrap gap-3">
            <a href="https://www.metapet.school" className="inline-flex min-h-12 items-center rounded-xl border border-amber-300/30 px-5 py-3 text-sm font-semibold text-amber-200">Start the classroom pilot</a>
            <Link href="/teach" className="inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">Teacher workspace</Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <a href={STUDIO_PORTAL_URL}>Blue $nake Studios · Studio portal</a>
        <p>MetaPet · Play, explore and teach with one living system.</p>
      </footer>
    </main>
  );
}

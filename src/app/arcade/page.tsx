import type { Metadata } from "next";
import Link from "next/link";

import { ARCADE_GAMES } from "@/lib/games/arcade";
import { STUDIO_ROUTE } from "@/lib/studio/identity";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Arcade — Blue Snake Studios",
  description:
    "Every Blue Snake Studios game in one place: Monkey Invaders, Bubble Hex, and the progression-linked mini-game tracks that scale with your MetaPet.",
  openGraph: {
    title: "Blue Snake Studios Arcade",
    description:
      "Full-screen arcade games and the progression-linked mini-game tracks, in one room.",
  },
  twitter: {
    card: "summary",
    title: "Blue Snake Studios Arcade",
    description:
      "Monkey Invaders, Bubble Hex, and the mini-game tracks that scale with your companion.",
  },
};

export default function ArcadePage() {
  enforceChildSafeServerRoute("/arcade");

  return (
    <main className="min-h-screen bg-slate-950 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-slate-100 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,143,31,0.12),transparent_38%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.12),transparent_36%)]" />
        <div className="relative mx-auto w-full max-w-5xl space-y-6 px-6 py-16 md:py-20">
          <Link
            href="/"
            className="inline-flex text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 transition-colors hover:text-cyan-300"
          >
            ← Blue $nake Studios
          </Link>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
            The arcade.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Two kinds of game live here. Full-screen arcade builds you can drop
            into on any device, and mini-game tracks wired into your
            companion&apos;s evolution, ranks and mastery stars.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-14 md:py-16">
        {/* `items-start` keeps a short card its own height instead of
            stretching it to match a neighbour that carries an alt build. */}
        <div className="grid items-start gap-5 md:grid-cols-2">
          {ARCADE_GAMES.map((game) => {
            const body = (
              <>
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${game.theme.glow}`}
                />
                <div className="relative space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-3xl" aria-hidden="true">
                      {game.theme.emoji}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        game.status === "live"
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border-slate-600/50 bg-slate-800/50 text-slate-400"
                      }`}
                    >
                      {game.status === "live"
                        ? game.surface === "standalone"
                          ? "Full screen"
                          : "In app"
                        : "Not installed yet"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.22em] ${game.theme.text}`}
                    >
                      {game.tagline}
                    </p>
                    <h2 className="text-2xl font-semibold text-white">
                      {game.title}
                    </h2>
                    <p className="text-sm leading-6 text-slate-400">
                      {game.description}
                    </p>
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    {game.controls}
                  </p>

                  <ul className="flex flex-wrap gap-2">
                    {game.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-slate-400"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>

                  {game.href ? (
                    <p
                      className={`pt-1 text-sm font-semibold ${game.theme.text} transition-transform group-hover:translate-x-1`}
                    >
                      Play {game.title} →
                    </p>
                  ) : (
                    <p className="pt-1 text-sm font-semibold text-slate-500">
                      Build not committed yet
                    </p>
                  )}
                </div>
              </>
            );

            const shell =
              "group relative overflow-hidden rounded-3xl border bg-slate-900/45 p-6 md:p-7";

            // The alt build is a sibling link, so it must sit outside the card
            // anchor rather than nested inside it.
            return (
              <div key={game.id} className="flex flex-col gap-2">
                {game.href ? (
                  <Link
                    href={game.href}
                    className={`${shell} ${game.theme.border} flex-1 transition-all hover:-translate-y-0.5 hover:bg-slate-900/75`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={`${shell} flex-1 border-slate-800 opacity-70`}>
                    {body}
                  </div>
                )}

                {game.altBuild ? (
                  <a
                    href={game.altBuild.href}
                    {...(game.altBuild.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group/alt rounded-2xl border border-slate-800 bg-slate-950/60 px-5 py-4 transition-colors hover:border-slate-600 hover:bg-slate-900/60"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      {game.altBuild.label}
                      <span className="transition-transform group-hover/alt:translate-x-1">
                        {game.altBuild.external ? "↗" : "→"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {game.altBuild.note}
                    </p>
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900/35">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <h2 className="text-lg font-semibold text-white">
            Why the mini-game tracks are different
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Monkey Invaders and Bubble Hex are self-contained: they keep their
            own high scores on the device and do not touch your companion. The
            mini-game tracks do the opposite — difficulty is derived from your
            pet&apos;s evolution stage, and every result feeds rank unlocks and
            mastery stars back into the same save.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
            The arcade is part of the full Blue Snake Studios product. It is not
            part of the MetaPet Schools classroom edition, which runs a curated,
            teacher-led lesson sequence instead.
          </p>
          <Link
            href={STUDIO_ROUTE}
            className="mt-6 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            More about the studio →
          </Link>
        </div>
      </section>
    </main>
  );
}

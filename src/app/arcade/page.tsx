import type { Metadata } from "next";
import Link from "next/link";

import {
  ARCADE_GAMES,
  ARCADE_ROUTE,
  isExternalArcadeGame,
} from "@/lib/arcade/games";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Arcade | Blue Snake Studios",
  description:
    "Play the standalone Blue Snake Studios games: Monkey Invaders and Bubble Hex.",
};

export default function ArcadePage() {
  enforceChildSafeServerRoute(ARCADE_ROUTE);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:gap-10 md:py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Blue Snake Studios
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Arcade
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Standalone games, each with its own build. Pick a cabinet and play
            &mdash; no account, no save required.
          </p>
        </header>

        <ul className="grid gap-5 md:grid-cols-2">
          {ARCADE_GAMES.map((game) => {
            const external = isExternalArcadeGame(game);

            return (
              <li key={game.id}>
                <Link
                  href={game.route}
                  className={`flex h-full flex-col gap-3 rounded-3xl border border-slate-800 bg-gradient-to-br ${game.tone} p-6 transition-colors hover:border-amber-300/50`}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  <span aria-hidden className="text-4xl">
                    {game.emoji}
                  </span>
                  <span className="text-xl font-semibold">{game.title}</span>
                  <span className="text-sm leading-6 text-slate-300">
                    {game.tagline}
                  </span>
                  <span className="mt-auto text-xs text-slate-400">
                    {game.controls}
                  </span>
                  {external ? (
                    <span className="text-xs font-medium text-amber-200">
                      Opens in a new tab &rarr;
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div>
          <Link
            className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

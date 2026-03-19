import { BattleArena } from "@/components/BattleArena";
import Link from "next/link";

export default function AppBattlePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-300">
              Student App
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Battle Arena
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Enter the consciousness arena and fight the eight opponents.
            </p>
          </div>

          <Link
            href="/app/activities"
            className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-400"
          >
            Open Full Activities
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <BattleArena />
      </div>
    </main>
  );
}

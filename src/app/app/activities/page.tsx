'use client';

import { FeaturesDashboard } from '@/components/FeaturesDashboard';
import { ENABLE_CHILD_SAFE_BASELINE } from '@/lib/env/features';
import { useStore } from '@/lib/store';

export default function AppActivitiesPage() {
  const evolution = useStore((state) => state.evolution);
  const battle = useStore((state) => state.battle);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h1 className="text-2xl font-semibold text-white">Activities</h1>
        <p className="mt-2 text-zinc-300">
          Battle, explore, play mini-games, unlock cosmetics, and track
          achievements for your active companion.
          {!ENABLE_CHILD_SAFE_BASELINE &&
            " Use the navigator wheel to jump between core tools from the dashboard."}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Live progress: Level {evolution.level} · Battle streak {battle.streak}
        </p>
      </header>

      <FeaturesDashboard
        includeNavigator={!ENABLE_CHILD_SAFE_BASELINE}
        initialTab={ENABLE_CHILD_SAFE_BASELINE ? "battle" : "navigator"}
      />
    </main>
  );
}

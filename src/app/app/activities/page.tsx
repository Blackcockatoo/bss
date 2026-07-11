'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { FeaturesDashboard } from '@/components/FeaturesDashboard';
import { IS_SCHOOLS_PROFILE } from '@/lib/env/features';
import { useStore } from '@/lib/store';

type FeaturesDashboardTab =
  | 'navigator'
  | 'battle'
  | 'vimana'
  | 'games'
  | 'cosmetics'
  | 'achievements';

const VALID_TABS: readonly FeaturesDashboardTab[] = [
  'navigator',
  'battle',
  'vimana',
  'games',
  'cosmetics',
  'achievements',
];

function ActivitiesDashboard({ showNavigator }: { showNavigator: boolean }) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = VALID_TABS.includes(requestedTab as FeaturesDashboardTab)
    ? (requestedTab as FeaturesDashboardTab)
    : undefined;

  return (
    <FeaturesDashboard
      includeNavigator={showNavigator}
      initialTab={tab ?? (showNavigator ? 'navigator' : 'battle')}
    />
  );
}

export default function AppActivitiesPage() {
  const evolution = useStore((state) => state.evolution);
  const battle = useStore((state) => state.battle);
  const showNavigator = !IS_SCHOOLS_PROFILE;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h1 className="text-2xl font-semibold text-white">Activities</h1>
        <p className="mt-2 text-zinc-300">
          Battle, explore, play mini-games, unlock cosmetics, and track
          achievements for your active companion.
          {showNavigator &&
            " Use the navigator wheel to jump between core tools from the dashboard."}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Live progress: Level {evolution.level} · Battle streak {battle.streak}
        </p>
      </header>

      <Suspense
        fallback={
          <FeaturesDashboard
            includeNavigator={showNavigator}
            initialTab={showNavigator ? 'navigator' : 'battle'}
          />
        }
      >
        <ActivitiesDashboard showNavigator={showNavigator} />
      </Suspense>
    </main>
  );
}

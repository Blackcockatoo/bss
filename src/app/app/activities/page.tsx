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
      <header className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-violet-950/60 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Pick your next adventure</p>
        <h1 className="mt-2 text-3xl font-black text-white">What sounds fun today?</h1>
        <p className="mt-2 text-zinc-300">
          Play a game, explore a new world, style your pet, or collect a win.
          {showNavigator &&
            " The Navigator starts with easy adventure cards, so no spinning is required."}
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

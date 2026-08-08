'use client';

import { useSubscription } from '@/lib/pricing/hooks';

/**
 * Consumer plan badge. There is no educator or school plan to badge — the
 * complete MetaPet School experience is free, so nothing about a school is
 * represented here.
 */
export function PlanBadge() {
  const subscription = useSubscription();
  const hasCompanionPass = subscription.planId === 'consumer';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${hasCompanionPass ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-zinc-200'}`}>
      {hasCompanionPass ? 'Companion Pass' : 'Free'}
    </span>
  );
}

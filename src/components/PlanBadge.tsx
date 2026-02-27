'use client';

import { useSubscription } from '@/lib/pricing/hooks';

export function PlanBadge() {
  const subscription = useSubscription();
  const isPro = subscription.planId === 'pro';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${isPro ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-zinc-200'}`}>
      {isPro ? 'Pro' : 'Free'}
    </span>
  );
}

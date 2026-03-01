'use client';

import { useState } from 'react';
import { PricingCard } from '@/components/PricingCard';
import { PLAN_CATALOG } from '@/lib/pricing/hooks';
import { useSubscription } from '@/lib/pricing/hooks';
import type { PlanId } from '@/lib/pricing/types';

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [comingSoon, setComingSoon] = useState(false);
  const subscription = useSubscription();

  const handleUpgrade = (planId: PlanId) => {
    if (planId === 'pro') {
      setComingSoon(true);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-zinc-100">
      <h1 className="text-3xl font-bold">Meta-Pet Pricing</h1>
      <p className="mt-2 text-zinc-400">Privacy-first subscriptions. Billing integration coming soon.</p>
      <p className="mt-1 text-xs text-zinc-600 max-w-lg leading-relaxed">
        The Starter plan is designed to be genuinely useful — not a stripped-down teaser. Pro unlocks scale for educators who need it. No ads, no data harvesting, no dark patterns. We earn your trust by being honest about what you get.
      </p>

      <div className="mt-6 inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1">
        <button type="button" onClick={() => setInterval('monthly')} className={`rounded-md px-4 py-2 text-sm ${interval === 'monthly' ? 'bg-cyan-400 text-slate-950' : 'text-zinc-300'}`}>
          Monthly
        </button>
        <button type="button" onClick={() => setInterval('yearly')} className={`rounded-md px-4 py-2 text-sm ${interval === 'yearly' ? 'bg-cyan-400 text-slate-950' : 'text-zinc-300'}`}>
          Annual (save 17%)
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <PricingCard plan={PLAN_CATALOG.free} interval={interval} isCurrentPlan={subscription.planId === 'free'} onUpgrade={handleUpgrade} />
        <PricingCard plan={PLAN_CATALOG.pro} interval={interval} isCurrentPlan={subscription.planId === 'pro'} onUpgrade={handleUpgrade} />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-zinc-300">
            <tr>
              <th className="p-3">Feature</th>
              <th className="p-3">Starter</th>
              <th className="p-3">Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-800"><td className="p-3">Classes</td><td className="p-3">2</td><td className="p-3">Unlimited</td></tr>
            <tr className="border-t border-slate-800"><td className="p-3">Students per class</td><td className="p-3">25</td><td className="p-3">Unlimited</td></tr>
            <tr className="border-t border-slate-800"><td className="p-3">Assignments</td><td className="p-3">10</td><td className="p-3">Unlimited</td></tr>
            <tr className="border-t border-slate-800"><td className="p-3">Lessons in queue</td><td className="p-3">5</td><td className="p-3">Unlimited</td></tr>
            <tr className="border-t border-slate-800"><td className="p-3">Analytics retention</td><td className="p-3">7 days</td><td className="p-3">365 days</td></tr>
          </tbody>
        </table>
      </div>

      {comingSoon && <p className="mt-4 text-sm text-amber-300">Upgrade checkout is coming soon. Stripe integration is not wired yet.</p>}

      <p className="mt-8 text-center text-xs text-zinc-800 max-w-md mx-auto leading-relaxed">
        On the horizon: school-wide site licences, district partnerships, and a community add-on marketplace where educators share curriculum resources. Built by people who care about classrooms.
      </p>
    </main>
  );
}

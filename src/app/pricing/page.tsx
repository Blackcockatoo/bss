'use client';

import { useState } from 'react';
import { PLAN_CATALOG } from '@/lib/pricing/hooks';
import { useSubscription } from '@/lib/pricing/hooks';
import type { PlanAudience, PlanDefinition, PlanId } from '@/lib/pricing/types';

const AUDIENCE_LABELS: Record<PlanAudience, string> = {
  consumer: 'Individual',
  educator: 'Educator',
  institution: 'School',
};

const AUDIENCE_DESCRIPTIONS: Record<PlanAudience, string> = {
  consumer: 'A companion that grows with you — wellness, play, and personality.',
  educator: 'Class management, student DNA profiles, and curriculum tools.',
  institution: 'One license for your whole school — teachers, students, and admin.',
};

function PlanCard({
  plan,
  interval,
  isCurrentPlan,
  onUpgrade,
}: {
  plan: PlanDefinition;
  interval: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  onUpgrade: (id: PlanId) => void;
}) {
  const price = interval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
  const isSchool = plan.id === 'school';

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? 'border-cyan-400/50 bg-gradient-to-b from-cyan-950/40 to-slate-900/80 shadow-lg shadow-cyan-900/20'
          : 'border-slate-700/50 bg-slate-900/60'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/60 bg-cyan-950 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
          Most Popular
        </span>
      )}

      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{AUDIENCE_LABELS[plan.audience]}</p>
        <h3 className="mt-1 text-xl font-bold text-zinc-100">{plan.name}</h3>
        <p className="mt-0.5 text-xs font-medium text-cyan-400">{plan.tagline}</p>
      </div>

      <div className="mb-5">
        {isSchool && interval === 'monthly' ? (
          <p className="text-sm text-zinc-400">Annual billing only — $299/yr</p>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-zinc-100">
              {isFree ? 'Free' : `$${price}`}
            </span>
            {!isFree && (
              <span className="mb-1 text-xs text-zinc-500">
                /{interval === 'yearly' ? 'yr' : 'mo'}
              </span>
            )}
          </div>
        )}
        {interval === 'yearly' && !isFree && !isSchool && (
          <p className="mt-0.5 text-[11px] text-emerald-400">Save ~17% vs monthly</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">{plan.description}</p>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 shrink-0 text-sm leading-none ${feature.included ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {feature.included ? '✓' : '—'}
            </span>
            <span className={feature.included ? 'text-zinc-300' : 'text-zinc-600'}>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      <div>
        {isCurrentPlan ? (
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 py-2 text-center text-xs font-semibold text-zinc-400">
            Current Plan
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onUpgrade(plan.id)}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
              plan.highlight
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                : 'border border-zinc-600 bg-zinc-900 text-zinc-200 hover:border-zinc-400 hover:text-white'
            }`}
          >
            {isFree ? 'Get Started' : isSchool ? 'Contact Us' : 'Upgrade'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [audience, setAudience] = useState<PlanAudience>('consumer');
  const [comingSoon, setComingSoon] = useState(false);
  const [contactShown, setContactShown] = useState(false);
  const subscription = useSubscription();

  const audiencePlans = Object.values(PLAN_CATALOG).filter(
    (p) => p.audience === audience,
  );

  const handleUpgrade = (planId: PlanId) => {
    if (planId === 'school') {
      setContactShown(true);
      setComingSoon(false);
    } else {
      setComingSoon(true);
      setContactShown(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-zinc-100">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Choose Your Path</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Privacy-first. No ads, no data harvesting. Billing integration coming soon.
        </p>
      </div>

      {/* Audience Toggle */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-xl border border-slate-700 bg-slate-900/80 p-1 gap-1">
          {(['consumer', 'educator', 'institution'] as PlanAudience[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                audience === a
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {AUDIENCE_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-6 text-center text-xs text-zinc-500">{AUDIENCE_DESCRIPTIONS[audience]}</p>

      {/* Billing toggle */}
      {audience !== 'institution' && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`rounded-md px-4 py-1.5 text-sm ${interval === 'monthly' ? 'bg-cyan-400 text-slate-950' : 'text-zinc-300'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('yearly')}
              className={`rounded-md px-4 py-1.5 text-sm ${interval === 'yearly' ? 'bg-cyan-400 text-slate-950' : 'text-zinc-300'}`}
            >
              Annual (save 17%)
            </button>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className={`grid gap-6 ${audiencePlans.length === 1 ? 'max-w-sm mx-auto' : 'md:grid-cols-2'}`}>
        {audiencePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrentPlan={subscription.planId === plan.id}
            onUpgrade={handleUpgrade}
          />
        ))}
      </div>

      {comingSoon && (
        <p className="mt-5 text-center text-sm text-amber-300">
          Upgrade checkout is coming soon — Stripe integration in progress.
        </p>
      )}
      {contactShown && (
        <p className="mt-5 text-center text-sm text-cyan-300">
          For Campus License enquiries:{' '}
          <a href="mailto:themossman@bluesnakestudios.com.au" className="underline hover:text-cyan-200">
            themossman@bluesnakestudios.com.au
          </a>
        </p>
      )}

      {/* Revenue Streams Overview */}
      <section className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-8">
        <h2 className="mb-1 text-lg font-semibold">Revenue Streams at a Glance</h2>
        <p className="mb-5 text-xs text-zinc-500">
          Three parallel paths — each designed to sustain the mission without compromising the product.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Individual</p>
            <p className="mt-2 text-sm font-medium text-zinc-200">Companion Pass</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              $4.99/mo per person. Full pet experience — all addons, dream journal, wellness sync, advanced genome tools. Zero class management.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Education</p>
            <p className="mt-2 text-sm font-medium text-zinc-200">Teacher Pro + Campus License</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              $19/mo per teacher or $299/yr per school. AI lesson tools, unlimited classes, school-wide provisioning, and extended analytics.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Addon Marketplace</p>
            <p className="mt-2 text-sm font-medium text-zinc-200">Coming Soon</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Limited-edition addon drops, creator revenue share, and a community marketplace for curriculum add-ons. Drop pricing from $1.99.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-zinc-700 max-w-md mx-auto leading-relaxed">
        On the horizon: district partnerships, gifting, and a parent/guardian tier.
        Built by people who care about quality of life.
      </p>
    </main>
  );
}

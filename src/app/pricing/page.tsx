"use client";

import Link from "next/link";

import { useEnforceChildSafeClientRoute } from "@/lib/childSafeRoute.client";
import { PLAN_CATALOG, useSubscription } from "@/lib/pricing/hooks";
import type { PlanDefinition, PlanId } from "@/lib/pricing/types";
import { useState } from "react";

function PlanCard({
  plan,
  interval,
  isCurrentPlan,
  onUpgrade,
}: {
  plan: PlanDefinition;
  interval: "monthly" | "yearly";
  isCurrentPlan: boolean;
  onUpgrade: (id: PlanId) => void;
}) {
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;

  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-zinc-100">{plan.name}</h3>
        <p className="mt-0.5 text-xs font-medium text-cyan-400">
          {plan.tagline}
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-zinc-100">
            {isFree ? "Free" : `$${price}`}
          </span>
          {!isFree && (
            <span className="mb-1 text-xs text-zinc-500">
              /{interval === "yearly" ? "yr" : "mo"}
            </span>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          {plan.description}
        </p>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-0.5 shrink-0 text-sm leading-none ${feature.included ? "text-emerald-400" : "text-zinc-600"}`}
            >
              {feature.included ? "✓" : "—"}
            </span>
            <span
              className={feature.included ? "text-zinc-300" : "text-zinc-600"}
            >
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
            className="w-full rounded-xl border border-zinc-600 bg-zinc-900 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-400 hover:text-white"
          >
            {isFree ? "Get Started" : "Upgrade"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const childSafeBlocked = useEnforceChildSafeClientRoute("/pricing");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [comingSoon, setComingSoon] = useState(false);
  const subscription = useSubscription();

  if (childSafeBlocked) {
    return null;
  }

  const plans = Object.values(PLAN_CATALOG);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 text-zinc-100">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Complete MetaPet</h1>
        <p className="mt-2 text-sm text-zinc-400">
          The consumer companion from Blue $nake Studio. Privacy-first. No ads,
          no data harvesting. Billing integration is not connected yet.
        </p>
      </div>

      {/* Schools are not a paid tier and never appear in this catalogue. */}
      <section className="mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
        <h2 className="text-base font-semibold text-emerald-200">
          Looking for MetaPet School?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
          The complete classroom experience is free for every school —
          permanently, with no licence, no per-student price and no paid tier.
          Contribution is voluntary and changes nothing a class receives.
        </p>
        <Link
          href="/schools"
          className="mt-4 inline-flex rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Open MetaPet School
        </Link>
      </section>

      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-1">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={`rounded-md px-4 py-1.5 text-sm ${interval === "monthly" ? "bg-cyan-400 text-slate-950" : "text-zinc-300"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={`rounded-md px-4 py-1.5 text-sm ${interval === "yearly" ? "bg-cyan-400 text-slate-950" : "text-zinc-300"}`}
          >
            Annual
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrentPlan={subscription.planId === plan.id}
            onUpgrade={() => setComingSoon(true)}
          />
        ))}
      </div>

      {comingSoon && (
        <p className="mt-5 text-center text-sm text-amber-300">
          Checkout is not connected yet. Nothing has been charged.
        </p>
      )}
    </main>
  );
}

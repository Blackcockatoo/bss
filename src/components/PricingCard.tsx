import { Button } from '@/components/ui/button';
import type { PlanDefinition, PlanId } from '@/lib/pricing/types';

interface PricingCardProps {
  plan: PlanDefinition;
  interval: 'monthly' | 'yearly';
  isCurrentPlan: boolean;
  onUpgrade?: (planId: PlanId) => void;
}

export function PricingCard({ plan, interval, isCurrentPlan, onUpgrade }: PricingCardProps) {
  const price = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6">
      <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
      <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
      <div className="mt-4">
        <span className="text-3xl font-bold text-zinc-100">${price}</span>
        <span className="ml-2 text-sm text-zinc-400">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
      </div>
      <Button
        disabled={isCurrentPlan}
        onClick={() => onUpgrade?.(plan.id)}
        className="mt-4 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-zinc-500"
      >
        {isCurrentPlan ? 'Current Plan' : 'Upgrade to Pro'}
      </Button>
    </div>
  );
}

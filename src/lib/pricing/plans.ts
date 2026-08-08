import type { PlanDefinition, PlanFeature, PlanId, UserSubscription } from "./types";

/**
 * The Blue Snake Studios consumer catalogue.
 *
 * The previous catalogue carried a "Teacher Pro" subscription and a "Campus
 * License" priced per school. Both are gone: MetaPet School's complete core is
 * free for every school, funded by voluntary contribution rather than by a
 * licence, so a paid school tier would contradict the product it sells.
 */

const CONSUMER_FEATURES: PlanFeature[] = [
  { id: "pet-companion", label: "Meta-pet companion (Jewble)", included: true },
  { id: "basic-addons", label: "Starter addon collection", included: true },
  {
    id: "premium-addons-consumer",
    label: "Full premium addon library",
    included: true,
    consumerOnly: true,
  },
  {
    id: "dream-journal",
    label: "Dream journal & lore unlocks",
    included: true,
    consumerOnly: true,
  },
  {
    id: "genome-explorer",
    label: "Advanced genome explorer",
    included: true,
    consumerOnly: true,
  },
  {
    id: "wellness-sync",
    label: "Full wellness sync (sleep, hydration, mood)",
    included: true,
    consumerOnly: true,
  },
  {
    id: "evolution-tracking",
    label: "Evolution stage tracking",
    included: true,
  },
];

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Start here",
    description:
      "The companion, the starter addons and evolution tracking. No account required to look around.",
    audience: "consumer",
    priceMonthly: 0,
    priceYearly: 0,
    features: CONSUMER_FEATURES.map((feature) => ({
      ...feature,
      included: feature.consumerOnly ? false : feature.included,
    })),
  },
  consumer: {
    id: "consumer",
    name: "Companion Pass",
    tagline: "Your pet, fully alive",
    description:
      "For individuals who want the full Jewble experience — all addons, dream journal, advanced genome tools and complete wellness sync.",
    audience: "consumer",
    priceMonthly: 4.99,
    priceYearly: 44,
    features: CONSUMER_FEATURES,
  },
};

export function getPlan(planId: PlanId): PlanDefinition {
  return PLAN_CATALOG[planId];
}

export function createFreeSubscription(): UserSubscription {
  return {
    planId: "free",
    status: "active",
    startedAt: Date.now(),
    expiresAt: null,
    trialEndsAt: null,
    canceledAt: null,
  };
}

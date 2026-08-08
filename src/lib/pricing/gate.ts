import type { PlanId, UserSubscription } from "./types";

/**
 * Consumer feature gating for the Blue Snake Studios product.
 *
 * Nothing in MetaPet School is gated. Every classroom feature is available at
 * A$0, so no school, teacher or classroom capability appears in this map — and
 * adding one would be a change to the product promise, not a config tweak.
 */
const FEATURE_PLAN_REQUIREMENTS: Record<string, PlanId> = {
  "premium-addons-consumer": "consumer",
  "dream-journal": "consumer",
  "genome-explorer": "consumer",
  "wellness-sync": "consumer",
};

function resolveRequiredPlan(featureId: string): PlanId {
  return FEATURE_PLAN_REQUIREMENTS[featureId] ?? "free";
}

export function canAccess(
  featureId: string,
  subscription: UserSubscription,
): boolean {
  const requiredPlan = resolveRequiredPlan(featureId);
  if (requiredPlan === "free") return true;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  if (!isActive) return false;

  return subscription.planId === requiredPlan;
}

export function getPlanRequired(featureId: string): PlanId {
  return resolveRequiredPlan(featureId);
}

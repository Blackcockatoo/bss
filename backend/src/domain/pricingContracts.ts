import type { PlanId, SubscriptionStatus } from '../../../shared/contracts/pricing';

const PLAN_IDS: PlanId[] = ['free', 'pro'];
const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['active', 'trialing', 'expired', 'canceled'];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function validatePlanId(planId: string): PlanId {
  assert(PLAN_IDS.includes(planId as PlanId), `planId must be one of: ${PLAN_IDS.join(', ')}`);
  return planId as PlanId;
}

export function validateSubscriptionStatus(status: string): SubscriptionStatus {
  assert(
    SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus),
    `subscription status must be one of: ${SUBSCRIPTION_STATUSES.join(', ')}`
  );
  return status as SubscriptionStatus;
}

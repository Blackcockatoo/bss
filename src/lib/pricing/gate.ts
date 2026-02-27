import { getPlan, UNLIMITED } from './plans';
import type { PlanId, UserSubscription } from './types';

const FEATURE_PLAN_REQUIREMENTS: Record<string, PlanId> = {
  'advanced-analytics': 'pro',
  'data-export': 'pro',
  'ai-lesson-suggestions': 'pro',
  'custom-standards-mapping': 'pro',
  'priority-support': 'pro',
  'premium-addons': 'pro',
};

const RESOURCE_LIMIT_KEYS = {
  classes: 'maxClasses',
  students: 'maxStudentsPerClass',
  assignments: 'maxAssignments',
  'lessons-queue': 'maxLessonsInQueue',
  'analytics-retention-days': 'analyticsRetentionDays',
} as const;

type LimitResource = keyof typeof RESOURCE_LIMIT_KEYS;

function resolveRequiredPlan(featureId: string): PlanId {
  return FEATURE_PLAN_REQUIREMENTS[featureId] ?? 'free';
}

export function canAccess(featureId: string, subscription: UserSubscription): boolean {
  const requiredPlan = resolveRequiredPlan(featureId);
  if (requiredPlan === 'free') return true;
  return subscription.planId === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing');
}

export function getPlanRequired(featureId: string): PlanId {
  return resolveRequiredPlan(featureId);
}

export function getRemainingQuota(resource: LimitResource, currentCount: number, subscription: UserSubscription): number {
  const plan = getPlan(subscription.planId);
  const limitKey = RESOURCE_LIMIT_KEYS[resource];
  const limit = plan.limits[limitKey];

  if (limit === UNLIMITED) return UNLIMITED;
  return Math.max(limit - currentCount, 0);
}

export function isAtLimit(resource: LimitResource, currentCount: number, subscription: UserSubscription): boolean {
  const remaining = getRemainingQuota(resource, currentCount, subscription);
  return remaining !== UNLIMITED && remaining <= 0;
}

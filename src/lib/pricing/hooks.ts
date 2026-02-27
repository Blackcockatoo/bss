'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { canAccess, getPlanRequired, getRemainingQuota, isAtLimit } from './gate';
import { getPlan, PLAN_CATALOG } from './plans';

const FALLBACK_SUBSCRIPTION = {
  planId: 'free',
  status: 'active',
  startedAt: 0,
  expiresAt: null,
  trialEndsAt: null,
  canceledAt: null,
} as const;

export function useSubscription() {
  const user = useAuthStore((state) => state.currentUser);
  return user?.subscription ?? FALLBACK_SUBSCRIPTION;
}

export function usePlanLimits() {
  const subscription = useSubscription();
  return useMemo(() => getPlan(subscription.planId).limits, [subscription.planId]);
}

export function useFeatureGate(featureId: string) {
  const subscription = useSubscription();

  return useMemo(() => ({
    allowed: canAccess(featureId, subscription),
    planRequired: getPlanRequired(featureId),
  }), [featureId, subscription]);
}

export function useQuota(resource: 'classes' | 'students' | 'assignments' | 'lessons-queue' | 'analytics-retention-days', currentCount: number) {
  const subscription = useSubscription();

  return useMemo(() => ({
    remaining: getRemainingQuota(resource, currentCount, subscription),
    atLimit: isAtLimit(resource, currentCount, subscription),
  }), [currentCount, resource, subscription]);
}

export { PLAN_CATALOG };

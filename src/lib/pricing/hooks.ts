'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import { canAccess, getPlanRequired } from './gate';
import { PLAN_CATALOG } from './plans';

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

export function useFeatureGate(featureId: string) {
  const subscription = useSubscription();

  return useMemo(() => ({
    allowed: canAccess(featureId, subscription),
    planRequired: getPlanRequired(featureId),
  }), [featureId, subscription]);
}

export { PLAN_CATALOG };

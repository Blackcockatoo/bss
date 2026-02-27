import type { PlanDefinition, PlanFeature, PlanId, PlanLimits, UserSubscription } from './types';

export const UNLIMITED = -1;

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxClasses: 2,
    maxStudentsPerClass: 25,
    maxAssignments: 10,
    maxLessonsInQueue: 5,
    analyticsRetentionDays: 7,
  },
  pro: {
    maxClasses: UNLIMITED,
    maxStudentsPerClass: UNLIMITED,
    maxAssignments: UNLIMITED,
    maxLessonsInQueue: UNLIMITED,
    analyticsRetentionDays: 365,
  },
};

const FEATURE_MATRIX: PlanFeature[] = [
  { id: 'basic-analytics', label: 'Basic analytics', included: true },
  { id: 'advanced-analytics', label: 'Advanced analytics (365-day retention)', included: true, proOnly: true },
  { id: 'student-dna-profiles', label: 'Student DNA profiles', included: true },
  { id: 'data-export', label: 'Data export (CSV)', included: true, proOnly: true },
  { id: 'ai-lesson-suggestions', label: 'AI-powered lesson suggestions', included: true, proOnly: true },
  { id: 'custom-standards-mapping', label: 'Custom standards mapping', included: true, proOnly: true },
  { id: 'priority-support', label: 'Priority support badge', included: true, proOnly: true },
  { id: 'premium-addons', label: 'Premium addons access', included: true, proOnly: true },
];

function projectFeatures(planId: PlanId): PlanFeature[] {
  return FEATURE_MATRIX.map((feature) => ({
    ...feature,
    included: feature.proOnly ? planId === 'pro' : feature.included,
  }));
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Starter',
    description: 'Built for individual educators and pilot classrooms.',
    priceMonthly: 0,
    priceYearly: 0,
    limits: PLAN_LIMITS.free,
    features: projectFeatures('free'),
  },
  pro: {
    id: 'pro',
    name: 'Teacher Pro',
    description: 'Unlimited classrooms, richer analytics, and premium teaching tools.',
    priceMonthly: 19,
    priceYearly: 190,
    limits: PLAN_LIMITS.pro,
    features: projectFeatures('pro'),
  },
};

export function getPlan(planId: PlanId): PlanDefinition {
  return PLAN_CATALOG[planId];
}

export function createFreeSubscription(): UserSubscription {
  return {
    planId: 'free',
    status: 'active',
    startedAt: Date.now(),
    expiresAt: null,
    trialEndsAt: null,
    canceledAt: null,
  };
}

export function formatLimit(value: number, unit: string): string {
  if (value === UNLIMITED) return 'Unlimited';
  return `${value} ${unit}`;
}

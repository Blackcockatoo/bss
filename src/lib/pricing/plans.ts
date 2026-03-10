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
  consumer: {
    maxClasses: 0,
    maxStudentsPerClass: 0,
    maxAssignments: 0,
    maxLessonsInQueue: 0,
    analyticsRetentionDays: 90,
  },
  pro: {
    maxClasses: UNLIMITED,
    maxStudentsPerClass: UNLIMITED,
    maxAssignments: UNLIMITED,
    maxLessonsInQueue: UNLIMITED,
    analyticsRetentionDays: 365,
  },
  school: {
    maxClasses: UNLIMITED,
    maxStudentsPerClass: UNLIMITED,
    maxAssignments: UNLIMITED,
    maxLessonsInQueue: UNLIMITED,
    analyticsRetentionDays: 730,
  },
};

const EDUCATOR_FEATURES: PlanFeature[] = [
  { id: 'basic-analytics', label: 'Basic class analytics', included: true },
  { id: 'advanced-analytics', label: 'Advanced analytics (365-day)', included: true, proOnly: true },
  { id: 'student-dna-profiles', label: 'Student DNA profiles', included: true },
  { id: 'data-export', label: 'Data export (CSV)', included: true, proOnly: true },
  { id: 'ai-lesson-suggestions', label: 'AI-powered lesson suggestions', included: true, proOnly: true },
  { id: 'custom-standards-mapping', label: 'Custom standards mapping', included: true, proOnly: true },
  { id: 'priority-support', label: 'Priority support', included: true, proOnly: true },
  { id: 'premium-addons', label: 'Premium addons access', included: true, proOnly: true },
];

const CONSUMER_FEATURES: PlanFeature[] = [
  { id: 'pet-companion', label: 'Meta-pet companion (Jewble)', included: true },
  { id: 'basic-addons', label: 'Starter addon collection', included: true },
  { id: 'premium-addons-consumer', label: 'Full premium addon library', included: true, consumerOnly: true },
  { id: 'dream-journal', label: 'Dream journal & lore unlocks', included: true, consumerOnly: true },
  { id: 'genome-explorer', label: 'Advanced genome explorer', included: true, consumerOnly: true },
  { id: 'wellness-sync', label: 'Full wellness sync (sleep, hydration, mood)', included: true, consumerOnly: true },
  { id: 'evolution-tracking', label: 'Evolution stage tracking', included: true },
];

const SCHOOL_FEATURES: PlanFeature[] = [
  ...EDUCATOR_FEATURES.map(f => ({ ...f, included: true, proOnly: false })),
  { id: 'unlimited-teachers', label: 'Unlimited teacher accounts', included: true, schoolOnly: true },
  { id: 'student-cap-500', label: 'Up to 500 student profiles', included: true, schoolOnly: true },
  { id: 'custom-branding', label: 'Custom school branding (coming soon)', included: true, schoolOnly: true },
  { id: 'admin-dashboard', label: 'School admin dashboard', included: true, schoolOnly: true },
  { id: 'bulk-dna', label: 'Bulk student DNA provisioning', included: true, schoolOnly: true },
  { id: 'extended-analytics', label: 'Extended analytics (730-day)', included: true, schoolOnly: true },
];

function projectEducatorFeatures(planId: 'free' | 'pro'): PlanFeature[] {
  return EDUCATOR_FEATURES.map((feature) => ({
    ...feature,
    included: feature.proOnly ? planId === 'pro' : feature.included,
  }));
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'Begin the journey',
    description: 'Built for individual educators and pilot classrooms. Genuinely useful — not a stripped-down teaser.',
    audience: 'educator',
    priceMonthly: 0,
    priceYearly: 0,
    limits: PLAN_LIMITS.free,
    features: projectEducatorFeatures('free'),
  },
  consumer: {
    id: 'consumer',
    name: 'Companion Pass',
    tagline: 'Your pet, fully alive',
    description: 'For individuals who want the full Jewble experience — all addons, dream journal, advanced genome tools, and complete wellness sync.',
    audience: 'consumer',
    priceMonthly: 4.99,
    priceYearly: 44,
    limits: PLAN_LIMITS.consumer,
    features: CONSUMER_FEATURES,
    highlight: true,
  },
  pro: {
    id: 'pro',
    name: 'Teacher Pro',
    tagline: 'Scale your classroom',
    description: 'Unlimited classrooms, richer analytics, AI lesson suggestions, and premium teaching tools.',
    audience: 'educator',
    priceMonthly: 19,
    priceYearly: 190,
    limits: PLAN_LIMITS.pro,
    features: projectEducatorFeatures('pro'),
    highlight: true,
  },
  school: {
    id: 'school',
    name: 'Campus License',
    tagline: 'School-wide consciousness',
    description: 'One license covers your whole school — unlimited teachers, up to 500 students, admin dashboard, and extended analytics.',
    audience: 'institution',
    priceMonthly: 0,
    priceYearly: 299,
    limits: PLAN_LIMITS.school,
    features: SCHOOL_FEATURES,
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
  if (value === 0) return '—';
  return `${value} ${unit}`;
}

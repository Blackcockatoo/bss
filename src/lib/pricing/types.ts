export type PlanId = 'free' | 'consumer' | 'pro' | 'school';

export type PlanAudience = 'consumer' | 'educator' | 'institution';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  description: string;
  audience: PlanAudience;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  features: PlanFeature[];
  highlight?: boolean;
}

export interface PlanLimits {
  maxClasses: number;
  maxStudentsPerClass: number;
  maxAssignments: number;
  maxLessonsInQueue: number;
  analyticsRetentionDays: number;
}

export interface PlanFeature {
  id: string;
  label: string;
  included: boolean;
  proOnly?: boolean;
  consumerOnly?: boolean;
  schoolOnly?: boolean;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'canceled';

export interface UserSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  startedAt: number;
  expiresAt: number | null;
  trialEndsAt: number | null;
  canceledAt: number | null;
}

export type PlanId = 'free' | 'pro';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  features: PlanFeature[];
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

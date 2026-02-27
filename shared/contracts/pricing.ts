export type PlanId = 'free' | 'pro';

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'canceled';

export interface PlanLimits {
  maxClasses: number;
  maxStudentsPerClass: number;
  maxAssignments: number;
  maxLessonsInQueue: number;
  analyticsRetentionDays: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
}

export interface SubscriptionDto {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  startedAt: number;
  expiresAt: number | null;
}

export interface UpgradeSubscriptionRequest {
  planId: PlanId;
  billingInterval: 'monthly' | 'yearly';
}

export interface UpgradeSubscriptionResponse {
  checkoutReady: boolean;
  message: string;
}

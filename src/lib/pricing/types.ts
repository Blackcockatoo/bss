/**
 * Pricing types for the Blue Snake Studios consumer product.
 *
 * MetaPet School is deliberately absent from this file. The complete school
 * experience is free, with a voluntary contribution instead of a licence, so
 * there is no school plan, no per-student tier and no educator upgrade to
 * model here. See `@/lib/schools/contribution` for the school side.
 */

export type PlanId = "free" | "consumer";

export type PlanAudience = "consumer";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  description: string;
  audience: PlanAudience;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeature[];
}

export interface PlanFeature {
  id: string;
  label: string;
  included: boolean;
  consumerOnly?: boolean;
}

export type SubscriptionStatus = "active" | "trialing" | "expired" | "canceled";

export interface UserSubscription {
  planId: PlanId;
  status: SubscriptionStatus;
  startedAt: number;
  expiresAt: number | null;
  trialEndsAt: number | null;
  canceledAt: number | null;
}

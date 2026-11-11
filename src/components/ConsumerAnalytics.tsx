"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

import { isAnalyticsAllowedPathname } from "@/lib/analyticsBoundary";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

/**
 * Product analytics are a Blue Snake Studios consumer concern only.
 *
 * MetaPet School's governance pack states that the school runtime carries no
 * analytics SDK, and Field Mode is a child-facing classroom surface. Mounting
 * `<Analytics />` in the shared root layout would have made that statement
 * false on every classroom page, so the beacon is gated twice:
 *
 * 1. build profile — the schools build never mounts it at all;
 * 2. pathname: analytics is default-off and only mounts on an explicit
 *    allowlist of adult marketing pages (see `analyticsBoundary.ts`). It never
 *    mounts on pet, play, identity, DNA, arcade, Moss60, school, teacher, Field
 *    Mode or governance routes.
 *
 * The pathname check is the one that matters: Field Mode is reachable from the
 * combined production build, so a build-time flag alone would not hold.
 */
export function ConsumerAnalytics() {
  const pathname = usePathname();

  if (IS_SCHOOLS_PROFILE) {
    return null;
  }

  if (!isAnalyticsAllowedPathname(pathname)) {
    return null;
  }

  return <Analytics />;
}

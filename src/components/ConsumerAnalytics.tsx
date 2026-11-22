"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { isAnalyticsAllowedPathname } from "@/lib/analyticsBoundary";
import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
);

/**
 * Product analytics are a Blue Snake Studios consumer concern only.
 *
 * MetaPet School's governance pack states that the school runtime carries no
 * analytics SDK, and the classroom surface is a child-facing learning tool.
 * Mounting `<Analytics />` in the shared root layout would have made that
 * statement false on every classroom page, so the beacon is gated twice:
 *
 * 1. build profile — the schools build never mounts it at all;
 * 2. pathname — the shared Blue Snake Studios build never mounts it on a
 *    school, teacher, classroom, or school-governance route.
 *
 * The pathname check is the one that matters: classroom routes are reachable
 * from the combined production build, so a build-time flag alone would not hold.
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

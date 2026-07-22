/**
 * Per-surface routing policy.
 *
 * The middleware asks a single question for every request:
 *   given the active {@link ProductSurface} and a pathname, what should happen?
 *
 * The answer is a {@link RouteDecision}:
 *   - `next`             → serve the route as-is
 *   - `rewrite`          → serve a different internal route under a clean URL
 *   - `redirect`         → same-origin redirect (e.g. blocked → school home)
 *   - `redirect-external`→ cross-domain redirect (studio → school domain)
 *
 * Keeping this pure and dependency-free makes the boundary trivially testable
 * and safe to run in Edge middleware.
 */

import {
  SCHOOL_ORIGIN,
  type ProductSurface,
} from "./surface";

export type RouteDecision =
  | { type: "next" }
  | { type: "rewrite"; pathname: string }
  | { type: "redirect"; pathname: string; permanent?: boolean }
  | { type: "redirect-external"; url: string; permanent?: boolean };

export interface RouteContext {
  surface: ProductSurface;
  pathname: string;
}

/**
 * Clean school URLs → internal implementation routes.
 *
 * The public school domain uses school-native URLs; internally we reuse the
 * existing `/schools/*`, `/school-game`, and `/legal/*` implementations rather
 * than duplicating pages.
 */
export const SCHOOL_REWRITES: Record<string, string> = {
  "/": "/schools",
  "/field": "/schools/field",
  "/lessons": "/schools/lessons",
  "/classroom": "/school-game",
  "/teacher-guide": "/schools/teacher-guide",
  "/parents": "/schools/parents",
  "/safety": "/schools/safeguarding",
  "/privacy": "/legal/privacy",
  "/contact": "/schools/contact",
  "/start": "/school-game",
};

/**
 * Internal route prefixes that remain reachable on the school domain. These
 * back the clean URLs above and the internally-supported `/schools/*` pack.
 * Everything else on the school surface is redirected to the school home.
 */
const SCHOOL_INTERNAL_ALLOWED_EXACT = new Set<string>([
  "/schools",
  "/school-game",
  "/legal",
]);

const SCHOOL_INTERNAL_ALLOWED_PREFIXES = [
  "/schools/",
  "/legal/",
  "/docs/schools-au/",
];

/** Static assets and metadata routes that must never be redirected. */
const SHARED_ASSET_EXACT = new Set<string>([
  "/icon.svg",
  "/favicon.ico",
  "/manifest.json",
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
  "/sitemap.xml",
]);

const SHARED_ASSET_PREFIXES = ["/_next/", "/api/", "/assets/", "/images/"];

function isSharedAsset(pathname: string): boolean {
  if (SHARED_ASSET_EXACT.has(pathname)) {
    return true;
  }

  if (SHARED_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // File-like requests (something.ext) are assets, never app routes.
  const lastSegment = pathname.split("/").pop() ?? "";
  return lastSegment.includes(".");
}

/**
 * Old public school URLs on the studio domain → their school-domain
 * equivalents. Anything under `/schools` not listed here falls back to the
 * school home so no consumer route ever "owns" school content.
 */
const STUDIO_SCHOOL_EXTERNAL_MAP: Record<string, string> = {
  "/schools": "/",
  "/schools/field": "/field",
  "/schools/lessons": "/lessons",
  "/schools/parents": "/parents",
  "/schools/safeguarding": "/safety",
  "/schools/teacher-guide": "/teacher-guide",
  "/schools/contact": "/contact",
};

function isSchoolInternalAllowed(pathname: string): boolean {
  if (SCHOOL_INTERNAL_ALLOWED_EXACT.has(pathname)) {
    return true;
  }

  return SCHOOL_INTERNAL_ALLOWED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function evaluateSchoolRoute(pathname: string): RouteDecision {
  // Clean URL → internal implementation.
  const rewriteTarget = SCHOOL_REWRITES[pathname];
  if (rewriteTarget) {
    return { type: "rewrite", pathname: rewriteTarget };
  }

  // Internally-supported implementation routes stay reachable.
  if (isSchoolInternalAllowed(pathname)) {
    return { type: "next" };
  }

  // Anything else (wallet, body-forge, breeding, marketplace, consumer
  // onboarding, studio projects, …) is not part of the school product.
  // Redirect to the school home rather than exposing it.
  return { type: "redirect", pathname: "/" };
}

function evaluateStudioRoute(pathname: string): RouteDecision {
  // Old public school URLs move to the dedicated school domain so the two
  // products never both index the same school content.
  if (pathname === "/schools" || pathname.startsWith("/schools/")) {
    // Known public school pages map to their clean school-domain URL; any other
    // deep/internal school link lands safely on the school home.
    const target = STUDIO_SCHOOL_EXTERNAL_MAP[pathname] ?? "/";
    return {
      type: "redirect-external",
      url: `${SCHOOL_ORIGIN}${target}`,
      permanent: true,
    };
  }

  // The studio surface keeps the complete ecosystem available.
  return { type: "next" };
}

export function evaluateRoute(context: RouteContext): RouteDecision {
  const { surface, pathname } = context;

  // Never touch static assets / framework routes on any surface.
  if (isSharedAsset(pathname)) {
    return { type: "next" };
  }

  return surface === "school"
    ? evaluateSchoolRoute(pathname)
    : evaluateStudioRoute(pathname);
}

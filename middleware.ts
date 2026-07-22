import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { APP_PROFILE } from "./src/lib/env/features";
import { evaluateRoute } from "./src/lib/domain/routePolicy";
import {
  isProductSurface,
  resolveProductSurface,
  type ProductSurface,
} from "./src/lib/domain/surface";

const DEFAULT_CANONICAL_ORIGIN = "https://www.bluesnakestudios.com";
const CORE_HOST_ALIASES = new Set([
  "bluesnakestudios.com",
  "www.bluesnakestudios.com",
]);

/** Header the app reads to render the correct surface (metadata, nav, …). */
export const SURFACE_HEADER = "x-metapet-surface";

function getCanonicalOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const parsed = new URL(configured || DEFAULT_CANONICAL_ORIGIN);
    return new URL(parsed.origin);
  } catch {
    return new URL(DEFAULT_CANONICAL_ORIGIN);
  }
}

function isProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV)
  );
}

/**
 * Determine an explicit surface override that always wins over hostname
 * resolution.
 *
 * - A build-time single-surface deployment (NEXT_PUBLIC_APP_PROFILE=schools)
 *   forces the school surface everywhere. This preserves the existing
 *   standalone school pilot behaviour.
 * - A dev-only override (NEXT_PUBLIC_DEV_SURFACE env or `?surface=` query)
 *   lets either surface be tested locally / on previews WITHOUT editing
 *   source. It is refused in production so a public query parameter can never
 *   bypass the school safety boundary.
 */
function getSurfaceOverride(request: NextRequest): ProductSurface | null {
  if (APP_PROFILE === "schools") {
    return "school";
  }

  if (isProductionRuntime()) {
    return null;
  }

  const queryOverride = request.nextUrl.searchParams.get("surface");
  if (isProductSurface(queryOverride)) {
    return queryOverride;
  }

  const envOverride = process.env.NEXT_PUBLIC_DEV_SURFACE?.trim();
  if (isProductSurface(envOverride)) {
    return envOverride;
  }

  return null;
}

function shouldRedirectToCanonicalOrigin(request: NextRequest): boolean {
  const requestHost = request.nextUrl.hostname.toLowerCase();
  const canonicalHost = getCanonicalOrigin().hostname.toLowerCase();

  if (!requestHost || requestHost === canonicalHost) {
    return false;
  }

  const isKnownCoreAlias = CORE_HOST_ALIASES.has(requestHost);
  const isProductionVercelAlias =
    process.env.VERCEL_ENV === "production" &&
    requestHost.endsWith(".vercel.app");

  return isKnownCoreAlias || isProductionVercelAlias;
}

function redirectToCanonicalOrigin(request: NextRequest): NextResponse {
  const canonicalOrigin = getCanonicalOrigin();
  const redirectUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    canonicalOrigin,
  );

  return NextResponse.redirect(redirectUrl, 308);
}

function withSurfaceHeader(
  response: NextResponse,
  surface: ProductSurface,
): NextResponse {
  response.headers.set(SURFACE_HEADER, surface);
  return response;
}

function passthroughWithSurface(
  request: NextRequest,
  surface: ProductSurface,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SURFACE_HEADER, surface);
  return withSurfaceHeader(
    NextResponse.next({ request: { headers: requestHeaders } }),
    surface,
  );
}

export function middleware(request: NextRequest) {
  const surface = resolveProductSurface(request.nextUrl.hostname, {
    override: getSurfaceOverride(request),
  });

  // Studio-only canonical host consolidation (bare domain / prod aliases → www).
  if (surface === "studio" && shouldRedirectToCanonicalOrigin(request)) {
    return redirectToCanonicalOrigin(request);
  }

  const decision = evaluateRoute({
    surface,
    pathname: request.nextUrl.pathname,
  });

  switch (decision.type) {
    case "rewrite": {
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      // Preserve query strings on internal rewrites (clean URL → impl route).
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(SURFACE_HEADER, surface);
      return withSurfaceHeader(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
        surface,
      );
    }
    case "redirect": {
      const url = request.nextUrl.clone();
      url.pathname = decision.pathname;
      // Drop query on safety redirects so blocked params never carry through.
      url.search = "";
      return withSurfaceHeader(
        NextResponse.redirect(url, decision.permanent ? 308 : 307),
        surface,
      );
    }
    case "redirect-external": {
      return withSurfaceHeader(
        NextResponse.redirect(decision.url, decision.permanent ? 308 : 307),
        surface,
      );
    }
    default:
      return passthroughWithSurface(request, surface);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

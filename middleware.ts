import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "./src/lib/childSafeBaseline";
import {
  APP_PROFILE,
  ENFORCE_CHILD_SAFE_BOUNDARY,
} from "./src/lib/env/features";

const DEFAULT_CANONICAL_ORIGIN = "https://www.bluesnakestudios.com";
const CORE_HOST_ALIASES = new Set([
  "bluesnakestudios.com",
  "www.bluesnakestudios.com",
]);

function getCanonicalOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const parsed = new URL(configured || DEFAULT_CANONICAL_ORIGIN);
    return new URL(parsed.origin);
  } catch {
    return new URL(DEFAULT_CANONICAL_ORIGIN);
  }
}

function shouldRedirectToCanonicalOrigin(request: NextRequest): boolean {
  if (APP_PROFILE !== "core") {
    return false;
  }

  const requestHost = request.nextUrl.hostname.toLowerCase();
  const canonicalHost = getCanonicalOrigin().hostname.toLowerCase();

  if (!requestHost || requestHost === canonicalHost) {
    return false;
  }

  const isKnownCoreAlias = CORE_HOST_ALIASES.has(requestHost);
  const isProductionVercelAlias =
    process.env.VERCEL_ENV === "production" && requestHost.endsWith(".vercel.app");

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

export function middleware(request: NextRequest) {
  if (shouldRedirectToCanonicalOrigin(request)) {
    return redirectToCanonicalOrigin(request);
  }

  // Single source of truth (src/lib/env/features.ts) decides whether the
  // request-time child-safe boundary is active. When it is off there is nothing
  // to enforce and every request passes through untouched.
  if (!ENFORCE_CHILD_SAFE_BOUNDARY) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (APP_PROFILE === "schools" && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/schools";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isChildSafeAllowedPathname(pathname)) {
    return NextResponse.next();
  }

  // API/data requests must be denied cleanly instead of 3xx-redirected to an
  // HTML page. A fetch() that transparently follows a redirect into /schools
  // would otherwise receive a 200 HTML document, masking the block from callers
  // and error handling. Return an opaque 404 so the route is denied and its
  // existence is not disclosed on the schools surface.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getChildSafeFallbackPathname(pathname);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getChildSafeFallbackPathname,
  isChildSafeAllowedPathname,
} from "./src/lib/childSafeBaseline";
import { APP_PROFILE } from "./src/lib/env/features";

const DEFAULT_CANONICAL_ORIGIN = "https://www.bluesnakestudios.com";
const CORE_HOST_ALIASES = new Set([
  "bluesnakestudios.com",
  "www.bluesnakestudios.com",
]);

function isEnabled(value: string | undefined): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

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

const CHILD_SAFE_BASELINE_ENABLED = isEnabled(
  process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE,
);

export function middleware(request: NextRequest) {
  if (shouldRedirectToCanonicalOrigin(request)) {
    return redirectToCanonicalOrigin(request);
  }

  if (!CHILD_SAFE_BASELINE_ENABLED) {
    if (APP_PROFILE !== "schools") {
      return NextResponse.next();
    }
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

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getChildSafeFallbackPathname(pathname);
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_EXIT_PATH,
  fieldModeCookieOptions,
  getPolicyFallbackPathname,
  isFieldModePathname,
  isPathnameAllowedByPolicy,
  type ChildSafePolicyId,
} from "@/lib/childSafeBaseline";
import {
  APP_PROFILE,
  ENFORCE_CHILD_SAFE_BOUNDARY,
} from "@/lib/env/features";

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
  if (APP_PROFILE !== "core") return false;

  const requestHost = request.nextUrl.hostname.toLowerCase();
  const canonicalHost = getCanonicalOrigin().hostname.toLowerCase();
  if (!requestHost || requestHost === canonicalHost) return false;

  return (
    CORE_HOST_ALIASES.has(requestHost) ||
    (process.env.VERCEL_ENV === "production" &&
      requestHost.endsWith(".vercel.app"))
  );
}

function redirectToCanonicalOrigin(request: NextRequest): NextResponse {
  const redirectUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    getCanonicalOrigin(),
  );
  return NextResponse.redirect(redirectUrl, 308);
}

function fieldCookieIsActive(request: NextRequest): boolean {
  if (
    request.cookies.get(FIELD_MODE_COOKIE)?.value === FIELD_MODE_COOKIE_VALUE
  ) {
    return true;
  }

  // Keep the policy resilient in edge runtimes/test adapters that expose the
  // raw Cookie header before populating NextRequest.cookies.
  return (request.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .some(
      (cookie) =>
        cookie === `${FIELD_MODE_COOKIE}=${FIELD_MODE_COOKIE_VALUE}`,
    );
}

function activePolicyId(request: NextRequest): ChildSafePolicyId | null {
  const { pathname } = request.nextUrl;
  if (fieldCookieIsActive(request) || isFieldModePathname(pathname)) {
    return "field";
  }
  if (ENFORCE_CHILD_SAFE_BOUNDARY) {
    return APP_PROFILE === "schools" ? "schools" : "core";
  }
  return null;
}

function activateFieldCookie(
  response: NextResponse,
  request: NextRequest,
): NextResponse {
  const { pathname } = request.nextUrl;
  if (
    isFieldModePathname(pathname) &&
    pathname !== FIELD_MODE_EXIT_PATH &&
    !fieldCookieIsActive(request)
  ) {
    response.cookies.set(
      FIELD_MODE_COOKIE,
      FIELD_MODE_COOKIE_VALUE,
      fieldModeCookieOptions(request.nextUrl.protocol === "https:"),
    );
  }
  return response;
}

export function proxy(request: NextRequest) {
  if (shouldRedirectToCanonicalOrigin(request)) {
    return redirectToCanonicalOrigin(request);
  }

  const { pathname } = request.nextUrl;
  const policyId = activePolicyId(request);

  if (!policyId) return NextResponse.next();

  if (policyId === "schools" && pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/schools";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isPathnameAllowedByPolicy(pathname, policyId)) {
    return activateFieldCookie(NextResponse.next(), request);
  }

  // Fetch callers must receive a real denial, not a redirect that resolves to
  // a 200 HTML page. The opaque response also avoids disclosing API inventory.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getPolicyFallbackPathname(policyId);
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

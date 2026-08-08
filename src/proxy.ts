import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_EXIT_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_UI_COOKIE,
  fieldModeCookieOptions,
  fieldModeUiCookieOptions,
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
const METAPET_SCHOOL_HOST_ALIASES = new Set([
  "metapet.school",
  "www.metapet.school",
]);

const METAPET_SCHOOL_CLEAN_ROUTES = new Map<string, string>([
  ["/lessons", "/schools/field/lessons"],
  ["/classroom", "/schools/field/classroom"],
  ["/offline", "/schools/field/offline"],
  ["/guide", "/schools/field/guide"],
  ["/safety", "/schools/field/safety"],
  ["/privacy", "/schools/field/privacy"],
  ["/pricing", "/schools/field/pricing"],
  ["/why-free", "/schools/field/why-free"],
  ["/trust", "/schools/field/trust"],
]);

function normalizeHost(value: string | null | undefined): string {
  if (!value) return "";
  // `x-forwarded-host` may carry a proxy chain; the first entry is the client
  // facing host. Port numbers are not part of the identity comparison.
  const first = value.split(",")[0] ?? "";
  return first.trim().toLowerCase().split(":")[0] ?? "";
}

/**
 * The whole domain product split keys off this value, so it must survive
 * proxying. `nextUrl.hostname` reports the internal origin rather than the
 * public domain whenever the app is served behind a proxy, which would hand
 * the full consumer product to metapet.school visitors. Forwarded headers are
 * consulted first and the parsed URL is kept as the local fallback.
 */
function getRequestHost(request: NextRequest): string {
  return (
    normalizeHost(request.headers.get("x-forwarded-host")) ||
    normalizeHost(request.headers.get("host")) ||
    normalizeHost(request.nextUrl.hostname)
  );
}

function isMetaPetSchoolHost(request: NextRequest): boolean {
  return METAPET_SCHOOL_HOST_ALIASES.has(getRequestHost(request));
}

/**
 * Same-host redirect target. `nextUrl` carries the internal origin behind a
 * proxy, so cloning it alone can send a visitor to an internal hostname. The
 * public host and scheme are reapplied from the forwarded headers.
 */
function sameHostUrl(request: NextRequest, pathname: string): URL {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  const publicHost = getRequestHost(request);
  if (publicHost && publicHost !== redirectUrl.hostname) {
    redirectUrl.hostname = publicHost;
    redirectUrl.port = "";
  }

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto === "http" || forwardedProto === "https") {
    redirectUrl.protocol = `${forwardedProto}:`;
  }

  return redirectUrl;
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
  if (APP_PROFILE !== "core") return false;

  const requestHost = getRequestHost(request);
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

function redirectSchoolRootToFieldMode(request: NextRequest): NextResponse {
  return NextResponse.redirect(sameHostUrl(request, FIELD_MODE_HOME_PATH), 308);
}

function cleanSchoolRouteTarget(pathname: string): string | null {
  const exact = METAPET_SCHOOL_CLEAN_ROUTES.get(pathname);
  if (exact) return exact;
  if (pathname.startsWith("/lessons/")) {
    return `/schools/field${pathname}`;
  }
  return null;
}

function cleanSchoolRewriteUrl(request: NextRequest, pathname: string): URL {
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathname;
  return rewriteUrl;
}

function fieldCookieIsActive(request: NextRequest): boolean {
  // MetaPet.school is a dedicated classroom surface. Its hostname is itself
  // sufficient authority to enforce the Field boundary; cookies remain useful
  // for the shared Blue $nake Studio host where Field Mode is opt-in.
  if (isMetaPetSchoolHost(request)) {
    return true;
  }

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

function fieldUiCookieIsActive(request: NextRequest): boolean {
  if (
    request.cookies.get(FIELD_MODE_UI_COOKIE)?.value === FIELD_MODE_COOKIE_VALUE
  ) {
    return true;
  }

  return (request.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .some(
      (cookie) =>
        cookie === `${FIELD_MODE_UI_COOKIE}=${FIELD_MODE_COOKIE_VALUE}`,
    );
}

function activePolicyId(request: NextRequest): ChildSafePolicyId | null {
  const { pathname } = request.nextUrl;

  if (isMetaPetSchoolHost(request)) {
    return "field";
  }

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
  const entersFieldMode =
    isFieldModePathname(pathname) && pathname !== FIELD_MODE_EXIT_PATH;
  if (!entersFieldMode && !fieldCookieIsActive(request)) {
    return response;
  }

  if (
    entersFieldMode &&
    !isMetaPetSchoolHost(request) &&
    !fieldCookieIsActive(request)
  ) {
    response.cookies.set(
      FIELD_MODE_COOKIE,
      FIELD_MODE_COOKIE_VALUE,
      fieldModeCookieOptions(request.nextUrl.protocol === "https:"),
    );
  }

  if (!fieldUiCookieIsActive(request)) {
    response.cookies.set(
      FIELD_MODE_UI_COOKIE,
      FIELD_MODE_COOKIE_VALUE,
      fieldModeUiCookieOptions(request.nextUrl.protocol === "https:"),
    );
  }
  return response;
}

export function proxy(request: NextRequest) {
  if (shouldRedirectToCanonicalOrigin(request)) {
    return redirectToCanonicalOrigin(request);
  }

  const { pathname } = request.nextUrl;

  if (isMetaPetSchoolHost(request) && pathname === "/") {
    return redirectSchoolRootToFieldMode(request);
  }

  if (isMetaPetSchoolHost(request)) {
    const cleanTarget = cleanSchoolRouteTarget(pathname);
    if (cleanTarget) {
      return activateFieldCookie(
        NextResponse.rewrite(cleanSchoolRewriteUrl(request, cleanTarget)),
        request,
      );
    }
  }

  const policyId = activePolicyId(request);

  if (!policyId) return NextResponse.next();

  if (policyId === "schools" && pathname === "/") {
    return NextResponse.redirect(sameHostUrl(request, "/schools"));
  }

  if (isPathnameAllowedByPolicy(pathname, policyId)) {
    return activateFieldCookie(NextResponse.next(), request);
  }

  // Fetch callers must receive a real denial, not a redirect that resolves to
  // a 200 HTML page. The opaque response also avoids disclosing API inventory.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.redirect(
    sameHostUrl(request, getPolicyFallbackPathname(policyId)),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

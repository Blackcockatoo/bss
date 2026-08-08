import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";
import { FIELD_MODE_INSTALL_ICON_PATHS } from "@/lib/fieldMode/pwa";

export const FIELD_MODE_HOME_PATH = "/schools/field";
export const FIELD_MODE_START_PATH = "/schools/field/start";
export const FIELD_MODE_LESSONS_PATH = "/schools/field/lessons";
export const FIELD_MODE_CLASSROOM_PATH = "/schools/field/classroom";
export const FIELD_MODE_PASSPORT_PATH = "/schools/field/passport";
export const FIELD_MODE_REVIEW_PATH = "/schools/field/review";
export const FIELD_MODE_OFFLINE_PATH = "/schools/field/offline";
export const FIELD_MODE_GUIDE_PATH = "/schools/field/guide";
export const FIELD_MODE_SAFETY_PATH = "/schools/field/safety";
export const FIELD_MODE_PACK_MANIFEST_PATH = "/schools/field/pack.json";
export const FIELD_MODE_PRINT_PATH_PREFIX = "/schools/field/print";
export const FIELD_MODE_EXIT_PATH = "/schools/field/exit";
export const FIELD_MODE_MANIFEST_PATH =
  "/schools/field/manifest.webmanifest";
export const FIELD_MODE_COOKIE = "metapet-field-mode";
export const FIELD_MODE_UI_COOKIE = "metapet-field-ui";
export const FIELD_MODE_COOKIE_VALUE = "active";

export type ChildSafePolicyId = "core" | "schools" | "field";

export interface ChildSafeRoutePolicy {
  id: ChildSafePolicyId;
  fallbackPathname: string;
  allowedExact: ReadonlySet<string>;
  allowedPrefixes: readonly string[];
}

export interface FieldModeNavItem {
  href: string;
  label: string;
  kind:
    | "home"
    | "lessons"
    | "classroom"
    | "offline"
    | "guide"
    | "safety"
    | "exit";
}

const REQUIRED_STATIC_ROUTES = [
  "/icon.svg",
  ...FIELD_MODE_INSTALL_ICON_PATHS,
  "/manifest.json",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
] as const;

const FIELD_REQUIRED_STATIC_ROUTES = [
  "/icon.svg",
  ...FIELD_MODE_INSTALL_ICON_PATHS,
  "/favicon.ico",
  "/sw.js",
] as const;

/**
 * The route/profile contract for every child-safe surface.
 *
 * Keep request enforcement, server guards, navigation and tests pointed at
 * this registry. A route should never be made visible by changing only a
 * component: it must be approved here first.
 */
export const CHILD_SAFE_ROUTE_POLICIES: Record<
  ChildSafePolicyId,
  ChildSafeRoutePolicy
> = {
  core: {
    id: "core",
    fallbackPathname: "/app",
    allowedExact: new Set([
      "/",
      "/app",
      "/compass",
      "/pet",
      "/school-game",
      "/legal",
      "/docs",
      ...REQUIRED_STATIC_ROUTES,
    ]),
    allowedPrefixes: ["/app/", "/docs/"],
  },
  schools: {
    id: "schools",
    fallbackPathname: "/schools",
    allowedExact: new Set([
      "/",
      "/schools",
      "/schools/safeguarding",
      "/schools/parents",
      // Adult-only. Deliberately absent from the `field` policy below: a
      // contribution page must never be reachable from a classroom screen.
      "/schools/contribute",
      "/schools/data",
      "/school-game",
      "/teachers",
      "/teachers/passport",
      "/teachers/pilot",
      "/teachers/review",
      "/legal",
      "/legal/privacy",
      "/legal/safety",
      "/legal/boundaries",
      ...REQUIRED_STATIC_ROUTES,
    ]),
    allowedPrefixes: [
      "/docs/schools-au/",
      "/schools/docs/",
      "/schools/field/",
      "/teachers/lessons/",
    ],
  },
  field: {
    id: "field",
    fallbackPathname: FIELD_MODE_HOME_PATH,
    allowedExact: new Set([
      "/schools",
      FIELD_MODE_HOME_PATH,
      FIELD_MODE_START_PATH,
      FIELD_MODE_LESSONS_PATH,
      FIELD_MODE_CLASSROOM_PATH,
      FIELD_MODE_PASSPORT_PATH,
      FIELD_MODE_REVIEW_PATH,
      FIELD_MODE_OFFLINE_PATH,
      FIELD_MODE_GUIDE_PATH,
      FIELD_MODE_SAFETY_PATH,
      FIELD_MODE_PACK_MANIFEST_PATH,
      FIELD_MODE_EXIT_PATH,
      FIELD_MODE_MANIFEST_PATH,
      "/schools/safeguarding",
      "/schools/parents",
      "/school-game",
      "/legal",
      "/legal/privacy",
      "/legal/safety",
      "/legal/boundaries",
      ...FIELD_REQUIRED_STATIC_ROUTES,
    ]),
    allowedPrefixes: [
      "/docs/schools-au/",
      "/schools/docs/",
      `${FIELD_MODE_LESSONS_PATH}/`,
      `${FIELD_MODE_PRINT_PATH_PREFIX}/`,
    ],
  },
};

/** The intentionally small navigation surface shown inside Field Mode. */
export const FIELD_MODE_NAV_ITEMS: readonly FieldModeNavItem[] = [
  { href: FIELD_MODE_HOME_PATH, label: "Field Home", kind: "home" },
  { href: FIELD_MODE_LESSONS_PATH, label: "Lessons", kind: "lessons" },
  {
    href: FIELD_MODE_CLASSROOM_PATH,
    label: "Classroom",
    kind: "classroom",
  },
  {
    href: FIELD_MODE_OFFLINE_PATH,
    label: "Offline Pack",
    kind: "offline",
  },
  {
    href: FIELD_MODE_GUIDE_PATH,
    label: "Teacher Guide",
    kind: "guide",
  },
  {
    href: FIELD_MODE_SAFETY_PATH,
    label: "Safety & Privacy",
    kind: "safety",
  },
  { href: FIELD_MODE_EXIT_PATH, label: "Exit Field Mode", kind: "exit" },
] as const;

export const CHILD_SAFE_NAV_ROUTES = new Set(
  IS_SCHOOLS_PROFILE
    ? ["/schools", "/school-game", "/legal/privacy"]
    : ["/", "/pet", "/app/wellness", "/school-game"],
);

export function isFieldModePathname(pathname: string): boolean {
  return (
    pathname === FIELD_MODE_HOME_PATH ||
    pathname.startsWith(`${FIELD_MODE_HOME_PATH}/`)
  );
}

export function getChildSafePolicy(
  policyId: ChildSafePolicyId,
): ChildSafeRoutePolicy {
  return CHILD_SAFE_ROUTE_POLICIES[policyId];
}

export function isPathnameAllowedByPolicy(
  pathname: string,
  policyId: ChildSafePolicyId,
): boolean {
  const policy = getChildSafePolicy(policyId);
  return (
    policy.allowedExact.has(pathname) ||
    policy.allowedPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

export function getPolicyFallbackPathname(policyId: ChildSafePolicyId): string {
  return getChildSafePolicy(policyId).fallbackPathname;
}

export function getChildSafeFallbackPathname(pathname: string): string {
  if (IS_SCHOOLS_PROFILE) {
    return getPolicyFallbackPathname("schools");
  }

  return pathname.startsWith("/docs")
    ? "/legal"
    : getPolicyFallbackPathname("core");
}

export function isChildSafeAllowedPathname(pathname: string): boolean {
  return isPathnameAllowedByPolicy(
    pathname,
    IS_SCHOOLS_PROFILE ? "schools" : "core",
  );
}

export function fieldModeCookieOptions(secure = true) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

/**
 * Presentation-only marker used to suppress consumer navigation on approved
 * supporting documents outside the nested Field layout. Request enforcement
 * always uses the separate HTTP-only FIELD_MODE_COOKIE.
 */
export function fieldModeUiCookieOptions(secure = true) {
  return {
    ...fieldModeCookieOptions(secure),
    httpOnly: false,
  };
}

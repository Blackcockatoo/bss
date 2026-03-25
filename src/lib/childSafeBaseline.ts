import { IS_SCHOOLS_PROFILE } from "@/lib/env/features";

const CORE_ALLOWED_EXACT = new Set([
  "/",
  "/app",
  "/pet",
  "/school-game",
  "/legal",
  "/docs",
  "/icon.svg",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const SCHOOLS_ALLOWED_EXACT = new Set([
  "/",
  "/schools",
  "/schools/safeguarding",
  "/school-game",
  "/legal",
  "/legal/privacy",
  "/legal/safety",
  "/legal/boundaries",
  "/icon.svg",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
]);

const CORE_ALLOWED_PREFIXES = ["/app/", "/docs/"];
const SCHOOLS_ALLOWED_PREFIXES = ["/docs/schools-au/", "/schools/docs/"];

export const CHILD_SAFE_NAV_ROUTES = IS_SCHOOLS_PROFILE
  ? new Set(["/schools", "/school-game", "/legal/privacy"])
  : new Set(["/", "/pet", "/school-game"]);

export function getChildSafeFallbackPathname(_pathname: string): string {
  if (IS_SCHOOLS_PROFILE) {
    return "/schools";
  }

  return _pathname.startsWith("/docs") ? "/legal" : "/app";
}

export function isChildSafeAllowedPathname(pathname: string): boolean {
  const exact = IS_SCHOOLS_PROFILE ? SCHOOLS_ALLOWED_EXACT : CORE_ALLOWED_EXACT;
  const prefixes = IS_SCHOOLS_PROFILE
    ? SCHOOLS_ALLOWED_PREFIXES
    : CORE_ALLOWED_PREFIXES;

  if (exact.has(pathname)) {
    return true;
  }

  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

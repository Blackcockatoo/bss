const CHILD_SAFE_ALLOWED_EXACT = new Set([
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

const CHILD_SAFE_ALLOWED_PREFIXES = ["/app/", "/docs/"];

export const CHILD_SAFE_NAV_ROUTES = new Set(["/", "/pet", "/school-game"]);

export function isChildSafeAllowedPathname(pathname: string): boolean {
  if (CHILD_SAFE_ALLOWED_EXACT.has(pathname)) {
    return true;
  }

  return CHILD_SAFE_ALLOWED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

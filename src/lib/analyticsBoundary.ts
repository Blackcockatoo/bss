/**
 * The analytics boundary for the shared codebase.
 *
 * MetaPet School promises adults that the classroom runtime carries no
 * analytics SDK and no behavioural tracking. Because MetaPet School and the
 * Blue Snake Studios consumer product are served from one Next.js app, that
 * promise has to be enforced by a route rule rather than by a build flag
 * alone — Field Mode is reachable from the combined production build.
 *
 * Any pathname listed here is treated as school territory: no analytics, no
 * third-party beacon, no error-reporting SDK. Widening this file is the only
 * way to put a tracker anywhere near a classroom page, which is deliberate.
 */

/** Route prefixes that must never load analytics or any tracking script. */
export const ANALYTICS_EXCLUDED_PREFIXES = [
  "/schools",
  "/school-game",
  "/teachers",
  "/docs/schools-au",
  "/legal/privacy",
  "/legal/safety",
  "/legal/boundaries",
] as const;

/**
 * True when a pathname is allowed to mount consumer product analytics.
 *
 * A null/unknown pathname is treated as excluded: the safe default when the
 * router has not resolved yet is "no beacon".
 */
export function isAnalyticsAllowedPathname(
  pathname: string | null | undefined,
): boolean {
  if (typeof pathname !== "string" || pathname.length === 0) {
    return false;
  }

  return !ANALYTICS_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

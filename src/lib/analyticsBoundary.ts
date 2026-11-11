/**
 * The analytics boundary for the shared codebase.
 *
 * MetaPet is used by children at home and in classrooms. Product analytics
 * (Vercel Analytics) is therefore OFF by default: it may only mount on an
 * explicit allowlist of adult-facing marketing pages. Any route not listed in
 * `ANALYTICS_ALLOWED_PREFIXES` gets no beacon, so a newly added page (a game,
 * a pet surface, a lesson) is private by default and nobody has to remember
 * to exclude it.
 *
 * `ANALYTICS_EXCLUDED_PREFIXES` is a second, independent guard. A route on
 * that list can never load analytics, even if someone later widens the
 * allowlist to cover it. School and classroom territory lives there because
 * MetaPet School promises adults that the classroom runtime carries no
 * analytics SDK and no behavioural tracking, and Field Mode is reachable from
 * the combined production build.
 *
 * Widening the allowlist is the only way to put a tracker on a page. Never add
 * a route that a child is likely to use.
 */

/**
 * Adult-facing marketing pages that may mount product analytics.
 *
 * - `/pricing`: plans and pricing for parents and schools.
 * - `/studio`: Blue Snake Studios identity / about page.
 *
 * `/shop` is deliberately absent. It is the pet add-on shop that children
 * browse from the companion, so it is a kid-facing surface.
 */
export const ANALYTICS_ALLOWED_PREFIXES = ["/pricing", "/studio"] as const;

/** Route prefixes that must never load analytics or any tracking script. */
export const ANALYTICS_EXCLUDED_PREFIXES = [
  // School, classroom and teacher territory.
  "/schools",
  "/school-game",
  "/teachers",
  "/teach",
  "/docs/schools-au",
  "/legal",
  // Child-facing companion, play and learning surfaces.
  "/",
  "/app",
  "/pet",
  "/project-forge",
  "/shop",
  "/arcade",
  "/monkey-invaders",
  "/space-jewbles",
  "/moss60",
  "/identity",
  "/digital-dna",
  "/dna-hub",
  "/genome-explorer",
  "/genome-resonance",
  "/geometry-sound",
  "/body-forge",
  "/alchemest",
  "/compass",
  "/visualizer",
  "/share",
  "/qr-messaging",
  "/addons-demo",
  "/lineage-demo",
  "/scaffold",
] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === "/") {
    return pathname === "/";
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * True when a pathname is allowed to mount consumer product analytics.
 *
 * Default-off: only allowlisted adult marketing pages qualify, and the
 * exclusion list always wins. A null or unknown pathname is excluded, because
 * the safe default before the router resolves is "no beacon".
 */
export function isAnalyticsAllowedPathname(
  pathname: string | null | undefined,
): boolean {
  if (typeof pathname !== "string" || pathname.length === 0) {
    return false;
  }

  if (ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }

  return ANALYTICS_ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

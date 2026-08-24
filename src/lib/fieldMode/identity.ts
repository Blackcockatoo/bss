import { SCHOOL_PROFILE_DESCRIPTION } from "@/lib/schools/privacyTruth";

/**
 * Standalone brand identity for the MetaPet School classroom product.
 *
 * MetaPet School ships from the shared `bss` codebase, but it is a product in
 * its own right with its own domain, install identity and search presence.
 * The shared app shell resolves its identity from build-time env
 * (`NEXT_PUBLIC_APP_PROFILE`), which on the combined production deployment is
 * `core` — Blue Snake Studios. Without these constants every classroom page
 * inherits the Blue Snake Studios title, social card and canonical origin.
 *
 * Field routes are the classroom product wherever they are served from, so the
 * identity below is deliberately fixed rather than host-derived. Serving a
 * metapet.school canonical from the Blue Snake Studios host is correct: it
 * consolidates classroom search authority onto the classroom domain instead of
 * splitting it across two hostnames.
 */

/** Canonical public origin for the classroom product. */
export const METAPET_SCHOOL_ORIGIN = "https://www.metapet.school";

/** Hostnames that serve the classroom product directly. */
export const METAPET_SCHOOL_HOSTS = [
  "metapet.school",
  "www.metapet.school",
] as const;

/** Product wordmark. Used for nav, install prompts and social cards. */
export const METAPET_SCHOOL_NAME = "MetaPet School";

/** Short form for home-screen install tiles, which truncate aggressively. */
export const METAPET_SCHOOL_SHORT_NAME = "MetaPet School";

export const METAPET_SCHOOL_TAGLINE =
  "Australian classroom lessons for Years 3–6";

export const METAPET_SCHOOL_DESCRIPTION =
  `MetaPet School is a calm Australian Years 3–6 classroom experience. ${SCHOOL_PROFILE_DESCRIPTION}`;

/** Emerald used for browser chrome and the install splash. */
export const METAPET_SCHOOL_THEME_COLOR = "#065f46";

/** Light slate the classroom surface actually paints. */
export const METAPET_SCHOOL_BACKGROUND_COLOR = "#f8fafc";

export function isMetaPetSchoolHostname(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return (METAPET_SCHOOL_HOSTS as readonly string[]).includes(normalized);
}

/** Absolute classroom URL for canonical, social and sitemap use. */
export function metaPetSchoolUrl(pathname = "/"): string {
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${METAPET_SCHOOL_ORIGIN}${suffix === "/" ? "" : suffix}`;
}

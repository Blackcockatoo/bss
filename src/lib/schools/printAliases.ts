/**
 * Short /print/... aliases that should resolve to an existing classroom pack
 * under /schools/field/print/. Unknown short paths are left alone so the
 * Field policy can keep sending them to the Field home fallback.
 */

import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";
import { FOUNDATION_SESSIONS } from "@/lib/schools/foundationSequence";
import { YEARS_78_SESSIONS } from "@/lib/schools/years78Sequence";

/** Named classroom print packs that are not a per-lesson planner. */
export const FIELD_PRINT_PACK_SLUGS = [
  "all",
  "checklist",
  "curriculum",
  "f2",
  "invisible-trail",
  "invisible-trail.html",
  "leadership",
  "no-tech",
  "parent-letter",
  "relief",
  "rollout",
  "staff-pd",
  "tickets",
  "verified",
  "word-walls",
  "years-7-8",
] as const;

const LESSON_PRINT_SLUGS = [
  ...CANONICAL_SESSIONS,
  ...FOUNDATION_SESSIONS,
  ...YEARS_78_SESSIONS,
].map((session) => session.slug);

const FIELD_PRINT_ALIAS_SLUGS = new Set<string>([
  ...FIELD_PRINT_PACK_SLUGS,
  ...LESSON_PRINT_SLUGS,
]);

function withoutTrailingSlashes(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }
  return pathname;
}

/**
 * If `pathname` is a short alias for a known print pack, return the real
 * classroom path. Otherwise return null.
 */
export function fieldPrintAliasTarget(pathname: string): string | null {
  const normalized = withoutTrailingSlashes(pathname);
  if (!normalized.startsWith("/print/")) {
    return null;
  }
  const slug = normalized.slice("/print/".length);
  if (!slug || slug.includes("/") || slug.includes("..") || !FIELD_PRINT_ALIAS_SLUGS.has(slug)) {
    return null;
  }
  return `/schools/field/print/${slug}`;
}

import { describe, expect, it } from "vitest";

import { SCRIPTED_LESSONS } from "@/lib/education/lesson-cards";
import {
  isFieldModePathname,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";
import {
  buildLessonPath,
  LESSON_BASE_PATH,
} from "./lessonRouting";
import { buildFieldLessonPath, DEFAULT_FIELD_SESSION } from "@/lib/fieldMode/session";
import {
  LESSON_DEFINITIONS,
  LESSON_IDS,
  getLessonById,
  getLessonBySlug,
} from "./lessonDefinitions";

/**
 * Regression coverage for the previous lesson-pack restoration issue: an
 * older, separate "MetaPet Schools" surface (`/school-game`, driven by
 * `SCRIPTED_LESSONS` in `src/lib/education/lesson-cards.ts`) still exists in
 * the codebase as a distinct legacy product surface. It must never silently
 * become the source of truth for Field Mode's seven canonical lessons, and
 * Field Mode's lesson routes must only ever resolve the current,
 * upgraded `LESSON_DEFINITIONS` pack.
 */
describe("legacy lesson pack cannot silently override the canonical pack", () => {
  it("keeps the canonical pack at exactly seven upgraded lessons", () => {
    expect(LESSON_DEFINITIONS).toHaveLength(7);
    expect(LESSON_DEFINITIONS.map((l) => l.title)).toEqual([
      "Meet Your Meta-Pet",
      "Build a Body",
      "DNA Makes Us Different",
      "Needs, Actions and Consequences",
      "Feelings Without Words",
      "Patterns Behind the Pet",
      "The Responsible Creator Challenge",
    ]);
  });

  it("never resolves a legacy scripted-lesson id through the canonical lookup", () => {
    for (const legacy of SCRIPTED_LESSONS) {
      expect(LESSON_IDS as readonly string[]).not.toContain(legacy.id);
      expect(getLessonById(legacy.id)).toBeUndefined();
      expect(getLessonBySlug(legacy.id)).toBeUndefined();
    }
  });

  it("falls back to the lessons index rather than a legacy id for an unknown slug", () => {
    const legacyId = SCRIPTED_LESSONS[0]?.id ?? "lesson-1-meet-your-pattern";
    expect(buildLessonPath(legacyId)).toBe(LESSON_BASE_PATH);
  });

  it("builds Field lesson routes only from the canonical lesson slugs", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const path = buildFieldLessonPath(lesson.slug, DEFAULT_FIELD_SESSION);
      expect(path).toMatch(new RegExp(`^/schools/field/lessons/${lesson.slug}\\?`));
    }
    for (const legacy of SCRIPTED_LESSONS) {
      // A legacy id used as a "slug" still only ever produces an (unresolved)
      // Field lesson URL — it can never be confused with a real lesson
      // because /schools/field/lessons/[slug]/page.tsx 404s safely via
      // getLessonBySlug returning undefined (see routeHandlers/route tests).
      expect(getLessonBySlug(legacy.id)).toBeUndefined();
    }
  });

  it("keeps the legacy /school-game surface outside the Field Mode route boundary", () => {
    expect(isFieldModePathname("/school-game")).toBe(false);
    // /school-game remains a separately-governed, pre-existing route; it is
    // not part of Field Mode's own nested navigation or lesson pack.
    expect(isPathnameAllowedByPolicy("/school-game/lessons", "field")).toBe(
      false,
    );
  });
});

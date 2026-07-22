/**
 * Meta-Pet Teacher Lesson System — routing helpers (Pass 1).
 *
 * Pure functions for building and parsing lesson deep links. Keeping these
 * side-effect free makes them easy to unit test and reuse from both the
 * Teacher Hub and the Lesson Runner.
 *
 * Route shape (App Router):
 *   /teachers                         -> Teacher Hub
 *   /teachers/lessons/[slug]          -> Lesson Runner
 *   /teachers/lessons/[slug]?step=2   -> deep link to a specific step (1-based)
 *   /teachers/lessons/[slug]?preview=1-> open in preview mode
 *   /teachers/lessons/[slug]?mode=student -> open in a specific view mode
 */

import { getLessonBySlug, getLessonById } from "./lessonDefinitions";
import type { LessonDefinition, LessonId, LessonViewMode } from "./types";

export const TEACHER_HUB_PATH = "/teachers";
export const LESSON_BASE_PATH = "/teachers/lessons";

/** Build the Teacher Hub URL. */
export function buildTeacherHubPath(): string {
  return TEACHER_HUB_PATH;
}

/** Options for building a lesson deep link. */
export interface LessonLinkOptions {
  /** 1-based step number to deep link to. */
  step?: number;
  /** Open in preview mode. */
  preview?: boolean;
  /** Force a particular view mode. */
  mode?: LessonViewMode;
}

/**
 * Build a lesson URL from a slug (or lesson id — both are accepted). Returns
 * the base lessons path if the identifier is unknown, so callers never build a
 * link to a non-existent lesson.
 */
export function buildLessonPath(
  slugOrId: string,
  options: LessonLinkOptions = {},
): string {
  const lesson = getLessonBySlug(slugOrId) ?? getLessonById(slugOrId);
  if (!lesson) {
    return LESSON_BASE_PATH;
  }

  const params = new URLSearchParams();
  if (typeof options.step === "number" && Number.isFinite(options.step)) {
    params.set("step", String(Math.max(1, Math.floor(options.step))));
  }
  if (options.preview) {
    params.set("preview", "1");
  }
  if (options.mode) {
    params.set("mode", options.mode);
  }

  const query = params.toString();
  return query
    ? `${LESSON_BASE_PATH}/${lesson.slug}?${query}`
    : `${LESSON_BASE_PATH}/${lesson.slug}`;
}

/**
 * Clamp a 1-based step number from a query string to a valid zero-based step
 * index for the given lesson. Invalid / missing values fall back to 0.
 */
export function resolveStepIndex(
  lesson: LessonDefinition,
  rawStep: string | number | null | undefined,
): number {
  if (rawStep === null || rawStep === undefined) {
    return 0;
  }

  const parsed =
    typeof rawStep === "number" ? rawStep : Number.parseInt(rawStep, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  // Query steps are 1-based; internal indices are 0-based.
  const zeroBased = Math.floor(parsed) - 1;
  if (zeroBased < 0) {
    return 0;
  }
  if (zeroBased > lesson.steps.length - 1) {
    return lesson.steps.length - 1;
  }
  return zeroBased;
}

/** Parse a `preview` query value into a boolean. */
export function parsePreviewFlag(
  raw: string | string[] | null | undefined,
): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

/** Parse a `mode` query value into a view mode, or null if absent/invalid. */
export function parseViewMode(
  raw: string | string[] | null | undefined,
): LessonViewMode | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "teacher" || value === "student") {
    return value;
  }
  return null;
}

/**
 * Resolve a raw slug from the URL into a known lesson id, or null when the
 * slug is invalid. Used by the Runner to fail safely on bad routes.
 */
export function resolveLessonId(slug: string | null | undefined): LessonId | null {
  const lesson = getLessonBySlug(slug);
  return lesson ? lesson.id : null;
}

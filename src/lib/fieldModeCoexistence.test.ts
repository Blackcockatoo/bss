import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_NAV_ITEMS,
  FIELD_MODE_PASSPORT_PATH,
  FIELD_MODE_REVIEW_PATH,
  FIELD_MODE_START_PATH,
  getChildSafePolicy,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

/**
 * Release-contract guard for the consolidated MetaPet classroom product.
 *
 * The Field boundary (Codex Pass 3) and the seven-lesson teacher system
 * (teacher-lesson Passes 1–4) are two separately-owned subsystems that MUST
 * coexist. This test encodes the coexistence contract so a future edit — human
 * or AI — that quietly re-introduces a consumer leak, drops the seven lessons,
 * demotes them behind the legacy `/school-game` pack, or dismantles the Field
 * route policy fails loudly instead of shipping.
 *
 * Ownership boundaries deliberately preserved:
 *   - Field boundary  → childSafeBaseline.ts + src/proxy.ts + field routes/cookie
 *   - Lesson engine   → teacher-lessons definitions, runner, activities, stores
 * These are asserted, not merged.
 */

const CWD = process.cwd();

function readSource(relativePath: string): string {
  return readFileSync(join(CWD, relativePath), "utf8");
}

const CONSUMER_ROUTES = [
  "/shop",
  "/wallet",
  "/marketplace",
  "/breeding",
  "/identity",
  "/digital-dna",
  "/alchemist",
  "/qr",
  "/pet",
  "/teachers",
] as const;

describe("MetaPet Field Mode ↔ teacher-lesson coexistence contract", () => {
  describe("the Field boundary is enforced by the Next 16 proxy", () => {
    it("keeps src/proxy.ts as the enforcement point and never resurrects a root middleware.ts", () => {
      // The Field boundary lives in the Next 16 request proxy. A regression that
      // replaces it with an ineffective root middleware.ts must fail here.
      expect(existsSync(join(CWD, "src/proxy.ts"))).toBe(true);
      expect(existsSync(join(CWD, "middleware.ts"))).toBe(false);

      const proxy = readSource("src/proxy.ts");
      expect(proxy).toContain("export function proxy");
      expect(proxy).toContain("ENFORCE_CHILD_SAFE_BOUNDARY");
      expect(proxy).toContain("FIELD_MODE_COOKIE");
      // Blocked APIs must be denied opaquely, not redirected to an HTML page.
      expect(proxy).toContain('"not_found"');
      expect(proxy).toContain("404");
    });

    it("declares a dedicated Field route policy with the Field home as fallback", () => {
      const policy = getChildSafePolicy("field");
      expect(policy).toBeTruthy();
      expect(policy.fallbackPathname).toBe(FIELD_MODE_HOME_PATH);
    });
  });

  describe("the Field policy allows the Field surface and blocks consumer routes", () => {
    it("allows every approved Field route", () => {
      for (const pathname of [
        FIELD_MODE_HOME_PATH,
        FIELD_MODE_LESSONS_PATH,
        `${FIELD_MODE_LESSONS_PATH}/build-a-body`,
        FIELD_MODE_CLASSROOM_PATH,
        FIELD_MODE_PASSPORT_PATH,
        FIELD_MODE_REVIEW_PATH,
        "/school-game",
        "/legal/privacy",
      ]) {
        expect(isPathnameAllowedByPolicy(pathname, "field")).toBe(true);
      }
    });

    it("blocks every consumer route while Field Mode is active", () => {
      for (const pathname of CONSUMER_ROUTES) {
        expect(isPathnameAllowedByPolicy(pathname, "field")).toBe(false);
      }
    });
  });

  describe("Start Field Mode enters the seven lessons, never the legacy pack", () => {
    it("routes the Field start into /schools/field/lessons", () => {
      expect(FIELD_MODE_LESSONS_PATH).toBe("/schools/field/lessons");

      const startRoute = readSource("src/app/schools/field/start/route.ts");
      expect(startRoute).toContain("FIELD_MODE_LESSONS_PATH");
      expect(startRoute).toContain("FIELD_MODE_COOKIE");
      // Start must never redirect to the legacy /school-game pack.
      expect(startRoute).not.toContain("school-game");
    });
  });

  describe("the seven guided lessons are the Field lesson experience via the shared engine", () => {
    it("keeps exactly seven guided lessons with usable slugs", () => {
      expect(LESSON_DEFINITIONS).toHaveLength(7);
      for (const lesson of LESSON_DEFINITIONS) {
        expect(lesson.slug.length).toBeGreaterThan(0);
      }
    });

    it("renders /schools/field/lessons from the shared launchpad, not the old pack", () => {
      const lessonsPage = readSource("src/app/schools/field/lessons/page.tsx");
      expect(lessonsPage).toContain("FieldLessonLaunchpad");
      expect(lessonsPage).not.toContain("school-game");

      const launchpad = readSource(
        "src/components/field-mode/FieldLessonLaunchpad.tsx",
      );
      expect(launchpad).toContain("LESSON_DEFINITIONS");
      expect(launchpad).not.toContain("school-game");
      expect(launchpad).not.toContain("/teachers");
    });

    it("drives Field lessons through the same LessonRunner as /teachers", () => {
      const fieldSlug = readSource(
        "src/app/schools/field/lessons/[slug]/page.tsx",
      );
      const teacherSlug = readSource(
        "src/app/teachers/lessons/[slug]/page.tsx",
      );
      for (const source of [fieldSlug, teacherSlug]) {
        expect(source).toContain("@/components/teacher-lessons");
        expect(source).toContain("LessonRunner");
      }
      // The Field variant must opt into Field Mode; the /teachers variant must not.
      expect(fieldSlug).toContain("fieldMode");
      expect(teacherSlug).not.toContain("fieldMode");
    });
  });

  describe("Field lessons suppress consumer pet-update controls", () => {
    it("forces the demonstration pet and disables real-pet updates in Field Mode only", () => {
      const runner = readSource(
        "src/components/teacher-lessons/LessonRunner.tsx",
      );
      expect(runner).toContain("forceDemonstration: fieldMode");
      expect(runner).toContain("allowPetUpdates: !fieldMode");
    });
  });

  describe("Field navigation never leaks consumer or /teachers links", () => {
    it("exposes only the approved Field destinations", () => {
      const hrefs = FIELD_MODE_NAV_ITEMS.map((item) => item.href);
      expect(hrefs).toEqual([
        FIELD_MODE_HOME_PATH,
        FIELD_MODE_LESSONS_PATH,
        FIELD_MODE_CLASSROOM_PATH,
        "/schools/docs/teacher-guide",
        "/schools/safeguarding",
        "/schools/field/exit",
      ]);

      for (const href of hrefs) {
        for (const consumer of CONSUMER_ROUTES) {
          expect(href.startsWith(consumer)).toBe(false);
        }
      }
    });

    it("keeps the Field nav component free of consumer/teacher links", () => {
      const nav = readSource("src/components/field-mode/FieldModeNav.tsx");
      expect(nav).not.toContain("/teachers");
      expect(nav).not.toContain('"/pet"');
      expect(nav).not.toContain("/shop");
    });
  });

  describe("QuickNav is removed from the DOM during an active lesson", () => {
    it("returns null under classroom focus rather than overlaying the lesson", () => {
      const quickNav = readSource("src/components/QuickNav.tsx");
      expect(quickNav).toContain("useClassroomFocusActive");
      expect(quickNav).toContain("classroomFocusActive");
      expect(quickNav).toContain("return null");
    });
  });

  describe("Exit Field Mode restores normal MetaPet", () => {
    it("clears the Field session cookie and leaves the schools surface", () => {
      const exitRoute = readSource("src/app/schools/field/exit/route.ts");
      expect(exitRoute).toContain("maxAge: 0");
      expect(exitRoute).toContain("/schools");
    });
  });

  describe("both subsystems remain present on disk (coexistence inventory)", () => {
    it("ships the Field boundary, the lesson engine, and the consumer runtime together", () => {
      const required = [
        // Field boundary
        "src/proxy.ts",
        "src/lib/fieldMode/session.ts",
        "src/app/schools/field/page.tsx",
        "src/app/schools/field/start/route.ts",
        "src/app/schools/field/exit/route.ts",
        "src/app/schools/field/lessons/page.tsx",
        "src/app/schools/field/lessons/[slug]/page.tsx",
        "src/app/schools/field/classroom/page.tsx",
        "src/app/schools/field/passport/page.tsx",
        "src/app/schools/field/review/page.tsx",
        "src/components/field-mode/FieldModeNav.tsx",
        "src/components/field-mode/FieldLessonLaunchpad.tsx",
        // Lesson engine
        "src/lib/teacher-lessons/lessonDefinitions.ts",
        "src/components/teacher-lessons/LessonRunner.tsx",
        "src/components/teacher-lessons/activities/registry.tsx",
        "src/components/teacher-lessons/ClassroomFocusMode.tsx",
        "src/components/teacher-lessons/LessonGuideBar.tsx",
        "src/components/teacher-lessons/LearningPassport.tsx",
        "src/components/teacher-lessons/TeacherReview.tsx",
        "src/lib/teacher-lessons/passport.ts",
        // Shared surfaces + normal consumer runtime
        "src/components/QuickNav.tsx",
        "src/app/teachers/lessons/[slug]/page.tsx",
        "src/app/pet/page.tsx",
      ];
      const missing = required.filter(
        (path) => !existsSync(join(CWD, path)),
      );
      expect(missing).toEqual([]);
    });
  });
});

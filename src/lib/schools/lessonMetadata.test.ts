import { describe, expect, it } from "vitest";

import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";
import { METAPET_SCHOOL_ORIGIN } from "@/lib/fieldMode/identity";
import { curriculumAlignmentForSession } from "@/lib/schools/curriculumAlignment";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import {
  buildLessonMetadata,
  lessonDocumentTitle,
  lessonPublicPath,
  lessonSearchDescription,
} from "./lessonMetadata";

const SURFACES = ["lesson", "print", "slides"] as const;

describe("per-lesson public metadata", () => {
  it("gives every public lesson surface a unique path, title and description", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      for (const surface of SURFACES) {
        const path = lessonPublicPath(lesson, surface);
        const title = lessonDocumentTitle(lesson, surface);
        const description = lessonSearchDescription(lesson, surface);
        const metadata = buildLessonMetadata(lesson, surface);
        const alignment = curriculumAlignmentForSession(lesson.number);

        expect(isPathnameAllowedByPolicy(path, "field"), path).toBe(true);
        expect(title).toContain(`Lesson ${lesson.number}: ${lesson.title}`);
        expect(description).toContain(`${lesson.durationMinutes}-minute`);
        expect(description).toContain("Years 3–6");
        expect(description).toContain(lesson.shortDescription);
        for (const code of alignment.codes) {
          expect(description).toContain(code);
        }
        expect(metadata.title).toBe(title);
        expect(metadata.description).toBe(description);
        expect(metadata.alternates?.canonical).toBe(
          `${METAPET_SCHOOL_ORIGIN}${path}`,
        );
        expect(metadata.openGraph).toMatchObject({
          locale: "en_AU",
          url: `${METAPET_SCHOOL_ORIGIN}${path}`,
        });
        expect(JSON.stringify(metadata)).not.toMatch(/Blue Snake Studios/i);
      }
    }
  });

  it("does not invent research, endorsement or privacy claims in search copy", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      for (const surface of SURFACES) {
        const description = lessonSearchDescription(lesson, surface);
        expect(description).not.toMatch(
          /research|study shows|endorsed|offline-first|no data leaves/i,
        );
      }
    }
  });
});

import type { Metadata } from "next";

import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
} from "@/lib/childSafeBaseline";
import { curriculumAlignmentForSession } from "@/lib/schools/curriculumAlignment";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import { FIELD_MODE_ICON_512_PATH } from "@/lib/fieldMode/pwa";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

export type LessonPublicSurface = "lesson" | "print" | "slides";

export function lessonPublicPath(
  lesson: LessonDefinition,
  surface: LessonPublicSurface,
): string {
  if (surface === "print") {
    return `${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`;
  }
  if (surface === "slides") {
    return `${FIELD_MODE_LESSONS_PATH}/${lesson.slug}/slides`;
  }
  return `${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`;
}

export function lessonDocumentTitle(
  lesson: LessonDefinition,
  surface: LessonPublicSurface,
): string {
  const lessonLabel = `Lesson ${lesson.number}: ${lesson.title}`;
  if (surface === "print") {
    return `Print ${lessonLabel}`;
  }
  if (surface === "slides") {
    return `Projector slides — ${lessonLabel}`;
  }
  return lessonLabel;
}

export function lessonSearchDescription(
  lesson: LessonDefinition,
  surface: LessonPublicSurface,
): string {
  const alignment = curriculumAlignmentForSession(lesson.number);
  const codes =
    alignment.codes.length > 0
      ? ` Australian Curriculum v9 codes on this lesson: ${alignment.codes.join(", ")}.`
      : "";
  const base = `A ${lesson.durationMinutes}-minute teacher-led Years 3–6 classroom lesson. ${lesson.shortDescription}`;
  if (surface === "print") {
    return `Printable planner for ${base}${codes} Includes the teacher script, materials and a paper path.`;
  }
  if (surface === "slides") {
    return `Projector slides for ${base}${codes} Follows the teacher script. No student data is shown.`;
  }
  return `${base}${codes}`;
}

export function buildLessonMetadata(
  lesson: LessonDefinition,
  surface: LessonPublicSurface,
): Metadata {
  const path = lessonPublicPath(lesson, surface);
  const title = lessonDocumentTitle(lesson, surface);
  const description = lessonSearchDescription(lesson, surface);
  const url = metaPetSchoolUrl(path);
  const socialTitle = `${title} — Years 3–6, ${lesson.durationMinutes} minutes`;
  const image = {
    url: FIELD_MODE_ICON_512_PATH,
    width: 512,
    height: 512,
    alt: METAPET_SCHOOL_NAME,
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: METAPET_SCHOOL_NAME,
      title: socialTitle,
      description,
      url,
      locale: "en_AU",
      images: [image],
    },
    twitter: {
      card: "summary",
      title: socialTitle,
      description,
      images: [FIELD_MODE_ICON_512_PATH],
    },
  };
}


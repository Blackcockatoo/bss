import type { Metadata } from "next";

import { LessonRunner } from "@/components/teacher-lessons";
import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { parseFieldSession } from "@/lib/fieldMode/session";
import {
  LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";
import {
  parsePreviewFlag,
  parseViewMode,
} from "@/lib/teacher-lessons/lessonRouting";

interface FieldLessonPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: FieldLessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  return {
    title: lesson?.title ?? "Classroom Lesson",
    description:
      lesson?.shortDescription ??
      "A teacher-led MetaPet Field Mode classroom lesson.",
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FieldLessonPage({
  params,
  searchParams,
}: FieldLessonPageProps) {
  const { slug } = await params;
  enforceChildSafeServerRoute(
    `${FIELD_MODE_LESSONS_PATH}/${slug}`,
    "field",
  );
  const query = await searchParams;
  const rawStep = first(query.step);
  const parsedStep = rawStep ? Number.parseInt(rawStep, 10) : undefined;

  return (
    <LessonRunner
      slug={slug}
      initialStep={
        typeof parsedStep === "number" && Number.isFinite(parsedStep)
          ? parsedStep
          : undefined
      }
      preview={parsePreviewFlag(query.preview)}
      initialMode={parseViewMode(query.mode) ?? "teacher"}
      fieldMode
      fieldSession={parseFieldSession(query)}
      hubPath={FIELD_MODE_LESSONS_PATH}
    />
  );
}

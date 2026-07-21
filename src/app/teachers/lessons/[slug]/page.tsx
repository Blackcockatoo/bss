import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { LessonRunner } from "@/components/teacher-lessons";
import {
  LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";
import {
  parsePreviewFlag,
  parseViewMode,
} from "@/lib/teacher-lessons/lessonRouting";

interface LessonPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    return { title: "Lesson — Meta-Pet Teacher Hub" };
  }
  return {
    title: `${lesson.title} — Meta-Pet Teacher Hub`,
    description: lesson.shortDescription,
  };
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LessonRunnerPage({
  params,
  searchParams,
}: LessonPageProps) {
  const { slug } = await params;
  enforceChildSafeServerRoute(`/teachers/lessons/${slug}`);

  const query = await searchParams;
  const rawStep = firstParam(query.step);
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
      initialMode={parseViewMode(query.mode)}
    />
  );
}

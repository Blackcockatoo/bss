import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReportCommentsPage } from "@/components/field-mode/ReportCommentsPage";
import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { reportCommentBankFor } from "@/lib/schools/reportComments";
import {
  ALL_LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";

interface LessonCommentsPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: LessonCommentsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) return { title: "Report comment starters" };
  return {
    title: `Report comment starters — Lesson ${lesson.number}: ${lesson.title}`,
    description:
      "Short, editable report comment starters written from this lesson’s learning intention and published AC v9 codes.",
    robots: { index: false, follow: false },
  };
}

export default async function LessonCommentsPage({
  params,
}: LessonCommentsPageProps) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();
  enforceChildSafeServerRoute(
    `${FIELD_MODE_LESSONS_PATH}/${lesson.slug}/comments`,
    "field",
  );
  return <ReportCommentsPage banks={[reportCommentBankFor(lesson)]} lesson={lesson} />;
}

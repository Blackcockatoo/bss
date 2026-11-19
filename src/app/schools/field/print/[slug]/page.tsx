import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableLessonDocument } from "@/components/field-mode/PrintableLessonDocument";
import { FIELD_MODE_PRINT_PATH_PREFIX } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { buildLessonMetadata } from "@/lib/schools/lessonMetadata";
import {
  LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";

interface PrintableLessonPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: PrintableLessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    return { title: "Printable classroom lesson" };
  }
  return buildLessonMetadata(lesson, "print");
}

export default async function PrintableLessonPage({
  params,
}: PrintableLessonPageProps) {
  const { slug } = await params;
  enforceChildSafeServerRoute(`${FIELD_MODE_PRINT_PATH_PREFIX}/${slug}`, "field");
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <PrintableLessonDocument lesson={lesson} />
    </main>
  );
}

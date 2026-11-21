import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonSlides } from "@/components/field-mode/LessonSlides";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  buildLessonMetadata,
  lessonPublicPath,
} from "@/lib/schools/lessonMetadata";
import {
  ALL_LESSON_DEFINITIONS,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";

interface LessonSlidesPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ALL_LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: LessonSlidesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) {
    return { title: "Projector slides" };
  }
  return buildLessonMetadata(lesson, "slides");
}

export default async function LessonSlidesPage({
  params,
}: LessonSlidesPageProps) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  if (!lesson) notFound();
  enforceChildSafeServerRoute(lessonPublicPath(lesson, "slides"), "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LessonSlides lesson={lesson} />
    </main>
  );
}

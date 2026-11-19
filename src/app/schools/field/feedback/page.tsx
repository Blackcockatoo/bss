import type { Metadata } from "next";

import { TeacherFeedbackForm } from "@/components/field-mode/TeacherFeedbackForm";
import { FIELD_MODE_FEEDBACK_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  getLessonById,
  getLessonBySlug,
} from "@/lib/teacher-lessons/lessonDefinitions";

export const metadata: Metadata = {
  title: "Private teacher feedback",
  description:
    "A short, private teacher note about how a lesson went. Stored only in this browser.",
  robots: { index: false, follow: false },
};

interface FeedbackPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TeacherFeedbackPage({
  searchParams,
}: FeedbackPageProps) {
  enforceChildSafeServerRoute(FIELD_MODE_FEEDBACK_PATH, "field");
  const query = await searchParams;
  const raw = query.lesson;
  const lessonKey = Array.isArray(raw) ? raw[0] : raw;
  const lesson = lessonKey
    ? (getLessonBySlug(lessonKey) ?? getLessonById(lessonKey))
    : undefined;
  return <TeacherFeedbackForm initialLessonId={lesson?.id ?? ""} />;
}

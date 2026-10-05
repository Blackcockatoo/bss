import { LessonRunner } from "@/components/teacher-lessons/LessonRunner";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { parseFieldSession } from "@/lib/fieldMode/session";
import { FIELD_PLAY_HOME } from "@/lib/productSurfaces";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export function generateStaticParams() {
  return LESSON_DEFINITIONS.map((lesson) => ({ slug: lesson.slug }));
}

export const metadata = { title: "Classroom activity — MetaPet" };

export default async function StudentActivityPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  enforceChildSafeServerRoute(FIELD_PLAY_HOME + "/" + slug, "field");
  const query = await searchParams;
  const step = Number(Array.isArray(query.step) ? query.step[0] : query.step);
  return <LessonRunner slug={slug} fieldMode studentOnly initialMode="student"
    initialStep={Number.isFinite(step) && step > 0 ? step : undefined}
    fieldSession={parseFieldSession(query)} hubPath={FIELD_PLAY_HOME} />;
}

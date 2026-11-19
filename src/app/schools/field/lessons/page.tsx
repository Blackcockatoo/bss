import type { Metadata } from "next";

import { FieldLessonLaunchpad } from "@/components/field-mode/FieldLessonLaunchpad";
import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { metaPetSchoolUrl } from "@/lib/fieldMode/identity";
import { parseLessonSearchParams } from "@/lib/schools/lessonFilters";

export const metadata: Metadata = {
  title: "Lessons",
  description:
    "Find and launch one of seven short teacher-led Australian Years 3–6 classroom lessons.",
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_LESSONS_PATH) },
};

interface FieldLessonsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FieldLessonsPage({
  searchParams,
}: FieldLessonsPageProps) {
  enforceChildSafeServerRoute(FIELD_MODE_LESSONS_PATH, "field");
  const filters = parseLessonSearchParams(await searchParams);
  return <FieldLessonLaunchpad initialFilters={filters} />;
}

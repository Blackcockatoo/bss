import type { Metadata } from "next";

import { FieldLessonLaunchpad } from "@/components/field-mode/FieldLessonLaunchpad";
import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Lessons",
  description: "Launch one of seven short teacher-led Australian classroom lessons.",
};

export default function FieldLessonsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_LESSONS_PATH, "field");
  return <FieldLessonLaunchpad />;
}

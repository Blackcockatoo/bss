import type { Metadata } from "next";

import { TeacherReview } from "@/components/teacher-lessons/TeacherReview";
import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PASSPORT_PATH,
  FIELD_MODE_REVIEW_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Teacher Evidence Review",
  description:
    "Review and delete alias-only lesson evidence stored locally on this classroom device.",
};

export default function FieldReviewPage() {
  enforceChildSafeServerRoute(FIELD_MODE_REVIEW_PATH, "field");
  return (
    <TeacherReview
      hubPath={FIELD_MODE_LESSONS_PATH}
      passportPath={FIELD_MODE_PASSPORT_PATH}
      fieldMode
    />
  );
}

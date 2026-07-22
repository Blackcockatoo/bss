import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { TeacherReview } from "@/components/teacher-lessons/TeacherReview";

export const metadata: Metadata = {
  title: "Evidence Review — Meta-Pet Teacher Hub",
  description:
    "Review the lesson evidence stored on this device across the seven-lesson Meta-Pet journey. Local-first, removable, no student accounts.",
};

export default function TeacherReviewPage() {
  enforceChildSafeServerRoute("/teachers/review");
  return <TeacherReview />;
}

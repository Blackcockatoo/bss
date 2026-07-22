import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { LearningPassport } from "@/components/teacher-lessons/LearningPassport";

export const metadata: Metadata = {
  title: "Learning Passport — Meta-Pet Teacher Hub",
  description:
    "A print-friendly summary of a student's seven-lesson Meta-Pet journey. Local-first, no student accounts, safe alias only.",
};

export default function LearningPassportPage() {
  enforceChildSafeServerRoute("/teachers/passport");
  return <LearningPassport />;
}

import type { Metadata } from "next";

import { LearningPassport } from "@/components/teacher-lessons/LearningPassport";
import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PASSPORT_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Learning Passport",
  description:
    "An alias-only journey summary derived from lesson evidence stored on this classroom device.",
};

export default function FieldPassportPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PASSPORT_PATH, "field");
  return <LearningPassport hubPath={FIELD_MODE_LESSONS_PATH} fieldMode />;
}

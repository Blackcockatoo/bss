import type { Metadata } from "next";

import { ClassFieldRecordView } from "@/components/teacher-lessons/ClassFieldRecordView";
import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_RECORD_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Class Field Record",
  description:
    "A printable, no-grading classroom evidence summary derived from local lesson evidence stored on this device.",
};

export default function FieldRecordPage() {
  enforceChildSafeServerRoute(FIELD_MODE_RECORD_PATH, "field");
  return (
    <ClassFieldRecordView hubPath={FIELD_MODE_LESSONS_PATH} hubLabel="Field Lessons" />
  );
}

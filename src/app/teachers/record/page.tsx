import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { ClassFieldRecordView } from "@/components/teacher-lessons/ClassFieldRecordView";

export const metadata: Metadata = {
  title: "Class Field Record — Meta-Pet Teacher Hub",
  description:
    "A printable, no-grading classroom evidence summary across the seven Meta-Pet lessons. Local-first, no student names by default.",
};

export default function ClassFieldRecordPage() {
  enforceChildSafeServerRoute("/teachers/record");
  return <ClassFieldRecordView />;
}

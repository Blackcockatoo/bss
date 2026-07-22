import type { Metadata } from "next";

import SchoolGamePage from "@/app/school-game/page";
import { FIELD_MODE_CLASSROOM_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata: Metadata = {
  title: "Classroom",
  description:
    "Alias-only classroom setup, lesson queue and local deletion controls for MetaPet Field Mode.",
};

export default function FieldClassroomPage() {
  enforceChildSafeServerRoute(FIELD_MODE_CLASSROOM_PATH, "field");
  return <SchoolGamePage />;
}

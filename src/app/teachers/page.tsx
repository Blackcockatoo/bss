import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { TeacherHub } from "@/components/teacher-lessons";

export const metadata: Metadata = {
  title: "Meta-Pet Teacher Hub",
  description:
    "A teacher-guided classroom layer over Meta-Pet: seven ordered lessons you can start in two or three clicks. Local-first, no student accounts.",
};

export default function TeacherHubPage() {
  enforceChildSafeServerRoute("/teachers");
  return <TeacherHub />;
}

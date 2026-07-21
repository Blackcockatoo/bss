import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { PilotReadiness } from "@/components/teacher-lessons/PilotReadiness";

export const metadata: Metadata = {
  title: "Pilot Readiness — Meta-Pet Teacher Hub",
  description:
    "A lightweight classroom pilot checklist and optional local feedback for the seven-lesson Meta-Pet journey. No student names, no tracking.",
};

export default function PilotReadinessPage() {
  enforceChildSafeServerRoute("/teachers/pilot");
  return <PilotReadiness />;
}

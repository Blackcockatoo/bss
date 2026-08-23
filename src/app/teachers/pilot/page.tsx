import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { PilotReadiness } from "@/components/teacher-lessons/PilotReadiness";

export const metadata: Metadata = {
  title: "Pilot Readiness — Meta-Pet Teacher Hub",
  description:
    "A lightweight classroom pilot checklist with optional local feedback. Student names are not requested, and school routes carry no product analytics.",
};

export default function PilotReadinessPage() {
  enforceChildSafeServerRoute("/teachers/pilot");
  return <PilotReadiness />;
}

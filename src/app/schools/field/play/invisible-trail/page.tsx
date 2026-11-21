import type { Metadata } from "next";

import { InvisibleTrailLab } from "@/components/field-mode/InvisibleTrailLab";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

const TRAIL_PATH = "/schools/field/play/invisible-trail";

export const metadata: Metadata = {
  title: "The Invisible Trail — Digital Privacy Lab",
  description: "A teacher-led Years 3–6 digital-footprint adventure using only fictional data, without accounts or student profiles.",
  alternates: { canonical: TRAIL_PATH },
};

export default function InvisibleTrailPage() {
  enforceChildSafeServerRoute(TRAIL_PATH, "field");
  return <InvisibleTrailLab />;
}

import type { Metadata } from "next";

import { InvisibleTrailSlides } from "@/components/field-mode/InvisibleTrailSlides";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { INVISIBLE_TRAIL_SLIDES_PATH } from "@/lib/schools/invisibleTrailPack";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";

export const metadata: Metadata = {
  title: "Projector slides — The Invisible Trail",
  description:
    "Teacher projector slides for the optional 30-minute Invisible Trail privacy lab.",
  alternates: { canonical: metaPetSchoolUrl(INVISIBLE_TRAIL_SLIDES_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Projector slides — The Invisible Trail",
    description:
      "Teacher projector slides for the optional 30-minute Invisible Trail privacy lab.",
    url: metaPetSchoolUrl(INVISIBLE_TRAIL_SLIDES_PATH),
    locale: "en_AU",
  },
};

export default function InvisibleTrailSlidesPage() {
  enforceChildSafeServerRoute(INVISIBLE_TRAIL_SLIDES_PATH, "field");
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <InvisibleTrailSlides />
    </main>
  );
}

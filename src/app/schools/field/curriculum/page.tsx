import type { Metadata } from "next";

import { CurriculumMaps } from "@/components/field-mode/CurriculumMaps";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  FIELD_MODE_CURRICULUM_PATH,
  FIELD_MODE_PRINT_CURRICULUM_PATH,
} from "@/lib/schools/classroomPack";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";

const DESCRIPTION =
  "Victorian Curriculum 2.0 and NSW syllabus maps for MetaPet School lessons, using official wording only, with a not-an-endorsement caveat.";

export const metadata: Metadata = {
  title: "Victorian and NSW curriculum maps",
  description: DESCRIPTION,
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_CURRICULUM_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Victorian and NSW curriculum maps",
    description: DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_CURRICULUM_PATH),
    locale: "en_AU",
  },
};

export default function CurriculumMapsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_CURRICULUM_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
          Teacher curriculum maps
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Victorian Curriculum 2.0 and NSW syllabus maps
        </h1>
        <div className="flex flex-wrap gap-3">
          <a
            href={FIELD_MODE_HOME_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Field home
          </a>
          <a
            href={FIELD_MODE_LESSONS_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Lessons
          </a>
          <a
            href={FIELD_MODE_PRINT_CURRICULUM_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Print version
          </a>
        </div>
        <CurriculumMaps />
      </div>
    </main>
  );
}

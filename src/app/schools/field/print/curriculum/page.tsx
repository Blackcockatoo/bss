import type { Metadata } from "next";

import { CurriculumMaps } from "@/components/field-mode/CurriculumMaps";
import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { FIELD_MODE_CURRICULUM_PATH } from "@/lib/schools/classroomPack";
import { FIELD_MODE_PRINT_CURRICULUM_PATH } from "@/lib/schools/classroomPack";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";

const DESCRIPTION =
  "Printable Victorian Curriculum 2.0 and NSW syllabus maps for all MetaPet School lessons and The Invisible Trail.";

export const metadata: Metadata = {
  title: "Print Victorian and NSW curriculum maps",
  description: DESCRIPTION,
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_PRINT_CURRICULUM_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Print Victorian and NSW curriculum maps",
    description: DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_CURRICULUM_PATH),
    locale: "en_AU",
  },
};

export default function PrintCurriculumMapsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_CURRICULUM_PATH, "field");

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700">
          Both states print on this page. Use your browser’s print dialog.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={FIELD_MODE_CURRICULUM_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Back to maps
          </a>
          <PrintLessonButton />
        </div>
      </div>
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Victorian Curriculum 2.0 and NSW syllabus maps
        </h1>
        <CurriculumMaps printBoth />
      </div>
    </main>
  );
}

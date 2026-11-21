import type { Metadata } from "next";

import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { PrintableLessonDocument } from "@/components/field-mode/PrintableLessonDocument";
import { PrintableOfficialLinks } from "@/components/field-mode/classroomPackDocuments";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import { FIELD_MODE_PRINT_F2_ALL_PATH } from "@/lib/schools/classroomPack";
import {
  FOUNDATION_ALIGNMENT_CAVEAT,
  FOUNDATION_SEQUENCE_SUMMARY,
} from "@/lib/schools/foundationSequence";
import { FOUNDATION_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

const PRINT_F2_DESCRIPTION =
  "One printable pack of seven fully unplugged Foundation and Years 1–2 lesson planners, with materials, timings, EAL/D notes, word walls, pre-reader exit activities and report comment starters.";

export const metadata: Metadata = {
  title: "Print the F–2 unplugged classroom pack",
  description: PRINT_F2_DESCRIPTION,
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_PRINT_F2_ALL_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Print the F–2 unplugged classroom pack",
    description: PRINT_F2_DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_F2_ALL_PATH),
    locale: "en_AU",
  },
};

export default function PrintFoundationLessonsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_F2_ALL_PATH, "field");

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            Printable F–2 unplugged pack
          </p>
          <p className="text-sm text-slate-700">
            Seven unplugged lesson planners for Foundation and Years 1–2. Use
            your browser’s print dialog and choose “Save as PDF” if you need a
            file.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={FIELD_MODE_HOME_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Back to home
          </a>
          <a
            href={FIELD_MODE_LESSONS_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Lesson list
          </a>
          <PrintLessonButton />
        </div>
      </div>
      <h1 className="field-print-hide mx-auto mb-6 max-w-4xl text-3xl font-semibold tracking-tight">
        Print the F–2 unplugged classroom pack
      </h1>
      <div className="space-y-10">
        <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none md:p-8">
          <h2 className="text-2xl font-semibold">What’s in this pack</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {FOUNDATION_SEQUENCE_SUMMARY}
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
            <li>Seven unplugged lesson planners, with teacher scripts and five guided steps</li>
            <li>Materials lists and estimated minutes that add up to 15 or 20 minutes</li>
            <li>Word walls, EAL/D notes, and exit activities suitable for pre-readers (draw, point or thumbs)</li>
            <li>Report comment starters that must be personalised</li>
            <li>Official Australian Curriculum v9 wording copied from ACARA sources, with a clear caveat</li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {FOUNDATION_ALIGNMENT_CAVEAT} Students do not need accounts or
            devices, and these lessons do not collect names or photos.
          </p>
        </article>
        {FOUNDATION_LESSON_DEFINITIONS.map((lesson) => (
          <div key={lesson.id} className="break-before-page">
            <PrintableLessonDocument
              lesson={lesson}
              showToolbar={false}
              headingLevel={2}
            />
          </div>
        ))}
        <div className="break-before-page">
          <PrintableOfficialLinks headingLevel={2} />
        </div>
      </div>
    </main>
  );
}

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
import { FIELD_MODE_PRINT_TOPICAL_PATH } from "@/lib/schools/classroomPack";
import { TOPICAL_ESAFETY_LINKS } from "@/lib/schools/topicalClassroomPack";
import { TOPICAL_CURRICULUM_SOURCES } from "@/lib/schools/topicalCurriculum";
import {
  TOPICAL_ALIGNMENT_CAVEAT,
  TOPICAL_PERIOD_NOTE,
  TOPICAL_SEQUENCE_SUMMARY,
} from "@/lib/schools/topicalSequence";
import { TOPICAL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

const PRINT_TOPICAL_DESCRIPTION =
  "One printable pack of three Years 5–8 topical mini-lesson planners, with materials, 25-minute timings, EAL/D notes, word walls, exit tasks and report comment starters. Unplugged; no student accounts.";

export const metadata: Metadata = {
  title: "Print the Years 5–8 topical mini-lesson pack",
  description: PRINT_TOPICAL_DESCRIPTION,
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_PRINT_TOPICAL_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Print the Years 5–8 topical mini-lesson pack",
    description: PRINT_TOPICAL_DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_PRINT_TOPICAL_PATH),
    locale: "en_AU",
  },
};

export default function PrintTopicalLessonsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_TOPICAL_PATH, "field");

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            Printable Years 5–8 topical pack
          </p>
          <p className="text-sm text-slate-700">
            Three short lesson planners for Years 5–8. Use your browser’s print
            dialog and choose “Save as PDF” if you need a file.
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
        Print the Years 5–8 topical mini-lesson pack
      </h1>
      <div className="space-y-10">
        <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none md:p-8">
          <h2 className="text-2xl font-semibold">What’s in this pack</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {TOPICAL_SEQUENCE_SUMMARY}
          </p>
          <p className="mt-3 text-base leading-7 text-slate-700">
            {TOPICAL_PERIOD_NOTE} {TOPICAL_ALIGNMENT_CAVEAT}
          </p>
        </article>
        {TOPICAL_LESSON_DEFINITIONS.map((lesson) => (
          <PrintableLessonDocument key={lesson.id} lesson={lesson} />
        ))}
        <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none md:p-8">
          <h2 className="text-2xl font-semibold">Official links for these mini-lessons</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">
            These official pages were checked as reachable (HTTP 200) on 22
            November 2026, Australia/Melbourne. That check confirms the
            address worked on that date. It is not an ACARA or eSafety
            endorsement of MetaPet School.
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-7 text-slate-700">
            {TOPICAL_CURRICULUM_SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} className="font-semibold underline">
                  {source.title}
                </a>
                <span> — {source.notes}</span>
              </li>
            ))}
            {TOPICAL_ESAFETY_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="font-semibold underline">
                  {link.title}
                </a>
                <span> — {link.note}</span>
              </li>
            ))}
          </ul>
        </article>
        <PrintableOfficialLinks headingLevel={2} includeCurriculum />
      </div>
    </main>
  );
}

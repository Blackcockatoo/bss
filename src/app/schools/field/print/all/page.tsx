import type { Metadata } from "next";

import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { PrintableLessonDocument } from "@/components/field-mode/PrintableLessonDocument";
import {
  PrintableAssessmentTools,
  PrintableExitTickets,
  PrintableLeadershipBrief,
  PrintableNoTechGuide,
  PrintableOfficialLinks,
  PrintablePackContents,
  PrintableParentLetter,
  PrintableReliefPack,
  PrintableVerifiedStatus,
  PrintableWordWalls,
} from "@/components/field-mode/classroomPackDocuments";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_ALL_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export const metadata: Metadata = {
  title: "Print the Years 3–6 classroom pack",
  description:
    "One printable pack of seven lesson planners, exit tickets, word walls, assessment tools, the parent letter, a relief pack, a leadership one-pager and what’s verified.",
  robots: { index: false, follow: false },
};

export default function PrintAllLessonsPage() {
  enforceChildSafeServerRoute(FIELD_MODE_PRINT_ALL_PATH, "field");

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            Printable classroom pack
          </p>
          <p className="text-sm text-slate-700">
            Lesson planners, paper tools, the parent letter and the leadership
            brief. Use your browser’s print dialog and choose “Save as PDF” if
            you need a file.
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
        Print the Years 3–6 classroom pack
      </h1>
      <div className="space-y-10">
        <PrintablePackContents headingLevel={2} />
        <div className="break-before-page">
          <PrintableReliefPack headingLevel={2} />
        </div>
        {LESSON_DEFINITIONS.map((lesson) => (
          <div key={lesson.id} className="break-before-page">
            <PrintableLessonDocument
              lesson={lesson}
              showToolbar={false}
              headingLevel={2}
            />
          </div>
        ))}
        <div className="break-before-page">
          <PrintableExitTickets headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableWordWalls headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableAssessmentTools headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableNoTechGuide headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableParentLetter headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableLeadershipBrief headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableVerifiedStatus headingLevel={2} />
        </div>
        <div className="break-before-page">
          <PrintableOfficialLinks headingLevel={2} includeCurriculum />
        </div>
      </div>
    </main>
  );
}

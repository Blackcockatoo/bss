import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";

import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { PrintableLessonDocument } from "@/components/field-mode/PrintableLessonDocument";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_ALL_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export const metadata: Metadata = {
  title: "Print all seven lessons and the parent note",
  description:
    "One printable pack of the seven MetaPet School lessons plus the parent and carer note.",
  robots: { index: false, follow: false },
};

function ParentNoteDocument() {
  const source = readFileSync(
    join(process.cwd(), "public/docs/schools-au/teacher-pack/parent-note.md"),
    "utf8",
  );
  const lines = source.split("\n");

  return (
    <article className="mx-auto max-w-4xl break-before-page rounded-2xl bg-white p-7 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none md:p-10">
      {lines.map((line, index) => {
        if (line.startsWith("# ")) {
          return (
            <h2 key={index} className="text-3xl font-bold tracking-tight">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="mt-6 text-xl font-bold">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={index} className="mt-1 pl-4 text-base leading-7">
              • {line.slice(2)}
            </p>
          );
        }
        if (line.startsWith("`") && line.endsWith("`") === false) {
          return (
            <p key={index} className="mt-3 text-base leading-7 text-slate-700">
              {line.replaceAll("`", "")}
            </p>
          );
        }
        if (line.trim() === "") {
          return null;
        }
        return (
          <p key={index} className="mt-3 text-base leading-7 text-slate-700">
            {line.replaceAll("`", "")}
          </p>
        );
      })}
    </article>
  );
}

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
            All seven lessons and the parent and carer note. Use your browser’s
            print dialog and choose “Save as PDF” if you need a file. The
            optional Invisible Trail teacher guide is a separate page that also
            works with JavaScript turned off.
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
        Print all seven lessons and the parent note
      </h1>
      <div className="space-y-10">
        {LESSON_DEFINITIONS.map((lesson) => (
          <div key={lesson.id} className="break-before-page first:break-before-auto">
            <PrintableLessonDocument
              lesson={lesson}
              showToolbar={false}
              headingLevel={2}
            />
          </div>
        ))}
        <ParentNoteDocument />
        <article className="field-print-hide mx-auto max-w-4xl rounded-2xl border border-emerald-900/20 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Optional: The Invisible Trail teacher guide</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            A 30-minute optional companion lab (15 minutes interactive, 15 minutes
            discussion), using only fictional data. Open the standalone guide to
            print it, including when JavaScript is off.
          </p>
          <a
            href="/schools/field/print/invisible-trail.html"
            className="mt-3 inline-flex min-h-11 items-center font-semibold text-emerald-900 underline"
          >
            Open the printable Invisible Trail teacher guide
          </a>
        </article>
      </div>
    </main>
  );
}

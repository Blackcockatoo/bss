import type { Metadata } from "next";

import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import {
  INVISIBLE_TRAIL_CONDITIONS,
  INVISIBLE_TRAIL_DURATION_MINUTES,
  INVISIBLE_TRAIL_EALD,
  INVISIBLE_TRAIL_EXIT_TICKET,
  INVISIBLE_TRAIL_INTENTION,
  INVISIBLE_TRAIL_LAB_PATH,
  INVISIBLE_TRAIL_MATERIALS,
  INVISIBLE_TRAIL_PAPER,
  INVISIBLE_TRAIL_PRINT_PLANNER_PATH,
  INVISIBLE_TRAIL_REPORT_STARTERS,
  INVISIBLE_TRAIL_SLIDES_PATH,
  INVISIBLE_TRAIL_STATIC_GUIDE_PATH,
  INVISIBLE_TRAIL_STATED_CURRICULUM,
  INVISIBLE_TRAIL_TIMINGS,
  INVISIBLE_TRAIL_TITLE,
  INVISIBLE_TRAIL_VOCAB,
  invisibleTrailTimingTotal,
} from "@/lib/schools/invisibleTrailPack";

const DESCRIPTION =
  "Printable 30-minute planner for The Invisible Trail, including materials, timings, EAL/D notes, a word wall, an exit ticket and report comment starters.";

export const metadata: Metadata = {
  title: "Planner — The Invisible Trail",
  description: DESCRIPTION,
  alternates: {
    canonical: metaPetSchoolUrl(INVISIBLE_TRAIL_PRINT_PLANNER_PATH),
  },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: "Planner — The Invisible Trail",
    description: DESCRIPTION,
    url: metaPetSchoolUrl(INVISIBLE_TRAIL_PRINT_PLANNER_PATH),
    locale: "en_AU",
  },
};

export default function InvisibleTrailPlannerPage() {
  enforceChildSafeServerRoute(INVISIBLE_TRAIL_PRINT_PLANNER_PATH, "field");
  const total = invisibleTrailTimingTotal();

  return (
    <main className="field-print-document min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
      <div className="field-print-hide mx-auto mb-8 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700">
          Optional companion planner. The no-JavaScript teacher guide is still
          available as a separate page.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={INVISIBLE_TRAIL_LAB_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Open the lab
          </a>
          <a
            href={INVISIBLE_TRAIL_SLIDES_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Projector slides
          </a>
          <a
            href={INVISIBLE_TRAIL_STATIC_GUIDE_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            No-JavaScript guide
          </a>
          <PrintLessonButton />
        </div>
      </div>

      <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:shadow-none md:p-10">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            Optional companion · Years 3–6 · {INVISIBLE_TRAIL_DURATION_MINUTES}{" "}
            minutes
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {INVISIBLE_TRAIL_TITLE} planner
          </h1>
          <p className="text-base leading-7 text-slate-700">
            {INVISIBLE_TRAIL_INTENTION}
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold">Materials</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {INVISIBLE_TRAIL_MATERIALS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {INVISIBLE_TRAIL_CONDITIONS}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            <span className="font-semibold">{INVISIBLE_TRAIL_PAPER.label}.</span>{" "}
            {INVISIBLE_TRAIL_PAPER.summary}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            Timings ({total} minutes)
          </h2>
          <ol className="mt-3 space-y-3">
            {INVISIBLE_TRAIL_TIMINGS.map((step) => (
              <li key={step.id} className="text-sm leading-6">
                <p className="font-semibold">
                  {step.minutes} min — {step.title}
                </p>
                <p className="text-slate-700">{step.teacherDoes}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Word wall</h2>
          <ul className="mt-2 space-y-2 text-sm leading-6">
            {INVISIBLE_TRAIL_VOCAB.map((entry) => (
              <li key={entry.word}>
                <span className="font-semibold">{entry.word}:</span>{" "}
                {entry.meaning}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">EAL/D notes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Pre-teach: {INVISIBLE_TRAIL_EALD.preteach.join(", ")}.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {INVISIBLE_TRAIL_EALD.sentenceStarters.map((stem) => (
              <li key={stem}>{stem}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {INVISIBLE_TRAIL_EALD.duringLesson}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">
            {INVISIBLE_TRAIL_EXIT_TICKET.title}
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6">
            {INVISIBLE_TRAIL_EXIT_TICKET.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Codes already stated on the lab</h2>
          <ul className="mt-2 space-y-3 text-sm leading-6">
            {INVISIBLE_TRAIL_STATED_CURRICULUM.map((item) => (
              <li key={item.code}>
                <p className="font-semibold">{item.code}</p>
                <p>“{item.wording}”</p>
                <p className="text-slate-600">{item.source}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Report comment starters</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Replace [alias]. These are starters only, not official achievement
            standards.
          </p>
          <ul className="mt-2 space-y-2 text-sm leading-6">
            <li>
              <span className="font-semibold">Working towards:</span>{" "}
              {INVISIBLE_TRAIL_REPORT_STARTERS["working-towards"]}
            </li>
            <li>
              <span className="font-semibold">At the intention:</span>{" "}
              {INVISIBLE_TRAIL_REPORT_STARTERS.at}
            </li>
            <li>
              <span className="font-semibold">Above the intention:</span>{" "}
              {INVISIBLE_TRAIL_REPORT_STARTERS.above}
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}

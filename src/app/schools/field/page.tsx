import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Printer, ShieldCheck } from "lucide-react";

import {
  FIELD_MODE_CLASSROOM_PATH,
  FIELD_MODE_GUIDE_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_ALL_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_TOOLS_PATH,
  FIELD_MODE_COMMENTS_PATH,
  FIELD_MODE_VERIFIED_PATH,
  SCHOOLS_DATA_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import {
  METAPET_SCHOOL_DESCRIPTION,
  METAPET_SCHOOL_NAME,
  metaPetSchoolUrl,
} from "@/lib/fieldMode/identity";
import {
  curriculumAlignmentForSession,
  mergeLearningAreas,
} from "@/lib/schools/curriculumAlignment";
import {
  CANONICAL_SESSION_COUNT,
  FIRST_CANONICAL_SESSION,
} from "@/lib/schools/canonicalSequence";
import {
  SCHOOL_PRIVACY_COMMITMENTS,
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
} from "@/lib/schools/privacyTruth";
import {
  FIELD_MODE_PRINT_CHECKLIST_PATH,
  FIELD_MODE_PRINT_NO_TECH_PATH,
  FIELD_MODE_PRINT_PARENT_LETTER_PATH,
  FIELD_MODE_PRINT_RELIEF_PATH,
  FIELD_MODE_PRINT_TICKETS_PATH,
  FIELD_MODE_PRINT_WORD_WALLS_PATH,
} from "@/lib/schools/classroomPack";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

const WHAT_YOU_NEED = [
  "Years 3–6 class",
  "About 15–20 minutes",
  "A teacher to lead it",
  "A browser — nothing to install",
  SCHOOL_PRIVACY_COMMITMENTS.accountsShort,
  "A printer if you want the paper fallback",
] as const;

export const metadata: Metadata = {
  title: `${METAPET_SCHOOL_NAME} — Australian Years 3–6 Classroom Lessons`,
  description: METAPET_SCHOOL_DESCRIPTION,
  alternates: { canonical: metaPetSchoolUrl(FIELD_MODE_HOME_PATH) },
  openGraph: {
    type: "website",
    siteName: METAPET_SCHOOL_NAME,
    title: `${METAPET_SCHOOL_NAME} — Australian Years 3–6 Classroom Lessons`,
    description: METAPET_SCHOOL_DESCRIPTION,
    url: metaPetSchoolUrl(FIELD_MODE_HOME_PATH),
    locale: "en_AU",
  },
};

const SESSION_ONE_PATH = `${FIELD_MODE_LESSONS_PATH}/${FIRST_CANONICAL_SESSION.slug}`;

export default function FieldModePage() {
  enforceChildSafeServerRoute(FIELD_MODE_HOME_PATH, "field");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-10 px-5 py-10 md:px-8 md:py-16">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/15 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {METAPET_SCHOOL_NAME} · Australian Years 3–6
          </div>

          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {CANONICAL_SESSION_COUNT} short lessons about how systems work.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-700">
            A teacher-led classroom resource. Each lesson takes about 15–20
            minutes. No student sign-in. Classroom records stay in this browser
            during routine use, and you can delete them at any time.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={SESSION_ONE_PATH}
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-emerald-800 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Start Lesson 1 in 15 minutes
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href={FIELD_MODE_LESSONS_PATH}
              className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-emerald-800 px-6 py-3 text-base font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            >
              Browse all seven lessons
            </a>
          </div>

          <p className="text-base text-slate-600">
            The flow is simple: open the lesson, follow the teacher script, hide
            notes when you project, and stop at the visible end point. Lesson 1
            is a complete lesson on its own.
          </p>
        </section>

        <section aria-labelledby="lesson-list-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="lesson-list-heading"
              className="text-2xl font-semibold text-slate-950"
            >
              The seven lessons
            </h2>
            <div className="flex flex-wrap gap-3">
              <a
                href={FIELD_MODE_PRINT_ALL_PATH}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print the classroom pack
              </a>
            </div>
          </div>
          <ol className="grid gap-4">
            {LESSON_DEFINITIONS.map((lesson) => {
              const alignment = curriculumAlignmentForSession(lesson.number);
              const areas = mergeLearningAreas(
                lesson.learningAreas,
                alignment.learningAreas,
              );
              return (
                <li
                  key={lesson.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                      Lesson {lesson.number}
                    </p>
                    <p className="text-sm font-medium text-slate-600">
                      Years 3–6 · {lesson.durationMinutes} minutes
                    </p>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {lesson.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {lesson.shortDescription}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Learning areas:
                    </span>{" "}
                    {areas.join(" · ")}
                  </p>
                  {alignment.codes.length > 0 ? (
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Australian Curriculum v9:
                      </span>{" "}
                      {alignment.codes.join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`}
                      className="inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {lesson.number === 1
                        ? "Start Lesson 1"
                        : "Open lesson"}
                    </a>
                    <a
                      href={`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`}
                      className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Print this lesson
                    </a>
                    <a
                      href={`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}/slides`}
                      className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Projector slides
                    </a>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="digital-independence-heading" className="rounded-2xl border border-emerald-900/20 bg-white p-6">
          <h2 id="digital-independence-heading" className="text-2xl font-semibold">Teach the child to read the machine.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-700">
            The Invisible Trail is an optional Digital Independence lesson. Students use fictional data
            to see how a click leaves a record, how a system makes a guess and how a privacy choice changes the result.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/schools/field/play/invisible-trail" className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline">
              Try The Invisible Trail
            </Link>
            <a href="/schools/field/print/invisible-trail.html" className="inline-flex min-h-12 items-center font-semibold text-emerald-900 underline">
              Printable teacher guide
            </a>
          </div>
        </section>

        <section
          aria-labelledby="classroom-pack-heading"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <h2
            id="classroom-pack-heading"
            className="text-2xl font-semibold text-slate-950"
          >
            Classroom pack
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            One-page planners now include materials, estimated step timings,
            published AC v9 codes and a two-minute explainer. Print the full
            pack, or open one tool at a time.
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {[
              { href: FIELD_MODE_PRINT_ALL_PATH, label: "Print the full pack" },
              { href: "/schools/field/print/invisible-trail.html", label: "Invisible Trail teacher guide" },
              { href: FIELD_MODE_PRINT_RELIEF_PATH, label: "Relief teacher pack" },
              { href: FIELD_MODE_PRINT_TICKETS_PATH, label: "Exit tickets" },
              { href: FIELD_MODE_PRINT_WORD_WALLS_PATH, label: "Word walls" },
              { href: FIELD_MODE_PRINT_CHECKLIST_PATH, label: "Assessment checklist" },
              { href: FIELD_MODE_PRINT_NO_TECH_PATH, label: "No-tech / paper path" },
              { href: FIELD_MODE_PRINT_PARENT_LETTER_PATH, label: "Parent letter" },
              { href: "/schools/field/print/leadership", label: "Leadership one-pager" },
              { href: FIELD_MODE_VERIFIED_PATH, label: "What’s verified" },
              { href: FIELD_MODE_TOOLS_PATH, label: "Timer and groups" },
              { href: FIELD_MODE_COMMENTS_PATH, label: "Report comment starters" },
            ].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="what-you-need-heading"
          className="rounded-3xl border-2 border-emerald-900/20 bg-white p-6 shadow-sm md:p-8"
        >
          <h2
            id="what-you-need-heading"
            className="text-2xl font-semibold text-slate-950"
          >
            What you need
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {WHAT_YOU_NEED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-base text-slate-800"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="teacher-tools-heading"
          className="grid gap-4 md:grid-cols-2"
        >
          <h2 id="teacher-tools-heading" className="sr-only">
            Teacher tools
          </h2>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">
              What this stores
            </h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-slate-700">
              <li>
                Teacher-chosen aliases; real names are not required and should
                not be entered
              </li>
              <li>Lesson progress and any light evidence you record</li>
              <li>{SCHOOL_PRIVACY_COMMITMENTS.localRecords}</li>
              <li>
                Cleared on the next school-route load after{" "}
                {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={FIELD_MODE_SAFETY_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Safety and privacy
              </a>
              <a
                href={SCHOOLS_DATA_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open local-data controls
              </a>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">
              Before you teach
            </h3>
            <ul className="mt-4 space-y-2 text-base leading-7 text-slate-700">
              <li>Prepare an alias-only classroom roster if you need one.</li>
              <li>
                Adjust year band, time and grouping on the lessons page if the
                defaults do not suit the class.
              </li>
              <li>
                Hide teacher notes when the lesson is on a projector.
              </li>
              <li>Print the paper pack if the network may drop out.</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={FIELD_MODE_CLASSROOM_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Alias roster and classroom setup
              </a>
              <a
                href={FIELD_MODE_TOOLS_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Timer and groups
              </a>
              <a
                href={FIELD_MODE_COMMENTS_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Report comment starters
              </a>
              <Link
                href={FIELD_MODE_GUIDE_PATH}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open the teacher guide
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

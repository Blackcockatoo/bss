import Link from "next/link";
import type { Metadata } from "next";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

import { lessonCards, learningOutcomes } from "../content";

export const metadata: Metadata = {
  title: "Lessons — MetaPet School",
  description:
    "Seven 20-minute lesson cards for Years 3–6: one clear outcome, one student activity, one teacher prompt, and light evidence per session.",
  alternates: { canonical: "/lessons" },
};

export default function SchoolLessonsPage() {
  enforceChildSafeServerRoute("/schools/lessons");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 md:py-16">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            MetaPet School · Lessons
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Seven lessons built for normal class windows
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-300">
            Each session is fixed to 20 minutes with one outcome, one student
            activity, one teacher prompt, and light evidence. Teacher-led,
            child-safe and classroom focused.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/start"
              className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200"
            >
              Open the classroom runtime
            </Link>
            <Link
              href="/teacher-guide"
              className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500"
            >
              Teacher guide
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {lessonCards.map((lesson) => (
            <article
              key={lesson.session}
              className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  {lesson.session}
                </p>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  20 minutes
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">
                {lesson.title}
              </h2>
              <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <div>
                  <dt className="font-semibold text-slate-100">Outcome</dt>
                  <dd>{lesson.outcome}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-100">
                    Student activity
                  </dt>
                  <dd>{lesson.activity}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-100">
                    Teacher prompt
                  </dt>
                  <dd>{lesson.prompt}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-100">Best-fit use</dt>
                  <dd>{lesson.bestFit}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            What students should be able to say and show
          </h2>
          <div className="mt-6 grid gap-4">
            {learningOutcomes.map((outcome) => (
              <article
                key={outcome.statement}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <p className="text-base font-medium leading-7 text-white">
                  {outcome.statement}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">Lessons:</span>{" "}
                  {outcome.lessons}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

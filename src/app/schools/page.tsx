import Link from "next/link";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

import {
  assuranceItems,
  curriculumRows,
  curriculumSourceLinks,
  evidenceTools,
  learningOutcomes,
  lessonCards,
  schoolPackageDocs,
  weeklyFitOptions,
} from "./content";

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {title}
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
        {description}
      </p>
    </div>
  );
}

export default function SchoolsPage() {
  enforceChildSafeServerRoute("/schools");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:gap-14 md:py-16">
        <header className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] md:p-8">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
              MetaPet for Schools
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                An Australia-wide Years 3-6 classroom sequence teachers can use
                tomorrow
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                This school-facing package is built for Australian classrooms:
                clear curriculum fit, seven 20-minute sessions, no student
                accounts, and no marking required. It positions MetaPet as a
                calm digital companion sequence for Digital Technologies,
                wellbeing learning and classroom reflection.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              {[
                "Years 3-6 fit",
                "7 x 20 minute sessions",
                "No student accounts",
                "No marking required",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 font-medium text-amber-100"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950"
                href="#downloads"
              >
                Download school pack
              </a>
              <a
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="#privacy"
              >
                View ICT note
              </a>
              <Link
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="/"
              >
                Back to MetaPet
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Australian Curriculum V9.0"
            title="Curriculum alignment with explicit classroom fit"
            description="This sequence is packaged for Digital Technologies, Health and Physical Education wellbeing learning, and Personal and Social capability. The alignment below focuses on the codes most useful for teacher planning and leadership approval."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {curriculumRows.map((row) => (
              <article
                key={`${row.code}-${row.band}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <span>{row.band}</span>
                  <span className="rounded-full border border-slate-700 px-2 py-1 normal-case tracking-normal text-slate-300">
                    {row.learningArea}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-amber-200">
                  {row.code}
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {row.focus}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {row.metapetUse}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-200">
              Personal and Social capability
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              The sequence also supports self-awareness, self-management, social
              awareness and social management. This makes it easy to position as
              both Digital Technologies learning and calm classroom wellbeing
              practice.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Learning Outcomes"
            title="What students should be able to say and show"
            description='Each outcome is written in a teacher-friendly "By the end of this sequence, students will..." form and mapped to both lessons and curriculum codes.'
          />

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
                <p className="mt-1 text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">Codes:</span>{" "}
                  {outcome.codes.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Lesson Snapshot"
            title="Seven lesson cards built for normal class windows"
            description="Each session is fixed to 20 minutes, one clear outcome, one student activity, one teacher prompt, light evidence, and a clear best-fit use case."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {lesson.title}
                </h3>
                <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  <div>
                    <dt className="font-semibold text-slate-100">Outcome</dt>
                    <dd>{lesson.outcome}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">Student activity</dt>
                    <dd>{lesson.activity}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">Teacher prompt</dt>
                    <dd>{lesson.prompt}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">Light evidence</dt>
                    <dd>{lesson.evidence}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">Best-fit use case</dt>
                    <dd>{lesson.bestFit}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <SectionHeading
              eyebrow="Assessment"
              title="Light evidence only"
              description="No marking required. Teachers can collect simple classroom evidence with two optional tools and still keep the sequence low-friction."
            />

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-lg font-semibold text-amber-100">
                No marking required
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This sequence does not require grading, report comments or a
                formal rubric. It is packaged for classroom use, not extra admin
                burden.
              </p>
            </div>

            <div className="mt-4 grid gap-4">
              {evidenceTools.map((tool) => (
                <article
                  key={tool.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <h3 className="text-base font-semibold text-white">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {tool.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <SectionHeading
              eyebrow="Weekly Fit"
              title="Where this fits in a school week"
              description="Teachers usually need a fast answer to timing and slotting. These are the primary packaging labels used throughout the school pack."
            />

            <div className="mt-6 grid gap-4">
              {weeklyFitOptions.map((option) => (
                <article
                  key={option.label}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <h3 className="text-base font-semibold text-white">
                    {option.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {option.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
            <SectionHeading
              eyebrow="Family and Admin Reassurance"
              title="Low-friction language for parents, principals and wellbeing teams"
              description="School-facing positioning stays simple: short classroom sequence, clear curriculum fit, calm use, and no extra teacher workload."
            />

            <div className="mt-6 grid gap-4">
              {assuranceItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <section
            id="privacy"
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
          >
            <SectionHeading
              eyebrow="ICT and Privacy"
              title="Keep the technical detail in the appendix, not the hero copy"
              description="Teacher and family surfaces should stay in plain classroom language. The implementation note carries the privacy and ICT discussion, including the privacy-and-security curriculum references."
            />

            <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
              <p className="text-sm font-semibold text-violet-200">
                ICT note
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The school-facing explanation is simple: the classroom baseline
                uses on-device storage for normal use and does not depend on
                student account setup. Technical implementation detail belongs in
                the appendix, not in day-to-day teacher copy.
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Privacy and security references kept here:
                <span className="font-medium text-slate-100">
                  {" "}
                  AC9TDI4P09, AC9TDI6P09
                </span>
              </p>
            </div>

            <a
              className="mt-4 inline-flex rounded-full border border-violet-400/30 px-4 py-2 text-sm font-semibold text-violet-200"
              download
              href="/docs/schools-au/04-privacy-and-implementation.md"
            >
              Download the privacy and implementation note
            </a>
          </section>
        </section>

        <section
          id="downloads"
          className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
        >
          <SectionHeading
            eyebrow="Download CTA"
            title="School pack downloads"
            description="These are the four generated markdown documents for the Australia-wide school package."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {schoolPackageDocs.map((doc) => (
              <article
                key={doc.slug}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <p className="text-sm font-semibold text-white">{doc.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {doc.description}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  {doc.audience}
                </p>
                <a
                  className="mt-4 inline-flex text-sm font-semibold text-amber-300"
                  download
                  href={doc.href}
                >
                  Download {doc.title}
                </a>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-sm font-semibold text-white">
              Curriculum source links
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {curriculumSourceLinks.map((resource) => (
                <a
                  key={resource.href}
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200"
                  href={resource.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {resource.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

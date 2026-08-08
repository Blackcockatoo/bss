import Link from "next/link";

import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";
import {
  CONTRIBUTION_HEADLINE,
  FREE_TIER_INCLUDES,
} from "@/lib/schools/contribution";
import { FIRST_CANONICAL_SESSION } from "@/lib/schools/canonicalSequence";

import {
  SCHOOL_ATTRIBUTION,
  SCHOOL_HEADLINE,
  SCHOOL_POSITIONING_STATEMENT,
  SCHOOL_PROOF_LINE,
  SCHOOL_SUPPORTING_STATEMENT,
  SCHOOL_TRUST_LINE,
  boundaryFacts,
  curriculumRows,
  curriculumSourceLinks,
  dataLifecycle,
  evidenceTools,
  learningOutcomes,
  lessonCards,
  packageSummaryCards,
  pilotAcceptanceSteps,
  proofStripFacts,
  reviewerPathways,
  schoolPackageDocCategories,
  schoolPackageDocs,
  teacherEffortSteps,
  standaloneOption,
  weeklyFitOptions,
  whatYouNeed,
} from "./content";

const SESSION_ONE_PATH = `/schools/field/lessons/${FIRST_CANONICAL_SESSION.slug}`;

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
  const docsBySlug = new Map(schoolPackageDocs.map((doc) => [doc.slug, doc]));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:gap-14 md:py-16">
        {/* 1. Hero */}
        <header className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] md:p-8">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
              MetaPet School
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {SCHOOL_HEADLINE}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              {SCHOOL_SUPPORTING_STATEMENT}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                className="inline-flex min-h-12 items-center rounded-xl bg-emerald-400 px-6 py-3 text-base font-semibold text-emerald-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                href={FIELD_MODE_HOME_PATH}
              >
                Run one class free
              </Link>
              <a
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-6 py-3 text-base font-semibold text-slate-100 hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
                href="#data"
              >
                See exactly what data it uses
              </a>
            </div>

            <p className="text-base font-semibold text-emerald-200">
              {SCHOOL_TRUST_LINE}
            </p>
            <p className="text-sm text-slate-400">{SCHOOL_ATTRIBUTION}</p>
          </div>
        </header>

        {/* 2. Immediate proof strip */}
        <section aria-label="At a glance" className="-mt-4">
          <ul className="flex flex-wrap gap-2 text-sm">
            {proofStripFacts.map((fact) => (
              <li
                key={fact}
                className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 font-medium text-slate-200"
              >
                {fact}
              </li>
            ))}
          </ul>
        </section>

        {/* Not a school-management system */}
        <section className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 md:p-8">
          <SectionHeading
            eyebrow="Where this fits"
            title="This does not replace the software that runs your school"
            description={SCHOOL_POSITIONING_STATEMENT}
          />
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            MetaPet School is not a school-management system, a learning
            management system, a parent portal or a behaviour-points platform.
            It is seven short classroom experiences and the material a school
            needs to approve them.
          </p>
        </section>

        {/* 3. Explain the product */}
        <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 md:p-8">
          <SectionHeading
            eyebrow="What children actually do"
            title="Seven short sessions about how systems work"
            description="Students watch a digital companion, give it one input, read its signals, compare how it is represented, test an if-then rule, decide what a system should remember, redesign one feature, and explain a pattern they noticed."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                One instruction at a time
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Each step gives a class one thing to do. No walls of text, no
                timers, no speed pressure, no penalty for starting again.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                Talking, pointing, moving or writing
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every session has an optional movement moment and more than one
                way to take part, so a child who does not want to write can
                still participate fully.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                A visible stopping point
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Sessions end on purpose. There is no streak to lose, nothing to
                come back for tonight, and nothing that keeps running after the
                bell.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Explain teacher effort */}
        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-6 md:p-8">
          <SectionHeading
            eyebrow="Teacher effort"
            title="Open the lesson. Guide the activity. Capture light evidence. Get back to teaching."
            description={SCHOOL_PROOF_LINE}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {teacherEffortSteps.map((item, index) => (
              <article
                key={item.step}
                className="rounded-2xl border border-amber-300/20 bg-slate-950/50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold text-white">
                  {item.step}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <h3 className="text-lg font-semibold text-white">What you need</h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              {whatYouNeed.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-emerald-300">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Field Mode caches its pages so a session can survive a dropped
              connection mid-lesson, and every session has a printable fallback.
              Full offline operation has not been verified across school
              hardware yet, so plan for the printed sheet if your connection is
              unreliable.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
                href={SESSION_ONE_PATH}
              >
                Preview Session One
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-400"
                href="/schools/docs/teacher-guide"
              >
                Download the teacher pack
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:border-slate-400"
                href="/schools/parents"
              >
                Review the parent and governance pack
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Explain privacy */}
        <section
          id="data"
          className="rounded-3xl border border-emerald-400/20 bg-slate-900/60 p-6 md:p-8"
        >
          <SectionHeading
            eyebrow="What happens to the data?"
            title="The whole local-data lifecycle, in order"
            description="No student account is required. Classroom lesson state and progress are stored locally in this browser during normal use, and a teacher can delete them at any time."
          />

          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {dataLifecycle.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4"
              >
                <dt className="text-base font-semibold text-emerald-200">
                  {item.question}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-300">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
            <h3 className="text-base font-semibold text-white">
              What the classroom build does not do
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              {boundaryFacts.map((fact) => (
                <li key={fact} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-slate-500">
                    —
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              Inactive local records are cleared after{" "}
              {SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days without use. We are not
              claiming there is no data, no risk, or blanket regulatory
              compliance. The accurate statement is narrower: routine classroom
              use keeps records on the device, and deletion is in a
              teacher&apos;s hands.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center rounded-xl bg-violet-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-violet-200"
                href="/schools/data"
              >
                Open the local-data controls
              </Link>
              <Link
                className="inline-flex min-h-11 items-center rounded-xl border border-violet-400/30 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:border-violet-300/60"
                href="/schools/docs/privacy-policy"
              >
                Read the privacy policy
              </Link>
            </div>
          </div>
        </section>

        {/* 6. Explain the pricing model */}
        <section className="rounded-3xl border-2 border-emerald-400/40 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="What it costs"
            title={CONTRIBUTION_HEADLINE}
            description="The complete core experience is A$0 for every school, permanently. There is no licence, no per-student price, no expiring trial and no paid classroom tier. Contribution is voluntary, adult-only, and changes nothing a class receives."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-500/5 p-5">
              <p className="text-3xl font-semibold text-emerald-200">A$0</p>
              <p className="mt-2 text-sm font-medium text-emerald-100">
                The complete experience. No conditions.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {FREE_TIER_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden="true" className="text-emerald-300">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-slate-400">
                No hardship form, no justification, no reduced lessons, no
                reminder emails.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
              <p className="text-lg font-semibold text-white">
                If your school can contribute
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Suggested annual amounts are shown on an adult-only page.
                Nothing is preselected, nothing is badged &ldquo;most
                popular&rdquo;, and no student ever sees a payment prompt.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Good educational software costs money. Children should not pay
                with their identity, attention or behavioural data.
              </p>
              <Link
                className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:border-emerald-300/70"
                href="/schools/contribute"
              >
                See contribution options
              </Link>
            </article>
          </div>
        </section>

        {/* 7. The lesson sequence */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="The sequence"
            title="One sequence. Seven sessions. Nothing hidden."
            description="Each session carries one learning intention, one activity, one optional movement moment, one reflection question, light evidence and a visible stopping point. This is the same list the app runs and the teacher pack prints."
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
                    {lesson.minutes} minutes
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {lesson.title}
                </h3>
                <dl className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Learning intention
                    </dt>
                    <dd>{lesson.outcome}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      What students do
                    </dt>
                    <dd>{lesson.activity}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Reflection question
                    </dt>
                    <dd>{lesson.prompt}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Movement moment (optional)
                    </dt>
                    <dd>{lesson.movement}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Light evidence
                    </dt>
                    <dd>{lesson.evidence}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Stopping point
                    </dt>
                    <dd>{lesson.stoppingPoint}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        {/* 8. Trust material */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Start Here"
            title="Choose the pack for your role"
            description="The school wrapper is organised so each reviewer can start in the right place without reading the whole pack end to end."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {reviewerPathways.map((pathway) => (
              <article
                key={pathway.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
              >
                <h3 className="text-base font-semibold text-white">
                  {pathway.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {pathway.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pathway.docSlugs.map((slug) => {
                    const doc = docsBySlug.get(slug);
                    if (!doc) {
                      return null;
                    }

                    return (
                      <Link
                        key={doc.slug}
                        className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
                        href={doc.inAppHref}
                      >
                        {doc.title}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Australian Curriculum V9.0"
            title="Curriculum alignment with explicit classroom fit"
            description="This sequence is mapped to Digital Technologies, Health and Physical Education wellbeing learning, and Personal and Social capability. Mapping is our own alignment work, not a government endorsement."
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
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Learning Outcomes"
            title="What students should be able to say and show"
            description='Each outcome is written in a teacher-friendly "By the end of this sequence, students will..." form and mapped to both sessions and curriculum codes.'
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
                  <span className="font-semibold text-slate-100">Sessions:</span>{" "}
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
              {[...weeklyFitOptions, standaloneOption].map((option) => (
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

        <section
          id="governance"
          className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
        >
          <SectionHeading
            eyebrow="Governance Pack"
            title="Pilot-ready material for leadership, ICT, and wellbeing review"
            description="The school profile is backed by a privacy pack, a safeguarding pack, a teacher pack, a pilot operations pack, and an evidence pack. That is the package you use for principal and pilot conversations."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {packageSummaryCards.map((item) => (
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
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Evidence"
            title="Run the acceptance gate before outreach"
            description="MetaPet School is currently being tested through small, carefully supported classroom pilots. We are collecting evidence before making claims about outcomes, so nothing below is presented as an achieved result."
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {pilotAcceptanceSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {step.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {step.docSlugs.map((slug) => {
                    const doc = docsBySlug.get(slug);
                    if (!doc) {
                      return null;
                    }

                    return (
                      <Link
                        key={doc.slug}
                        className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
                        href={doc.inAppHref}
                      >
                        {doc.title}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="downloads"
          className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-8"
        >
          <SectionHeading
            eyebrow="Document Pack"
            title="School pack downloads"
            description="Start with the in-app reader for review. Use downloads when a teacher or reviewer needs a printable or offline copy of the same material."
          />

          <div className="mt-6 space-y-8">
            {schoolPackageDocCategories.map((category) => {
              const docs = schoolPackageDocs.filter(
                (doc) => doc.category === category,
              );

              return (
                <div key={category}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {category}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {docs.length} documents
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {docs.map((doc) => (
                      <article
                        key={doc.slug}
                        className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                      >
                        <p className="text-sm font-semibold text-white">
                          {doc.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {doc.description}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                          {doc.audience}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Link
                            className="text-sm font-semibold text-amber-300 hover:text-amber-200"
                            href={doc.inAppHref}
                          >
                            Read in app
                          </Link>
                          <a
                            aria-label={`Download ${doc.title}`}
                            className="text-sm text-slate-400 hover:text-slate-300"
                            download
                            href={doc.href}
                          >
                            Download
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
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

        {/* 9. Separate the broader universe */}
        <section className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="For adults only"
            title="MetaPet School is not the whole MetaPet"
            description="Blue $nake Studio also makes a broader consumer MetaPet experience. It is a different product with different rules, and it sits entirely outside the classroom pathway — no classroom screen links to it, and no student route can reach it."
          />
          <a
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-400"
            href="https://www.bluesnakestudios.com"
            rel="noreferrer"
            target="_blank"
          >
            Complete MetaPet at Blue $nake Studio
          </a>
        </section>

        <section className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6 md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Questions before you run it?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            You do not need to contact anyone to start. Session One is available
            right now, free, with no form. Email is for the things a web page
            cannot answer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={FIELD_MODE_HOME_PATH}
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-300"
            >
              Run one class free
            </Link>
            <a
              href="mailto:bluesssnakestudio@gmail.com?subject=MetaPet%20School%20question"
              className="inline-flex min-h-11 items-center rounded-xl border border-cyan-400/40 px-5 py-2.5 text-sm font-semibold text-cyan-200 hover:border-cyan-300/70"
            >
              Email the studio
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

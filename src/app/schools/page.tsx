import Link from "next/link";

import { FIELD_MODE_HOME_PATH } from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

import {
  assuranceItems,
  curriculumRows,
  curriculumSourceLinks,
  evidenceTools,
  learningOutcomes,
  lessonCards,
  packageSummaryCards,
  pilotAcceptanceSteps,
  reviewerPathways,
  schoolPackageDocCategories,
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
  const docsBySlug = new Map(schoolPackageDocs.map((doc) => [doc.slug, doc]));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:gap-14 md:py-16">
        <header className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] md:p-8">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
              MetaPet Schools
            </p>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Teacher-led, low-data classroom pilot for Years 3-6
              </h1>
              <p className="max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                MetaPet Schools is a teacher-led, time-bounded classroom tool
                for digital responsibility, systems thinking, and online safety
                habits. The school profile keeps the product surface narrow:
                alias-based classroom use, no student accounts, no social
                features, and a governance pack built for pilot conversations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              {[
                "Years 3-6 fit",
                "Alias-only classroom use",
                "7 x 20 minute sessions",
                "No student accounts",
                "Governance pack included",
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
              <Link
                className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-950"
                href={FIELD_MODE_HOME_PATH}
              >
                Open Field Mode
              </Link>
              <Link
                className="rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-slate-950"
                href="/schools/docs/pilot-readiness-verdict-v2"
              >
                Read pilot readiness verdict
              </Link>
              <a
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="#downloads"
              >
                Browse full document pack
              </a>
              <Link
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="/school-game"
              >
                Open classroom runtime
              </Link>
              <Link
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="/schools/safeguarding"
              >
                Safeguarding
              </Link>
              <a
                className="rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-100"
                href="#governance"
              >
                Review governance pack
              </a>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-6 md:p-8">
          <SectionHeading
            eyebrow="What is Meta-Pet?"
            title="A digital companion that teaches systems thinking"
            description="Meta-Pet is a classroom tool where students interact with a digital companion to learn how systems work. Through short, guided activities, students observe cause and effect, practise emotional regulation, and build digital responsibility skills."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">What students do</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Observe a digital companion, discuss what they notice with classmates, and reflect on patterns, feelings, and system behaviour.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">What teachers do</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Lead 20-minute sessions using lesson cards with built-in prompts. Set up an alias roster, run the activity, and optionally collect light evidence.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">What parents should know</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                No accounts, no personal data, no social features. Students use aliases. All data stays on the school device and can be deleted at any time.
              </p>
              <Link
                href="/schools/parents"
                className="mt-3 inline-block rounded-full border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:border-emerald-300/50"
              >
                Read the full parent information page
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 p-6 md:p-8">
          <SectionHeading
            eyebrow="Three ways to start"
            title="From a 10-minute look to a full pilot"
            description="You do not have to commit to anything to evaluate this. Each step is small, teacher-controlled, and reversible."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-amber-300/20 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
                Step 1 · 10 minutes
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Try it yourself
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">
                Open the browser demo on your own device. No account, no
                install, nothing saved beyond your browser. See exactly what
                students would see.
              </p>
              <Link
                href="/pet"
                className="mt-4 inline-block rounded-full border border-amber-300/30 px-4 py-2 text-center text-sm font-semibold text-amber-100 hover:border-amber-300/60"
              >
                Open the 10-minute demo
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-amber-300/20 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
                Step 2 · One classroom session
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Run one 20-minute session
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">
                Use Lesson Card 1 with your class as a one-off taster. The dry-run
                checklist covers devices, aliases and timing so nothing surprises
                you mid-lesson.
              </p>
              <Link
                href="/schools/docs/teacher-dry-run-checklist"
                className="mt-4 inline-block rounded-full border border-amber-300/30 px-4 py-2 text-center text-sm font-semibold text-amber-100 hover:border-amber-300/60"
              >
                Read the dry-run checklist
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-amber-300/20 bg-slate-950/50 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-300">
                Step 3 · 7-session pilot
              </p>
              <h3 className="mt-3 text-lg font-semibold text-white">
                Run the constrained pilot
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">
                Seven 20-minute lessons with the full governance pack: teacher
                checklist, parent/carer notice, ICT privacy summary, stop
                conditions and an evidence plan.
              </p>
              <a
                href="mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry"
                className="mt-4 inline-block rounded-full bg-amber-300 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-amber-200"
              >
                Start a pilot conversation
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {[
              {
                label: "Teacher checklist",
                href: "/schools/docs/school-partner-checklist",
              },
              { label: "Parent/carer notice", href: "/schools/parents" },
              {
                label: "ICT privacy summary",
                href: "/schools/docs/ict-privacy-review-checklist",
              },
              {
                label: "What data is stored",
                href: "/schools/docs/data-inventory",
              },
              {
                label: "How to delete local data",
                href: "/schools/docs/retention-and-deletion-schedule",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-700 px-3 py-1.5 font-medium text-slate-200 hover:border-slate-500"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-400/20 bg-slate-900/60 p-6 md:p-8">
          <SectionHeading
            eyebrow="Data, in plain words"
            title="What is stored, what is never collected"
            description="The governance pack has the full detail. These are the answers up front, in the language a staff meeting actually uses."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                What is stored
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Alias-based classroom progress and settings, saved locally on
                the school device. No names, no student accounts, no profiles.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                What is never collected
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Names, emails, photos, voice, location, contacts, behavioural
                profiles or advertising identifiers. There is no mechanism to
                collect them.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-slate-950/50 p-4">
              <h3 className="text-base font-semibold text-emerald-200">
                How it is deleted
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Clearing the browser&apos;s site data on the device removes
                everything. Any staff member with device access can do it — no
                request to the studio required.
              </p>
            </div>
          </div>
        </section>

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
                    <dt className="font-semibold text-slate-100">
                      Light evidence
                    </dt>
                    <dd>{lesson.evidence}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-100">
                      Best-fit use case
                    </dt>
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
              description="School-facing positioning stays simple: short classroom sequence, clear curriculum fit, supervised use, and no extra account administration."
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
              title="Keep the technical detail in the governance pack, not the hero copy"
              description="Teacher and family surfaces stay in plain classroom language. Privacy, retention, and implementation detail live in the governance pack for leadership and ICT review."
            />

            <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
              <p className="text-sm font-semibold text-violet-200">
                Privacy position
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The school-facing explanation is simple: routine classroom use
                keeps alias-based data on the device, does not depend on student
                account setup, and leaves exports under adult control.
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Privacy and security references kept here:
                <span className="font-medium text-slate-100">
                  {" "}
                  AC9TDI4P09, AC9TDI6P09
                </span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="inline-flex rounded-full bg-violet-300 px-4 py-2 text-sm font-semibold text-slate-950"
                href="/schools/docs/privacy-policy"
              >
                Read the privacy policy in app
              </Link>
              <a
                className="inline-flex rounded-full border border-violet-400/30 px-4 py-2 text-sm font-semibold text-violet-200"
                download
                href="/docs/schools-au/governance/privacy-policy.md"
              >
                Download the privacy policy
              </a>
            </div>
          </section>
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
            eyebrow="Acceptance Gate"
            title="Run the acceptance gate before outreach"
            description="Complete these checks in order. A failed step means fix the issue before moving into school outreach or live pilot use."
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

        <section className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/70">
            Pilot enquiry
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Ask about a no-cost pilot
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Schools, teachers, principals, councils, and education contacts can
            approach Blue $nake Studio about a no-cost pilot pathway.
          </p>
          <div className="mt-4">
            <a
              href="mailto:bluesssnakestudio@gmail.com?subject=Meta-Pet%20School%20Pilot%20Enquiry"
              className="inline-flex items-center rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Ask About a Pilot
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

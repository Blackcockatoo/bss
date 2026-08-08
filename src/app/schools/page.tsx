import Link from "next/link";

import {
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_SAFETY_PATH,
  FIELD_MODE_START_PATH,
} from "@/lib/childSafeBaseline";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/storage";
import {
  CONTRIBUTION_EXPLANATION,
  CONTRIBUTION_HEADLINE,
  CONTRIBUTION_RATIONALE,
  CONTRIBUTION_SUPPORTING_COPY,
  FREE_ACCESS,
  FREE_PROMISE,
  GOVERNING_PRINCIPLE,
  START_TEACHING_ACTION,
} from "@/lib/schools/contribution";

import {
  SCHOOL_ATTRIBUTION,
  SCHOOL_HEADLINE,
  SCHOOL_POSITIONING_STATEMENT,
  SCHOOL_PROOF_LINE,
  SCHOOL_SUPPORTING_STATEMENT,
  curriculumSourceLinks,
  dataLifecycle,
  learningOutcomes,
  lessonCards,
  reviewerPathways,
  schoolPackageDocCategories,
  schoolPackageDocs,
  whatYouNeed,
} from "./content";

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function SchoolsPage() {
  enforceChildSafeServerRoute("/schools");
  const docsBySlug = new Map(schoolPackageDocs.map((doc) => [doc.slug, doc]));

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/*
        Hero. One action, and nothing above the fold that asks a visitor to
        decode a business model before starting. The zero is in the button
        because "free" alone is what every expiring trial also says.
      */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-14 pt-16 md:pt-24">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
          MetaPet School
        </p>
        <p className="mt-2 text-sm text-slate-400">{SCHOOL_ATTRIBUTION}</p>

        <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
          {SCHOOL_HEADLINE}
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          {SCHOOL_SUPPORTING_STATEMENT}
        </p>

        <Link
          href={FIELD_MODE_START_PATH}
          className="mt-9 inline-flex min-h-14 items-center rounded-xl bg-emerald-400 px-8 py-4 text-lg font-semibold text-emerald-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          {START_TEACHING_ACTION}
        </Link>

        {/* Body text, not microcopy. It is the whole access model. */}
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
          {FREE_PROMISE}
        </p>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-base">
          <Link
            className="text-slate-300 underline underline-offset-4 hover:text-white"
            href={FIELD_MODE_LESSONS_PATH}
          >
            Browse the seven lessons
          </Link>
          <Link
            className="text-slate-300 underline underline-offset-4 hover:text-white"
            href={FIELD_MODE_SAFETY_PATH}
          >
            Review safety and privacy
          </Link>
        </div>
      </section>

      {/*
        The governing principle. Full width, display size, full contrast, and
        deliberately alone — it is the constitution of the model, not a
        footnote to the contribution section.
      */}
      <section
        aria-label="Our governing principle"
        className="border-y border-emerald-400/30 bg-emerald-950/40"
      >
        <p className="mx-auto w-full max-w-4xl px-6 py-16 text-2xl font-semibold leading-relaxed tracking-tight text-white md:py-20 md:text-4xl">
          {GOVERNING_PRINCIPLE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 py-16 md:gap-20 md:py-20">
        {/* Where it fits — the one thing a principal has to rule out first. */}
        <section>
          <SectionHeading
            title="This does not replace the software that runs your school"
            description={SCHOOL_POSITIONING_STATEMENT}
          />
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            It is not a school-management system, a learning management system,
            a parent portal or a behaviour-points platform.
          </p>
        </section>

        {/* What children do — the canonical sequence, one line each. */}
        <section>
          <SectionHeading
            title="What children do"
            description="Seven sessions, about 15–20 minutes each. Each one gives a class one instruction at a time, one reflection question, and a visible stopping point."
          />
          <ol className="mt-8 space-y-5">
            {lessonCards.map((lesson) => (
              <li key={lesson.session} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 w-6 shrink-0 text-base font-semibold text-amber-300"
                >
                  {lesson.session.replace("Session ", "")}
                </span>
                <span>
                  <span className="block text-lg font-medium text-white">
                    {lesson.title}
                  </span>
                  <span className="mt-1 block text-base leading-7 text-slate-300">
                    {lesson.activity}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* What teachers do. */}
        <section>
          <SectionHeading title="What teachers do" description={SCHOOL_PROOF_LINE} />
          <div className="mt-7 rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">What you need</h3>
            <ul className="mt-4 grid gap-2 text-base text-slate-300 sm:grid-cols-2">
              {whatYouNeed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              Field Mode caches its pages so a session can survive a dropped
              connection mid-lesson, and every session has a printable fallback.
              Full offline operation has not been verified across school
              hardware yet.
            </p>
          </div>
        </section>

        {/* Privacy — the seven questions, in the order an adult asks them. */}
        <section id="data">
          <SectionHeading
            title="What happens to the data?"
            description="No student account is required. Classroom records are stored locally in this browser during normal use, and a teacher can delete them at any time."
          />
          <dl className="mt-8 space-y-5">
            {dataLifecycle.map((item) => (
              <div key={item.question}>
                <dt className="text-base font-semibold text-emerald-200">
                  {item.question}
                </dt>
                <dd className="mt-1 max-w-3xl text-base leading-7 text-slate-300">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-400">
            Inactive records are cleared after {SCHOOLS_LOCAL_DATA_RETENTION_DAYS}{" "}
            days without use. We are not claiming there is no data, no risk, or
            blanket regulatory compliance — the accurate statement is narrower:
            routine classroom use keeps records on the device, and deletion is in
            a teacher&apos;s hands.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-base">
            <Link
              className="text-slate-200 underline underline-offset-4 hover:text-white"
              href="/schools/data"
            >
              Open the local-data controls
            </Link>
            <Link
              className="text-slate-200 underline underline-offset-4 hover:text-white"
              href="/schools/docs/privacy-policy"
            >
              Read the privacy policy
            </Link>
          </div>
        </section>

        {/*
          Contribution, only now — after a visitor knows what this is, what a
          teacher gets, what children do, why the privacy architecture matters,
          and that the complete experience is already free.
        */}
        <section aria-labelledby="contribute-heading">
          <h2
            id="contribute-heading"
            className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
          >
            {CONTRIBUTION_HEADLINE}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            {CONTRIBUTION_SUPPORTING_COPY}
          </p>

          {/* The free option first and clearest. Never a card in a row. */}
          <div className="mt-8">
            <Link
              href={FIELD_MODE_START_PATH}
              className="inline-flex min-h-14 items-center rounded-xl bg-emerald-400 px-7 py-4 text-lg font-semibold text-emerald-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              {FREE_ACCESS.action}
            </Link>
            <p className="mt-4 text-base leading-7 text-slate-200">
              {FREE_ACCESS.assurance}
            </p>
          </div>

          <p className="mt-10 max-w-3xl text-base leading-7 text-slate-400">
            {CONTRIBUTION_EXPLANATION}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
            {CONTRIBUTION_RATIONALE}
          </p>

          <Link
            className="mt-6 inline-block text-base text-slate-300 underline underline-offset-4 hover:text-white"
            href="/schools/contribute"
          >
            See the optional contribution amounts
          </Link>
        </section>

        {/* Trust material, kept discoverable rather than crowded into entry. */}
        <section>
          <SectionHeading
            title="Material for reviewers"
            description="Teacher, parent, privacy, safeguarding, curriculum and pilot documents, grouped by who needs to read them first."
          />
          <div className="mt-8 space-y-6">
            {reviewerPathways.map((pathway) => (
              <article key={pathway.title}>
                <h3 className="text-lg font-medium text-white">
                  {pathway.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {pathway.docSlugs.map((slug) => {
                    const doc = docsBySlug.get(slug);
                    if (!doc) return null;
                    return (
                      <Link
                        key={doc.slug}
                        className="text-sm text-slate-300 underline underline-offset-4 hover:text-white"
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

        <section>
          <SectionHeading
            title="Curriculum alignment with explicit classroom fit"
            description="Mapped to Digital Technologies, Health and Physical Education wellbeing learning, and Personal and Social capability. This is our own alignment work, not a government endorsement."
          />
          <ul className="mt-8 space-y-5">
            {learningOutcomes.map((outcome) => (
              <li key={outcome.statement}>
                <p className="text-base leading-7 text-white">
                  {outcome.statement}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {outcome.lessons} · {outcome.codes.join(", ")}
                </p>
              </li>
            ))}
          </ul>
          <Link
            className="mt-6 inline-block text-base text-slate-300 underline underline-offset-4 hover:text-white"
            href="/schools/docs/01-overview-and-alignment"
          >
            Read the full curriculum mapping
          </Link>
        </section>

        <section id="downloads">
          <SectionHeading
            title="School pack downloads"
            description="Read any document in the app, or download a printable copy."
          />
          <div className="mt-8 space-y-8">
            {schoolPackageDocCategories.map((category) => {
              const docs = schoolPackageDocs.filter(
                (doc) => doc.category === category,
              );

              return (
                <div key={category}>
                  <h3 className="text-lg font-medium text-white">{category}</h3>
                  <ul className="mt-3 space-y-2">
                    {docs.map((doc) => (
                      <li
                        key={doc.slug}
                        className="flex flex-wrap items-baseline gap-x-4 text-base"
                      >
                        <Link
                          className="text-slate-200 underline underline-offset-4 hover:text-white"
                          href={doc.inAppHref}
                        >
                          {doc.title}
                        </Link>
                        <a
                          aria-label={`Download ${doc.title}`}
                          className="text-sm text-slate-500 hover:text-slate-300"
                          download
                          href={doc.href}
                        >
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {curriculumSourceLinks.map((resource) => (
              <a
                key={resource.href}
                className="text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200"
                href={resource.href}
                rel="noreferrer"
                target="_blank"
              >
                {resource.label}
              </a>
            ))}
          </div>
        </section>

        {/* The broader universe, clearly outside the classroom pathway. */}
        <section className="border-t border-slate-800 pt-10">
          <h2 className="text-lg font-medium text-white">
            MetaPet School is not the whole MetaPet
          </h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-400">
            Blue $nake Studio also makes a broader consumer MetaPet experience.
            It is a different product with different rules, and it sits entirely
            outside the classroom pathway — no classroom screen links to it, and
            no student route can reach it.
          </p>
          <a
            className="mt-4 inline-block text-base text-slate-300 underline underline-offset-4 hover:text-white"
            href="https://www.bluesnakestudios.com"
            rel="noreferrer"
            target="_blank"
          >
            Complete MetaPet at Blue $nake Studio
          </a>
        </section>
      </div>
    </main>
  );
}

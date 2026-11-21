import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrintableLessonDocument } from "@/components/field-mode/PrintableLessonDocument";
import { printArticleClassName } from "@/components/field-mode/PrintToolbar";
import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";
import {
  CURRICULUM_SOURCE_LINKS,
  ESAFETY_TEACHER_LINKS,
  FIELD_MODE_PRINT_CHECKLIST_PATH,
  FIELD_MODE_PRINT_NO_TECH_PATH,
  FIELD_MODE_PRINT_PARENT_LETTER_PATH,
  FIELD_MODE_PRINT_RELIEF_PATH,
  FIELD_MODE_PRINT_TICKETS_PATH,
  FIELD_MODE_PRINT_WORD_WALLS_PATH,
  FIELD_MODE_PRINT_STAFF_PD_PATH,
  FIELD_MODE_PRINT_ROLLOUT_PATH,
  FIELD_MODE_VERIFIED_PATH,
  LEADERSHIP_ONE_PAGER,
  OFFICIAL_LINK_CHECKED_AT,
  PARENT_LETTER_BLANKS,
  PARENT_NOTE_SOURCE_PATH,
  SHARED_LESSON_CONDITIONS,
  SHARED_LESSON_MATERIALS,
  STUDENT_REFLECTION_PROMPTS,
  TEACHER_OBSERVATION_CHECKLIST_ITEMS,
  VERIFICATION_ITEMS,
  plannerExtrasFor,
  twoMinuteExplainerFor,
} from "@/lib/schools/classroomPack";
import { SCHOOL_PRIVACY_COMMITMENTS } from "@/lib/schools/privacyTruth";
import { FIRST_CANONICAL_SESSION } from "@/lib/schools/canonicalSequence";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

function SectionTitle({
  headingLevel,
  children,
}: {
  headingLevel: 1 | 2;
  children: ReactNode;
}) {
  const Tag = headingLevel === 1 ? "h1" : "h2";
  return <Tag className="text-3xl font-bold tracking-tight">{children}</Tag>;
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
      {children}
    </p>
  );
}

export function PrintableExitTickets({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Exit tickets — aliases only
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Use one ticket at the end of a lesson if you want a written snapshot.
        Students should use a teacher-chosen alias, not a legal name. This is
        light evidence, not a test.
      </p>
      <div className="mt-6 space-y-6">
        {LESSON_DEFINITIONS.map((lesson) => {
          const session = CANONICAL_SESSIONS.find((item) => item.id === lesson.id);
          return (
            <section
              key={lesson.id}
              className="break-inside-avoid rounded-xl border border-slate-300 p-4 print:rounded-none"
            >
              <h3 className="text-lg font-bold">
                Lesson {lesson.number}: {lesson.title}
              </h3>
              <p className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <span>
                  Alias (not a legal name): ________________________
                </span>
                <span>Session: {lesson.number}</span>
              </p>
              <p className="mt-4 text-sm font-semibold">
                {session?.reflectionPrompt ?? lesson.reflectionPrompt}
              </p>
              <p className="mt-3 min-h-16 border-b border-slate-400" />
              <p className="mt-3 min-h-16 border-b border-slate-400" />
              <p className="mt-4 text-xs text-slate-600">
                Light evidence: {session?.lightEvidence ?? lesson.lightEvidence}
              </p>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function PrintableWordWalls({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Vocabulary word walls
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        These words already appear in the lesson scripts. Meanings match how
        the lesson uses them, in plain Years 3–6 language.
      </p>
      <div className="mt-6 space-y-8">
        {LESSON_DEFINITIONS.map((lesson) => {
          const extras = plannerExtrasFor(lesson.id);
          return (
            <section key={lesson.id} className="break-inside-avoid">
              <h3 className="text-lg font-bold">
                Lesson {lesson.number}: {lesson.title}
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {extras.vocab.map((entry) => (
                  <li
                    key={entry.word}
                    className="rounded-xl border-2 border-slate-800 p-4 print:rounded-none"
                  >
                    <p className="text-2xl font-bold">{entry.word}</p>
                    <p className="mt-2 text-sm leading-6">{entry.meaning}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </article>
  );
}

export function PrintableAssessmentTools({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Assessment and reflection
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        This sequence is designed for light classroom evidence, not grading.
        Teachers do not need to mark written paragraphs, grade student
        performance, create reports from the sequence, or manage formal
        rubrics. The tools below are the published observation checklist and
        student reflection sheet.
      </p>

      <section className="mt-6 break-inside-avoid">
        <h3 className="text-xl font-bold">Teacher observation checklist</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Use this while circulating. It is a quick classroom note, not a
          scoring sheet. Record aliases only.
        </p>
        <table className="mt-4 w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr>
              <th className="border border-slate-400 px-2 py-2 text-left">
                Student or pair (alias)
              </th>
              {TEACHER_OBSERVATION_CHECKLIST_ITEMS.map((item) => (
                <th key={item} className="border border-slate-400 px-2 py-2 text-left">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["1", "2", "3", "4"].map((row) => (
              <tr key={row}>
                <td className="border border-slate-400 px-2 py-4"> </td>
                {TEACHER_OBSERVATION_CHECKLIST_ITEMS.map((item) => (
                  <td key={item} className="border border-slate-400 px-2 py-4">
                    Yes / Not yet
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 break-inside-avoid">
        <h3 className="text-xl font-bold">Student reflection sheet</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Use this once near the end of the sequence, or after any lesson where
          you want a written snapshot. Alias only.
        </p>
        <p className="mt-4 text-sm">
          Alias (not a legal name): ________________________ · Session: ______
        </p>
        <ol className="mt-4 space-y-4">
          {STUDENT_REFLECTION_PROMPTS.map((prompt, index) => (
            <li key={prompt} className="text-sm leading-6">
              {index + 1}. {prompt}
              <span className="mt-2 block min-h-10 border-b border-slate-400" />
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

export function PrintableNoTechGuide({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        No-tech / paper path
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Some lessons are built around watching the demonstration companion.
        This page says, honestly, which activities still work on paper and
        which are a fallback rather than the full live lesson. Suggested
        timings on the planners are estimates.
      </p>
      <ul className="mt-6 space-y-5">
        {LESSON_DEFINITIONS.map((lesson) => {
          const extras = plannerExtrasFor(lesson.id);
          return (
            <li key={lesson.id} className="break-inside-avoid border-t border-slate-300 pt-4">
              <h3 className="font-bold">
                Lesson {lesson.number}: {lesson.title}
              </h3>
              <p className="mt-1 text-sm font-semibold">{extras.paper.label}</p>
              <p className="mt-2 text-sm leading-6">{extras.paper.summary}</p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export function PrintableReliefPack({
  headingLevel = 1,
  includePlanner = false,
  lesson = LESSON_DEFINITIONS.find((item) => item.id === "meet-the-system")
    ?? LESSON_DEFINITIONS[0],
}: {
  headingLevel?: 1 | 2;
  includePlanner?: boolean;
  lesson?: LessonDefinition;
}) {
  if (!lesson) {
    return null;
  }
  const extras = plannerExtrasFor(lesson.id);
  const explainer = twoMinuteExplainerFor(lesson);
  const session = FIRST_CANONICAL_SESSION;

  return (
    <article className={printArticleClassName}>
      <Eyebrow>Relief teacher pack — Session 1 only</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Relief pack: {session.title}
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        This pack is for a relief teacher who has not used MetaPet School
        before. You do not need a login. Lesson 1 is a complete 15-minute
        lesson on its own. Use aliases only, not legal names. Do not send
        students into any other MetaPet product.
      </p>

      <section className="mt-6 break-inside-avoid rounded-xl border-2 border-emerald-800 p-4 print:rounded-none">
        <h3 className="text-xl font-bold">In two minutes</h3>
        <dl className="mt-3 space-y-3 text-sm leading-6">
          <div>
            <dt className="font-semibold">Intention</dt>
            <dd>{explainer.intention}</dd>
          </div>
          <div>
            <dt className="font-semibold">Say this</dt>
            <dd>{explainer.sayThis}</dd>
          </div>
          <div>
            <dt className="font-semibold">Students do this</dt>
            <dd>{explainer.studentsDoThis}</dd>
          </div>
          <div>
            <dt className="font-semibold">Stop here</dt>
            <dd>{explainer.stopHere}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h3 className="text-xl font-bold">What you need</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {SHARED_LESSON_MATERIALS.map((item) => (
            <li key={item}>{item}</li>
          ))}
          {extras.materials.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Planned time: {lesson.durationMinutes} minutes. {SHARED_LESSON_CONDITIONS}
        </p>
        <p className="mt-3 text-sm leading-6">
          <strong>{extras.paper.label}.</strong> {extras.paper.summary}
        </p>
      </section>

      {includePlanner ? (
        <div className="mt-8">
          <p className="mb-4 text-sm leading-6 text-slate-700">
            Follow the Lesson 1 planner below. You do not need any other
            MetaPet page to run this session.
          </p>
          <PrintableLessonDocument
            lesson={lesson}
            showToolbar={false}
            headingLevel={2}
          />
        </div>
      ) : (
        <p className="mt-6 text-sm leading-6 text-slate-700">
          The full Lesson 1 planner, exit ticket and word wall follow in this
          same classroom pack. Use those pages to run the five guided steps.
        </p>
      )}
    </article>
  );
}

function renderParentNoteBody() {
  const source = readFileSync(join(process.cwd(), PARENT_NOTE_SOURCE_PATH), "utf8");
  return source.split("\n").map((line, index) => {
    if (line.startsWith("# ")) {
      return (
        <h3 key={index} className="mt-6 text-xl font-bold">
          {line.slice(2)}
        </h3>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={index} className="mt-6 text-lg font-bold">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <p key={index} className="mt-1 pl-4 text-base leading-7">
          • {line.slice(2)}
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
  });
}

export function PrintableParentLetter({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Parent and carer letter
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Fill in the school details by hand, or edit a PDF after you print. The
        wording below is the published parent and carer note. Do not add
        student names to this letter.
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        {PARENT_LETTER_BLANKS.map((label) => (
          <div key={label} className="grid grid-cols-[10rem_1fr] items-end gap-3">
            <dt className="font-semibold">{label}</dt>
            <dd className="border-b border-slate-500 pb-1"> </dd>
          </div>
        ))}
      </dl>
      <div className="mt-8">{renderParentNoteBody()}</div>
    </article>
  );
}

export function PrintableLeadershipBrief({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  const brief = LEADERSHIP_ONE_PAGER;
  return (
    <article className={printArticleClassName}>
      <Eyebrow>For school leadership</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>{brief.title}</SectionTitle>
      <dl className="mt-6 space-y-4 text-sm leading-6">
        <div>
          <dt className="font-semibold">What it is</dt>
          <dd>{brief.whatItIs}</dd>
        </div>
        <div>
          <dt className="font-semibold">What it teaches</dt>
          <dd>{brief.whatItTeaches}</dd>
        </div>
        <div>
          <dt className="font-semibold">What it avoids</dt>
          <dd>{brief.whatItAvoids}</dd>
        </div>
      </dl>
      <section className="mt-6">
        <h3 className="text-lg font-bold">Operating rules</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {brief.operatingRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {SCHOOL_PRIVACY_COMMITMENTS.accounts}
        </p>
      </section>
      <section className="mt-6">
        <h3 className="text-lg font-bold">Review first</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          {brief.reviewFirst.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <p className="mt-6 text-sm leading-6 text-slate-700">
        Official eSafety Commissioner links for teachers are on the Safety
        page and at the end of this pack. Check the what’s-verified page
        before treating any hardware or deployment claim as confirmed.
      </p>
    </article>
  );
}

export function PrintableOfficialLinks({
  headingLevel = 1,
  includeCurriculum = false,
}: {
  headingLevel?: 1 | 2;
  includeCurriculum?: boolean;
}) {
  const links = includeCurriculum
    ? [
        { heading: "eSafety Commissioner", items: ESAFETY_TEACHER_LINKS },
        { heading: "Australian Curriculum sources already used on /schools", items: CURRICULUM_SOURCE_LINKS },
      ]
    : [{ heading: "eSafety Commissioner", items: ESAFETY_TEACHER_LINKS }];

  return (
    <article className={printArticleClassName}>
      <Eyebrow>Official links</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        Official eSafety Commissioner links
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        These are official eSafety pages, checked as reachable (HTTP 200) on{" "}
        {OFFICIAL_LINK_CHECKED_AT}. The check confirms the address worked on
        that date. It is not an eSafety endorsement of MetaPet School. Follow
        your school’s child-safety procedures first.
      </p>
      {links.map((group) => (
        <section key={group.heading} className="mt-6">
          <h3 className="text-lg font-bold">{group.heading}</h3>
          <ul className="mt-3 space-y-3">
            {group.items.map((link) => (
              <li key={link.href} className="text-sm leading-6">
                <a
                  href={link.href}
                  className="font-semibold text-emerald-900 underline underline-offset-2"
                >
                  {link.title}
                </a>
                <span className="block break-all text-xs text-slate-600">
                  {link.href}
                </span>
                <span className="block text-slate-700">{link.note}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

export function PrintableVerifiedStatus({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>For teachers and ICT</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>What’s verified</SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        This page only records checks that have actually been done, and says
        so when something has not been checked. Dates use Australia/Melbourne
        time. Nothing here is a usage statistic or a research claim.
      </p>
      <ul className="mt-6 space-y-4">
        {VERIFICATION_ITEMS.map((item) => (
          <li key={item.title} className="break-inside-avoid border-t border-slate-300 pt-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              {item.status === "checked" ? "Checked" : "Not checked"}
            </p>
            <h3 className="mt-1 text-lg font-bold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6">{item.detail}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-6 text-slate-700">
        Official links that were reachability-checked on {OFFICIAL_LINK_CHECKED_AT}{" "}
        are listed with the classroom pack.
      </p>
    </article>
  );
}

export function PrintablePackContents({
  headingLevel = 1,
}: {
  headingLevel?: 1 | 2;
}) {
  return (
    <article className={printArticleClassName}>
      <Eyebrow>Printable classroom pack</Eyebrow>
      <SectionTitle headingLevel={headingLevel}>
        What’s in this pack
      </SectionTitle>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        Seven Years 3–6 lesson planners, plus the paper tools a teacher can
        use in the same week. Use your browser’s print dialog and choose
        “Save as PDF” if you need a file.
      </p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6">
        <li>Relief teacher start page for Lesson 1</li>
        <li>One planner for each of the seven lessons, including timings, materials, published AC v9 codes and a two-minute explainer</li>
        <li>Exit tickets, vocabulary word walls, and the published assessment tools</li>
        <li>No-tech / paper path</li>
        <li>Editable parent and carer letter</li>
        <li>Principal and ICT one-pager, what’s-verified page, and official eSafety links</li>
        <li>15-minute staff briefing handout and a blank term rollout plan</li>
      </ol>
      <p className="mt-5 text-xs leading-5 text-slate-600">
        Suggested step timings are estimates. Curriculum codes are the ones
        already published on /schools. Aliases only — do not record legal
        names.
      </p>
    </article>
  );
}

/** Quiet links used by on-screen print pages, not needed on paper. */
export const CLASSROOM_PACK_PRINT_LINKS = [
  { href: FIELD_MODE_PRINT_RELIEF_PATH, label: "Relief teacher pack" },
  { href: FIELD_MODE_PRINT_TICKETS_PATH, label: "Exit tickets" },
  { href: FIELD_MODE_PRINT_WORD_WALLS_PATH, label: "Word walls" },
  { href: FIELD_MODE_PRINT_CHECKLIST_PATH, label: "Assessment checklist" },
  { href: FIELD_MODE_PRINT_NO_TECH_PATH, label: "No-tech / paper path" },
  { href: FIELD_MODE_PRINT_PARENT_LETTER_PATH, label: "Parent letter" },
  { href: "/schools/field/print/leadership", label: "Leadership one-pager" },
  { href: FIELD_MODE_VERIFIED_PATH, label: "What’s verified" },
  { href: FIELD_MODE_PRINT_STAFF_PD_PATH, label: "Staff briefing handout" },
  { href: FIELD_MODE_PRINT_ROLLOUT_PATH, label: "Rollout plan template" },
] as const;

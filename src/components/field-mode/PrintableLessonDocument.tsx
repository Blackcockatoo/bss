import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import {
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import {
  curriculumAlignmentForSession,
  mergeLearningAreas,
} from "@/lib/schools/curriculumAlignment";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

export function PrintableLessonDocument({
  lesson,
  showToolbar = true,
  headingLevel = 1,
}: {
  lesson: LessonDefinition;
  showToolbar?: boolean;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const alignment = curriculumAlignmentForSession(lesson.number);
  const areas = mergeLearningAreas(lesson.learningAreas, alignment.learningAreas);

  return (
    <article className="mx-auto max-w-4xl rounded-2xl bg-white p-7 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none md:p-10">
      {showToolbar ? (
        <div className="field-print-hide mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <a
            href={`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`}
            className="text-sm font-semibold text-emerald-900 underline underline-offset-2"
          >
            Return to guided lesson
          </a>
          <PrintLessonButton />
        </div>
      ) : null}

      <header className="border-b-2 border-emerald-800 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
          MetaPet School — Australian Schools
        </p>
        <Heading className="mt-3 text-3xl font-bold tracking-tight">
          Lesson {lesson.number}: {lesson.title}
        </Heading>
        <p className="mt-3 text-base leading-7 text-slate-700">
          {lesson.shortDescription}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-semibold">Years</dt>
            <dd>3–6</dd>
          </div>
          <div>
            <dt className="font-semibold">Suggested time</dt>
            <dd>{lesson.durationMinutes} minutes</dd>
          </div>
          <div>
            <dt className="font-semibold">Use</dt>
            <dd>Teacher-led</dd>
          </div>
          <div>
            <dt className="font-semibold">Records</dt>
            <dd>Alias-only, local device</dd>
          </div>
        </dl>
      </header>

      <section className="mt-6 break-inside-avoid">
        <h2 className="text-xl font-bold">Learning intention</h2>
        <p className="mt-2 leading-7">{lesson.learningIntention}</p>
        <p className="mt-3 text-sm text-slate-600">
          <strong>Learning areas:</strong> {areas.join(" · ")}
        </p>
        {alignment.codes.length > 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            <strong>Australian Curriculum v9:</strong> {alignment.codes.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="mt-6 break-inside-avoid rounded-xl border border-slate-300 p-4 print:rounded-none">
        <h2 className="text-xl font-bold">Success criteria</h2>
        <ul className="mt-3 space-y-2">
          {lesson.successCriteria.map((criterion) => (
            <li key={criterion} className="flex gap-3">
              <span aria-hidden="true">☐</span>
              <span>{criterion}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 break-inside-avoid">
        <h2 className="text-xl font-bold">Teacher opening</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.teacherIntroduction}</p>
        <blockquote className="mt-3 border-l-4 border-emerald-700 pl-4 leading-7">
          {lesson.teacherScript}
        </blockquote>
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-bold">Five guided steps</h2>
        <ol className="mt-4 space-y-5">
          {lesson.steps.map((step, index) => (
            <li key={step.id} className="break-inside-avoid border-t border-slate-300 pt-4">
              <h3 className="font-bold">{index + 1}. {step.title}</h3>
              <dl className="mt-2 grid gap-2 text-sm leading-6">
                <div>
                  <dt className="font-semibold">Teacher says / does</dt>
                  <dd>{step.teacherPrompt}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Student task</dt>
                  <dd>{step.studentTask}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Expected outcome</dt>
                  <dd>{step.expectedOutcome}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="break-inside-avoid rounded-xl border border-slate-300 p-4 print:rounded-none">
          <h2 className="font-bold">Support option</h2>
          <p className="mt-2 text-sm leading-6">{lesson.supportActivity}</p>
        </div>
        <div className="break-inside-avoid rounded-xl border border-slate-300 p-4 print:rounded-none">
          <h2 className="font-bold">Extension option</h2>
          <p className="mt-2 text-sm leading-6">{lesson.extensionActivity}</p>
        </div>
      </section>

      <section className="mt-7 break-inside-avoid">
        <h2 className="text-xl font-bold">Discussion prompts</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          {lesson.discussionPrompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </section>

      <section className="mt-7 break-inside-avoid rounded-xl border-2 border-dashed border-slate-400 p-4 print:min-h-32 print:rounded-none">
        <h2 className="font-bold">Teacher notes — aliases only</h2>
        <p className="mt-2 text-xs text-slate-600">
          Do not record student names, contact details or identifying information.
        </p>
      </section>

      <footer className="mt-7 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-600">
        Static emergency fallback · no student account required · no public sharing ·
        Australian Years 3–6 classroom use
      </footer>
    </article>
  );
}

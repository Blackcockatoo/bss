import { printArticleClassName } from "@/components/field-mode/PrintToolbar";
import {
  ROLLOUT_PLAN_CAVEAT,
  emptyRolloutPlan,
  type RolloutPlan,
} from "@/lib/schools/rolloutPlan";
import { lessonDisplayTitle } from "@/lib/schools/lessonYearBands";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

function blank(value: string): string {
  return value.trim() ? value : "________________________________";
}

export function PrintableRolloutPlan({
  plan = emptyRolloutPlan(),
  headingLevel = 1,
}: {
  plan?: RolloutPlan;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <article className={printArticleClassName}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">
        Whole-school planning template
      </p>
      <Heading className="mt-3 text-3xl font-bold tracking-tight">
        MetaPet School — term rollout plan
      </Heading>
      <p className="mt-3 text-sm leading-6 text-slate-700">{ROLLOUT_PLAN_CAVEAT}</p>
      <dl className="mt-6 grid gap-3 text-sm leading-6 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">School (optional)</dt>
          <dd>{blank(plan.schoolName)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Term or year</dt>
          <dd>{blank(plan.term)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Year levels</dt>
          <dd>{blank(plan.yearLevels)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Classes</dt>
          <dd>{blank(plan.classes)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Who leads</dt>
          <dd>{blank(plan.leader)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Parent letter timing</dt>
          <dd>{blank(plan.parentLetterWhen)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Devices check</dt>
          <dd>{blank(plan.deviceCheck)}</dd>
        </div>
        <div>
          <dt className="font-semibold">Projector check</dt>
          <dd>{blank(plan.projectorCheck)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold">Paper fallback</dt>
          <dd>{blank(plan.paperFallback)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-semibold">Notes</dt>
          <dd>{blank(plan.notes)}</dd>
        </div>
      </dl>
      <table className="mt-6 w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-base font-bold">
          Which lessons, when
        </caption>
        <thead>
          <tr>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left">Lesson</th>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left">When (week or date)</th>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left">Classes</th>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left">Who leads</th>
          </tr>
        </thead>
        <tbody>
          {ALL_LESSON_DEFINITIONS.map((lesson) => {
            const row = plan.lessons.find((item) => item.lessonId === lesson.id);
            return (
              <tr key={lesson.id}>
                <td className="border border-slate-300 p-2">
                  {lessonDisplayTitle(lesson)} ({lesson.durationMinutes} min)
                </td>
                <td className="border border-slate-300 p-2">{blank(row?.when ?? "")}</td>
                <td className="border border-slate-300 p-2">{blank(row?.classes ?? "")}</td>
                <td className="border border-slate-300 p-2">{blank(row?.lead ?? "")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}

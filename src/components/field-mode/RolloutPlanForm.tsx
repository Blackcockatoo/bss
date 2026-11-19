"use client";

import { useSyncExternalStore } from "react";

import { PrintLessonButton } from "@/components/field-mode/PrintLessonButton";
import { PrintableRolloutPlan } from "@/components/field-mode/PrintableRolloutPlan";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_STAFF_PD_PATH,
} from "@/lib/childSafeBaseline";
import { FIELD_MODE_PRINT_ROLLOUT_PATH } from "@/lib/schools/classroomPack";
import {
  ROLLOUT_PLAN_CAVEAT,
  clearRolloutPlan,
  parseRolloutPlan,
  readRolloutPlanRaw,
  saveRolloutPlan,
  subscribeRolloutPlan,
  type RolloutPlan,
} from "@/lib/schools/rolloutPlan";
import { lessonDisplayTitle } from "@/lib/schools/lessonYearBands";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal";

function getSnapshot(): string {
  return readRolloutPlanRaw(window.localStorage);
}

export function RolloutPlanForm() {
  const raw = useSyncExternalStore(
    subscribeRolloutPlan,
    getSnapshot,
    () => "",
  );
  const plan = parseRolloutPlan(raw || null);

  const update = (patch: Partial<RolloutPlan>) => {
    saveRolloutPlan({ ...plan, ...patch }, window.localStorage);
  };

  const updateLesson = (
    lessonId: RolloutPlan["lessons"][number]["lessonId"],
    patch: Partial<RolloutPlan["lessons"][number]>,
  ) => {
    saveRolloutPlan(
      {
        ...plan,
        lessons: plan.lessons.map((row) =>
          row.lessonId === lessonId ? { ...row, ...patch } : row,
        ),
      },
      window.localStorage,
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="space-y-3 field-print-hide">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Whole-school planning
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Term rollout plan
          </h1>
          <p className="text-base leading-7 text-slate-700">{ROLLOUT_PLAN_CAVEAT}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={FIELD_MODE_HOME_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href={FIELD_MODE_STAFF_PD_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Staff briefing
            </a>
            <a
              href={FIELD_MODE_PRINT_ROLLOUT_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Blank printable template
            </a>
            <PrintLessonButton />
            <button
              type="button"
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => {
                if (
                  window.confirm(
                    "Clear the rollout plan stored in this browser? This does not delete other classroom records.",
                  )
                ) {
                  clearRolloutPlan(window.localStorage);
                }
              }}
            >
              Clear this plan from this device
            </button>
          </div>
        </header>

        <form
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm field-print-hide md:p-8"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">
              School name (optional)
              <input
                className={inputClassName}
                value={plan.schoolName}
                onChange={(event) => update({ schoolName: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Term or year
              <input
                className={inputClassName}
                value={plan.term}
                onChange={(event) => update({ term: event.target.value })}
                placeholder="Term 1"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Year levels
              <input
                className={inputClassName}
                value={plan.yearLevels}
                onChange={(event) => update({ yearLevels: event.target.value })}
                placeholder="Years 3–4, or Years 5–6"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Classes
              <input
                className={inputClassName}
                value={plan.classes}
                onChange={(event) => update({ classes: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Who leads
              <input
                className={inputClassName}
                value={plan.leader}
                onChange={(event) => update({ leader: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Parent letter timing
              <input
                className={inputClassName}
                value={plan.parentLetterWhen}
                onChange={(event) => update({ parentLetterWhen: event.target.value })}
                placeholder="Before Lesson 1, or the school’s usual process"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Devices check
              <input
                className={inputClassName}
                value={plan.deviceCheck}
                onChange={(event) => update({ deviceCheck: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Projector or shared screen check
              <input
                className={inputClassName}
                value={plan.projectorCheck}
                onChange={(event) => update({ projectorCheck: event.target.value })}
              />
            </label>
            <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
              Paper fallback
              <input
                className={inputClassName}
                value={plan.paperFallback}
                onChange={(event) => update({ paperFallback: event.target.value })}
                placeholder="Print the classroom pack, or name who will print it"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
              Notes (no student names)
              <textarea
                className={`${inputClassName} min-h-28 py-3`}
                value={plan.notes}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </label>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Which lessons, when</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-slate-300 bg-slate-50 p-2 text-left">Lesson</th>
                    <th className="border border-slate-300 bg-slate-50 p-2 text-left">When</th>
                    <th className="border border-slate-300 bg-slate-50 p-2 text-left">Classes</th>
                    <th className="border border-slate-300 bg-slate-50 p-2 text-left">Who leads</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_LESSON_DEFINITIONS.map((lesson) => {
                    const row = plan.lessons.find((item) => item.lessonId === lesson.id)!;
                    return (
                      <tr key={lesson.id}>
                        <th className="border border-slate-300 p-2 text-left font-medium">
                          {lessonDisplayTitle(lesson)}
                        </th>
                        <td className="border border-slate-300 p-1">
                          <input
                            aria-label={`When for ${lessonDisplayTitle(lesson)}`}
                            className="min-h-11 w-full rounded-lg border-0 px-2"
                            value={row.when}
                            onChange={(event) =>
                              updateLesson(lesson.id, { when: event.target.value })
                            }
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            aria-label={`Classes for ${lessonDisplayTitle(lesson)}`}
                            className="min-h-11 w-full rounded-lg border-0 px-2"
                            value={row.classes}
                            onChange={(event) =>
                              updateLesson(lesson.id, { classes: event.target.value })
                            }
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            aria-label={`Who leads ${lessonDisplayTitle(lesson)}`}
                            className="min-h-11 w-full rounded-lg border-0 px-2"
                            value={row.lead}
                            onChange={(event) =>
                              updateLesson(lesson.id, { lead: event.target.value })
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        <div className="hidden print:block">
          <PrintableRolloutPlan plan={plan} headingLevel={1} />
        </div>
      </div>
    </main>
  );
}

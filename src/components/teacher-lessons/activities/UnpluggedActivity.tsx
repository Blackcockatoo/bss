"use client";

import type { LessonActivityProps } from "./types";
import { STEP_KIND_LABEL, StepShell } from "./shared";

/**
 * F–2 unplugged lessons: no companion, no student data. The large student
 * task is what the class should do with objects, movement or paper.
 */
export function UnpluggedActivity(props: LessonActivityProps) {
  const { step, lesson } = props;

  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL[step.kind]}
      instruction={step.studentTask}
    >
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
          Unplugged classroom activity
        </p>
        <p className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
          {step.studentTask}
        </p>
        <p className="text-lg leading-8 text-slate-700">{step.title}</p>
        <p className="text-sm leading-6 text-slate-600">
          This lesson is unplugged. Follow the teacher prompt, and use the
          objects, cards or movement in the planner. No student names or photos
          are collected, and no student data is shown here.
        </p>
        {lesson.movementMoment ? (
          <p className="text-sm leading-6 text-slate-700">
            <span className="font-semibold">Movement moment: </span>
            {lesson.movementMoment}
          </p>
        ) : null}
      </div>
    </StepShell>
  );
}

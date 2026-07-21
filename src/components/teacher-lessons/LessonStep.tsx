"use client";

import { CheckCircle2, Circle } from "lucide-react";

import type { LessonDefinition, LessonStepDefinition } from "@/lib/teacher-lessons";

const STEP_KIND_LABEL: Record<LessonStepDefinition["kind"], string> = {
  introduce: "Introduce",
  observe: "Observe / Predict",
  interact: "Interact",
  discuss: "Discuss",
  complete: "Save / Complete",
};

interface LessonStepProps {
  lesson: LessonDefinition;
  step: LessonStepDefinition;
  stepIndex: number;
  completedSteps: number[];
}

/**
 * Colour-independent step progress dots plus the current step's core content.
 * This is the shared body both the Teacher and Student panels frame around, so
 * later passes can slot a real activity into the "activity area" without
 * touching navigation.
 */
export function LessonStep({
  lesson,
  step,
  stepIndex,
  completedSteps,
}: LessonStepProps) {
  return (
    <div className="space-y-5">
      {/* Colour-independent progress indicator */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Lesson steps">
        {lesson.steps.map((s, index) => {
          const done = completedSteps.includes(index);
          const current = index === stepIndex;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                  current
                    ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                    : done
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-700 bg-slate-800/40 text-slate-400"
                }`}
                aria-current={current ? "step" : undefined}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{STEP_KIND_LABEL[s.kind]}</span>
                <span className="sm:hidden">{index + 1}</span>
                {done ? <span className="sr-only">(completed)</span> : null}
                {current ? <span className="sr-only">(current step)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
          {STEP_KIND_LABEL[step.kind]}
        </p>
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {step.title}
        </h2>
      </div>

      {/* Placeholder activity area — Pass 2 will mount real Meta-Pet systems here. */}
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-slate-400">
          Activity area for <span className="text-slate-200">{lesson.title}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          This is where the {lesson.appDestination.replace(/-/g, " ")} activity
          will appear in a later pass. Expected outcome: {step.expectedOutcome}
        </p>
      </div>
    </div>
  );
}

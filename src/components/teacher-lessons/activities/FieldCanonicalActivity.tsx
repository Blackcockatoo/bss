"use client";

import { CheckCircle2, Eye, RotateCcw } from "lucide-react";
import { useState } from "react";

import type { LessonActivityProps } from "./types";
import { STEP_KIND_LABEL, StepShell } from "./shared";

const VISUAL_LABELS = [
  ["Input", "State", "Output"],
  ["Signal", "Choice", "Check"],
  ["Shape", "Number", "Trait"],
  ["Step", "Branch", "Repeat"],
  ["Purpose", "Minimum data", "Delete"],
  ["Need", "Feature", "Access"],
  ["Test", "Repair", "Next"],
] as const;

/**
 * A calm, data-free Field Mode activity surface driven only by the canonical
 * lesson definition. The broader teacher system retains its richer consumer
 * demonstrations, but the school runtime never falls back to conflicting
 * legacy lesson concepts.
 */
export function FieldCanonicalActivity({
  lesson,
  step,
  reducedMotion,
}: LessonActivityProps) {
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const checked = checkedSteps[step.id] === true;
  const labels = VISUAL_LABELS[lesson.number - 1] ?? VISUAL_LABELS[0];

  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL[step.kind]}
      instruction={step.studentTask}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <div
          className="rounded-3xl border border-emerald-300/25 bg-emerald-950/20 p-5"
          aria-label={`${lesson.title} visual activity`}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {labels.map((label, index) => (
              <div key={label} className="relative rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-300 bg-cyan-300/10 text-lg font-bold text-cyan-100" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold text-white">{label}</p>
                {index < labels.length - 1 ? (
                  <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-cyan-300 sm:block" aria-hidden="true">→</span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm leading-6 text-slate-200">
            {step.expectedOutcome}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-sm leading-6 text-slate-200">
          <p className="flex items-start gap-2">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
            Move, point, speak, draw, build, partner, quietly observe or use the
            printed alternative. The method is not scored.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setCheckedSteps((current) => ({
              ...current,
              [step.id]: !checked,
            }))
          }
          className="mx-auto flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 hover:bg-emerald-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
        >
          {checked ? <RotateCcw className="h-5 w-5" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
          {checked ? "Reset this example" : "Example checked together"}
        </button>
        <p className="text-center text-xs text-slate-400" aria-live="polite">
          {checked
            ? "Checked for this screen only. No student response was stored."
            : reducedMotion
              ? "Static reduced-motion display is active."
              : "No timer and no saved student response."}
        </p>
      </div>
    </StepShell>
  );
}

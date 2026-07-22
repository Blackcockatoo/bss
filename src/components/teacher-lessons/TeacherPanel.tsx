"use client";

import { useState } from "react";
import { Eye, EyeOff, MessagesSquare, Speech, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LessonDefinition, LessonStepDefinition } from "@/lib/teacher-lessons";

interface TeacherPanelProps {
  lesson: LessonDefinition;
  step: LessonStepDefinition;
  /** Whether the "expected outcome" is being shown (teacher toggle). */
  showExpectedOutcome: boolean;
}

/**
 * Teacher View guidance panel shown above the activity. Projector-friendly: the
 * teacher script, discussion prompts, an optional expected-outcome reveal, and
 * toggles to show the student instructions or hide teacher-only notes.
 */
export function TeacherPanel({
  lesson,
  step,
  showExpectedOutcome,
}: TeacherPanelProps) {
  const [showStudentInstructions, setShowStudentInstructions] = useState(false);
  const [hideTeacherNotes, setHideTeacherNotes] = useState(false);

  return (
    <aside
      className="mb-6 space-y-3 rounded-3xl border border-amber-300/15 bg-slate-900/40 p-4"
      aria-label="Teacher guidance"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          Teacher guidance
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={() => setShowStudentInstructions((v) => !v)}
            aria-pressed={showStudentInstructions}
          >
            {showStudentInstructions ? (
              <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            Student instructions
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={() => setHideTeacherNotes((v) => !v)}
            aria-pressed={hideTeacherNotes}
          >
            {hideTeacherNotes ? (
              <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
            )}
            {hideTeacherNotes ? "Show notes" : "Hide notes (projector)"}
          </Button>
        </div>
      </div>

      {!hideTeacherNotes ? (
        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              <Speech className="h-4 w-4" aria-hidden="true" />
              Teacher script
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-amber-50/90">
              “{step.teacherPrompt}”
            </p>
          </section>
          <section className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <MessagesSquare className="h-4 w-4" aria-hidden="true" />
              Discussion prompts
            </h3>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
              {lesson.discussionPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {showStudentInstructions ? (
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
            What students see
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-cyan-50/90">
            {step.studentTask}
          </p>
        </section>
      ) : null}

      {showExpectedOutcome ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            <Target className="h-4 w-4" aria-hidden="true" />
            Expected outcome
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-emerald-50/90">
            {step.expectedOutcome}
          </p>
        </section>
      ) : null}
    </aside>
  );
}

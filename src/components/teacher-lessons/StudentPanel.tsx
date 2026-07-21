"use client";

import { useState } from "react";
import { Check, HandHelping, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LessonDefinition, LessonStepDefinition } from "@/lib/teacher-lessons";

interface StudentPanelProps {
  lesson: LessonDefinition;
  step: LessonStepDefinition;
  stepIndex: number;
  totalSteps: number;
  savedEvidence: string | undefined;
  onSaveResponse: (value: string) => void;
  onAskForHelp: () => void;
}

/**
 * Student View: one instruction, one primary action, large touch targets and
 * minimal text. The response box is a Pass 1 evidence placeholder that persists
 * locally. No strict timers, no colour-only cues.
 */
export function StudentPanel({
  lesson,
  step,
  stepIndex,
  totalSteps,
  savedEvidence,
  onSaveResponse,
  onAskForHelp,
}: StudentPanelProps) {
  // The Runner mounts this panel with key={step.id}, so a fresh component (and
  // thus a fresh lazy initial value) is created whenever the step changes — no
  // in-effect state sync required.
  const [response, setResponse] = useState(() => savedEvidence ?? "");
  const [justSaved, setJustSaved] = useState(false);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
      <p className="text-sm font-medium text-cyan-300" aria-live="polite">
        Step {stepIndex + 1} of {totalSteps}
      </p>

      <h2 className="text-2xl font-semibold text-white md:text-3xl">
        {step.title}
      </h2>

      <p className="text-lg leading-8 text-slate-200">{step.studentTask}</p>

      <div className="w-full space-y-3 text-left">
        <label
          htmlFor="student-response"
          className="block text-sm font-medium text-slate-300"
        >
          Your response (optional)
        </label>
        <textarea
          id="student-response"
          value={response}
          onChange={(event) => {
            setResponse(event.target.value);
            setJustSaved(false);
          }}
          rows={3}
          placeholder="Type or say your answer…"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
        />
        <Button
          type="button"
          size="lg"
          className="min-h-12 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          onClick={() => {
            onSaveResponse(response);
            setJustSaved(true);
          }}
        >
          {justSaved ? (
            <Check className="mr-1.5 h-5 w-5" aria-hidden="true" />
          ) : (
            <Save className="mr-1.5 h-5 w-5" aria-hidden="true" />
          )}
          {justSaved ? "Saved" : "Save response"}
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="min-h-12 border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
        onClick={onAskForHelp}
      >
        <HandHelping className="mr-1.5 h-5 w-5" aria-hidden="true" />
        Ask teacher for help
      </Button>

      <p className="sr-only">
        Working on {lesson.title}. There is no timer — take the time you need.
      </p>
    </div>
  );
}

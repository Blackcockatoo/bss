"use client";

import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TEACHER_HUB_PATH,
  resolveLessonAvailability,
  type LessonActivityType,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import { STEP_KIND_LABEL, StepShell } from "./shared";
import { MeetActivity } from "./MeetActivity";
import { BuildBodyActivity } from "./BuildBodyActivity";
import { DnaDifferenceActivity } from "./DnaDifferenceActivity";
import { NeedsActivity } from "./NeedsActivity";
import { FeelingsActivity } from "./FeelingsActivity";
import { PatternsActivity } from "./PatternsActivity";
import { ResponsibleCreatorActivity } from "./ResponsibleCreatorActivity";

/**
 * The generic activity registry: `activityType → component`. The shared Runner
 * looks up the right activity here without any per-lesson branching, so future
 * passes add or swap activities by editing this map alone.
 */
export const ACTIVITY_REGISTRY: Record<
  LessonActivityType,
  (props: LessonActivityProps) => React.ReactElement
> = {
  observe: MeetActivity,
  build: BuildBodyActivity,
  compare: DnaDifferenceActivity,
  care: NeedsActivity,
  interpret: FeelingsActivity,
  predict: PatternsActivity,
  create: ResponsibleCreatorActivity,
};

/**
 * Shown when a lesson's required feature is unavailable on this device. Never
 * exposes a raw technical error: it gives a teacher-friendly message, keeps the
 * lesson navigable in a simplified mode, and offers a safe route back to the
 * Hub.
 */
function FeatureUnavailable({
  reason,
  props,
}: {
  reason: string;
  props: LessonActivityProps;
}) {
  const { step, lesson } = props;
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL[step.kind]}
      instruction={step.studentTask}
    >
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-amber-300/20 bg-slate-900/60 p-5 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
          aria-hidden="true"
        >
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="text-sm leading-6 text-slate-200">{reason}</p>
        <p className="text-xs text-slate-400">
          You can still run this lesson using the guided steps and discussion.
          Expected outcome: {step.expectedOutcome}
        </p>
        {lesson.discussionPrompts.length > 0 ? (
          <ul className="space-y-1 text-left text-xs text-slate-300">
            {lesson.discussionPrompts.map((prompt) => (
              <li key={prompt}>• {prompt}</li>
            ))}
          </ul>
        ) : null}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
        >
          <Link href={TEACHER_HUB_PATH}>
            <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Return to Teacher Hub
          </Link>
        </Button>
      </div>
    </StepShell>
  );
}

/**
 * Generic fallback for a lesson whose activityType has no registered activity.
 * Keeps the lesson usable rather than showing a blank area.
 */
function ReflectionFallback(props: LessonActivityProps) {
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL[props.step.kind]}
      instruction={props.step.studentTask}
    >
      <p className="text-sm text-slate-400">
        Follow the teacher prompt for this step, then continue.
      </p>
    </StepShell>
  );
}

/**
 * The single mounting point the Runner uses. It checks feature availability
 * first (graceful fallback) then renders the registered activity generically.
 */
export function ActivityHost(props: LessonActivityProps) {
  const availability = resolveLessonAvailability(props.lesson);
  if (!availability.available) {
    return (
      <FeatureUnavailable
        reason={
          availability.reason ??
          "This tool is unavailable. A simplified classroom example is used instead."
        }
        props={props}
      />
    );
  }

  const Activity = ACTIVITY_REGISTRY[props.lesson.activityType] ?? ReflectionFallback;
  return <Activity {...props} />;
}

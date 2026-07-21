"use client";

import Link from "next/link";
import { ArrowRight, PartyPopper, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TEACHER_HUB_PATH,
  buildLessonPath,
  type LessonDefinition,
} from "@/lib/teacher-lessons";

interface LessonCompletionProps {
  lesson: LessonDefinition;
  nextLesson: LessonDefinition | null;
  onReplay: () => void;
  onReturnToHub: () => void;
}

/**
 * Completion screen shown when a lesson finishes. Offers a clear route back to
 * the Teacher Hub, an option to run the lesson again, and (if any) a link to
 * the next lesson.
 */
export function LessonCompletion({
  lesson,
  nextLesson,
  onReplay,
  onReturnToHub,
}: LessonCompletionProps) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-6 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        aria-hidden="true"
      >
        <PartyPopper className="h-8 w-8" />
      </span>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
          Lesson {lesson.number} complete
        </p>
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {lesson.title}
        </h2>
      </div>

      <p className="text-lg leading-8 text-slate-200">
        {lesson.completionMessage}
      </p>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="bg-amber-300 text-slate-950 hover:bg-amber-200"
        >
          <Link href={TEACHER_HUB_PATH} onClick={onReturnToHub}>
            Return to Teacher Hub
          </Link>
        </Button>
        {nextLesson ? (
          <Button
            asChild
            variant="outline"
            className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
          >
            <Link href={buildLessonPath(nextLesson.slug)} onClick={onReturnToHub}>
              Next: {nextLesson.title}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          onClick={onReplay}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Run again
        </Button>
      </div>
    </div>
  );
}

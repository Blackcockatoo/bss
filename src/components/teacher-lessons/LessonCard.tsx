"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildLessonPath,
  type LessonCardStatus,
  type LessonDefinition,
} from "@/lib/teacher-lessons";
import { LESSON_STATUS_META } from "./lessonStatusMeta";

const STATUS_ICONS = {
  Circle,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
} as const;

interface LessonCardProps {
  lesson: LessonDefinition;
  status: LessonCardStatus;
  /** 0-1 completion within the lesson (completed steps / total). */
  stepProgress: number;
  onPreview: (lesson: LessonDefinition) => void;
  onTeacherNotes: (lesson: LessonDefinition) => void;
}

export function LessonCard({
  lesson,
  status,
  stepProgress,
  onPreview,
  onTeacherNotes,
}: LessonCardProps) {
  const statusMeta = LESSON_STATUS_META[status];
  const StatusIcon = STATUS_ICONS[statusMeta.icon];
  const startLabel =
    status === "completed"
      ? "Restart Lesson"
      : status === "in-progress" || status === "paused"
        ? "Resume Lesson"
        : "Start Lesson";
  const progressPercent = Math.round(
    Math.min(1, Math.max(0, stepProgress)) * 100,
  );

  return (
    <article
      className="flex h-full flex-col gap-4 rounded-3xl border border-amber-300/15 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] transition-colors focus-within:border-amber-300/40 hover:border-amber-300/30 md:p-6"
      aria-labelledby={`lesson-card-title-${lesson.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-lg font-semibold text-amber-200"
            aria-hidden="true"
          >
            {lesson.number}
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
              Lesson {lesson.number}
            </p>
            <h3
              id={`lesson-card-title-${lesson.id}`}
              className="text-lg font-semibold leading-tight text-white md:text-xl"
            >
              {lesson.title}
            </h3>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
        >
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {statusMeta.label}
        </span>
      </div>

      <p className="text-sm leading-6 text-slate-300">
        {lesson.shortDescription}
      </p>

      <dl className="grid grid-cols-1 gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <dt className="sr-only">Suggested duration</dt>
          <dd>{lesson.durationMinutes} min</dd>
        </div>
        <div className="flex items-start gap-1.5">
          <BookOpen
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <div>
            <dt className="sr-only">Learning areas</dt>
            <dd>{lesson.learningAreas.join(", ")}</dd>
          </div>
        </div>
      </dl>

      {progressPercent > 0 && status !== "completed" ? (
        <div className="space-y-1">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${lesson.title} progress`}
          >
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[0.7rem] text-slate-400">
            {progressPercent}% through this lesson
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-1">
        <Button
          asChild
          className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200"
        >
          <Link href={buildLessonPath(lesson.slug)}>{startLabel}</Link>
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={() => onPreview(lesson)}
          >
            <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={() => onTeacherNotes(lesson)}
          >
            <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Teacher Notes
          </Button>
        </div>
      </div>
    </article>
  );
}

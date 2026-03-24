"use client";

import { Button } from "@/components/ui/button";
import {
  ENGAGEMENT_CATEGORY_DEFINITIONS,
  FOCUS_AREA_LABELS,
  normalizeEngagementCategory,
  useEducationStore,
} from "@/lib/education";
import type {
  EngagementCategory,
  LessonProgress,
  QueuedLesson,
} from "@/lib/education";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";

interface EducationQueuePanelProps {
  mode: "teacher" | "student";
  onLessonActivate?: (lessonId: string) => void;
  onLessonComplete?: (lessonId: string) => void;
  studentAlias?: string;
}

const ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES: Record<
  EngagementCategory,
  string
> = {
  "health-digital-use":
    "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  learning: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  exploring: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  "training-practice":
    "border-violet-400/30 bg-violet-500/10 text-violet-200",
  "mindfulness-regulation":
    "border-teal-400/30 bg-teal-500/10 text-teal-200",
  "vegging-passive-consumption":
    "border-slate-400/30 bg-slate-500/10 text-slate-200",
};

function getBadgeClassName(
  lesson: Pick<QueuedLesson, "engagementCategory">,
): string {
  return ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES[
    normalizeEngagementCategory(lesson.engagementCategory)
  ];
}

function getProgressForAlias(
  lessonProgress: LessonProgress[],
  lessonId: string,
  studentAlias?: string,
): LessonProgress | undefined {
  if (!studentAlias) {
    return undefined;
  }

  return lessonProgress.find(
    (entry) =>
      entry.lessonId === lessonId && entry.studentAlias === studentAlias,
  );
}

export function EducationQueuePanel({
  mode,
  onLessonActivate,
  onLessonComplete,
  studentAlias,
}: EducationQueuePanelProps) {
  const queue = useEducationStore((s) => s.queue);
  const activeLesson = useEducationStore((s) => s.activeLesson);
  const lessonProgress = useEducationStore((s) => s.lessonProgress);
  const removeLesson = useEducationStore((s) => s.removeLesson);
  const reorderQueue = useEducationStore((s) => s.reorderQueue);
  const activateLesson = useEducationStore((s) => s.activateLesson);
  const pauseLesson = useEducationStore((s) => s.pauseLesson);
  const initProgress = useEducationStore((s) => s.initProgress);
  const completeLesson = useEducationStore((s) => s.completeLesson);

  const completedLessonIds = useMemo(() => {
    const completed = new Set<string>();
    for (const progress of lessonProgress) {
      if (progress.status === "completed") {
        completed.add(progress.lessonId);
      }
    }
    return completed;
  }, [lessonProgress]);

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          {mode === "teacher"
            ? "No lessons are queued yet. Add a lesson from the planner to begin."
            : "No lessons are queued right now. Ask your teacher to prepare the sequence first."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((lesson, index) => {
        const isActive = activeLesson === lesson.id;
        const isCompleted = completedLessonIds.has(lesson.id);
        const aliasProgress = getProgressForAlias(
          lessonProgress,
          lesson.id,
          studentAlias,
        );
        const lessonStatus = aliasProgress?.status ?? (isCompleted ? "completed" : "queued");

        return (
          <article
            key={lesson.id}
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getBadgeClassName(lesson)}`}
                  >
                    {
                      ENGAGEMENT_CATEGORY_DEFINITIONS[
                        normalizeEngagementCategory(lesson.engagementCategory)
                      ].shortLabel
                    }
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {FOCUS_AREA_LABELS[lesson.focusArea]}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {lesson.targetMinutes} min
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {lesson.title}
                  </h3>
                  <p className="text-xs leading-5 text-zinc-400">
                    {lesson.description}
                  </p>
                </div>
                {lesson.standardsRef.length > 0 && (
                  <p className="text-[10px] text-emerald-300/80">
                    {lesson.standardsRef.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {mode === "teacher" && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => reorderQueue(lesson.id, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => reorderQueue(lesson.id, "down")}
                      disabled={index === queue.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-400 hover:bg-rose-500/10"
                      onClick={() => removeLesson(lesson.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill isActive={isActive} status={lessonStatus} />
              {mode === "teacher" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => {
                    activateLesson(lesson.id);
                    onLessonActivate?.(lesson.id);
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isActive ? "Active now" : "Set active"}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700"
                    onClick={() => {
                      if (!studentAlias) return;
                      initProgress(lesson.id, studentAlias);
                      activateLesson(lesson.id);
                      onLessonActivate?.(lesson.id);
                    }}
                    disabled={!studentAlias}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start lesson
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700"
                    onClick={() => {
                      if (!studentAlias) return;
                      pauseLesson(lesson.id, studentAlias);
                    }}
                    disabled={!studentAlias}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-200"
                    onClick={() => {
                      if (!studentAlias) return;
                      const result = completeLesson(lesson.id, studentAlias);
                      if (result.ready) {
                        onLessonComplete?.(lesson.id);
                      }
                    }}
                    disabled={!studentAlias || lessonStatus === "completed"}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark complete
                  </Button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatusPill({
  status,
  isActive,
}: {
  status: LessonProgress["status"] | "queued";
  isActive: boolean;
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (isActive || status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
        <Play className="h-3.5 w-3.5" />
        Active
      </span>
    );
  }

  if (status === "paused") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
        <Pause className="h-3.5 w-3.5" />
        Paused
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
      <Circle className="h-3.5 w-3.5" />
      Queued
    </span>
  );
}

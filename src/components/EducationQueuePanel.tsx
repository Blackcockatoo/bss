"use client";

import { ProgressRing } from "@/components/ProgressRing";
import {
  VisualEffectsRenderer,
  useVisualEffects,
} from "@/components/VisualEffects";
import { Button } from "@/components/ui/button";
import {
  DNA_MODE_LABELS,
  ENGAGEMENT_CATEGORY_DEFINITIONS,
  ENGAGEMENT_CATEGORY_ORDER,
  FOCUS_AREA_LABELS,
  VIBE_EMOJI,
  getEngagementCategoryDefinition,
  lessonNeedsQuestBoard,
  normalizeEngagementCategory,
  selectQuestPack,
  useEducationStore,
} from "@/lib/education";
import type {
  EngagementCategory,
  LessonProgress,
  QueuedLesson,
  VibeReaction,
} from "@/lib/education";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Lock,
  Pause,
  Play,
  Trash2,
  Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface EducationQueuePanelProps {
  mode: "teacher" | "student";
  onLessonActivate?: (lessonId: string) => void;
  onLessonComplete?: (lessonId: string) => void;
  studentAlias?: string;
}

const VIBE_BUTTONS: { reaction: VibeReaction; label: string }[] = [
  { reaction: "fire", label: "Fire" },
  { reaction: "brain", label: "Brain" },
  { reaction: "sleeping", label: "Sleepy" },
  { reaction: "mind-blown", label: "Mind Blown" },
];

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

function getEngagementCategoryBadgeClassName(
  lesson: Pick<QueuedLesson, "engagementCategory">,
): string {
  return ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES[
    normalizeEngagementCategory(lesson.engagementCategory)
  ];
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
  const eduXP = useEducationStore((s) => s.eduXP);
  const classEnergy = useEducationStore((s) => s.classEnergy);
  const getClassEnergy = useEducationStore((s) => s.getClassEnergy);
  const sendVibeReaction = useEducationStore((s) => s.sendVibeReaction);
  const completeLessonWithFlair = useEducationStore(
    (s) => s.completeLessonWithFlair,
  );

  const { effects, triggerEffect } = useVisualEffects();

  const completedLessonIds = useMemo(() => {
    const completed = new Set<string>();
    for (const p of lessonProgress) {
      if (p.status === "completed") {
        completed.add(p.lessonId);
      }
    }
    return completed;
  }, [lessonProgress]);

  const handleActivate = (lessonId: string) => {
    activateLesson(lessonId);
    onLessonActivate?.(lessonId);
  };

  const handleVibeReaction = useCallback(
    (lessonId: string, reaction: VibeReaction, event: React.MouseEvent) => {
      sendVibeReaction(lessonId, reaction);
      // Trigger sparkle effect at click position
      triggerEffect("sparkle", event.clientX, event.clientY, 800);
    },
    [sendVibeReaction, triggerEffect],
  );

  const handleComplete = useCallback(
    (lessonId: string, alias: string) => {
      const result = completeLessonWithFlair(lessonId, alias);

      if (!result.completed) {
        return;
      }

      // Fire confetti + star effects
      triggerEffect(
        "confetti",
        window.innerWidth / 2,
        window.innerHeight / 2,
        1500,
      );
      setTimeout(() => {
        triggerEffect(
          "star",
          window.innerWidth / 2 - 50,
          window.innerHeight / 2 - 50,
          1000,
        );
        triggerEffect(
          "star",
          window.innerWidth / 2 + 50,
          window.innerHeight / 2 - 50,
          1000,
        );
      }, 300);

      onLessonComplete?.(lessonId);

      // Trigger burst for new achievements
      if (result.newAchievements.length > 0) {
        setTimeout(() => {
          triggerEffect(
            "burst",
            window.innerWidth / 2,
            window.innerHeight / 3,
            1200,
          );
        }, 800);
      }
    },
    [completeLessonWithFlair, triggerEffect, onLessonComplete],
  );

  const currentEnergy = getClassEnergy();
  const xpProgress = eduXP.xp % 100;

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          {mode === "teacher"
            ? "No lessons in the queue yet. Create assignments and add them to the queue."
            : "No lessons are queued right now. Ask your teacher to set up a lesson path."}
        </p>
        <VisualEffectsRenderer effects={effects} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* XP bar */}
      <div className="flex items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-500/5 p-3">
        <ProgressRing
          progress={xpProgress}
          size={32}
          strokeWidth={3}
          color="amber"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-200">
              Level {eduXP.level}
            </span>
            <span className="text-xs text-zinc-500">{eduXP.xp} XP</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Class Energy Meter */}
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-cyan-300 uppercase tracking-wide flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Class Energy
          </span>
          <span className="text-sm font-bold text-cyan-200">
            {currentEnergy}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all ${
              currentEnergy > 60
                ? "bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                : "bg-gradient-to-r from-cyan-500 to-cyan-400"
            }`}
            initial={{ width: 0 }}
            animate={{
              width: `${currentEnergy}%`,
              ...(currentEnergy > 60 ? { scale: [1, 1.02, 1] } : {}),
            }}
            transition={{
              width: { duration: 0.5 },
              scale: { repeat: Number.POSITIVE_INFINITY, duration: 1.5 },
            }}
          />
        </div>
      </div>

      {mode === "teacher" ? (
        <TeacherQueue
          queue={queue}
          activeLesson={activeLesson}
          completedLessonIds={completedLessonIds}
          lessonProgress={lessonProgress}
          onRemove={removeLesson}
          onReorder={reorderQueue}
          onActivate={handleActivate}
        />
      ) : (
        <StudentQueue
          queue={queue}
          activeLesson={activeLesson}
          completedLessonIds={completedLessonIds}
          onActivate={handleActivate}
          onVibeReaction={handleVibeReaction}
          onComplete={handleComplete}
          studentAlias={studentAlias ?? ""}
        />
      )}

      <VisualEffectsRenderer effects={effects} />
    </div>
  );
}

// ---------- Teacher View ----------

function TeacherQueue({
  queue,
  activeLesson,
  completedLessonIds,
  lessonProgress,
  onRemove,
  onReorder,
  onActivate,
}: {
  queue: QueuedLesson[];
  activeLesson: string | null;
  completedLessonIds: Set<string>;
  lessonProgress: LessonProgress[];
  onRemove: (id: string) => void;
  onReorder: (id: string, dir: "up" | "down") => void;
  onActivate: (id: string) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<
    EngagementCategory | "all"
  >("all");

  const visibleQueue = useMemo(
    () =>
      queue.filter((lesson) =>
        categoryFilter === "all"
          ? true
          : normalizeEngagementCategory(lesson.engagementCategory) ===
            categoryFilter,
      ),
    [categoryFilter, queue],
  );

  const categoryCounts = useMemo(
    () =>
      ENGAGEMENT_CATEGORY_ORDER.map((category) => ({
        category,
        count: queue.filter(
          (lesson) =>
            normalizeEngagementCategory(lesson.engagementCategory) === category,
        ).length,
      })).filter((entry) => entry.count > 0),
    [queue],
  );

  const completedVisibleCount = visibleQueue.filter((lesson) =>
    completedLessonIds.has(lesson.id),
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-200">Lesson Queue</p>
          <p className="text-xs text-zinc-500">
            {completedVisibleCount} of {visibleQueue.length} completed
            {categoryFilter !== "all" && ` in ${ENGAGEMENT_CATEGORY_DEFINITIONS[categoryFilter].shortLabel.toLowerCase()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            className="text-[11px] uppercase tracking-wide text-zinc-500"
            htmlFor="teacher-queue-category-filter"
          >
            Filter
          </label>
          <select
            id="teacher-queue-category-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value === "all"
                  ? "all"
                  : normalizeEngagementCategory(event.target.value),
              )
            }
            className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="all">All categories</option>
            {ENGAGEMENT_CATEGORY_ORDER.map((category) => (
              <option key={category} value={category}>
                {ENGAGEMENT_CATEGORY_DEFINITIONS[category].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {categoryCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categoryCounts.map(({ category, count }) => (
            <span
              key={category}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ENGAGEMENT_CATEGORY_BADGE_CLASSNAMES[category]}`}
            >
              {ENGAGEMENT_CATEGORY_DEFINITIONS[category].shortLabel}: {count}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {visibleQueue.length === 0 && (
          <p className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-zinc-500">
            No lessons match the current engagement category filter.
          </p>
        )}
        <AnimatePresence mode="popLayout">
          {visibleQueue.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson;
            const isCompleted = completedLessonIds.has(lesson.id);
            const engagement = getEngagementCategoryDefinition(
              lesson.engagementCategory,
            );
            const fullIndex = queue.findIndex((entry) => entry.id === lesson.id);
            const lessonProgressEntries = lessonProgress.filter(
              (p) => p.lessonId === lesson.id,
            );
            const progressCount = lessonProgressEntries.filter(
              (p) => p.status === "completed",
            ).length;
            const totalCount = lessonProgressEntries.length;
            const usesQuestBoard = lessonNeedsQuestBoard(lesson);
            const questReadyCount = lessonProgressEntries.filter((progress) => {
              const summary = progress.questSummary;
              return Boolean(
                summary &&
                  summary.requiredCoreQuests > 0 &&
                  summary.completedCoreQuests >= summary.requiredCoreQuests,
              );
            }).length;
            const questPackLabel = usesQuestBoard
              ? selectQuestPack({
                  focusArea: lesson.focusArea,
                  dnaMode: lesson.dnaMode,
                }).name
              : null;

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`rounded-lg border p-3 transition ${
                  isActive
                    ? "border-cyan-400/60 bg-cyan-500/10"
                    : isCompleted
                      ? "border-emerald-400/40 bg-emerald-500/5"
                      : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">
                        {idx + 1}.
                      </span>
                      <p className="text-sm font-semibold text-zinc-100 truncate">
                        {lesson.title}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getEngagementCategoryBadgeClassName(lesson)}`}
                      >
                        {engagement.shortLabel}
                      </span>
                      {isActive && (
                        <motion.span
                          className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-200 font-semibold"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 2,
                          }}
                        >
                          ACTIVE
                        </motion.span>
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} ·{" "}
                      {lesson.targetMinutes} min
                      {lesson.dnaMode &&
                        ` · ${DNA_MODE_LABELS[lesson.dnaMode]}`}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {engagement.description}
                    </p>
                    {questPackLabel && (
                      <p className="mt-1 text-[11px] text-cyan-300/80">
                        Quest pack: {questPackLabel}
                        {totalCount > 0 &&
                          ` · ${questReadyCount}/${totalCount} quest-ready`}
                      </p>
                    )}
                    {totalCount > 0 && (
                      <motion.p
                        className="text-[11px] text-zinc-500 mt-1"
                        key={progressCount}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                      >
                        {progressCount}/{totalCount} learners done
                      </motion.p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
                      onClick={() => onReorder(lesson.id, "up")}
                      disabled={fullIndex === 0 || categoryFilter !== "all"}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
                      onClick={() => onReorder(lesson.id, "down")}
                      disabled={
                        fullIndex === queue.length - 1 || categoryFilter !== "all"
                      }
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    {!isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => onActivate(lesson.id)}
                        aria-label="Activate lesson"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Pause className="h-3.5 w-3.5 text-cyan-300" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                      onClick={() => onRemove(lesson.id)}
                      aria-label="Remove lesson"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Student View (Journey/Pathway) ----------

function StudentQueue({
  queue,
  activeLesson,
  completedLessonIds,
  onActivate,
  onVibeReaction,
  onComplete,
  studentAlias,
}: {
  queue: QueuedLesson[];
  activeLesson: string | null;
  completedLessonIds: Set<string>;
  onActivate: (id: string) => void;
  onVibeReaction: (
    lessonId: string,
    reaction: VibeReaction,
    event: React.MouseEvent,
  ) => void;
  onComplete: (lessonId: string, alias: string) => void;
  studentAlias: string;
}) {
  // Find the first incomplete lesson
  const nextLessonIdx = queue.findIndex(
    (l) => !completedLessonIds.has(l.id) && l.id !== activeLesson,
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Your Learning Path</p>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {queue.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson;
            const isCompleted = completedLessonIds.has(lesson.id);
            const isNext = idx === nextLessonIdx && !isActive;
            const isLocked = !isCompleted && !isActive && !isNext;
            const usesQuestBoard = lessonNeedsQuestBoard(lesson);
            const engagement = getEngagementCategoryDefinition(
              lesson.engagementCategory,
            );

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`rounded-lg p-3 transition ${
                  isActive
                    ? "border border-cyan-400/60 bg-cyan-500/10"
                    : isCompleted
                      ? "bg-emerald-500/5"
                      : isNext
                        ? "border border-slate-700 bg-slate-950/50"
                        : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 1.5,
                        }}
                      >
                        <Play className="h-5 w-5 text-cyan-300" />
                      </motion.div>
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-zinc-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        isActive
                          ? "text-cyan-100"
                          : isCompleted
                            ? "text-emerald-200"
                            : "text-zinc-300"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getEngagementCategoryBadgeClassName(lesson)}`}
                      >
                        {engagement.shortLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} ·{" "}
                      {lesson.targetMinutes} min
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      {engagement.description}
                    </p>
                  </div>
                  {(isActive || isNext) && (
                    <Button
                      type="button"
                      size="sm"
                      className={`h-8 px-3 text-xs ${
                        isActive
                          ? "bg-cyan-500/90 hover:bg-cyan-500 text-slate-950"
                          : "bg-slate-800 hover:bg-slate-700 text-zinc-200"
                      }`}
                      onClick={() => onActivate(lesson.id)}
                    >
                      {isActive
                        ? usesQuestBoard
                          ? "Continue Quest"
                          : "Continue"
                        : usesQuestBoard
                          ? "Open Quest"
                          : "Start"}
                    </Button>
                  )}
                </div>

                {/* Vibe Check Buttons - Only on active lesson */}
                {isActive && (
                  <motion.div
                    className="mt-3 pt-3 border-t border-slate-700/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">
                      Vibe Check
                    </p>
                    <div className="flex gap-2">
                      {VIBE_BUTTONS.map(({ reaction, label }) => (
                        <motion.button
                          key={reaction}
                          type="button"
                          onClick={(e) =>
                            onVibeReaction(lesson.id, reaction, e)
                          }
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-500 transition text-sm"
                          whileTap={{ scale: 1.4 }}
                          whileHover={{ scale: 1.05 }}
                          title={label}
                        >
                          <span>{VIBE_EMOJI[reaction]}</span>
                        </motion.button>
                      ))}
                    </div>
                    {usesQuestBoard && (
                      <p className="mt-3 text-[11px] text-cyan-300/80">
                        Finish this lesson inside the Pattern Quest Board.
                      </p>
                    )}
                    {/* Complete button */}
                    {studentAlias && !usesQuestBoard && (
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                        onClick={() => onComplete(lesson.id, studentAlias)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete Lesson
                      </Button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

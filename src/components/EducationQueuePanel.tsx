'use client';

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Lock,
  Zap,
} from 'lucide-react';
import { useEducationStore, VIBE_EMOJI } from '@/lib/education';
import type { QueuedLesson, VibeReaction } from '@/lib/education';
import { FOCUS_AREA_LABELS, DNA_MODE_LABELS } from '@/lib/education';
import { ProgressRing } from '@/components/ProgressRing';
import { useVisualEffects, VisualEffectsRenderer } from '@/components/VisualEffects';

interface EducationQueuePanelProps {
  mode: 'teacher' | 'student';
  onLessonActivate?: (lessonId: string) => void;
  onLessonComplete?: (lessonId: string) => void;
  studentAlias?: string;
}

const VIBE_BUTTONS: { reaction: VibeReaction; label: string }[] = [
  { reaction: 'fire', label: 'Fire' },
  { reaction: 'brain', label: 'Brain' },
  { reaction: 'sleeping', label: 'Sleepy' },
  { reaction: 'mind-blown', label: 'Mind Blown' },
];

export function EducationQueuePanel({ mode, onLessonActivate, onLessonComplete, studentAlias }: EducationQueuePanelProps) {
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
  const completeLessonWithFlair = useEducationStore((s) => s.completeLessonWithFlair);

  const { effects, triggerEffect } = useVisualEffects();

  const completedLessonIds = useMemo(() => {
    const completed = new Set<string>();
    for (const p of lessonProgress) {
      if (p.status === 'completed') {
        completed.add(p.lessonId);
      }
    }
    return completed;
  }, [lessonProgress]);

  const handleActivate = (lessonId: string) => {
    activateLesson(lessonId);
    onLessonActivate?.(lessonId);
  };

  const handleVibeReaction = useCallback((lessonId: string, reaction: VibeReaction, event: React.MouseEvent) => {
    sendVibeReaction(lessonId, reaction);
    // Trigger sparkle effect at click position
    triggerEffect('sparkle', event.clientX, event.clientY, 800);
  }, [sendVibeReaction, triggerEffect]);

  const handleComplete = useCallback((lessonId: string, alias: string) => {
    const result = completeLessonWithFlair(lessonId, alias);

    // Fire confetti + star effects
    triggerEffect('confetti', window.innerWidth / 2, window.innerHeight / 2, 1500);
    setTimeout(() => {
      triggerEffect('star', window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 1000);
      triggerEffect('star', window.innerWidth / 2 + 50, window.innerHeight / 2 - 50, 1000);
    }, 300);

    onLessonComplete?.(lessonId);

    // Trigger burst for new achievements
    if (result.newAchievements.length > 0) {
      setTimeout(() => {
        triggerEffect('burst', window.innerWidth / 2, window.innerHeight / 3, 1200);
      }, 800);
    }
  }, [completeLessonWithFlair, triggerEffect, onLessonComplete]);

  const currentEnergy = getClassEnergy();
  const xpProgress = eduXP.xp % 100;

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          {mode === 'teacher'
            ? 'No lessons in the queue yet. Create assignments and add them to the queue.'
            : 'No lessons are queued right now. Ask your teacher to set up a lesson path.'}
        </p>
        <VisualEffectsRenderer effects={effects} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* XP/Streak Bar */}
      <div className="flex items-center gap-4 rounded-xl border border-amber-400/30 bg-amber-500/5 p-3">
        <ProgressRing progress={xpProgress} size={32} strokeWidth={3} color="amber" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-amber-200">Level {eduXP.level}</span>
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
        {eduXP.streak > 0 && (
          <motion.div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-400/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold text-orange-300">{eduXP.streak}</span>
          </motion.div>
        )}
      </div>

      {/* Class Energy Meter */}
      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-cyan-300 uppercase tracking-wide flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Class Energy
          </span>
          <span className="text-sm font-bold text-cyan-200">{currentEnergy}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all ${
              currentEnergy > 60
                ? 'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400'
                : 'bg-gradient-to-r from-cyan-500 to-cyan-400'
            }`}
            initial={{ width: 0 }}
            animate={{
              width: `${currentEnergy}%`,
              ...(currentEnergy > 60 ? { scale: [1, 1.02, 1] } : {})
            }}
            transition={{
              width: { duration: 0.5 },
              scale: { repeat: Infinity, duration: 1.5 }
            }}
          />
        </div>
      </div>

      {mode === 'teacher' ? (
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
          studentAlias={studentAlias ?? ''}
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
  lessonProgress: { lessonId: string; status: string }[];
  onRemove: (id: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onActivate: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-200">Lesson Queue</p>
        <p className="text-xs text-zinc-500">
          {completedLessonIds.size} of {queue.length} completed
        </p>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {queue.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson;
            const isCompleted = completedLessonIds.has(lesson.id);
            const progressCount = lessonProgress.filter(
              (p) => p.lessonId === lesson.id && p.status === 'completed'
            ).length;
            const totalCount = lessonProgress.filter(
              (p) => p.lessonId === lesson.id
            ).length;

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`rounded-lg border p-3 transition ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-500/10'
                    : isCompleted
                    ? 'border-emerald-400/40 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">{idx + 1}.</span>
                      <p className="text-sm font-semibold text-zinc-100 truncate">{lesson.title}</p>
                      {isActive && (
                        <motion.span
                          className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-200 font-semibold"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          ACTIVE
                        </motion.span>
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} · {lesson.targetMinutes} min
                      {lesson.dnaMode && ` · ${DNA_MODE_LABELS[lesson.dnaMode]}`}
                    </p>
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
                      onClick={() => onReorder(lesson.id, 'up')}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
                      onClick={() => onReorder(lesson.id, 'down')}
                      disabled={idx === queue.length - 1}
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
  onVibeReaction: (lessonId: string, reaction: VibeReaction, event: React.MouseEvent) => void;
  onComplete: (lessonId: string, alias: string) => void;
  studentAlias: string;
}) {
  // Find the first incomplete lesson
  const nextLessonIdx = queue.findIndex(
    (l) => !completedLessonIds.has(l.id) && l.id !== activeLesson
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

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`rounded-lg p-3 transition ${
                  isActive
                    ? 'border border-cyan-400/60 bg-cyan-500/10'
                    : isCompleted
                    ? 'bg-emerald-500/5'
                    : isNext
                    ? 'border border-slate-700 bg-slate-950/50'
                    : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
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
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-cyan-100' : isCompleted ? 'text-emerald-200' : 'text-zinc-300'
                    }`}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} · {lesson.targetMinutes} min
                    </p>
                  </div>
                  {(isActive || isNext) && (
                    <Button
                      type="button"
                      size="sm"
                      className={`h-8 px-3 text-xs ${
                        isActive
                          ? 'bg-cyan-500/90 hover:bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-zinc-200'
                      }`}
                      onClick={() => onActivate(lesson.id)}
                    >
                      {isActive ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>

                {/* Vibe Check Buttons - Only on active lesson */}
                {isActive && (
                  <motion.div
                    className="mt-3 pt-3 border-t border-slate-700/50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Vibe Check</p>
                    <div className="flex gap-2">
                      {VIBE_BUTTONS.map(({ reaction, label }) => (
                        <motion.button
                          key={reaction}
                          type="button"
                          onClick={(e) => onVibeReaction(lesson.id, reaction, e)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-500 transition text-sm"
                          whileTap={{ scale: 1.4 }}
                          whileHover={{ scale: 1.05 }}
                          title={label}
                        >
                          <span>{VIBE_EMOJI[reaction]}</span>
                        </motion.button>
                      ))}
                    </div>
                    {/* Complete button */}
                    {studentAlias && (
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

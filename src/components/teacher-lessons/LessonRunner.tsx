"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FastForward,
  Flag,
  Home,
  Pause,
  Play,
  RotateCcw,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_DEFINITIONS,
  TEACHER_HUB_PATH,
  getLessonBySlug,
  resolveStepIndex,
  selectRecord,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type LessonViewMode,
} from "@/lib/teacher-lessons";
import { ClassroomFocusMode } from "./ClassroomFocusMode";
import { LessonCompletion } from "./LessonCompletion";
import { LessonGuideBar } from "./LessonGuideBar";
import { LessonModal } from "./LessonModal";
import { StudentPanel } from "./StudentPanel";
import { TeacherPanel } from "./TeacherPanel";

interface LessonRunnerProps {
  slug: string;
  initialStep?: number;
  preview?: boolean;
  initialMode?: LessonViewMode | null;
}

type GuideModalKind = "teacher" | "student" | "help" | null;

/** Safe fallback shown when a lesson slug is unknown or data is missing. */
function LessonNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md space-y-4 rounded-3xl border border-amber-300/20 bg-slate-900 p-8 text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
          aria-hidden="true"
        >
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold text-white">Lesson not found</h1>
        <p className="text-sm leading-6 text-slate-300">
          We couldn&apos;t find that lesson. It may have moved or the link may be
          incomplete. No progress has been lost.
        </p>
        <Button
          asChild
          className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200"
        >
          <Link href={TEACHER_HUB_PATH}>
            <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Back to Teacher Hub
          </Link>
        </Button>
      </div>
    </main>
  );
}

export function LessonRunner({
  slug,
  initialStep,
  preview = false,
  initialMode,
}: LessonRunnerProps) {
  const lesson = getLessonBySlug(slug);
  const hydrated = useLessonProgressHydrated();

  // Store bindings (hooks must run unconditionally, before any early return).
  const state = useLessonProgressStore();
  const startLesson = useLessonProgressStore((s) => s.startLesson);
  const nextStep = useLessonProgressStore((s) => s.nextStep);
  const previousStep = useLessonProgressStore((s) => s.previousStep);
  const completeStep = useLessonProgressStore((s) => s.completeStep);
  const resetStep = useLessonProgressStore((s) => s.resetStep);
  const resetLesson = useLessonProgressStore((s) => s.resetLesson);
  const pauseLesson = useLessonProgressStore((s) => s.pauseLesson);
  const resumeLesson = useLessonProgressStore((s) => s.resumeLesson);
  const completeLesson = useLessonProgressStore((s) => s.completeLesson);
  const exitLesson = useLessonProgressStore((s) => s.exitLesson);
  const setViewMode = useLessonProgressStore((s) => s.setViewMode);
  const setFocusMode = useLessonProgressStore((s) => s.setFocusMode);
  const saveEvidence = useLessonProgressStore((s) => s.saveEvidence);

  // Preview mode keeps its own ephemeral step so it never touches real
  // progress. Seeded lazily from the deep link; the route remounts on change.
  const [previewStep, setPreviewStep] = useState(() =>
    lesson && preview ? resolveStepIndex(lesson, initialStep ?? 1) : 0,
  );
  const [guideModal, setGuideModal] = useState<GuideModalKind>(null);
  const [confirmResetLesson, setConfirmResetLesson] = useState(false);
  const startedRef = useRef(false);

  // On first mount, start the lesson (unless previewing) at the requested step.
  useEffect(() => {
    if (!lesson || preview || !hydrated || startedRef.current) return;
    startedRef.current = true;
    startLesson(lesson.id, {
      fromStep:
        typeof initialStep === "number" ? initialStep : undefined,
    });
    if (initialMode) {
      setViewMode(initialMode);
    }
  }, [
    lesson,
    preview,
    hydrated,
    initialStep,
    initialMode,
    startLesson,
    setViewMode,
  ]);

  const record = useMemo(
    () => (lesson ? selectRecord(state, lesson.id) : null),
    [state, lesson],
  );

  if (!lesson) {
    return <LessonNotFound />;
  }

  const totalSteps = lesson.steps.length;
  const viewMode: LessonViewMode = state.viewMode;
  const focusMode = !preview && state.focusMode;

  const stepIndex = preview
    ? Math.min(previewStep, totalSteps - 1)
    : (record?.currentStep ?? 0);
  const step = lesson.steps[stepIndex] ?? lesson.steps[0];
  const completedSteps = preview ? [] : (record?.completedSteps ?? []);
  const isPaused = !preview && (record?.paused ?? false);
  const isCompleted = !preview && (record?.completed ?? false);

  const nextLesson =
    LESSON_DEFINITIONS.find((l) => l.number === lesson.number + 1) ?? null;

  // --- Navigation handlers (branch on preview vs real progress) ---
  const goPrevious = () => {
    if (preview) {
      setPreviewStep((s) => Math.max(0, s - 1));
    } else {
      previousStep();
    }
  };

  const goNext = () => {
    if (preview) {
      setPreviewStep((s) => Math.min(totalSteps - 1, s + 1));
    } else {
      completeStep(stepIndex);
      nextStep();
    }
  };

  const handleComplete = () => {
    if (preview) return;
    completeLesson(lesson.id);
  };

  const handleReplay = () => {
    resetLesson(lesson.id);
    startLesson(lesson.id, { fromStep: 0 });
  };

  const isLastStep = stepIndex >= totalSteps - 1;

  // --- Completion screen ---
  if (isCompleted) {
    return (
      <ClassroomFocusMode
        active={focusMode}
        lessonTitle={lesson.title}
        onEnter={() => setFocusMode(true)}
        onExit={() => setFocusMode(false)}
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <LessonCompletion
            lesson={lesson}
            nextLesson={nextLesson}
            onReplay={handleReplay}
            onReturnToHub={() => exitLesson()}
          />
        </div>
      </ClassroomFocusMode>
    );
  }

  const guideModalContent: Record<
    Exclude<GuideModalKind, null>,
    { title: string; body: string }
  > = {
    teacher: { title: "Teacher Prompt", body: step.teacherPrompt },
    student: { title: "Student Task", body: step.studentTask },
    help: { title: "What do I do now?", body: step.whatDoINow },
  };

  return (
    <ClassroomFocusMode
      active={focusMode}
      lessonTitle={lesson.title}
      onEnter={() => setFocusMode(true)}
      onExit={() => setFocusMode(false)}
    >
      {/* pb-28 keeps content clear of the fixed guide bar on all screens. */}
      <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 sm:px-6">
        {/* Header / control strip */}
        <header className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
                Lesson {lesson.number}
                {preview ? " · Preview" : null}
              </p>
              <h1 className="text-2xl font-semibold text-white md:text-3xl">
                {lesson.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!preview ? (
                <div
                  className="inline-flex overflow-hidden rounded-xl border border-slate-700"
                  role="group"
                  aria-label="View mode"
                >
                  {(["teacher", "student"] as LessonViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      aria-pressed={viewMode === mode}
                      className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                        viewMode === mode
                          ? "bg-amber-300 text-slate-950"
                          : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              ) : null}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              >
                <Link href={TEACHER_HUB_PATH} onClick={() => exitLesson()}>
                  <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Exit to Hub
                </Link>
              </Button>
            </div>
          </div>

          {preview ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-xs text-amber-100">
              Preview mode — navigate freely. Nothing here changes student or pet
              progress.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {isPaused ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  onClick={() => resumeLesson()}
                >
                  <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Resume Lesson
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => pauseLesson()}
                >
                  <Pause className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Pause Lesson
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                onClick={() => resetStep(stepIndex)}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reset Step
              </Button>
              {confirmResetLesson ? (
                <span className="inline-flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      resetLesson(lesson.id);
                      startLesson(lesson.id, { fromStep: 0 });
                      setConfirmResetLesson(false);
                    }}
                  >
                    Confirm reset lesson
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                    onClick={() => setConfirmResetLesson(false)}
                  >
                    Cancel
                  </Button>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => setConfirmResetLesson(true)}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Reset Lesson
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
                onClick={handleComplete}
              >
                <FastForward className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Finish Early
              </Button>
            </div>
          )}
        </header>

        {/* Paused overlay message */}
        {isPaused ? (
          <div
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            Lesson paused. Press <strong>Resume Lesson</strong> when you&apos;re
            ready to continue.
          </div>
        ) : null}

        {/* Activity body */}
        {viewMode === "student" && !preview ? (
          <StudentPanel
            key={step.id}
            lesson={lesson}
            step={step}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            savedEvidence={record?.evidence[step.id]}
            onSaveResponse={(value) => saveEvidence(step.id, value)}
            onAskForHelp={() => setGuideModal("help")}
          />
        ) : (
          <TeacherPanel
            lesson={lesson}
            step={step}
            stepIndex={stepIndex}
            completedSteps={completedSteps}
          />
        )}

        {/* Last-step complete action (guide bar Next is disabled at the end) */}
        {isLastStep && !preview ? (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              size="lg"
              className="min-h-12 bg-emerald-400 px-8 text-slate-950 hover:bg-emerald-300"
              onClick={handleComplete}
            >
              <Flag className="mr-1.5 h-5 w-5" aria-hidden="true" />
              Complete Lesson
            </Button>
          </div>
        ) : null}
      </div>

      <LessonGuideBar
        stepNumber={stepIndex + 1}
        totalSteps={totalSteps}
        canGoPrevious={stepIndex > 0}
        canGoNext={stepIndex < totalSteps - 1}
        onPrevious={goPrevious}
        onNext={goNext}
        onTeacherPrompt={() => setGuideModal("teacher")}
        onStudentTask={() => setGuideModal("student")}
        onWhatDoINow={() => setGuideModal("help")}
      />

      <LessonModal
        open={guideModal !== null}
        title={guideModal ? guideModalContent[guideModal].title : ""}
        onClose={() => setGuideModal(null)}
      >
        <p className="text-base leading-7 text-slate-200">
          {guideModal ? guideModalContent[guideModal].body : ""}
        </p>
        {guideModal === "student" ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Users className="h-4 w-4" aria-hidden="true" />
            Read this out or show it to students.
          </p>
        ) : null}
      </LessonModal>
    </ClassroomFocusMode>
  );
}

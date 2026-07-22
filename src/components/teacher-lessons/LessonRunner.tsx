"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FastForward,
  Flag,
  Home,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipForward,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldSessionStatus } from "@/components/field-mode/FieldSessionStatus";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useFieldConnectivity } from "@/lib/fieldMode/connectivity";
import {
  buildFieldLessonPath,
  fieldPresentationMode,
  fieldTimingMode,
  type FieldSessionConfig,
} from "@/lib/fieldMode/session";
import { touchSchoolsLocalState } from "@/lib/schools/storage";
import {
  LESSON_DEFINITIONS,
  LESSON_TIMING_MODES,
  TEACHER_HUB_PATH,
  getLessonBySlug,
  getTimingModeMeta,
  resolveStepIndex,
  selectRecord,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type LessonEvidence,
  type LessonPresentationMode,
  type LessonViewMode,
} from "@/lib/teacher-lessons";
import { ClassroomFocusMode } from "./ClassroomFocusMode";
import { LessonCompletion } from "./LessonCompletion";
import { LessonGuideBar } from "./LessonGuideBar";
import { LessonModal } from "./LessonModal";
import { TeacherPanel } from "./TeacherPanel";
import { ActivityHost, useLessonPet } from "./activities";
import type { LessonActivityProps } from "./activities";

interface LessonRunnerProps {
  slug: string;
  initialStep?: number;
  preview?: boolean;
  initialMode?: LessonViewMode | null;
  fieldMode?: boolean;
  fieldSession?: FieldSessionConfig;
  hubPath?: string;
}

type GuideModalKind = "teacher" | "student" | "help" | null;

const PRESENTATION_MODES: { id: LessonPresentationMode; label: string }[] = [
  { id: "support", label: "Support" },
  { id: "standard", label: "Standard" },
  { id: "extension", label: "Extension" },
];

/** Safe fallback shown when a lesson slug is unknown or data is missing. */
function LessonNotFound({ hubPath }: { hubPath: string }) {
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
          {hubPath === TEACHER_HUB_PATH ? (
            <Link href={hubPath}>
              <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back to Teacher Hub
            </Link>
          ) : (
            <a href={hubPath}>
              <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back to Field Lessons
            </a>
          )}
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
  fieldMode = false,
  fieldSession,
  hubPath = TEACHER_HUB_PATH,
}: LessonRunnerProps) {
  const lesson = getLessonBySlug(slug);
  const hydrated = useLessonProgressHydrated();
  const reducedMotion = useReducedMotion();
  const online = useFieldConnectivity();
  const router = useRouter();

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
  const saveEvidenceEntry = useLessonProgressStore((s) => s.saveEvidenceEntry);
  const setPresentationMode = useLessonProgressStore(
    (s) => s.setPresentationMode,
  );
  const setTimingMode = useLessonProgressStore((s) => s.setTimingMode);
  const setLowPerformance = useLessonProgressStore((s) => s.setLowPerformance);

  // Lesson pet context (safe demo/real resolution). Called unconditionally with
  // a fallback so the hook order is stable even on an unknown slug.
  const pet = useLessonPet(
    lesson ?? {
      usesStudentRealPet: false,
      usesDemonstrationPet: true,
      persistChanges: false,
    },
    { forceDemonstration: fieldMode },
  );

  // Preview mode keeps its own ephemeral step so it never touches real
  // progress. Seeded lazily from the deep link; the route remounts on change.
  const [previewStep, setPreviewStep] = useState(() =>
    lesson && preview ? resolveStepIndex(lesson, initialStep ?? 1) : 0,
  );
  const [guideModal, setGuideModal] = useState<GuideModalKind>(null);
  const [confirmResetLesson, setConfirmResetLesson] = useState(false);
  const [showExpected, setShowExpected] = useState(false);
  const [activityNonce, setActivityNonce] = useState(0);
  const startedRef = useRef(false);

  // On first mount, start the lesson (unless previewing) at the requested step.
  useEffect(() => {
    if (!lesson || preview || !hydrated || startedRef.current) return;
    startedRef.current = true;
    startLesson(lesson.id, {
      fromStep: typeof initialStep === "number" ? initialStep : undefined,
    });
    if (initialMode) {
      setViewMode(initialMode);
    }
    if (fieldMode && fieldSession) {
      setTimingMode(fieldTimingMode(fieldSession));
      setPresentationMode(fieldPresentationMode(fieldSession));
      setLowPerformance(fieldSession.supportMode === "low-sensory");
    }
  }, [
    lesson,
    preview,
    hydrated,
    initialStep,
    initialMode,
    startLesson,
    setViewMode,
    fieldMode,
    fieldSession,
    setTimingMode,
    setPresentationMode,
    setLowPerformance,
  ]);

  const record = useMemo(
    () => (lesson ? selectRecord(state, lesson.id) : null),
    [state, lesson],
  );

  useEffect(() => {
    if (!fieldMode || !hydrated || !record?.lastActiveAt) return;
    try {
      touchSchoolsLocalState(window.localStorage, record.lastActiveAt);
    } catch {
      // Local storage is optional; the active lesson still runs in memory.
    }
  }, [fieldMode, hydrated, record?.lastActiveAt]);

  if (!lesson) {
    return <LessonNotFound hubPath={hubPath} />;
  }

  const totalSteps = lesson.steps.length;
  const viewMode: LessonViewMode = state.viewMode;
  const focusMode = !preview && state.focusMode;
  const lowPerformance = state.lowPerformance;
  // Low Performance Mode implies static visuals everywhere reduced-motion does.
  const effectiveReducedMotion =
    reducedMotion || lowPerformance || (fieldMode && !online);
  const timing = getTimingModeMeta(
    LESSON_TIMING_MODES.find((m) => m.id === state.timingMode)?.id ??
      "standard",
  );

  const stepIndex = preview
    ? Math.min(previewStep, totalSteps - 1)
    : (record?.currentStep ?? 0);
  const step = lesson.steps[stepIndex] ?? lesson.steps[0];
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

  const skipStep = () => {
    if (preview) {
      setPreviewStep((s) => Math.min(totalSteps - 1, s + 1));
    } else {
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
    setActivityNonce((n) => n + 1);
  };

  const isLastStep = stepIndex >= totalSteps - 1;

  // --- Completion screen ---
  // Render with focus mode inactive so the global bottom navigation is
  // restored the moment a lesson completes (there is no guide bar here).
  if (isCompleted) {
    return (
      <ClassroomFocusMode
        active={false}
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
            hubPath={hubPath}
            hubLabel={fieldMode ? "Field Lessons" : "Teacher Hub"}
            nextLessonPath={
              fieldMode && fieldSession && nextLesson
                ? buildFieldLessonPath(nextLesson.slug, fieldSession)
                : undefined
            }
            documentNavigation={fieldMode}
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

  const activityProps: LessonActivityProps = {
    lesson,
    step,
    stepIndex,
    viewMode,
    isPreview: preview,
    presentationMode: state.presentationMode,
    timing,
    reducedMotion: effectiveReducedMotion,
    lowPerformance,
    pet,
    record: record ?? selectRecord(state, lesson.id),
    getEvidence: (stepId) =>
      (record ?? selectRecord(state, lesson.id)).evidenceEntries[stepId],
    saveEvidence: (evidence: LessonEvidence) => {
      if (preview) return;
      saveEvidenceEntry(evidence.stepId, evidence);
    },
    onAskForHelp: () => setGuideModal("help"),
    allowPetUpdates: !fieldMode,
    hubPath,
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
        {/* Header */}
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
                {fieldMode ? (
                  <a href={hubPath} onClick={() => exitLesson()}>
                    <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Exit to Hub
                  </a>
                ) : (
                  <Link href={hubPath} onClick={() => exitLesson()}>
                    <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Exit to Hub
                  </Link>
                )}
              </Button>
            </div>
          </div>

          {preview ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-xs text-amber-100">
              Preview mode — navigate freely. Nothing here changes student or pet
              progress.
            </p>
          ) : viewMode === "teacher" ? (
            <div className="space-y-2">
              {fieldMode && fieldSession ? (
                <FieldSessionStatus session={fieldSession} paused={isPaused} />
              ) : (
              /* Timing + presentation selectors */
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300">
                  <span className="font-medium">Timing</span>
                  <select
                    value={timing.id}
                    onChange={(e) => setTimingMode(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-slate-200"
                  >
                    {LESSON_TIMING_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  className="inline-flex overflow-hidden rounded-lg border border-slate-700"
                  role="group"
                  aria-label="Presentation mode"
                >
                  {PRESENTATION_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPresentationMode(m.id)}
                      aria-pressed={state.presentationMode === m.id}
                      className={`px-2.5 py-1 font-medium transition-colors ${
                        state.presentationMode === m.id
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLowPerformance(!lowPerformance)}
                  aria-pressed={lowPerformance}
                  className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${
                    lowPerformance
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                      : "border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                  }`}
                  title="Static, low-quality visuals for older devices. Lessons still work fully."
                >
                  Low Performance Mode: {lowPerformance ? "On" : "Off"}
                </button>
              </div>
              )}

              {/* Teacher control strip */}
              <div className="flex flex-wrap items-center gap-2">
                {isPaused ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                    onClick={() => resumeLesson()}
                  >
                    <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Resume
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
                    Pause
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowExpected((v) => !v)}
                  aria-pressed={showExpected}
                >
                  <Target className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Expected outcome
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={handleReplay}
                >
                  <Repeat className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Replay
                </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={skipStep}
                  disabled={isLastStep}
                >
                  <SkipForward className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Skip Step
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
                        setActivityNonce((n) => n + 1);
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
            </div>
          ) : null}
        </header>

        {/* Paused overlay message */}
        {isPaused ? (
          <div
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            Lesson paused. Press <strong>Resume</strong> when you&apos;re ready to
            continue.
          </div>
        ) : null}

        {/* Teacher guidance (teacher view only, not in preview) */}
        {viewMode === "teacher" && !preview ? (
          <TeacherPanel
            lesson={lesson}
            step={step}
            showExpectedOutcome={showExpected}
          />
        ) : null}

        {/* Activity — mounted once per lesson (keyed by lesson + replay nonce)
            so a student's in-progress work persists as steps change. */}
        <ActivityHost key={`${lesson.id}-${activityNonce}`} {...activityProps} />

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
        isPaused={isPaused}
        onPrevious={goPrevious}
        onNext={goNext}
        onTeacherPrompt={() => setGuideModal("teacher")}
        onStudentTask={() => setGuideModal("student")}
        onWhatDoINow={() => setGuideModal("help")}
        onPauseResume={() => (isPaused ? resumeLesson() : pauseLesson())}
        onExit={() => {
          exitLesson();
          router.push(hubPath);
        }}
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

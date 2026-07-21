"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  FileText,
  GraduationCap,
  PawPrint,
  Play,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  LESSON_DEFINITIONS,
  buildLessonPath,
  deriveLearningPassport,
  getLessonById,
  passportHasContent,
  selectLessonStatus,
  selectProgressSummary,
  selectRecord,
  usePetProfileStore,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type LessonDefinition,
} from "@/lib/teacher-lessons";
import { LessonCard } from "./LessonCard";
import { LessonPreview } from "./LessonPreview";
import { TeacherNotes } from "./TeacherNotes";

const PASSPORT_PATH = "/teachers/passport";
const REVIEW_PATH = "/teachers/review";

/** Route back to the main Meta-Pet area. */
const META_PET_HOME_PATH = "/pet";

export function TeacherHub() {
  const hydrated = useLessonProgressHydrated();
  const state = useLessonProgressStore();
  const resetAllProgress = useLessonProgressStore(
    (store) => store.resetAllProgress,
  );

  const [previewLesson, setPreviewLesson] = useState<LessonDefinition | null>(
    null,
  );
  const [notesLesson, setNotesLesson] = useState<LessonDefinition | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const alias = usePetProfileStore((store) => store.alias);
  const hasPet = useStore((store) => store.genome !== null);

  const summary = useMemo(
    () => selectProgressSummary(state),
    [state],
  );

  const passport = useMemo(
    () => deriveLearningPassport({ progress: state, alias, hasPet }),
    [state, alias, hasPet],
  );
  const hasEvidence = passportHasContent(passport);
  const appliedCount = passport.appliedChanges.length;

  const resumeLesson = summary.resumeLessonId
    ? getLessonById(summary.resumeLessonId)
    : undefined;

  const overallPercent = Math.round(summary.completionRatio * 100);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:gap-10 md:py-12">
        {/* Header */}
        <header className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.05)] md:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
                aria-hidden="true"
              >
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
                  Meta-Pet Teacher Hub
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Seven guided lessons
                </h1>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              A teacher-guided classroom layer over Meta-Pet. Pick a lesson and
              press Start — you never need to navigate DNA Lab, Body Forge,
              vitals or visualisations by hand. Everything is local-first with no
              student accounts.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                asChild
                variant="outline"
                className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              >
                <Link href={META_PET_HOME_PATH}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Return to Meta-Pet
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
              >
                <Link href={PASSPORT_PATH}>
                  <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  View Learning Passport
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              >
                <Link href={REVIEW_PATH}>
                  <BookOpenCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Review Evidence
                </Link>
              </Button>
            </div>
            {hasEvidence ? (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                <span>
                  {passport.completedLessons} of {passport.totalLessons} lessons
                  with saved evidence-ready progress
                </span>
                {appliedCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-200">
                    <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                    {appliedCount} change{appliedCount === 1 ? "" : "s"} applied
                    to pet
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        {/* Continue Teaching */}
        <section
          aria-labelledby="continue-teaching-heading"
          className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 md:p-8"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h2
                id="continue-teaching-heading"
                className="text-xl font-semibold text-white"
              >
                Continue Teaching
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-48 max-w-full overflow-hidden rounded-full bg-slate-700/60"
                    role="progressbar"
                    aria-valuenow={overallPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Overall seven-lesson progress"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {hydrated
                      ? `${summary.completedLessons} of ${summary.totalLessons} complete`
                      : "Loading progress…"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {resumeLesson
                    ? `Resume: Lesson ${resumeLesson.number} — ${resumeLesson.title}`
                    : "No lesson in progress yet. Start with Lesson 1."}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <Button
                asChild
                className="bg-amber-300 text-slate-950 hover:bg-amber-200"
              >
                <Link
                  href={buildLessonPath(
                    resumeLesson?.slug ?? LESSON_DEFINITIONS[0].slug,
                  )}
                >
                  <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {resumeLesson ? "Resume Lesson" : "Start Lesson 1"}
                </Link>
              </Button>
              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      resetAllProgress();
                      setConfirmReset(false);
                    }}
                  >
                    Confirm reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Reset all progress
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Lesson grid */}
        <section aria-labelledby="lessons-heading" className="space-y-4">
          <h2 id="lessons-heading" className="text-xl font-semibold text-white">
            Choose a lesson
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {LESSON_DEFINITIONS.map((lesson) => {
              const record = selectRecord(state, lesson.id);
              const status = hydrated
                ? selectLessonStatus(state, lesson.id)
                : "not-started";
              const stepProgress =
                lesson.steps.length > 0
                  ? record.completedSteps.length / lesson.steps.length
                  : 0;
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  status={status}
                  stepProgress={hydrated ? stepProgress : 0}
                  onPreview={setPreviewLesson}
                  onTeacherNotes={setNotesLesson}
                />
              );
            })}
          </div>
        </section>
      </div>

      <LessonPreview
        lesson={previewLesson}
        open={previewLesson !== null}
        onClose={() => setPreviewLesson(null)}
      />
      <TeacherNotes
        lesson={notesLesson}
        open={notesLesson !== null}
        onClose={() => setNotesLesson(null)}
      />
    </main>
  );
}

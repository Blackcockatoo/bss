"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  TEACHER_HUB_PATH,
  buildLessonPath,
  deriveLearningPassport,
  usePetProfileHydrated,
  usePetProfileStore,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type PassportLessonSection,
} from "@/lib/teacher-lessons";

const PASSPORT_PATH = "/teachers/passport";

function SectionRow({
  section,
  onReset,
}: {
  section: PassportLessonSection;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-sm font-semibold text-white">
            {section.number}. {section.title}
          </span>
        </button>
        <div className="flex items-center gap-2 text-xs">
          {section.hasEvidence ? (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Evidence
            </span>
          ) : section.missingEvidence ? (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Missing
            </span>
          ) : section.corrupted ? (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Unreadable
            </span>
          ) : (
            <span className="text-slate-500">No evidence yet</span>
          )}
          {section.evidence?.appliedChange?.appliedToPet ? (
            <span className="rounded-full border border-cyan-500/40 px-2 py-0.5 text-cyan-200">
              Applied to pet
            </span>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-slate-800 p-4 text-sm text-slate-300">
          {section.hasEvidence && section.evidence ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950/60 p-3 text-xs text-slate-300">
              {JSON.stringify(section.evidence, null, 2)}
            </pre>
          ) : (
            <p className="italic text-slate-500">
              No readable evidence for this lesson yet.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            >
              <Link href={buildLessonPath(section.lessonId)}>Open lesson</Link>
            </Button>
            {confirm ? (
              <span className="inline-flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onReset();
                    setConfirm(false);
                  }}
                >
                  Confirm reset evidence
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => setConfirm(false)}
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
                onClick={() => setConfirm(true)}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reset this lesson&apos;s evidence
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TeacherReview() {
  const progressHydrated = useLessonProgressHydrated();
  const profileHydrated = usePetProfileHydrated();
  const progress = useLessonProgressStore();
  const resetLesson = useLessonProgressStore((s) => s.resetLesson);
  const resetAllProgress = useLessonProgressStore((s) => s.resetAllProgress);
  const alias = usePetProfileStore((s) => s.alias);
  const hasPet = useStore((s) => s.genome !== null);

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const passport = useMemo(
    () => deriveLearningPassport({ progress, alias, hasPet }),
    [progress, alias, hasPet],
  );

  const hydrated = progressHydrated && profileHydrated;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-6 space-y-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href={TEACHER_HUB_PATH}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Teacher Hub
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
              aria-hidden="true"
            >
              <BookOpenCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Evidence Review
              </h1>
              <p className="text-sm text-slate-400">
                {hydrated
                  ? `${passport.completedLessons} of ${passport.totalLessons} lessons complete`
                  : "Loading…"}
              </p>
            </div>
          </div>
          <p className="rounded-2xl border border-slate-700/60 bg-slate-800/30 px-4 py-2 text-xs text-slate-400">
            Review data is stored locally on this device only, is not linked to
            any real student name, and can be removed at any time. It is
            classroom evidence, not a sensitive personal record.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-amber-300 text-slate-950 hover:bg-amber-200"
            >
              <Link href={PASSPORT_PATH}>
                <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Open Learning Passport
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            >
              <Link href={PASSPORT_PATH}>
                <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Print Passport
              </Link>
            </Button>
          </div>
        </header>

        {/* Responsible creator promise (quick access) */}
        {(() => {
          const l7 = passport.sections.find(
            (s) => s.lessonId === "responsible-creator",
          );
          const promise =
            l7?.evidence?.kind === "responsible-creator-promise"
              ? l7.evidence.promise
              : "";
          return promise.trim() ? (
            <section className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h2 className="text-sm font-semibold text-white">
                Responsible Creator promise
              </h2>
              <p className="mt-1 text-sm italic text-emerald-200">
                “{promise}”
              </p>
            </section>
          ) : null;
        })()}

        <div className="space-y-3">
          {passport.sections.map((section) => (
            <SectionRow
              key={section.lessonId}
              section={section}
              onReset={() => resetLesson(section.lessonId)}
            />
          ))}
        </div>

        {/* Danger zone: delete local lesson evidence (never the pet). */}
        <section className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete local lesson data
          </h2>
          <p className="mt-1 text-xs text-amber-100/80">
            This clears all saved lesson progress and evidence on this device.
            It does <strong>not</strong> delete the Meta-Pet, its DNA or its
            body.
          </p>
          <div className="mt-3">
            {confirmDeleteAll ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetAllProgress();
                    setConfirmDeleteAll(false);
                  }}
                >
                  Yes, delete all lesson evidence
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                  onClick={() => setConfirmDeleteAll(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="border-amber-400/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                onClick={() => setConfirmDeleteAll(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Delete Local Lesson Data
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

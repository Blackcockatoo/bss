"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Home, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  TEACHER_HUB_PATH,
  classFieldRecordHasContent,
  deriveClassFieldRecord,
  useLessonProgressHydrated,
  useLessonProgressStore,
  type ClassFieldRecord,
  type ClassFieldRecordEntry,
} from "@/lib/teacher-lessons";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-200">
      <span className="font-medium text-slate-100">{label}:</span> {value}
    </p>
  );
}

function EntryCard({ entry }: { entry: ClassFieldRecordEntry }) {
  return (
    <section className="passport-section space-y-2 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">
          {entry.lessonNumber}. {entry.lessonTitle}
        </h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            entry.completed
              ? "border-emerald-500/40 text-emerald-200"
              : "border-slate-600/50 text-slate-400"
          }`}
        >
          {entry.completed ? "Lesson completed" : "Not completed yet"}
        </span>
      </header>
      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
        Key concept
      </p>
      <p className="text-sm text-slate-300">{entry.keyConcept}</p>
      <div className="space-y-1 pt-1">
        <Field label="Class prediction" value={entry.classPrediction} />
        <Field label="Class observation" value={entry.classObservation} />
        <Field label="Class reflection" value={entry.classReflection} />
      </div>
    </section>
  );
}

/**
 * Class Field Record: a printable, no-grading classroom evidence summary
 * across all seven lessons — completion, class prediction, class
 * observation, key concept, class reflection, and an optional teacher note.
 * No student names by default; derived (never separately stored) from local
 * lesson evidence, mirroring the Learning Passport's derivation contract.
 */
export function ClassFieldRecordView({
  hubPath = TEACHER_HUB_PATH,
  hubLabel = "Teacher Hub",
}: {
  hubPath?: string;
  hubLabel?: string;
}) {
  const hydrated = useLessonProgressHydrated();
  const progress = useLessonProgressStore();
  const [teacherNote, setTeacherNote] = useState("");

  const record: ClassFieldRecord = useMemo(
    () => deriveClassFieldRecord(progress),
    [progress],
  );
  const hasContent = classFieldRecordHasContent(record);

  return (
    <main className="passport-root min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href={hubPath}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {hubLabel}
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={!hasContent}
            className="bg-amber-300 text-slate-950 hover:bg-amber-200 disabled:opacity-50"
          >
            <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Print Class Field Record
          </Button>
        </div>

        <header className="passport-section mb-6 space-y-2 rounded-3xl border border-amber-300/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            Class Field Record
          </p>
          <h1 className="text-2xl font-semibold text-white">
            {record.completedLessons} of {record.totalLessons} lessons
            complete
          </h1>
          <p className="text-xs text-slate-400">
            No student names are included. This is a record of class
            thinking, not a graded test.
          </p>
        </header>

        {!hydrated ? (
          <p className="text-center text-sm text-slate-400">
            Loading class record…
          </p>
        ) : !hasContent ? (
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-6 text-center">
            <p className="text-sm text-slate-300">
              No lessons completed yet. Start a lesson from {hubLabel} to
              begin building this record.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          {record.entries.map((entry) => (
            <EntryCard key={entry.lessonId} entry={entry} />
          ))}
        </div>

        <section className="passport-section mt-6 space-y-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
          <h2 className="text-base font-semibold text-white">
            Optional teacher note
          </h2>
          <p className="no-print text-xs text-slate-400">
            Add a short note before printing. It is not saved between visits
            and never includes student names.
          </p>
          <textarea
            value={teacherNote}
            onChange={(event) => setTeacherNote(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Strong discussion on feedback loops; revisit Lesson 6 patterns next week."
            aria-label="Optional teacher note"
            className="no-print w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
          />
          {teacherNote.trim() ? (
            <p className="hidden text-sm text-slate-200 print:block">
              {teacherNote}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            Generated {new Date(record.generatedAt).toLocaleString()}
          </p>
        </section>

        <footer className="no-print mt-8 flex justify-center">
          <Button
            asChild
            variant="outline"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href={hubPath}>
              <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Return to {hubLabel}
            </Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}

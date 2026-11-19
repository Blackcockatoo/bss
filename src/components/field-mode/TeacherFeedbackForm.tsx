"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import {
  TEACHER_FEEDBACK_CAVEAT,
  TEACHER_FEEDBACK_NOTE_MAX,
  TEACHER_FEEDBACK_RATINGS,
  TEACHER_FEEDBACK_RATING_LABELS,
  clearTeacherFeedback,
  formatTeacherFeedbackExport,
  parseTeacherFeedbackList,
  readTeacherFeedbackRaw,
  saveTeacherFeedbackList,
  subscribeTeacherFeedback,
  type TeacherFeedbackRating,
} from "@/lib/schools/teacherFeedback";
import type { CanonicalSessionId } from "@/lib/schools/canonicalSequence";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

function getSnapshot(): string {
  return readTeacherFeedbackRaw(window.localStorage);
}

export function TeacherFeedbackForm({
  initialLessonId = "",
}: {
  initialLessonId?: CanonicalSessionId | "";
}) {
  const raw = useSyncExternalStore(
    subscribeTeacherFeedback,
    getSnapshot,
    () => "",
  );
  const entries = useMemo(() => parseTeacherFeedbackList(raw || null), [raw]);
  const [lessonId, setLessonId] = useState<CanonicalSessionId | "">(initialLessonId);
  const [rating, setRating] = useState<TeacherFeedbackRating | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [copyError, setCopyError] = useState(false);

  const save = () => {
    if (!rating) {
      setStatus("Choose how the lesson went first.");
      return;
    }
    const entry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `feedback-${Date.now()}`,
      lessonId,
      rating,
      note: note.trim(),
      recordedAt: Date.now(),
    };
    saveTeacherFeedbackList([entry, ...entries], window.localStorage);
    setNote("");
    setRating(null);
    setStatus("Saved on this device only.");
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatTeacherFeedbackExport(entries));
      setCopyError(false);
      setStatus("Copied the notes stored on this device.");
    } catch {
      setCopyError(true);
      setStatus("Clipboard was not available. You can select the export text below.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Private teacher note
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            How did the lesson go?
          </h1>
          <p className="text-base leading-7 text-slate-700">{TEACHER_FEEDBACK_CAVEAT}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={FIELD_MODE_HOME_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
            <a
              href={FIELD_MODE_LESSONS_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Lessons
            </a>
          </div>
        </header>

        <form
          className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label className="block text-sm font-semibold text-slate-800">
            Which lesson?
            <select
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"
              value={lessonId}
              onChange={(event) =>
                setLessonId((event.target.value || "") as CanonicalSessionId | "")
              }
            >
              <option value="">Not specified</option>
              {LESSON_DEFINITIONS.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  Lesson {lesson.number}: {lesson.title}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-800">
              How did it go?
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {TEACHER_FEEDBACK_RATINGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={rating === value}
                  className={`min-h-14 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    rating === value
                      ? "border-emerald-800 bg-emerald-800 text-white"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                  onClick={() => setRating(value)}
                >
                  {TEACHER_FEEDBACK_RATING_LABELS[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-semibold text-slate-800">
            Optional short note (no student information)
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal"
              maxLength={TEACHER_FEEDBACK_NOTE_MAX}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Save on this device
            </button>
          </div>
          {status ? (
            <p className="text-sm text-emerald-900" aria-live="polite">
              {status}
            </p>
          ) : null}
        </form>

        <section aria-labelledby="saved-feedback-heading" className="space-y-4">
          <h2 id="saved-feedback-heading" className="text-2xl font-semibold">
            Notes on this device
          </h2>
          {entries.length === 0 ? (
            <p className="text-sm leading-6 text-slate-700">
              No private teacher feedback is stored on this device yet.
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {entries.map((entry) => {
                  const lesson = LESSON_DEFINITIONS.find((item) => item.id === entry.lessonId);
                  return (
                    <li
                      key={entry.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-sm font-semibold text-emerald-900">
                        {TEACHER_FEEDBACK_RATING_LABELS[entry.rating]}
                        {lesson ? ` · Lesson ${lesson.number}: ${lesson.title}` : ""}
                      </p>
                      {entry.note ? (
                        <p className="mt-2 text-sm leading-6 text-slate-800">{entry.note}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => void copyAll()}
                >
                  Copy or export these notes
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear the private teacher feedback stored in this browser?",
                      )
                    ) {
                      clearTeacherFeedback(window.localStorage);
                      setStatus("Feedback cleared from this device.");
                    }
                  }}
                >
                  Clear feedback from this device
                </button>
              </div>
              {copyError ? (
                <textarea
                  readOnly
                  className="min-h-40 w-full rounded-xl border border-slate-300 p-3 text-sm"
                  value={formatTeacherFeedbackExport(entries)}
                />
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

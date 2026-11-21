"use client";

import { useState } from "react";

import {
  FIELD_MODE_COMMENTS_PATH,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
} from "@/lib/childSafeBaseline";
import {
  REPORT_COMMENT_CAVEAT,
  REPORT_LEVEL_LABELS,
  REPORT_LEVELS,
  type ReportCommentBank,
  type ReportLevel,
} from "@/lib/schools/reportComments";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

function CommentEditor({ bank }: { bank: ReportCommentBank }) {
  const lesson = LESSON_DEFINITIONS.find((item) => item.id === bank.lessonId);
  const [drafts, setDrafts] = useState(bank.starters);
  const [copied, setCopied] = useState<ReportLevel | null>(null);
  const [copyError, setCopyError] = useState<ReportLevel | null>(null);

  const copy = async (level: ReportLevel) => {
    const text = drafts[level];
    try {
      await navigator.clipboard.writeText(text);
      setCopied(level);
      setCopyError(null);
    } catch {
      setCopied(null);
      setCopyError(level);
    }
  };

  return (
    <section
      aria-labelledby={`comments-${bank.lessonId}`}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
    >
      <h2 id={`comments-${bank.lessonId}`} className="text-2xl font-semibold">
        {lesson
          ? `Lesson ${lesson.number}: ${lesson.title}`
          : bank.lessonId}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-700">
        <strong>Learning intention:</strong> {bank.intention}
      </p>
      {bank.codes.length > 0 ? (
        <p className="mt-2 text-sm leading-6 text-slate-700">
          <strong>Australian Curriculum v9 codes already listed on this lesson:</strong>{" "}
          {bank.codes.join(", ")}
        </p>
      ) : null}
      <div className="mt-6 grid gap-5">
        {REPORT_LEVELS.map((level) => (
          <div key={level}>
            <label
              htmlFor={`${bank.lessonId}-${level}`}
              className="text-sm font-semibold text-slate-800"
            >
              {REPORT_LEVEL_LABELS[level]}
            </label>
            <textarea
              id={`${bank.lessonId}-${level}`}
              value={drafts[level]}
              onChange={(event) =>
                setDrafts((current) => ({
                  ...current,
                  [level]: event.target.value,
                }))
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-7 text-slate-900"
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => void copy(level)}
              >
                Copy {REPORT_LEVEL_LABELS[level].toLowerCase()} comment
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() =>
                  setDrafts((current) => ({
                    ...current,
                    [level]: bank.starters[level],
                  }))
                }
              >
                Reset wording
              </button>
              {copied === level ? (
                <p className="text-sm text-emerald-900" aria-live="polite">
                  Copied to this device’s clipboard.
                </p>
              ) : null}
              {copyError === level ? (
                <p className="text-sm text-amber-900" aria-live="polite">
                  Clipboard was not available. Select the text and copy it
                  yourself.
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReportCommentsPage({
  banks,
  lesson,
}: {
  banks: readonly ReportCommentBank[];
  lesson?: LessonDefinition;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Teacher report support
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            {lesson
              ? `Report comment starters — Lesson ${lesson.number}`
              : "Report comment starters"}
          </h1>
          <p className="text-base leading-7 text-slate-700">
            {REPORT_COMMENT_CAVEAT}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={FIELD_MODE_HOME_PATH}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
            {lesson ? (
              <a
                href={FIELD_MODE_COMMENTS_PATH}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                All lessons
              </a>
            ) : (
              <a
                href={FIELD_MODE_LESSONS_PATH}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Lessons
              </a>
            )}
          </div>
        </header>
        {banks.map((bank) => (
          <CommentEditor key={bank.lessonId} bank={bank} />
        ))}
      </div>
    </main>
  );
}

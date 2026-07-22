"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardList, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_DEFINITIONS,
  PILOT_CHECKLIST,
  PILOT_FEEDBACK_QUESTIONS,
  TEACHER_HUB_PATH,
  usePilotStore,
} from "@/lib/teacher-lessons";

export function PilotReadiness() {
  const checklist = usePilotStore((s) => s.checklist);
  const toggle = usePilotStore((s) => s.toggleChecklistItem);
  const feedbackCount = usePilotStore((s) => s.feedback.length);
  const addFeedback = usePilotStore((s) => s.addFeedback);

  const [lessonId, setLessonId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const readyCount = PILOT_CHECKLIST.filter((i) => checklist[i.id]).length;

  const submitFeedback = () => {
    addFeedback({ lessonId: lessonId || null, answers });
    setSubmitted(true);
    setAnswers({});
    setLessonId("");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mb-6 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
        >
          <Link href={TEACHER_HUB_PATH}>
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Teacher Hub
          </Link>
        </Button>

        <header className="mb-6 flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
            aria-hidden="true"
          >
            <ClipboardList className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-white">Pilot readiness</h1>
            <p className="text-sm text-slate-400">
              {readyCount} of {PILOT_CHECKLIST.length} ready
            </p>
          </div>
        </header>

        {/* Checklist */}
        <section
          aria-labelledby="checklist-heading"
          className="mb-8 space-y-2 rounded-3xl border border-slate-700/60 bg-slate-900/50 p-4"
        >
          <h2 id="checklist-heading" className="text-sm font-semibold text-white">
            Before you start
          </h2>
          <ul className="space-y-2">
            {PILOT_CHECKLIST.map((item) => {
              const checked = checklist[item.id] === true;
              return (
                <li key={item.id}>
                  <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.id)}
                      className="h-5 w-5 rounded border-slate-600"
                    />
                    <span className="flex items-center gap-2">
                      {checked ? (
                        <CheckCircle2
                          className="h-4 w-4 text-emerald-300"
                          aria-hidden="true"
                        />
                      ) : null}
                      {item.label}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Feedback form */}
        <section
          aria-labelledby="feedback-heading"
          className="space-y-3 rounded-3xl border border-slate-700/60 bg-slate-900/50 p-4"
        >
          <h2 id="feedback-heading" className="text-sm font-semibold text-white">
            Post-lesson feedback (optional)
          </h2>
          <p className="text-xs text-slate-400">
            Stored on this device only. No student names, no tracking. It helps
            improve the lessons.
          </p>

          <div className="space-y-1.5">
            <label
              htmlFor="feedback-lesson"
              className="block text-sm font-medium text-slate-200"
            >
              Which lesson? (optional)
            </label>
            <select
              id="feedback-lesson"
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Not specified</option>
              {LESSON_DEFINITIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.number}. {l.title}
                </option>
              ))}
            </select>
          </div>

          {PILOT_FEEDBACK_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <label
                htmlFor={`fb-${q.id}`}
                className="block text-sm font-medium text-slate-200"
              >
                {q.label}
              </label>
              {q.type === "yesno" ? (
                <div
                  className="inline-flex overflow-hidden rounded-xl border border-slate-700"
                  role="group"
                  aria-label={q.label}
                >
                  {["Yes", "Partly", "No"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: opt }))
                      }
                      aria-pressed={answers[q.id] === opt}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        answers[q.id] === opt
                          ? "bg-amber-300 text-slate-950"
                          : "bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  id={`fb-${q.id}`}
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                  rows={2}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={submitFeedback}
              className="bg-amber-300 text-slate-950 hover:bg-amber-200"
            >
              <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Save feedback
            </Button>
            {submitted ? (
              <span className="text-xs text-emerald-300" role="status">
                Saved locally. Thank you.
              </span>
            ) : null}
          </div>
          {feedbackCount > 0 ? (
            <p className="text-xs text-slate-500">
              {feedbackCount} feedback note{feedbackCount === 1 ? "" : "s"} saved
              on this device.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

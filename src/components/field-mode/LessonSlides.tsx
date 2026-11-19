"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_TOOLS_PATH,
} from "@/lib/childSafeBaseline";
import { twoMinuteExplainerFor } from "@/lib/schools/classroomPack";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

interface Slide {
  id: string;
  kicker: string;
  title: string;
  body: string;
  notes?: string;
}

function buildSlides(lesson: LessonDefinition): Slide[] {
  const explainer = twoMinuteExplainerFor(lesson);
  const slides: Slide[] = [
    {
      id: "title",
      kicker: `Years 3–6 · ${lesson.durationMinutes} minutes`,
      title: `Lesson ${lesson.number}: ${lesson.title}`,
      body: lesson.shortDescription,
      notes: "Open with the class looking at the shared screen. Hide these notes when you present.",
    },
    {
      id: "intention",
      kicker: "Learning intention",
      title: explainer.intention,
      body: "Listen first. Then we will try it together.",
      notes: lesson.teacherIntroduction,
    },
    {
      id: "script",
      kicker: "The teacher says",
      title: explainer.sayThis,
      body: explainer.studentsDoThis,
      notes: "Say the script as written, then move to the first step.",
    },
  ];

  for (const [index, step] of lesson.steps.entries()) {
    slides.push({
      id: step.id,
      kicker: `Step ${index + 1} of ${lesson.steps.length}`,
      title: step.studentTask,
      body: step.title,
      notes: step.teacherPrompt,
    });
  }

  slides.push({
    id: "discuss",
    kicker: "Talk together",
    title: lesson.discussionPrompts[0] ?? "What did you notice?",
    body: lesson.discussionPrompts.slice(1).join(" "),
    notes: lesson.discussionPrompts.join(" · "),
  });

  slides.push({
    id: "stop",
    kicker: "Stop here",
    title: explainer.stopHere,
    body: lesson.reflectionPrompt,
    notes: lesson.lightEvidence,
  });

  return slides;
}

export function LessonSlides({ lesson }: { lesson: LessonDefinition }) {
  const slides = useMemo(() => buildSlides(lesson), [lesson]);
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const current = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      const last = slides.length - 1;
      setIndex(Math.min(last, Math.max(0, next)));
    },
    [slides.length],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        go(index + 1);
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Backspace") {
        event.preventDefault();
        go(index - 1);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        go(0);
        return;
      }
      if (event.key === "End") {
        event.preventDefault();
        go(slides.length - 1);
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setShowNotes((value) => !value);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, index, slides.length]);

  if (!current) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 text-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">
          {current.kicker}
        </p>
        <p className="text-sm text-slate-600">
          Slide {index + 1} of {slides.length}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            onClick={() => setShowNotes((value) => !value)}
          >
            {showNotes ? "Hide teacher notes" : "Show teacher notes"}
          </button>
          <a
            href={`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Exit to lesson
          </a>
          <a
            href={`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Print planner
          </a>
          <a
            href={FIELD_MODE_TOOLS_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Timer and groups
          </a>
          <a
            href={FIELD_MODE_HOME_PATH}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          >
            Home
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 md:px-16">
        <h1 className="max-w-5xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          {current.title}
        </h1>
        {current.body ? (
          <p className="mt-8 max-w-4xl text-2xl leading-snug text-slate-700 md:text-4xl">
            {current.body}
          </p>
        ) : null}
        {showNotes && current.notes ? (
          <p className="mt-10 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-lg leading-7 text-amber-950">
            Teacher note: {current.notes}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-600">
          Arrow keys or space to move. N toggles notes. No student data is
          shown on these slides.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            onClick={() => go(index + 1)}
            disabled={index === slides.length - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

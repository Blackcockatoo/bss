"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export interface ProjectorSlide {
  id: string;
  kicker: string;
  title: string;
  body?: string;
  bullets?: readonly string[];
  notes?: string;
}

export function ProjectorSlides({
  slides,
  links,
  notesLabel = "Teacher note",
  footer = "Arrow keys or space to move. N toggles notes. No student data is shown on these slides.",
}: {
  slides: readonly ProjectorSlide[];
  links?: ReactNode;
  notesLabel?: string;
  footer?: string;
}) {
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const current = slides[index] ?? slides[0];

  const go = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex(Math.min(slides.length - 1, Math.max(0, next)));
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
            {showNotes ? `Hide ${notesLabel.toLowerCase()}s` : `Show ${notesLabel.toLowerCase()}s`}
          </button>
          {links}
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
        {current.bullets && current.bullets.length > 0 ? (
          <ul className="mt-8 max-w-4xl list-disc space-y-3 pl-8 text-2xl leading-snug text-slate-700 md:text-3xl">
            {current.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {showNotes && current.notes ? (
          <p className="mt-10 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-lg leading-7 text-amber-950">
            {notesLabel}: {current.notes}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-600">{footer}</p>
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

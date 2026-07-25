"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Home,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface LessonGuideBarProps {
  stepNumber: number;
  totalSteps: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isPaused: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTeacherPrompt: () => void;
  onStudentTask: () => void;
  onWhatDoINow: () => void;
  onPauseResume: () => void;
  onExit: () => void;
}

const SECONDARY_BUTTON =
  "min-h-11 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800";

/**
 * Persistent lesson guide bar — the ONLY persistent bottom control surface
 * while a lesson runs (the global app bar hides during Classroom Focus Mode).
 *
 *   Previous | Step 2 of 5 | Teacher Prompt · Student Task · Help · Pause · Exit | Next
 *
 * Previous, the step indicator and Next are always visible. On narrow screens
 * the secondary actions collapse into an accessible "More" menu so the Next
 * button is never crowded out or covered. Respects device safe-area insets.
 */
export function LessonGuideBar({
  stepNumber,
  totalSteps,
  canGoPrevious,
  canGoNext,
  isPaused,
  onPrevious,
  onNext,
  onTeacherPrompt,
  onStudentTask,
  onWhatDoINow,
  onPauseResume,
  onExit,
}: LessonGuideBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the "More" menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const runAndClose = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  const secondaryActions = (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="min-h-11 border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
        onClick={runAndClose(onTeacherPrompt)}
      >
        <UserCog className="mr-1 h-5 w-5" aria-hidden="true" />
        Teacher Prompt
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="min-h-11 border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
        onClick={runAndClose(onStudentTask)}
      >
        <MessageSquare className="mr-1 h-5 w-5" aria-hidden="true" />
        Student Task
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={SECONDARY_BUTTON}
        onClick={runAndClose(onWhatDoINow)}
      >
        <HelpCircle className="mr-1 h-5 w-5" aria-hidden="true" />
        What do I do now?
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={SECONDARY_BUTTON}
        onClick={runAndClose(onPauseResume)}
      >
        {isPaused ? (
          <Play className="mr-1 h-5 w-5" aria-hidden="true" />
        ) : (
          <Pause className="mr-1 h-5 w-5" aria-hidden="true" />
        )}
        {isPaused ? "Resume" : "Pause"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={SECONDARY_BUTTON}
        onClick={runAndClose(onExit)}
      >
        <Home className="mr-1 h-5 w-5" aria-hidden="true" />
        Exit Lesson
      </Button>
    </>
  );

  return (
    <nav
      aria-label="Lesson controls"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-slate-950/80"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-3 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 shrink-0 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-5 w-5 sm:mr-1" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous step</span>
        </Button>

        <div className="flex shrink-0 flex-col gap-1">
          <p className="text-sm font-semibold text-white" aria-live="polite">
            Step {stepNumber}
            <span className="text-slate-400"> / {totalSteps}</span>
          </p>
          <div
            className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800 sm:w-28"
            role="progressbar"
            aria-valuenow={stepNumber}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={`Lesson stage progress: step ${stepNumber} of ${totalSteps}`}
          >
            <div
              className="h-full rounded-full bg-amber-300"
              style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Inline secondary actions on wider screens. */}
        <div className="ml-auto hidden flex-wrap items-center justify-end gap-2 sm:flex">
          {secondaryActions}
        </div>

        {/* Collapsed "More" menu on narrow screens. */}
        <div className="relative ml-auto sm:hidden" ref={menuRef}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={`${SECONDARY_BUTTON} min-w-[2.75rem]`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="More lesson controls"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </Button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 flex w-56 flex-col gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-xl"
            >
              {secondaryActions}
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          size="lg"
          className="min-h-11 shrink-0 bg-amber-300 text-slate-950 hover:bg-amber-200 disabled:opacity-40"
          onClick={onNext}
          disabled={!canGoNext}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sr-only sm:hidden">Next step</span>
          <ChevronRight className="h-5 w-5 sm:ml-1" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

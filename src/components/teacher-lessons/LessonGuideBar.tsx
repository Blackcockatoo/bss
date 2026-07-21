"use client";

import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface LessonGuideBarProps {
  stepNumber: number;
  totalSteps: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTeacherPrompt: () => void;
  onStudentTask: () => void;
  onWhatDoINow: () => void;
}

/**
 * Persistent guide bar shown at the bottom of the Lesson Runner:
 *   Previous | Step 2 of 5 | Teacher Prompt | Student Task | Next
 * Plus a prominent "What do I do now?" recovery control. Stays fixed and
 * accessible on small screens without covering the activity (the Runner adds
 * bottom padding to compensate).
 */
export function LessonGuideBar({
  stepNumber,
  totalSteps,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onTeacherPrompt,
  onStudentTask,
  onWhatDoINow,
}: LessonGuideBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <nav
        aria-label="Lesson controls"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-6"
      >
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="min-h-11 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="mr-1 h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sr-only sm:hidden">Previous step</span>
        </Button>

        <div className="order-first w-full text-center sm:order-none sm:w-auto">
          <p
            className="text-sm font-semibold text-white"
            aria-live="polite"
          >
            Step {stepNumber} of {totalSteps}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
            onClick={onTeacherPrompt}
          >
            <UserCog className="mr-1 h-5 w-5" aria-hidden="true" />
            <span className="hidden md:inline">Teacher Prompt</span>
            <span className="md:hidden">Teacher</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 border-cyan-500/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
            onClick={onStudentTask}
          >
            <MessageSquare className="mr-1 h-5 w-5" aria-hidden="true" />
            <span className="hidden md:inline">Student Task</span>
            <span className="md:hidden">Student</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-11 border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={onWhatDoINow}
          >
            <HelpCircle className="mr-1 h-5 w-5" aria-hidden="true" />
            <span className="hidden lg:inline">What do I do now?</span>
            <span className="lg:hidden">Help</span>
          </Button>
        </div>

        <Button
          type="button"
          size="lg"
          className="min-h-11 bg-amber-300 text-slate-950 hover:bg-amber-200 disabled:opacity-40"
          onClick={onNext}
          disabled={!canGoNext}
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sr-only sm:hidden">Next step</span>
          <ChevronRight className="ml-1 h-5 w-5" aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

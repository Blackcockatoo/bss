"use client";

import { Focus, Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ClassroomFocusModeProps {
  active: boolean;
  lessonTitle: string;
  onEnter: () => void;
  onExit: () => void;
  children: React.ReactNode;
}

/**
 * An optional layer the Lesson Runner wraps its content in. When active it
 * frames the lesson with a slim focus banner and hides the "unrelated app
 * navigation" affordances, keeping the class inside the current lesson. It
 * never permanently changes the app's real navigation — exiting restores the
 * normal Runner chrome, and the active flag is persisted so a refresh keeps the
 * class in place.
 */
export function ClassroomFocusMode({
  active,
  lessonTitle,
  onEnter,
  onExit,
  children,
}: ClassroomFocusModeProps) {
  return (
    <div
      className={
        active
          ? "min-h-screen bg-slate-950 ring-4 ring-inset ring-amber-300/30"
          : "min-h-screen bg-slate-950"
      }
      data-focus-mode={active ? "on" : "off"}
    >
      {active ? (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-amber-300/30 bg-amber-300/10 px-4 py-2 text-amber-100 sm:px-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Focus className="h-4 w-4" aria-hidden="true" />
            <span>Classroom Focus Mode</span>
            <span className="hidden text-amber-200/70 sm:inline">
              · {lessonTitle}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-amber-300/40 bg-amber-300/10 text-amber-50 hover:bg-amber-300/20"
            onClick={onExit}
          >
            <Minimize2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Exit focus
          </Button>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end px-4 pt-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            onClick={onEnter}
          >
            <Focus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Classroom Focus Mode
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}

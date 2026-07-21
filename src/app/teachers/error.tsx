"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setClassroomFocusActive } from "@/lib/teacher-lessons/classroomFocusSignal";

/**
 * Route-level error boundary for the whole teacher lesson system. If any
 * teacher route throws during render, teachers and students see a calm,
 * plain-language recovery screen instead of a blank page or a raw stack
 * trace — with a safe retry and a route back to the Teacher Hub. It also
 * restores the global navigation bar (in case an error occurred mid-lesson).
 */
export default function TeachersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Make sure the global bottom bar is not left hidden after a crash.
    setClassroomFocusActive(false);
    // Technical detail stays in developer logs only.
    if (process.env.NODE_ENV !== "production") {
      console.error("[teachers] route error", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md space-y-4 rounded-3xl border border-amber-300/20 bg-slate-900 p-8 text-center">
        <span
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200"
          aria-hidden="true"
        >
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold text-white">
          Something went wrong
        </h1>
        <p className="text-sm leading-6 text-slate-300">
          The lesson ran into a problem, but nothing was lost. Your Meta-Pet is
          safe and your saved progress is untouched. You can try again or go
          back to the Teacher Hub.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={reset}
            className="bg-amber-300 text-slate-950 hover:bg-amber-200"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
          >
            <Link href="/teachers">
              <Home className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Back to Teacher Hub
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

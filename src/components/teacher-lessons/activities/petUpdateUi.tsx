"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, PawPrint, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type {
  LessonId,
  PetUpdateContext,
  PetUpdateResult,
} from "@/lib/teacher-lessons";

/** Reactive: does the student have a real Meta-Pet (a genome) yet? */
export function useHasRealPet(): boolean {
  return useStore((state) => state.genome !== null);
}

/**
 * Build the safe-update context for an approved action. `isDemo` here means
 * "no real pet exists to target" (so applies are blocked), which is distinct
 * from which pet the lesson renders. Preview always blocks.
 */
export function buildUpdateContext(
  isPreview: boolean,
  hasRealPet: boolean,
  lessonId: LessonId,
): PetUpdateContext {
  return { isPreview, isDemo: !hasRealPet, lessonId };
}

/** Success/error feedback for an approved update, with optional undo. */
export function ApplyResultBanner({
  result,
  onUndo,
  showViewPet = false,
}: {
  result: PetUpdateResult | null;
  onUndo?: () => void;
  showViewPet?: boolean;
}) {
  if (!result) return null;
  return (
    <div
      role="status"
      className={`space-y-2 rounded-2xl border px-4 py-3 text-sm ${
        result.ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-amber-400/40 bg-amber-400/10 text-amber-100"
      }`}
    >
      <p className="flex items-start gap-2">
        {result.ok ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{result.message}</span>
      </p>
      {result.summary && result.ok ? (
        <p className="pl-6 text-xs text-emerald-200/80">{result.summary}</p>
      ) : null}
      {result.ok && (onUndo || showViewPet) ? (
        <div className="flex flex-wrap gap-2 pl-6">
          {onUndo && result.undoAvailable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUndo}
              className="border-slate-600 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            >
              <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Undo
            </Button>
          ) : null}
          {showViewPet ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-cyan-500/40 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"
            >
              <Link href="/pet">
                <PawPrint className="mr-1.5 h-4 w-4" aria-hidden="true" />
                View My Updated Pet
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Explains that no real pet exists, with a route to create one. */
export function MissingPetNotice({
  message = "This activity is using a classroom example. Create a Meta-Pet before saving this to your own pet.",
}: {
  message?: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-sm text-slate-300">
      <p className="flex items-start gap-2">
        <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span>{message}</span>
      </p>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="border-slate-600 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
      >
        <Link href="/pet">Create a Meta-Pet</Link>
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Info, RotateCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CLASS_CONSEQUENCE_DIMENSIONS,
  useClassConsequencesHydrated,
  useClassConsequencesStore,
} from "@/lib/teacher-lessons";

/**
 * Class-level, locally stored Meta-Pet state indicator. Shows the seven
 * transparent dimensions as descriptive bars (never a competitive score or
 * leaderboard), the plain-language reason for the most recent change, a
 * trusted-system indicator, and a teacher-only reset control.
 *
 * This is intentionally class-level only: there is no per-student data here.
 */
export function ClassStateIndicator() {
  const hydrated = useClassConsequencesHydrated();
  const state = useClassConsequencesStore();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!hydrated) {
    return (
      <p className="text-sm text-slate-500" aria-live="polite">
        Loading class Meta-Pet state…
      </p>
    );
  }

  return (
    <section
      aria-labelledby="class-state-heading"
      className="space-y-4 rounded-3xl border border-emerald-950/15 bg-white p-5 shadow-sm md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="class-state-heading" className="text-xl font-semibold text-slate-950">
            Class Meta-Pet state
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            A shared, locally stored classroom indicator. It reflects the
            class as a whole — never an individual student.
          </p>
        </div>
        {state.trustedSystemUnlocked ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Trusted-system indicator unlocked
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CLASS_CONSEQUENCE_DIMENSIONS.map((dimension) => {
          const value = Math.round(state.values[dimension.id]);
          return (
            <div key={dimension.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>{dimension.label}</span>
                <span>{value}</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${dimension.label}: ${value} out of 100`}
              >
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {state.lastChange ? (
        <p
          className="flex items-start gap-2 rounded-2xl border border-emerald-900/10 bg-emerald-50/60 px-3 py-2 text-xs leading-5 text-emerald-950"
          role="status"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Last change — {state.lastChange.label}: {state.lastChange.explanation}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          No changes recorded yet. Careful, balanced and creative choices in
          lessons and Field Missions will nudge this state.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {confirmReset ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                state.resetAll();
                setConfirmReset(false);
              }}
            >
              Confirm reset class state
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmReset(true)}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Reset class state
          </Button>
        )}
      </div>
    </section>
  );
}

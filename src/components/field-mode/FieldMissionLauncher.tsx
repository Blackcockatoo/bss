"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Footprints,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClassStateIndicator } from "./ClassStateIndicator";
import {
  FIELD_MISSIONS,
  LESSON_DEFINITIONS,
  selectFieldMissionRecord,
  useClassConsequencesStore,
  useFieldMissionProgressHydrated,
  useFieldMissionProgressStore,
  type FieldMissionDefinition,
} from "@/lib/teacher-lessons";

function relatedLessonTitles(mission: FieldMissionDefinition): string {
  if (mission.relatedLessonIds.length === 0) return "Any lesson";
  return mission.relatedLessonIds
    .map((id) => LESSON_DEFINITIONS.find((lesson) => lesson.id === id)?.title)
    .filter((title): title is string => Boolean(title))
    .join(", ");
}

function MissionCard({ mission }: { mission: FieldMissionDefinition }) {
  const [expanded, setExpanded] = useState(false);
  const missionProgress = useFieldMissionProgressStore();
  const recordClassAction = useClassConsequencesStore((s) => s.recordAction);
  const record = selectFieldMissionRecord(missionProgress, mission.id);
  const panelId = `mission-panel-${mission.id}`;

  const complete = () => {
    if (!record.completed) {
      recordClassAction(mission.consequenceActionId);
    }
    missionProgress.completeMission(mission.id);
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <h3>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full min-h-16 items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-900/15 bg-emerald-50 text-emerald-900"
            >
              {record.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock3 className="h-5 w-5" />
              )}
            </span>
            <span>
              <span className="block text-base font-semibold text-slate-950">
                {mission.title}
              </span>
              <span className="block text-sm font-normal text-slate-600">
                {mission.summary}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-slate-500">
            {mission.minutes} min
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>
      </h3>

      {expanded ? (
        <div id={panelId} className="space-y-4 border-t border-slate-100 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-800">
            Connects to: {relatedLessonTitles(mission)}
          </p>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Teacher prompt
            </p>
            <p className="text-sm leading-6 text-slate-700">{mission.teacherPrompt}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Student task
            </p>
            <p className="text-sm leading-6 text-slate-700">{mission.studentTask}</p>
          </div>
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 px-3 py-2">
            <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
            <p className="text-sm leading-6 text-emerald-950">
              <span className="font-semibold">Off-screen action: </span>
              {mission.offScreenAction}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Reflection
            </p>
            <p className="text-sm leading-6 text-slate-700">{mission.reflectionPrompt}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              onClick={complete}
              disabled={record.completed}
              className="bg-emerald-800 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {record.completed ? "Marked complete" : "Mark mission complete"}
            </Button>
            {record.completed ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => missionProgress.resetMission(mission.id)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reset this mission
              </Button>
            ) : null}
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">
              Optional class note (no student names)
            </span>
            <textarea
              value={record.note}
              onChange={(event) =>
                missionProgress.setMissionNote(mission.id, event.target.value)
              }
              rows={2}
              maxLength={280}
              placeholder="e.g. Class noticed the loop broke when we chose Rest first."
              className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30"
            />
          </label>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Field Missions launcher: a reusable, teacher-optional set of short (5-10
 * minute) activities. Reuses the existing Field Mode visual language and the
 * class-level consequences engine rather than a separate game mode.
 */
export function FieldMissionLauncher() {
  const hydrated = useFieldMissionProgressHydrated();
  const missionProgress = useFieldMissionProgressStore();
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const completedCount = FIELD_MISSIONS.filter(
    (mission) => selectFieldMissionRecord(missionProgress, mission.id).completed,
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-10 md:px-8 md:py-14">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
            Field Missions · optional · 5-10 minutes
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Short investigations for any lesson
          </h1>
          <p className="text-base leading-7 text-slate-700 md:text-lg">
            Field Missions are short, teacher-optional activities you can run
            inside a lesson, between lessons, or as a stand-alone warm-up.
            They use the same guided lesson engine and never involve scores,
            rankings or competition.
          </p>
          <p className="text-sm font-medium text-emerald-900" aria-live="polite">
            {hydrated
              ? `${completedCount} of ${FIELD_MISSIONS.length} missions marked complete locally`
              : "Loading local mission records…"}
          </p>
        </header>

        <ClassStateIndicator />

        <section aria-labelledby="missions-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="missions-heading" className="text-2xl font-semibold">
              Choose a mission
            </h2>
            {confirmResetAll ? (
              <span className="inline-flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    missionProgress.resetAll();
                    setConfirmResetAll(false);
                  }}
                >
                  Confirm reset all missions
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmResetAll(false)}
                >
                  Cancel
                </Button>
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmResetAll(true)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Reset all missions
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {FIELD_MISSIONS.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

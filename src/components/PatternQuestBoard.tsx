"use client";

import type { QuestMode } from "@/lib/education";
import type { QuestPackProgress } from "@/lib/education/quests";

interface PatternQuestBoardProps {
  progress: QuestPackProgress;
  activeMode: QuestMode;
  isLessonMode: boolean;
  isCompleted: boolean;
  missingRequirements: string[];
  onJumpToMode: (mode: QuestMode) => void;
}

const MODE_LABELS: Record<QuestMode, string> = {
  spiral: "DNA Helix",
  mandala: "Symmetry Studio",
  triangle: "Triangle Instrument",
  pentagon: "Pentagon Instrument",
  hexagon: "Hexagon Instrument",
  decagon: "Decagon Instrument",
  circle: "Circle Instrument",
  sound: "Sound Lab",
  journey: "Guided Journey",
};

export function PatternQuestBoard({
  progress,
  activeMode,
  isLessonMode,
  isCompleted,
  missingRequirements,
  onJumpToMode,
}: PatternQuestBoardProps) {
  const coreQuests = progress.quests.filter((quest) => quest.kind === "core");
  const bonusQuests = progress.quests.filter((quest) => quest.kind === "bonus");
  const statusTitle = isLessonMode ? "Lesson status" : "Quest status";
  const readyTitle = isLessonMode ? "Ready to finish" : "Core quests complete";
  const readyCopy = isLessonMode
    ? "The required quest work is done. Submit any reflection prompt and finish the lesson."
    : "The core quest path is complete. Keep exploring or switch packs by moving to a different mode.";
  const progressCopy = isLessonMode
    ? `Complete ${progress.requiredCoreQuests} core quests to finish this lesson. Bonus quests are optional.`
    : `Complete ${progress.requiredCoreQuests} core quests to clear the guided path. Bonus quests are optional.`;

  return (
    <section className="mb-8 rounded-[2rem] border border-cyan-500/20 bg-slate-900/45 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/70">
            Pattern Quest Board
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {progress.pack.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {progress.pack.description}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {progressCopy}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/80">
              Core progress
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {progress.completedCoreQuests}/{coreQuests.length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200/80">
              Bonus progress
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {bonusQuests.filter((quest) => quest.complete).length}/
              {bonusQuests.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {progress.quests.map((quest) => {
            const needsJump = quest.mode && quest.mode !== activeMode;

            return (
              <div
                key={quest.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  quest.complete
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-slate-700/60 bg-slate-950/55"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                          quest.kind === "core"
                            ? "bg-cyan-500/15 text-cyan-100"
                            : "bg-amber-500/15 text-amber-100"
                        }`}
                      >
                        {quest.kind}
                      </span>
                      {quest.mode && (
                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                          {MODE_LABELS[quest.mode]}
                        </span>
                      )}
                      {quest.complete && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-100">
                          Complete
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {quest.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {quest.description}
                    </p>
                  </div>

                  <div className="sm:min-w-[132px]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-center">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                        Progress
                      </div>
                      <div className="mt-2 text-2xl font-bold text-white">
                        {quest.current}/{quest.target}
                      </div>
                    </div>
                    {needsJump && (
                      <button
                        type="button"
                        onClick={() => onJumpToMode(quest.mode!)}
                        className="mt-2 w-full rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
                      >
                        Go to {MODE_LABELS[quest.mode!]}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300/80">
              {statusTitle}
            </p>
            {isCompleted ? (
              <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">
                  Lesson complete
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your quest evidence has been saved. Return to the class quest
                  screen when you are ready for the next activity.
                </p>
              </div>
            ) : progress.readyToComplete &&
              (!isLessonMode || missingRequirements.length === 0) ? (
              <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">
                  {readyTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {readyCopy}
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold text-amber-100">
                  What is left
                </p>
                <div className="mt-2 space-y-2 text-sm text-slate-300">
                  {missingRequirements.length > 0 ? (
                    missingRequirements.map((requirement) => (
                      <p key={requirement}>{requirement}</p>
                    ))
                  ) : (
                    progress.remainingCoreQuestTitles.map((title) => (
                      <p key={title}>{title}</p>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/55 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              Active mode
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {MODE_LABELS[activeMode]}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Mode-specific quests only advance when you are inside the correct
              workspace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

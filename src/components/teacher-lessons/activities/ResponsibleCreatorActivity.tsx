"use client";

import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

import {
  LESSON_DEFINITIONS,
  selectLessonStatus,
  useLessonProgressStore,
  type ResponsibleCreatorPromiseEvidence,
  evidenceTimestamp,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import {
  EvidenceText,
  SaveButton,
  STEP_KIND_LABEL,
  StepShell,
} from "./shared";

interface Scenario {
  id: string;
  category: string;
  prompt: string;
  choices: {
    id: string;
    label: string;
    responsible: boolean;
    feedback: string;
  }[];
}

const SCENARIOS: Record<"setA" | "setB", Scenario[]> = {
  setA: [
    {
      id: "privacy",
      category: "Privacy",
      prompt: "Someone online asks for your full real name to 'save your pet'.",
      choices: [
        {
          id: "share-name",
          label: "Type my full name",
          responsible: false,
          feedback:
            "It is safer to use an alias. You never need your real name to enjoy a Meta-Pet.",
        },
        {
          id: "use-alias",
          label: "Use my pet alias instead",
          responsible: true,
          feedback: "Great choice — an alias keeps your personal details private.",
        },
      ],
    },
    {
      id: "care",
      category: "Care",
      prompt: "Your pet looks happy, but its energy and hunger are getting low.",
      choices: [
        {
          id: "one-signal",
          label: "It looks happy, so do nothing",
          responsible: false,
          feedback:
            "One signal is not the whole picture. Check more than one need before deciding.",
        },
        {
          id: "check-all",
          label: "Check all its needs and help",
          responsible: true,
          feedback: "Yes — caring means looking at several needs, not just one.",
        },
      ],
    },
    {
      id: "difference",
      category: "Difference",
      prompt: "Two pets look very different, but their DNA shares many traits.",
      choices: [
        {
          id: "judge-look",
          label: "They are completely different",
          responsible: false,
          feedback:
            "Looks can differ while structure stays shared. Look deeper than appearance.",
        },
        {
          id: "recognise-shared",
          label: "Different looks, shared structure",
          responsible: true,
          feedback: "Exactly — variation on the outside, shared information inside.",
        },
      ],
    },
  ],
  setB: [
    {
      id: "emotion",
      category: "Emotion",
      prompt: "The pet appears happy, but its stress signal is quietly rising.",
      choices: [
        {
          id: "assume",
          label: "Assume it is fine",
          responsible: false,
          feedback:
            "Appearance is not the whole story. Investigate more than one signal.",
        },
        {
          id: "investigate",
          label: "Look at more than one signal",
          responsible: true,
          feedback: "Well done — you looked beyond the obvious.",
        },
      ],
    },
    {
      id: "accessibility",
      category: "Accessible design",
      prompt:
        "A design looks exciting but makes the pet hard to read and understand.",
      choices: [
        {
          id: "keep-flashy",
          label: "Keep it — it looks cool",
          responsible: false,
          feedback:
            "Creativity matters, but so does clarity. Aim for both.",
        },
        {
          id: "improve-clarity",
          label: "Improve clarity, keep the creativity",
          responsible: true,
          feedback: "Great — accessible and creative can go together.",
        },
      ],
    },
    {
      id: "sharing",
      category: "Responsible sharing",
      prompt: "You want to share your pet with a friend.",
      choices: [
        {
          id: "share-all",
          label: "Share everything attached",
          responsible: false,
          feedback:
            "Check what information is attached first, so nothing personal is exposed.",
        },
        {
          id: "review-first",
          label: "Review what is attached, then share",
          responsible: true,
          feedback: "Perfect — share the pet without exposing personal details.",
        },
      ],
    },
  ],
};

function ScenarioCard({
  scenario,
  chosen,
  onChoose,
  disabled,
}: {
  scenario: Scenario;
  chosen: string | undefined;
  onChoose: (choiceId: string, responsible: boolean) => void;
  disabled: boolean;
}) {
  const chosenChoice = scenario.choices.find((c) => c.id === chosen);
  return (
    <article className="space-y-3 rounded-3xl border border-slate-700/60 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
        {scenario.category}
      </p>
      <p className="text-sm leading-6 text-slate-100">{scenario.prompt}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {scenario.choices.map((choice) => {
          const selected = chosen === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(choice.id, choice.responsible)}
              aria-pressed={selected}
              className={`min-h-14 rounded-2xl border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                selected
                  ? "border-amber-300 bg-amber-300/15 text-amber-100"
                  : "border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      {chosenChoice ? (
        <p
          className={`flex items-start gap-2 rounded-2xl px-3 py-2 text-xs ${
            chosenChoice.responsible
              ? "bg-emerald-500/10 text-emerald-200"
              : "bg-amber-400/10 text-amber-100"
          }`}
          role="status"
        >
          {chosenChoice.responsible ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {chosenChoice.feedback}
        </p>
      ) : null}
    </article>
  );
}

/**
 * Lesson 7 — The Responsible Creator Challenge. A guided, primarily emulated
 * scenario challenge covering privacy, care, emotion, accessibility, sharing
 * and difference. Produces the structured promise + choices data that Pass 4's
 * Learning Passport will export (the export itself is out of scope here).
 */
export function ResponsibleCreatorActivity({
  step,
  isPreview,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const progressState = useLessonProgressStore();
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | ResponsibleCreatorPromiseEvidence
    | undefined;

  const [choices, setChoices] = useState<
    Record<string, { choiceId: string; responsible: boolean }>
  >(() => {
    const seed: Record<string, { choiceId: string; responsible: boolean }> = {};
    for (const c of existing?.scenarioChoices ?? []) {
      seed[c.scenarioId] = { choiceId: c.choiceId, responsible: c.responsible };
    }
    return seed;
  });
  const [promise, setPromise] = useState(existing?.promise ?? "");
  const [saved, setSaved] = useState(false);

  const buildEvidence = (): ResponsibleCreatorPromiseEvidence => ({
    kind: "responsible-creator-promise",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    scenarioChoices: Object.entries(choices).map(([scenarioId, c]) => ({
      scenarioId,
      choiceId: c.choiceId,
      responsible: c.responsible,
    })),
    promise,
  });

  const choose = (scenarioId: string, choiceId: string, responsible: boolean) => {
    if (isPreview) return;
    setChoices((prev) => {
      const next = { ...prev, [scenarioId]: { choiceId, responsible } };
      // Persist as choices accumulate.
      saveEvidence({
        ...buildEvidence(),
        scenarioChoices: Object.entries(next).map(([sid, c]) => ({
          scenarioId: sid,
          choiceId: c.choiceId,
          responsible: c.responsible,
        })),
      });
      return next;
    });
  };

  const renderScenarioSet = (set: Scenario[]) => (
    <div className="space-y-4">
      {set.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          chosen={choices[scenario.id]?.choiceId}
          onChoose={(choiceId, responsible) =>
            choose(scenario.id, choiceId, responsible)
          }
          disabled={isPreview}
        />
      ))}
    </div>
  );

  if (step.kind === "introduce") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.introduce}
        instruction="Look back at your journey. These are the seven lessons and how far you have come."
      >
        <ul className="mx-auto max-w-md space-y-2">
          {LESSON_DEFINITIONS.map((l) => {
            const status = selectLessonStatus(progressState, l.id);
            return (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {l.number}. {l.title}
                </span>
                <span
                  className={
                    status === "completed"
                      ? "text-emerald-300"
                      : "text-slate-400"
                  }
                >
                  {status === "completed" ? "Completed" : "Not yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </StepShell>
    );
  }

  if (step.kind === "observe") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.observe}
        instruction="Work through the privacy, care and difference scenarios. Choose the responsible action."
      >
        {renderScenarioSet(SCENARIOS.setA)}
      </StepShell>
    );
  }

  if (step.kind === "interact") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.interact}
        instruction="Now the emotion, accessibility and sharing scenarios."
      >
        {renderScenarioSet(SCENARIOS.setB)}
      </StepShell>
    );
  }

  if (step.kind === "discuss") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.discuss}
        instruction="Write your responsible creator promise."
      >
        <div className="mx-auto max-w-md">
          <EvidenceText
            label="As a Meta-Pet creator, I will…"
            value={promise}
            onChange={setPromise}
            onBlur={() => !isPreview && saveEvidence(buildEvidence())}
            placeholder="…keep people's information private and care for my pet's needs."
            rows={3}
            disabled={isPreview}
          />
        </div>
      </StepShell>
    );
  }

  // complete — journey summary
  const responsibleCount = Object.values(choices).filter(
    (c) => c.responsible,
  ).length;
  const totalScenarios = SCENARIOS.setA.length + SCENARIOS.setB.length;
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL.complete}
      instruction="You have reached the end of the journey. Save your responsible creator promise."
    >
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Your journey</p>
          <p className="mt-1 text-slate-300">
            Responsible choices: {responsibleCount} of {totalScenarios}.
          </p>
          {promise ? (
            <p className="mt-2 italic text-emerald-200">“{promise}”</p>
          ) : (
            <p className="mt-2 text-slate-400">
              Add your promise on the previous step.
            </p>
          )}
        </div>
        <div className="flex justify-center">
          <SaveButton
            onClick={() => {
              if (!isPreview) saveEvidence(buildEvidence());
              setSaved(true);
            }}
            saved={saved}
            disabled={isPreview}
            label="Save my promise"
          />
        </div>
      </div>
    </StepShell>
  );
}

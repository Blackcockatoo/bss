"use client";

import { useState } from "react";
import { CheckCircle2, Info, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_DEFINITIONS,
  selectLessonStatus,
  useClassConsequencesStore,
  useLessonProgressStore,
  type ResponsibleCreatorPromiseEvidence,
  evidenceTimestamp,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import {
  ChoiceGrid,
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

const COMPETING_NEEDS = [
  { id: "health", label: "Health" },
  { id: "energy", label: "Energy" },
  { id: "curiosity", label: "Curiosity" },
  { id: "safety", label: "Safety" },
  { id: "trust", label: "Trust" },
  { id: "habitat", label: "Habitat" },
  { id: "resources", label: "Resources" },
  { id: "device-use", label: "Device use" },
];

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

const EMPTY_RULES: [string, string, string] = ["", "", ""];

/**
 * Lesson 7 — The Responsible Creator Challenge. The capstone: students
 * balance several competing needs, make responsible choices across privacy,
 * care, emotion, accessibility, sharing and difference scenarios, explain a
 * trade-off, and produce a small habitat plan (three system rules, one
 * cause-and-effect diagram, one promise) before a final reflection.
 */
export function ResponsibleCreatorActivity({
  step,
  isPreview,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const progressState = useLessonProgressStore();
  const recordClassAction = useClassConsequencesStore((s) => s.recordAction);
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | ResponsibleCreatorPromiseEvidence
    | undefined;

  const [predictedPriorityNeed, setPredictedPriorityNeed] = useState(
    existing?.predictedPriorityNeed ?? "",
  );
  const [choices, setChoices] = useState<
    Record<string, { choiceId: string; responsible: boolean }>
  >(() => {
    const seed: Record<string, { choiceId: string; responsible: boolean }> = {};
    for (const c of existing?.scenarioChoices ?? []) {
      seed[c.scenarioId] = { choiceId: c.choiceId, responsible: c.responsible };
    }
    return seed;
  });
  const [tradeOffExplanation, setTradeOffExplanation] = useState(
    existing?.tradeOffExplanation ?? "",
  );
  const [systemRules, setSystemRules] = useState<string[]>(
    existing?.systemRules && existing.systemRules.length > 0
      ? existing.systemRules
      : [...EMPTY_RULES],
  );
  const [diagramCause, setDiagramCause] = useState(
    existing?.causeEffectDiagram?.[0]?.cause ?? "",
  );
  const [diagramEffect, setDiagramEffect] = useState(
    existing?.causeEffectDiagram?.[0]?.effect ?? "",
  );
  const [promise, setPromise] = useState(existing?.promise ?? "");
  const [saved, setSaved] = useState(false);

  const buildEvidence = (): ResponsibleCreatorPromiseEvidence => ({
    kind: "responsible-creator-promise",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    predictedPriorityNeed,
    scenarioChoices: Object.entries(choices).map(([scenarioId, c]) => ({
      scenarioId,
      choiceId: c.choiceId,
      responsible: c.responsible,
    })),
    tradeOffExplanation,
    systemRules: systemRules.filter((r) => r.trim().length > 0),
    causeEffectDiagram:
      diagramCause || diagramEffect
        ? [{ cause: diagramCause, effect: diagramEffect }]
        : undefined,
    promise,
  });

  const choose = (scenarioId: string, choiceId: string, responsible: boolean) => {
    if (isPreview) return;
    if (scenarioId === "privacy" && responsible) {
      recordClassAction("responsible-privacy-choice");
    }
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

  switch (step.kind) {
    case "notice":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.notice}
          instruction="Look back at your journey, and notice the competing needs in your Meta-Pet's environment."
        >
          <div className="mx-auto max-w-md space-y-4">
            <ul className="space-y-2">
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
            <p className="rounded-2xl border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-xs text-slate-300">
              Your Meta-Pet&apos;s environment has several competing needs:
              health, energy, curiosity, safety, trust, habitat, resources and
              device use.
            </p>
          </div>
        </StepShell>
      );

    case "predict":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.predict}
          instruction="Predict which competing need would cause the biggest problem if it were ignored."
        >
          <div className="mx-auto max-w-lg">
            <ChoiceGrid
              legend="I predict this need matters most:"
              options={COMPETING_NEEDS}
              value={predictedPriorityNeed || null}
              onChange={(id) => {
                setPredictedPriorityNeed(id);
                if (!isPreview)
                  saveEvidence({ ...buildEvidence(), predictedPriorityNeed: id });
              }}
              columns={4}
              disabled={isPreview}
            />
          </div>
        </StepShell>
      );

    case "act":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.act}
          instruction="Work through the privacy, care and difference scenarios. Choose the responsible action."
        >
          {renderScenarioSet(SCENARIOS.setA)}
        </StepShell>
      );

    case "observe":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.observe}
          instruction="Now the emotion, accessibility and sharing scenarios. Observe the feedback for each choice."
        >
          {renderScenarioSet(SCENARIOS.setB)}
        </StepShell>
      );

    case "explain":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.explain}
          instruction="Explain one trade-off: a time you couldn't fully satisfy two needs at once, and what you decided."
        >
          <div className="mx-auto max-w-md">
            <EvidenceText
              label="One trade-off I made was…"
              value={tradeOffExplanation}
              onChange={setTradeOffExplanation}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. I chose safety over curiosity, so the pet stayed calm but explored less."
              rows={3}
              disabled={isPreview}
            />
          </div>
        </StepShell>
      );

    case "create":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.create}
          instruction="Create your habitat plan: three system rules, one cause-and-effect diagram, and your promise."
        >
          <div className="mx-auto max-w-md space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">
                Three system rules for a balanced habitat
              </p>
              {systemRules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={rule}
                    disabled={isPreview}
                    onChange={(e) => {
                      const next = [...systemRules];
                      next[index] = e.target.value;
                      setSystemRules(next);
                    }}
                    onBlur={() => !isPreview && saveEvidence(buildEvidence())}
                    placeholder={`Rule ${index + 1} e.g. Always check hunger before play.`}
                    aria-label={`System rule ${index + 1}`}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 disabled:opacity-60"
                  />
                  {systemRules.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPreview}
                      onClick={() => {
                        const next = systemRules.filter((_, i) => i !== index);
                        setSystemRules(next);
                        if (!isPreview) saveEvidence(buildEvidence());
                      }}
                      className="border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
                      aria-label={`Remove rule ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPreview}
                onClick={() => setSystemRules((r) => [...r, ""])}
                className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Add another rule
              </Button>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-700/60 bg-slate-800/30 p-3">
              <p className="text-sm font-medium text-slate-200">
                One cause-and-effect diagram
              </p>
              <EvidenceText
                label="Cause"
                value={diagramCause}
                onChange={setDiagramCause}
                onBlur={() => !isPreview && saveEvidence(buildEvidence())}
                placeholder="e.g. leaving the habitat cramped"
                rows={1}
                disabled={isPreview}
              />
              <EvidenceText
                label="Effect"
                value={diagramEffect}
                onChange={setDiagramEffect}
                onBlur={() => !isPreview && saveEvidence(buildEvidence())}
                placeholder="e.g. curiosity and trust both fall"
                rows={1}
                disabled={isPreview}
              />
            </div>

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

    case "reflect":
    default: {
      const responsibleCount = Object.values(choices).filter(
        (c) => c.responsible,
      ).length;
      const totalScenarios = SCENARIOS.setA.length + SCENARIOS.setB.length;
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.reflect}
          instruction="You have reached the end of the journey. What does it mean to be a responsible creator?"
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
            <EvidenceText
              label="In one sentence, a responsible creator…"
              value={promise}
              onChange={setPromise}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              rows={2}
              disabled={isPreview}
            />
            <div className="flex justify-center">
              <SaveButton
                onClick={() => {
                  if (!isPreview) {
                    saveEvidence(buildEvidence());
                    const hasHabitatPlan =
                      systemRules.filter((r) => r.trim().length > 0).length >= 2 &&
                      diagramCause.trim().length > 0 &&
                      diagramEffect.trim().length > 0;
                    if (hasHabitatPlan) {
                      recordClassAction("habitat-plan-created");
                    }
                  }
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
  }
}

"use client";

import { useState } from "react";
import { HelpCircle, RotateCcw, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CLASSROOM_VITAL_META,
  DEFAULT_CLASSROOM_VITALS,
  DEMO_PET_CONFIG,
  LESSON_ACTION_META,
  applyLessonAction,
  describeRealEffect,
  getActionMeta,
  type CauseEffectChainEvidence,
  type ClassroomVitals,
  type LessonAction,
  type LessonPetConfig,
  evidenceTimestamp,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import {
  ChoiceGrid,
  PetStage,
  SaveButton,
  STEP_KIND_LABEL,
  StepShell,
} from "./shared";

/** Derive a pet mood config from the current classroom vitals. */
function vitalsToConfig(vitals: ClassroomVitals): LessonPetConfig {
  let expression = "calm";
  if (vitals.stress > 65) expression = "focused";
  else if (vitals.energy < 30) expression = "sleepy";
  else if (vitals.mood > 65) expression = "smile";
  return {
    ...DEMO_PET_CONFIG,
    expression,
    brightness: Math.max(0.3, Math.min(1, vitals.mood / 100)),
    eyeOpenness: Math.max(0.2, Math.min(1, vitals.energy / 100)),
    movement: vitals.energy < 30 ? "still" : vitals.mood > 60 ? "bounce" : "float",
  };
}

function VitalBar({ id, value, delta }: { id: keyof ClassroomVitals; value: number; delta: number }) {
  const meta = CLASSROOM_VITAL_META.find((m) => m.id === id)!;
  const percent = Math.round(value);
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-200">{meta.label}</span>
        <span className="text-slate-300">
          {percent}
          {delta !== 0 ? (
            <span
              className={delta > 0 ? "ml-1 text-emerald-300" : "ml-1 text-amber-300"}
            >
              {arrow} {delta > 0 ? "+" : ""}
              {Math.round(delta)}
            </span>
          ) : null}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${meta.label}: ${percent} out of 100`}
      >
        <div
          className={`h-full rounded-full ${meta.higherIsBetter ? "bg-emerald-400" : "bg-amber-400"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Lesson 4 — Needs, Actions and Consequences. A temporary vitals sandbox with a
 * deterministic starting state. The four core vitals use the REAL Meta-Pet
 * interaction model; three classroom vitals are layered on. Nothing here
 * touches or harms the real pet.
 */
export function NeedsActivity({
  step,
  isPreview,
  reducedMotion,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | CauseEffectChainEvidence
    | undefined;

  const [vitals, setVitals] = useState<ClassroomVitals>({
    ...DEFAULT_CLASSROOM_VITALS,
  });
  const [deltas, setDeltas] = useState<Partial<Record<keyof ClassroomVitals, number>>>({});
  const [prediction, setPrediction] = useState<LessonAction | null>(null);
  const [lastAction, setLastAction] = useState<LessonAction | null>(
    (existing?.action as LessonAction) ?? null,
  );
  const [balancingActions, setBalancingActions] = useState<string[]>(
    existing?.balancingActions ?? [],
  );
  const [showWhy, setShowWhy] = useState(false);
  const [saved, setSaved] = useState(false);

  const perform = (action: LessonAction, isBalancing = false) => {
    if (isPreview) return;
    const next = applyLessonAction(vitals, action);
    const nextDeltas: Partial<Record<keyof ClassroomVitals, number>> = {};
    for (const meta of CLASSROOM_VITAL_META) {
      nextDeltas[meta.id] = next[meta.id] - vitals[meta.id];
    }
    setVitals(next);
    setDeltas(nextDeltas);
    setLastAction(action);
    if (isBalancing) {
      setBalancingActions((prev) =>
        prev.includes(action) ? prev : [...prev, action],
      );
    }
  };

  const resetSandbox = () => {
    setVitals({ ...DEFAULT_CLASSROOM_VITALS });
    setDeltas({});
    setLastAction(null);
    setBalancingActions([]);
  };

  const buildEvidence = (): CauseEffectChainEvidence => {
    const meta = lastAction ? getActionMeta(lastAction) : LESSON_ACTION_META[0];
    return {
      kind: "cause-effect-chain",
      version: 1,
      lessonId: lesson.id,
      stepId: evidenceStepId,
      createdAt: evidenceTimestamp(),
      action: meta.label,
      immediateEffect: meta.immediate,
      secondaryEffect: meta.secondary,
      petResponse: meta.petResponse,
      balancingActions: balancingActions.map((a) => getActionMeta(a as LessonAction).label),
    };
  };

  const actionOptions = LESSON_ACTION_META.map((a) => ({
    id: a.id,
    label: a.label,
    hint: a.immediate,
  }));

  const vitalsPanel = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CLASSROOM_VITAL_META.map((meta) => (
        <VitalBar
          key={meta.id}
          id={meta.id}
          value={vitals[meta.id]}
          delta={deltas[meta.id] ?? 0}
        />
      ))}
    </div>
  );

  const sandboxControls = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={resetSandbox}
        disabled={isPreview}
        className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Reset sandbox
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => lastAction && perform(lastAction)}
        disabled={isPreview || !lastAction}
        className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
      >
        <Repeat className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Replay last action
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowWhy((v) => !v)}
        className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
        aria-pressed={showWhy}
      >
        <HelpCircle className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Show why this changed
      </Button>
    </div>
  );

  const whyPanel =
    showWhy && lastAction ? (
      <p className="rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-xs text-slate-300">
        {describeRealEffect(lastAction)} {getActionMeta(lastAction).secondary}.
      </p>
    ) : null;

  if (step.kind === "introduce") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.introduce}
        instruction="Read the pet's needs. Which need looks like it needs the most attention?"
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex justify-center">
            <PetStage config={vitalsToConfig(vitals)} reducedMotion={reducedMotion} />
          </div>
          {vitalsPanel}
        </div>
      </StepShell>
    );
  }

  if (step.kind === "observe") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.observe}
        instruction="Choose an action and predict what it will do before you try it."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
          <ChoiceGrid
            legend="I predict this action will help most:"
            options={actionOptions}
            value={prediction}
            onChange={(id) => setPrediction(id as LessonAction)}
            disabled={isPreview}
          />
          <div className="flex justify-center">
            <PetStage config={vitalsToConfig(vitals)} reducedMotion={reducedMotion} size="sm" />
          </div>
        </div>
        {prediction ? (
          <p className="text-center text-sm text-slate-300">
            You predicted <strong>{getActionMeta(prediction).label}</strong>:{" "}
            {getActionMeta(prediction).immediate}.
          </p>
        ) : null}
      </StepShell>
    );
  }

  if (step.kind === "interact") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.interact}
        instruction="Perform an action and watch how several needs change at once."
        footer={sandboxControls}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex flex-col items-center gap-2">
            <PetStage config={vitalsToConfig(vitals)} reducedMotion={reducedMotion} />
            {lastAction ? (
              <p className="text-center text-xs text-slate-300" role="status">
                {getActionMeta(lastAction).petResponse}
              </p>
            ) : null}
          </div>
          <div className="space-y-4">
            <ChoiceGrid
              legend="Choose an action"
              options={actionOptions}
              value={null}
              onChange={(id) => perform(id as LessonAction)}
              disabled={isPreview}
            />
            {vitalsPanel}
            {whyPanel}
          </div>
        </div>
      </StepShell>
    );
  }

  if (step.kind === "discuss") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.discuss}
        instruction="Choose one or two more actions to bring the pet's needs into balance."
        footer={sandboxControls}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex justify-center">
            <PetStage config={vitalsToConfig(vitals)} reducedMotion={reducedMotion} />
          </div>
          <div className="space-y-4">
            <ChoiceGrid
              legend="Balancing action"
              options={actionOptions}
              value={null}
              onChange={(id) => perform(id as LessonAction, true)}
              disabled={isPreview}
            />
            {vitalsPanel}
            {whyPanel}
          </div>
        </div>
      </StepShell>
    );
  }

  // complete
  const meta = lastAction ? getActionMeta(lastAction) : null;
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL.complete}
      instruction="Record the chain: action → immediate effect → secondary effect → pet response."
    >
      <div className="mx-auto max-w-lg space-y-4">
        {meta ? (
          <ol className="space-y-2">
            {[
              { label: "Action", value: meta.label },
              { label: "Immediate effect", value: meta.immediate },
              { label: "Secondary effect", value: meta.secondary },
              { label: "Pet response", value: meta.petResponse },
            ].map((row, i) => (
              <li
                key={row.label}
                className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/40 px-4 py-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-300/20 text-sm font-semibold text-amber-200">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200">
                  <span className="font-medium">{row.label}:</span> {row.value}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-center text-sm text-slate-400">
            Go back and perform an action first, then return here to record the
            chain.
          </p>
        )}
        <div className="flex justify-center">
          <SaveButton
            onClick={() => {
              if (!isPreview && meta) saveEvidence(buildEvidence());
              setSaved(true);
            }}
            saved={saved}
            disabled={isPreview || !meta}
            label="Save cause-and-effect chain"
          />
        </div>
      </div>
    </StepShell>
  );
}

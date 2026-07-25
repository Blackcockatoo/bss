"use client";

import { useState } from "react";
import { Wind } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEMO_PET_CONFIG,
  LESSON_EMOTION_PRESETS,
  LESSON_MOVEMENT_OPTIONS,
  applyEmotionPreset,
  getEmotionPreset,
  nudgeTowardCalm,
  type EmotionReflectionEvidence,
  type LessonMovementStyle,
  type LessonPetConfig,
  evidenceTimestamp,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import {
  ChoiceGrid,
  EvidenceText,
  PetStage,
  SaveButton,
  STEP_KIND_LABEL,
  StepShell,
} from "./shared";

/** A controlled starting emotion keeps the classroom example predictable. */
const MYSTERY_EMOTION = "worried";

const ALL_CLUES = Array.from(
  new Set(LESSON_EMOTION_PRESETS.flatMap((p) => p.clues)),
);

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm text-slate-200">
      <span className="font-medium">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-cyan-400"
        aria-label={label}
      />
    </label>
  );
}

/**
 * Lesson 5 — Feelings Without Words. A simplified emotion mixer. Emotional
 * states are temporary and are never saved to the real pet. Language is
 * deliberately non-absolute ("the pet may be feeling…"). Students make a
 * quick first guess, then gather evidence before settling on a
 * best-supported (never certain) interpretation.
 */
export function FeelingsActivity({
  step,
  isPreview,
  reducedMotion,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | EmotionReflectionEvidence
    | undefined;

  const [config, setConfig] = useState<LessonPetConfig>(() =>
    applyEmotionPreset(DEMO_PET_CONFIG, MYSTERY_EMOTION),
  );
  const [firstGuess, setFirstGuess] = useState(existing?.firstGuess ?? "");
  const [clues, setClues] = useState<string[]>(existing?.clues ?? []);
  const [interpretation, setInterpretation] = useState(
    existing?.interpretation ?? "",
  );
  const [helpedBy, setHelpedBy] = useState(existing?.helpedBy ?? "");
  const [alternative, setAlternative] = useState(
    existing?.alternativeExplanation ?? "",
  );
  const [saved, setSaved] = useState(false);

  const patch = (p: Partial<LessonPetConfig>) => {
    if (isPreview) return;
    setConfig((c) => ({ ...c, ...p }));
  };

  const buildEvidence = (): EmotionReflectionEvidence => ({
    kind: "emotion-reflection",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    firstGuess,
    clues,
    interpretation,
    helpedBy,
    alternativeExplanation: alternative,
  });

  switch (step.kind) {
    case "notice":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.notice}
          instruction="Here is a pet showing a feeling. Watch carefully — what clues can you see?"
        >
          <div className="flex justify-center">
            <PetStage
              config={config}
              reducedMotion={reducedMotion}
              size="lg"
              caption="The pet is showing a feeling through its eyes, posture, colour and movement."
            />
          </div>
        </StepShell>
      );

    case "predict":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.predict}
          instruction="Before you look closely, make a first guess. This is just a starting point, not a final answer."
        >
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex justify-center">
              <PetStage config={config} reducedMotion={reducedMotion} />
            </div>
            <EvidenceText
              label="My first guess"
              value={firstGuess}
              onChange={setFirstGuess}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. maybe worried?"
              rows={2}
              disabled={isPreview}
            />
          </div>
        </StepShell>
      );

    case "act":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.act}
          instruction="Select every clue you can see, then choose the feeling you think is best supported by the evidence."
        >
          <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <div className="flex justify-center">
              <PetStage config={config} reducedMotion={reducedMotion} />
            </div>
            <div className="space-y-4">
              <fieldset disabled={isPreview} className="space-y-2">
                <legend className="text-sm font-medium text-slate-200">
                  Clues I can see
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ALL_CLUES.map((clue) => {
                    const checked = clues.includes(clue);
                    return (
                      <label
                        key={clue}
                        className={`flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
                          checked
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-100"
                            : "border-slate-700 bg-slate-800/40 text-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...clues, clue]
                              : clues.filter((c) => c !== clue);
                            setClues(next);
                            if (!isPreview)
                              saveEvidence({ ...buildEvidence(), clues: next });
                          }}
                          className="h-5 w-5 rounded border-slate-600"
                        />
                        {clue}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <ChoiceGrid
                legend="Based on the evidence, the pet may be feeling…"
                options={LESSON_EMOTION_PRESETS.map((p) => ({
                  id: p.id,
                  label: p.label,
                }))}
                value={
                  interpretation
                    ? LESSON_EMOTION_PRESETS.find(
                        (p) => p.label === interpretation,
                      )?.id ?? null
                    : null
                }
                onChange={(id) => {
                  const label = getEmotionPreset(id)?.label ?? "";
                  setInterpretation(label);
                  if (!isPreview)
                    saveEvidence({ ...buildEvidence(), interpretation: label });
                }}
                disabled={isPreview}
              />
            </div>
          </div>
        </StepShell>
      );

    case "observe":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.observe}
          instruction="Try guiding the pet toward calm and observe how its signals respond."
        >
          <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <div className="flex flex-col items-center gap-3">
              <PetStage config={config} reducedMotion={reducedMotion} />
              <Button
                type="button"
                onClick={() => patch(nudgeTowardCalm(config))}
                disabled={isPreview}
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              >
                <Wind className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Guide toward calm
              </Button>
            </div>
            <div className="space-y-3">
              <Slider
                label="Eyes (closed → wide)"
                value={config.eyeOpenness}
                onChange={(v) => patch({ eyeOpenness: v })}
                disabled={isPreview}
              />
              <Slider
                label="Posture (slumped → upright)"
                value={(config.posture + 1) / 2}
                onChange={(v) => patch({ posture: v * 2 - 1 })}
                disabled={isPreview}
              />
              <Slider
                label="Breathing (fast → slow)"
                value={config.breathing}
                onChange={(v) => patch({ breathing: v })}
                disabled={isPreview}
              />
              <Slider
                label="Brightness (dim → bright)"
                value={config.brightness}
                onChange={(v) => patch({ brightness: v })}
                disabled={isPreview}
              />
              <ChoiceGrid
                legend="Movement"
                options={LESSON_MOVEMENT_OPTIONS}
                value={config.movement}
                onChange={(id) => patch({ movement: id as LessonMovementStyle })}
                columns={4}
                disabled={isPreview}
              />
            </div>
          </div>
        </StepShell>
      );

    case "explain":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.explain}
          instruction="Explain how you helped, and offer another explanation for the same clues — remember, we cannot be certain."
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="I helped by…"
              value={helpedBy}
              onChange={setHelpedBy}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              disabled={isPreview}
            />
            <EvidenceText
              label="Another explanation could be…"
              value={alternative}
              onChange={setAlternative}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="Maybe the pet is just resting, not worried."
              disabled={isPreview}
            />
          </div>
        </StepShell>
      );

    case "create":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.create}
          instruction="Create your feelings card: the clues, your guess, how you helped, and your alternative explanation."
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="Clues I noticed"
              value={clues.join(", ")}
              onChange={() => undefined}
              disabled
            />
            <EvidenceText
              label="I thought the pet may be feeling…"
              value={interpretation}
              onChange={setInterpretation}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              disabled={isPreview}
            />
            <div className="flex justify-center">
              <SaveButton
                onClick={() => {
                  if (!isPreview) saveEvidence(buildEvidence());
                  setSaved(true);
                }}
                saved={saved}
                disabled={isPreview}
                label="Save feelings card"
              />
            </div>
          </div>
        </StepShell>
      );

    case "reflect":
    default:
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.reflect}
          instruction="Why is it kind to say 'the pet may be feeling…' instead of 'the pet is feeling…'?"
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="My reflection"
              value={alternative}
              onChange={setAlternative}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="It is kind because…"
              rows={3}
              disabled={isPreview}
            />
            <div className="flex justify-center">
              <SaveButton
                onClick={() => {
                  if (!isPreview) saveEvidence(buildEvidence());
                  setSaved(true);
                }}
                saved={saved}
                disabled={isPreview}
                label="Save reflection"
              />
            </div>
          </div>
        </StepShell>
      );
  }
}

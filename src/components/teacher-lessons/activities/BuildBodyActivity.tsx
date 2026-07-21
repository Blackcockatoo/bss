"use client";

import { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_EXPRESSION_OPTIONS,
  LESSON_MOVEMENT_OPTIONS,
  LESSON_PATTERN_OPTIONS,
  LESSON_SHAPE_OPTIONS,
  cloneLessonPetConfig,
  type BodyDesignComparisonEvidence,
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

/**
 * Lesson 2 — Build a Body. A simplified mini Body Forge exposing only four
 * guided categories (shape, face, movement, surface). Selections are reversible
 * (undo / reset) and only committed when the student presses Apply.
 */
export function BuildBodyActivity({
  step,
  stepIndex,
  isPreview,
  reducedMotion,
  pet,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | BodyDesignComparisonEvidence
    | undefined;

  const [before] = useState<LessonPetConfig>(() =>
    cloneLessonPetConfig(pet.startingConfig),
  );
  const [history, setHistory] = useState<LessonPetConfig[]>([]);
  const [working, setWorking] = useState<LessonPetConfig>(() =>
    cloneLessonPetConfig(pet.startingConfig),
  );
  const [reason, setReason] = useState(existing?.reason ?? "");
  const [applied, setApplied] = useState(existing?.applied ?? false);
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<LessonPetConfig>) => {
    if (isPreview) return;
    setHistory((h) => [...h, working]);
    setWorking((w) => ({ ...w, ...patch }));
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setWorking(prev);
      return h.slice(0, -1);
    });
  };

  const resetToStart = () => {
    setHistory([]);
    setWorking(cloneLessonPetConfig(before));
  };

  const buildEvidence = (
    overrides: Partial<BodyDesignComparisonEvidence> = {},
  ): BodyDesignComparisonEvidence => ({
    kind: "body-design-comparison",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    before: { ...before },
    after: { ...working },
    chosenFeatures: {
      shape: working.shape,
      face: working.expression,
      movement: working.movement,
      surface: working.pattern,
    },
    reason: overrides.reason ?? reason,
    applied: overrides.applied ?? applied,
  });

  const undoControls = (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={undo}
        disabled={isPreview || history.length === 0}
        className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
      >
        <Undo2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Undo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={resetToStart}
        disabled={isPreview}
        className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Reset to lesson start
      </Button>
    </div>
  );

  if (stepIndex === 0) {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.introduce}
        instruction="Here is the starting body. Look at its shape, face, movement and surface before you change anything."
      >
        <div className="flex justify-center">
          <PetStage config={before} reducedMotion={reducedMotion} size="lg" />
        </div>
      </StepShell>
    );
  }

  if (stepIndex === 1) {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.observe}
        instruction="Choose a body shape. How might this shape affect the way the pet moves?"
        footer={undoControls}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex justify-center">
            <PetStage config={working} reducedMotion={reducedMotion} />
          </div>
          <ChoiceGrid
            legend="Body shape"
            options={LESSON_SHAPE_OPTIONS}
            value={working.shape}
            onChange={(id) => update({ shape: id })}
            disabled={isPreview}
          />
        </div>
      </StepShell>
    );
  }

  if (stepIndex === 2) {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.interact}
        instruction="Choose a face. What does this feature communicate without words?"
        footer={undoControls}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex justify-center">
            <PetStage config={working} reducedMotion={reducedMotion} />
          </div>
          <ChoiceGrid
            legend="Face / expression"
            options={LESSON_EXPRESSION_OPTIONS}
            value={working.expression}
            onChange={(id) => update({ expression: id })}
            disabled={isPreview}
          />
        </div>
      </StepShell>
    );
  }

  if (stepIndex === 3) {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.discuss}
        instruction="Choose how it moves and its surface. Then finish: I chose this because…"
        footer={undoControls}
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="flex justify-center">
            <PetStage config={working} reducedMotion={reducedMotion} />
          </div>
          <div className="space-y-4">
            <ChoiceGrid
              legend="Movement"
              options={LESSON_MOVEMENT_OPTIONS}
              value={working.movement}
              onChange={(id) =>
                update({ movement: id as LessonMovementStyle })
              }
              columns={4}
              disabled={isPreview}
            />
            <ChoiceGrid
              legend="Surface"
              options={LESSON_PATTERN_OPTIONS}
              value={working.pattern}
              onChange={(id) => update({ pattern: id })}
              disabled={isPreview}
            />
            <EvidenceText
              label="I chose this because…"
              value={reason}
              onChange={setReason}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. I chose wings so it can explore high places."
              disabled={isPreview}
            />
          </div>
        </div>
      </StepShell>
    );
  }

  // complete
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL.complete}
      instruction="Compare before and after. Keep your original or apply your new design."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Before
            </p>
            <PetStage config={before} reducedMotion={reducedMotion} size="sm" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
              After
            </p>
            <PetStage config={working} reducedMotion={reducedMotion} size="sm" />
          </div>
        </div>

        <div className="mx-auto max-w-md space-y-3">
          <EvidenceText
            label="I chose this because…"
            value={reason}
            onChange={setReason}
            onBlur={() => !isPreview && saveEvidence(buildEvidence())}
            disabled={isPreview}
          />
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetToStart();
                setApplied(false);
                if (!isPreview) {
                  saveEvidence(buildEvidence({ applied: false }));
                }
              }}
              disabled={isPreview}
              className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
            >
              Keep my original design
            </Button>
            {pet.canPersist ? (
              <Button
                type="button"
                onClick={() => {
                  setApplied(true);
                  if (!isPreview) {
                    saveEvidence(buildEvidence({ applied: true }));
                  }
                }}
                className="bg-amber-300 text-slate-950 hover:bg-amber-200"
              >
                Apply Design to My Meta-Pet
              </Button>
            ) : null}
          </div>
          {applied ? (
            <p className="text-center text-xs text-emerald-300" role="status">
              Design applied to your lesson pet.
            </p>
          ) : null}
          <div className="flex justify-center">
            <SaveButton
              onClick={() => {
                if (!isPreview) saveEvidence(buildEvidence());
                setSaved(true);
              }}
              saved={saved}
              disabled={isPreview}
              label="Save design comparison"
            />
          </div>
        </div>
      </div>
    </StepShell>
  );
}

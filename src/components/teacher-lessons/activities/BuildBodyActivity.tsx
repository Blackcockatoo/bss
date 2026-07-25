"use client";

import { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  LESSON_EXPRESSION_OPTIONS,
  LESSON_MOVEMENT_OPTIONS,
  LESSON_PATTERN_OPTIONS,
  LESSON_SHAPE_OPTIONS,
  applyBodyDesign,
  cloneLessonPetConfig,
  toAppliedChange,
  undoBodyDesign,
  type AppliedChangeMeta,
  type BodyDesignComparisonEvidence,
  type LessonMovementStyle,
  type LessonPetConfig,
  type PetUpdateResult,
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
import { configToBodySpec } from "./petSpec";
import {
  ApplyResultBanner,
  MissingPetNotice,
  buildUpdateContext,
  useHasRealPet,
} from "./petUpdateUi";

/**
 * Lesson 2 — Build a Body. A simplified mini Body Forge exposing only four
 * guided categories (shape, face, movement, surface), framed as an ordered
 * algorithm: Start → Choose → Check → Act → Repeat → Stop. Selections are
 * reversible (undo / reset) and only committed when the student presses
 * Apply.
 */
export function BuildBodyActivity({
  step,
  isPreview,
  reducedMotion,
  pet,
  lesson,
  getEvidence,
  saveEvidence,
  allowPetUpdates = true,
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
  const [shapePrediction, setShapePrediction] = useState("");
  const [debugNote, setDebugNote] = useState("");
  const [reason, setReason] = useState(existing?.reason ?? "");
  const [applied, setApplied] = useState(existing?.applied ?? false);
  const [saved, setSaved] = useState(false);
  const [bodyResult, setBodyResult] = useState<PetUpdateResult | null>(null);
  const hasRealPet = useHasRealPet();

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
    appliedChange?: AppliedChangeMeta,
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
    shapePrediction: overrides.shapePrediction ?? shapePrediction,
    ...(appliedChange
      ? { appliedChange }
      : existing?.appliedChange
        ? { appliedChange: existing.appliedChange }
        : {}),
  });

  // Apply the approved design to the REAL Meta-Pet via the safe update API.
  const applyToPet = () => {
    const result = applyBodyDesign(
      configToBodySpec(working),
      buildUpdateContext(isPreview, hasRealPet, lesson.id),
    );
    setBodyResult(result);
    if (result.ok) setApplied(true);
    if (!isPreview) {
      saveEvidence(buildEvidence({ applied: result.ok }, toAppliedChange(result)));
    }
  };

  const undoApplyToPet = () => {
    const result = undoBodyDesign();
    setBodyResult(result);
    if (result.ok) {
      setApplied(false);
      if (!isPreview) {
        saveEvidence(
          buildEvidence({ applied: false }, {
            appliedToPet: false,
            updateType: "body-design",
          }),
        );
      }
    }
  };

  // Textual before/after description (accessibility: not images alone).
  const changeDescription = `Before: ${before.shape} shape, ${before.pattern} surface, ${before.expression} face. After: ${working.shape} shape, ${working.pattern} surface, ${working.expression} face.`;

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

  switch (step.kind) {
    case "notice":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.notice}
          instruction="Here is the starting body. Look at its shape, face, movement and surface before you change anything."
        >
          <div className="flex justify-center">
            <PetStage config={before} reducedMotion={reducedMotion} size="lg" />
          </div>
        </StepShell>
      );

    case "predict":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.predict}
          instruction="Building a body follows an order: Start, Choose, Check, Act, Repeat, Stop. Predict what will change if you choose a new shape."
        >
          <div className="mx-auto max-w-md space-y-3">
            <div className="flex justify-center">
              <PetStage config={before} reducedMotion={reducedMotion} />
            </div>
            <EvidenceText
              label="My prediction"
              value={shapePrediction}
              onChange={setShapePrediction}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. I think a tall shape will make it look like it can reach high places."
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
          instruction="Choose → Check → Act: choose a body shape and check it fits the pet you want."
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

    case "observe":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.observe}
          instruction="Observe your chosen shape, then Repeat the same rule (Choose → Check → Act) to pick a face."
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

    case "explain":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.explain}
          instruction="Choose movement and surface. Then explain: what would you Check first if two choices didn't work together?"
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
                label="If something didn't fit, I would check…"
                value={debugNote}
                onChange={setDebugNote}
                placeholder="e.g. whether the feature matches the body shape."
                disabled={isPreview}
              />
            </div>
          </div>
        </StepShell>
      );

    case "create":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.create}
          instruction="Create your finished design. Compare before and after, then keep your original or apply your new design."
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
            <p className="text-center text-xs text-slate-400">{changeDescription}</p>

            <div className="mx-auto max-w-md space-y-3">
              <EvidenceText
                label="I chose this because…"
                value={reason}
                onChange={setReason}
                onBlur={() => !isPreview && saveEvidence(buildEvidence())}
                placeholder="e.g. I chose wings so it can explore high places."
                disabled={isPreview}
              />
              <p className="rounded-2xl border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-xs text-slate-400">
                Trying designs here is temporary. Nothing changes your real Meta-Pet
                until you press <strong>Apply Design to My Meta-Pet</strong>.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetToStart();
                    if (!isPreview) saveEvidence(buildEvidence({ applied }));
                  }}
                  disabled={isPreview}
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                >
                  Keep my original design
                </Button>
                {allowPetUpdates && hasRealPet ? (
                  <Button
                    type="button"
                    onClick={applyToPet}
                    disabled={isPreview}
                    className="bg-amber-300 text-slate-950 hover:bg-amber-200"
                  >
                    Apply Design to My Meta-Pet
                  </Button>
                ) : null}
              </div>
              {allowPetUpdates ? (hasRealPet ? (
                <ApplyResultBanner
                  result={bodyResult}
                  onUndo={undoApplyToPet}
                  showViewPet
                />
              ) : (
                <MissingPetNotice message="You can still finish this lesson with a classroom example. Create a Meta-Pet to apply your design to your own pet." />
              )) : null}
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

    case "reflect":
    default:
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.reflect}
          instruction="Why does the order of Start, Choose, Check, Act, Repeat, Stop matter when building something?"
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="My reflection"
              value={reason}
              onChange={setReason}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="The order matters because…"
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

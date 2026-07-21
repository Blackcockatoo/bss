"use client";

import { useState } from "react";
import { Eye, HandHelping } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEMO_PET_CONFIG,
  applyAlias,
  getAliasError,
  toAppliedChange,
  undoAlias,
  type AppliedChangeMeta,
  type PetObservationCardEvidence,
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
import {
  ApplyResultBanner,
  MissingPetNotice,
  buildUpdateContext,
  useHasRealPet,
} from "./petUpdateUi";

const SHAPE_OBSERVATIONS = [
  { id: "round-soft", label: "Round and soft" },
  { id: "pointed", label: "Pointed" },
  { id: "tall", label: "Tall" },
  { id: "wide", label: "Wide" },
];
const SURFACE_OBSERVATIONS = [
  { id: "smooth", label: "Smooth" },
  { id: "shiny", label: "Shiny" },
  { id: "patterned", label: "Patterned" },
  { id: "glowing", label: "Glowing" },
];
const MOVEMENT_OBSERVATIONS = [
  { id: "floaty", label: "Floaty" },
  { id: "still", label: "Very still" },
  { id: "bouncy", label: "Bouncy" },
  { id: "gentle", label: "Gentle" },
];

/**
 * Lesson 1 — Meet Your Meta-Pet. A guided introduction (not the full pet
 * dashboard): a visible demonstration pet, three highlighted observable
 * features, a safe alias field and an observation card.
 */
export function MeetActivity({
  step,
  isPreview,
  reducedMotion,
  getEvidence,
  saveEvidence,
  onAskForHelp,
  lesson,
}: LessonActivityProps) {
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | PetObservationCardEvidence
    | undefined;

  const [alias, setAlias] = useState(existing?.alias ?? "");
  const [shapeObs, setShapeObs] = useState(existing?.observations.shape ?? "");
  const [surfaceObs, setSurfaceObs] = useState(
    existing?.observations.surface ?? "",
  );
  const [movementObs, setMovementObs] = useState(
    existing?.observations.movement ?? "",
  );
  const [question, setQuestion] = useState(existing?.question ?? "");
  const [saved, setSaved] = useState(false);
  const [aliasResult, setAliasResult] = useState<PetUpdateResult | null>(null);
  const hasRealPet = useHasRealPet();

  const persist = (
    overrides: Partial<PetObservationCardEvidence> = {},
    appliedChange?: AppliedChangeMeta,
  ) => {
    if (isPreview) return;
    const evidence: PetObservationCardEvidence = {
      kind: "pet-observation-card",
      version: 1,
      lessonId: lesson.id,
      stepId: evidenceStepId,
      createdAt: evidenceTimestamp(),
      alias: overrides.alias ?? alias,
      observations: {
        shape: overrides.observations?.shape ?? shapeObs,
        surface: overrides.observations?.surface ?? surfaceObs,
        movement: overrides.observations?.movement ?? movementObs,
      },
      question: overrides.question ?? question,
      petConfigRef: { ...DEMO_PET_CONFIG },
      ...(appliedChange ? { appliedChange } : existing?.appliedChange ? { appliedChange: existing.appliedChange } : {}),
    };
    saveEvidence(evidence);
  };

  const saveAliasToPet = () => {
    const result = applyAlias(
      alias,
      buildUpdateContext(isPreview, hasRealPet, lesson.id),
    );
    setAliasResult(result);
    persist({}, toAppliedChange(result));
  };

  const handleUndoAlias = () => {
    const result = undoAlias();
    setAliasResult(result);
    if (result.ok) persist({}, { appliedToPet: false, updateType: "alias" });
  };

  switch (step.kind) {
    case "introduce":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.introduce}
          instruction="Look closely at the Meta-Pet before touching anything. What do you notice first?"
        >
          <div className="flex justify-center">
            <PetStage config={DEMO_PET_CONFIG} reducedMotion={reducedMotion} size="lg" />
          </div>
        </StepShell>
      );

    case "observe":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.observe}
          instruction="Notice three things: its shape, its surface, and how it moves. Pick one word for each."
        >
          <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
            <div className="flex justify-center">
              <PetStage config={DEMO_PET_CONFIG} reducedMotion={reducedMotion} />
            </div>
            <div className="space-y-4">
              <ChoiceGrid
                legend="1. Its shape looks…"
                options={SHAPE_OBSERVATIONS}
                value={shapeObs || null}
                onChange={(v) => {
                  setShapeObs(v);
                  persist({ observations: { shape: v, surface: surfaceObs, movement: movementObs } });
                }}
                columns={2}
                disabled={isPreview}
              />
              <ChoiceGrid
                legend="2. Its surface looks…"
                options={SURFACE_OBSERVATIONS}
                value={surfaceObs || null}
                onChange={(v) => {
                  setSurfaceObs(v);
                  persist({ observations: { shape: shapeObs, surface: v, movement: movementObs } });
                }}
                columns={2}
                disabled={isPreview}
              />
              <ChoiceGrid
                legend="3. It moves in a way that is…"
                options={MOVEMENT_OBSERVATIONS}
                value={movementObs || null}
                onChange={(v) => {
                  setMovementObs(v);
                  persist({ observations: { shape: shapeObs, surface: surfaceObs, movement: v } });
                }}
                columns={2}
                disabled={isPreview}
              />
            </div>
          </div>
        </StepShell>
      );

    case "interact":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.interact}
          instruction="Give your Meta-Pet a safe nickname (an alias). Do not use your real name."
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <PetStage config={{ ...DEMO_PET_CONFIG, alias: alias || DEMO_PET_CONFIG.alias }} reducedMotion={reducedMotion} />
            <div className="w-full space-y-1.5 text-left">
              <label htmlFor="pet-alias" className="block text-sm font-medium text-slate-200">
                Pet alias (a made-up name)
              </label>
              <input
                id="pet-alias"
                value={alias}
                maxLength={24}
                disabled={isPreview}
                onChange={(e) => setAlias(e.target.value)}
                onBlur={() => persist()}
                placeholder="e.g. Sparky, Moss, Comet"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus-visible:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 disabled:opacity-60"
              />
              <p className="text-xs text-slate-400">
                An alias keeps you private. Never use a real full name.
              </p>
            </div>

            {/* Optional: save the alias to the real Meta-Pet (explicit + safe). */}
            {hasRealPet ? (
              <div className="w-full space-y-2">
                <Button
                  type="button"
                  onClick={saveAliasToPet}
                  disabled={isPreview || getAliasError(alias) !== null}
                  className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200 disabled:opacity-50"
                >
                  Save Alias to My Meta-Pet
                </Button>
                <p className="text-xs text-slate-500">
                  This is optional. Your previous alias can be restored.
                </p>
                <ApplyResultBanner
                  result={aliasResult}
                  onUndo={handleUndoAlias}
                />
              </div>
            ) : (
              <MissingPetNotice message="Saving an alias to your own pet is optional. You can still complete this lesson with a classroom example." />
            )}
          </div>
        </StepShell>
      );

    case "discuss":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.discuss}
          instruction="Think of one question you have about your Meta-Pet. Type or say it."
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="My question about the Meta-Pet"
              value={question}
              onChange={setQuestion}
              onBlur={() => persist()}
              placeholder="e.g. How does it know I am here?"
              rows={2}
              disabled={isPreview}
            />
            <Button
              type="button"
              variant="outline"
              className="border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20"
              onClick={onAskForHelp}
            >
              <HandHelping className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Ask teacher for help
            </Button>
          </div>
        </StepShell>
      );

    case "complete":
    default:
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.complete}
          instruction="Save your pet card: your alias, three observations and your question."
        >
          <div className="mx-auto max-w-md space-y-4">
            <div className="rounded-3xl border border-amber-300/20 bg-slate-900/60 p-5">
              <div className="flex items-center gap-4">
                <PetStage
                  config={{ ...DEMO_PET_CONFIG, alias: alias || DEMO_PET_CONFIG.alias }}
                  reducedMotion={reducedMotion}
                  size="sm"
                />
                <div className="space-y-1 text-left text-sm">
                  <p className="text-base font-semibold text-white">
                    {alias || "(add an alias)"}
                  </p>
                  <p className="text-slate-300">
                    <Eye className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    {[shapeObs, surfaceObs, movementObs].filter(Boolean).join(", ") ||
                      "(add observations)"}
                  </p>
                  <p className="text-slate-400">{question || "(add a question)"}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <SaveButton
                onClick={() => {
                  persist();
                  setSaved(true);
                }}
                saved={saved}
                disabled={isPreview}
                label="Save pet card"
              />
            </div>
          </div>
        </StepShell>
      );
  }
}

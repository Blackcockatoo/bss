"use client";

import { useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";

import { AdvancedDNACanvas } from "@/components/advanced-dna/AdvancedDNACanvas";
import { buildDnaVisualModel } from "@/components/advanced-dna/dnaMapper";
import {
  detectDevicePerformance,
  resolvePerformanceProfile,
} from "@/components/advanced-dna/performance";
import type {
  AdvancedDnaControlsState,
  AdvancedDnaMode,
} from "@/components/advanced-dna/types";
import { Button } from "@/components/ui/button";
import type { Genome } from "@/lib/genome";
import { MOSS_STRANDS } from "@/lib/moss60/strandSequences";
import { DEFAULT_VITALS } from "@/vitals";
import type {
  AppliedChangeMeta,
  PetUpdateResult,
  VisualisationSelectionEvidence,
} from "@/lib/teacher-lessons";
import {
  applyPreferredVisualisation,
  evidenceTimestamp,
  toAppliedChange,
  undoPreferredVisualisation,
} from "@/lib/teacher-lessons";
import type { LessonActivityProps } from "./types";
import {
  ChoiceGrid,
  EvidenceText,
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

/** One fixed DNA seed is shared across every visual mode in this lesson. */
const LESSON_GENOME: Genome = {
  red60: MOSS_STRANDS.red.split("").map(Number),
  blue60: MOSS_STRANDS.blue.split("").map(Number),
  black60: MOSS_STRANDS.black.split("").map(Number),
};

const MODE_OPTIONS: { id: AdvancedDnaMode; label: string }[] = [
  { id: "sigil", label: "Sigil" },
  { id: "cascade", label: "Cascade" },
  { id: "fourD", label: "4D" },
  { id: "vortex", label: "Vortex" },
];

const MODE_EXPLAIN: Record<AdvancedDnaMode, string> = {
  sigil: "A radial seal: mirrored gene groups form a stable emblem.",
  cascade: "Flowing lanes: the same genes shown as streams of information.",
  fourD: "Folded helices: inherited and expressed versions layered together.",
  vortex: "An orbit: stable genes swing wide, changeable genes fall inward.",
};

function DnaViewer({
  mode,
  playing,
  reducedMotion,
  lowPerformance = false,
}: {
  mode: AdvancedDnaMode;
  playing: boolean;
  reducedMotion: boolean;
  lowPerformance?: boolean;
}) {
  const model = useMemo(
    () =>
      buildDnaVisualModel({
        genome: LESSON_GENOME,
        traits: null,
        vitals: DEFAULT_VITALS,
        mutationLog: [],
        petId: "lesson-demo-pet",
        petName: "Lesson Pet",
        isFallback: false,
      }),
    [],
  );

  const performanceMode = lowPerformance ? "performance" : "auto";

  const controls: AdvancedDnaControlsState = {
    mode,
    speed: 0.78,
    intensity: 0.82,
    mutationLevel: 0.24,
    particleDensity: lowPerformance ? 0.35 : 0.7,
    symmetry: 12,
    cameraDepth: 1,
    dimension: 4,
    playing: playing && !reducedMotion,
    performanceMode,
    animationNonce: 0,
  };

  const performance = useMemo(
    () =>
      resolvePerformanceProfile(
        performanceMode,
        detectDevicePerformance(),
        reducedMotion,
      ),
    [performanceMode, reducedMotion],
  );

  return (
    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950">
      <AdvancedDNACanvas
        model={model}
        controls={controls}
        performance={performance}
        reducedMotion={reducedMotion}
        resetViewToken={0}
      />
    </div>
  );
}

/**
 * Lesson 6 — Patterns Behind the Pet. Uses the REAL advanced DNA visualisation
 * engine inside a simplified lesson viewer that only exposes the four modes,
 * pause/resume, compare, explain and reduced-motion. The same DNA seed drives
 * every mode, so students can see the modes differ while the identity holds.
 * Support presentation gives Years 3-4 a "continue the pattern" prompt;
 * Extension presentation gives Years 5-6 a rule-testing prompt.
 */
export function PatternsActivity({
  step,
  isPreview,
  reducedMotion,
  lowPerformance,
  presentationMode,
  lesson,
  getEvidence,
  saveEvidence,
  allowPetUpdates = true,
}: LessonActivityProps) {
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | VisualisationSelectionEvidence
    | undefined;

  const [mode, setMode] = useState<AdvancedDnaMode>(
    (existing?.selectedMode as AdvancedDnaMode) ?? "sigil",
  );
  const [predictedMode, setPredictedMode] = useState(
    existing?.predictedMode ?? "",
  );
  const [compareMode, setCompareMode] = useState<AdvancedDnaMode>("vortex");
  const [playing, setPlaying] = useState(!reducedMotion);
  const [patternNoticed, setPatternNoticed] = useState(
    existing?.patternNoticed ?? "",
  );
  const [sharedFeature, setSharedFeature] = useState(
    existing?.sharedFeature ?? "",
  );
  const [reason, setReason] = useState(existing?.reason ?? "");
  const [saved, setSaved] = useState(false);
  const [viewResult, setViewResult] = useState<PetUpdateResult | null>(null);
  const hasRealPet = useHasRealPet();

  const buildEvidence = (
    appliedChange?: AppliedChangeMeta,
  ): VisualisationSelectionEvidence => ({
    kind: "visualisation-selection",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    selectedMode: mode,
    predictedMode,
    patternNoticed,
    sharedFeature,
    reason,
    ...(appliedChange
      ? { appliedChange }
      : existing?.appliedChange
        ? { appliedChange: existing.appliedChange }
        : {}),
  });

  // Save the chosen mode as the preferred DNA view (no genome change).
  const savePreferredView = () => {
    const result = applyPreferredVisualisation(
      mode,
      buildUpdateContext(isPreview, hasRealPet, lesson.id),
    );
    setViewResult(result);
    if (!isPreview) saveEvidence(buildEvidence(toAppliedChange(result)));
  };

  const undoPreferredView = () => {
    const result = undoPreferredVisualisation();
    setViewResult(result);
    if (result.ok && !isPreview) {
      saveEvidence(
        buildEvidence({
          appliedToPet: false,
          updateType: "preferred-visualisation",
        }),
      );
    }
  };

  const playToggle = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setPlaying((p) => !p)}
      className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
    >
      {playing ? (
        <Pause className="mr-1.5 h-4 w-4" aria-hidden="true" />
      ) : (
        <Play className="mr-1.5 h-4 w-4" aria-hidden="true" />
      )}
      {playing ? "Pause" : "Resume"}
    </Button>
  );

  switch (step.kind) {
    case "notice":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.notice}
          instruction="This is the pet's DNA shown as a Sigil — a radial pattern. Notice how it holds together."
          footer={playToggle}
        >
          <div className="flex flex-col items-center gap-2">
            <DnaViewer mode="sigil" playing={playing} reducedMotion={reducedMotion}
              lowPerformance={lowPerformance} />
            <p className="text-center text-sm text-slate-300">
              {MODE_EXPLAIN.sigil}
            </p>
            {reducedMotion ? (
              <p className="text-xs text-slate-400">
                Reduced motion is on: the pattern is shown as a still image.
              </p>
            ) : null}
          </div>
        </StepShell>
      );

    case "predict":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.predict}
          instruction="Predict: if we show the same DNA a different way, what do you think will stay the same, and what might look different?"
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="My prediction"
              value={predictedMode}
              onChange={setPredictedMode}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. I think the colours will stay the same but the shape will change."
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
          instruction="Change the representation. The DNA is the same — only how we draw it changes."
          footer={playToggle}
        >
          <div className="flex flex-col items-center gap-3">
            <DnaViewer mode={mode} playing={playing} reducedMotion={reducedMotion}
              lowPerformance={lowPerformance} />
            <p className="text-center text-sm text-slate-300">
              {MODE_EXPLAIN[mode]}
            </p>
            <ChoiceGrid
              legend="Representation"
              options={MODE_OPTIONS}
              value={mode}
              onChange={(id) => setMode(id as AdvancedDnaMode)}
              columns={4}
            />
          </div>
        </StepShell>
      );

    case "observe":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.observe}
          instruction="Compare two representations side by side. What appears in both?"
          footer={playToggle}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-2">
              <DnaViewer mode={mode} playing={playing} reducedMotion={reducedMotion}
              lowPerformance={lowPerformance} />
              <ChoiceGrid
                legend="Left"
                options={MODE_OPTIONS}
                value={mode}
                onChange={(id) => setMode(id as AdvancedDnaMode)}
                columns={4}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <DnaViewer
                mode={compareMode}
                playing={playing}
                reducedMotion={reducedMotion}
                lowPerformance={lowPerformance}
              />
              <ChoiceGrid
                legend="Right"
                options={MODE_OPTIONS}
                value={compareMode}
                onChange={(id) => setCompareMode(id as AdvancedDnaMode)}
                columns={4}
              />
            </div>
          </div>
        </StepShell>
      );

    case "explain":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.explain}
          instruction={
            presentationMode === "extension"
              ? "Years 5-6: state the rule behind the pattern, then try to find a case that breaks it."
              : presentationMode === "support"
                ? "Years 3-4: find something that repeats, and describe what comes next."
                : "Identify something consistent. What pattern or feature appears in more than one mode?"
          }
          footer={playToggle}
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label={
                presentationMode === "extension"
                  ? "The rule I found (and any exception)"
                  : "A pattern I noticed"
              }
              value={patternNoticed}
              onChange={setPatternNoticed}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="e.g. a bright cluster near the centre"
              disabled={isPreview}
            />
            <EvidenceText
              label="A feature that appears in more than one mode"
              value={sharedFeature}
              onChange={setSharedFeature}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              disabled={isPreview}
            />
          </div>
        </StepShell>
      );

    case "create":
      return (
        <StepShell
          kindLabel={STEP_KIND_LABEL.create}
          instruction="Choose the representation that shows the DNA most clearly, and explain why."
        >
          <div className="mx-auto max-w-md space-y-3">
            <ChoiceGrid
              legend="My chosen representation"
              options={MODE_OPTIONS}
              value={mode}
              onChange={(id) => {
                setMode(id as AdvancedDnaMode);
                if (!isPreview)
                  saveEvidence({ ...buildEvidence(), selectedMode: id });
              }}
              columns={4}
            />
            <EvidenceText
              label="I chose this because…"
              value={reason}
              onChange={setReason}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              disabled={isPreview}
            />
            {allowPetUpdates ? (hasRealPet ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={savePreferredView}
                  disabled={isPreview}
                  className="w-full bg-amber-300 text-slate-950 hover:bg-amber-200"
                >
                  Use This as My Preferred DNA View
                </Button>
                <p className="text-xs text-slate-500">
                  This only changes your preferred view. It does not change your
                  pet&apos;s DNA.
                </p>
                <ApplyResultBanner result={viewResult} onUndo={undoPreferredView} />
              </div>
            ) : (
              <MissingPetNotice message="You can still record your choice. Create a Meta-Pet to save a preferred DNA view." />
            )) : null}
            <div className="flex justify-center">
              <SaveButton
                onClick={() => {
                  if (!isPreview) saveEvidence(buildEvidence());
                  setSaved(true);
                }}
                saved={saved}
                disabled={isPreview}
                label="Save my choice"
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
          instruction="What does a pattern tell you about the rules behind it?"
        >
          <div className="mx-auto max-w-md space-y-3">
            <EvidenceText
              label="My reflection"
              value={reason}
              onChange={setReason}
              onBlur={() => !isPreview && saveEvidence(buildEvidence())}
              placeholder="A pattern tells me…"
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

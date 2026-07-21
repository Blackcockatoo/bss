"use client";

import { useState } from "react";
import { Dna, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  applyDnaVariation,
  buildDnaStrip,
  cloneLessonPetConfig,
  getLessonGene,
  restorePreviousDna,
  toAppliedChange,
  type AppliedChangeMeta,
  type DnaComparisonEvidence,
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
import {
  ApplyResultBanner,
  MissingPetNotice,
  buildUpdateContext,
  useHasRealPet,
} from "./petUpdateUi";

/** A fixed, clearly-visible gene keeps the classroom outcome predictable. */
const LESSON_GENE_ID = "gene-pattern";
const HIGHLIGHT_INDEX = 4;

function DnaStrip({
  seed,
  changed,
}: {
  seed: string;
  changed: boolean;
}) {
  const strip = buildDnaStrip(seed, 12, HIGHLIGHT_INDEX);
  return (
    <ol
      className="flex flex-wrap justify-center gap-1"
      aria-label={`DNA strip${changed ? " (one position changed)" : ""}`}
    >
      {strip.map((cell, index) => (
        <li
          key={index}
          className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold ${
            cell.highlighted
              ? changed
                ? "border-amber-300 bg-amber-300/20 text-amber-100 ring-2 ring-amber-300"
                : "border-cyan-400 bg-cyan-400/15 text-cyan-100 ring-2 ring-cyan-400"
              : "border-slate-700 bg-slate-800/40 text-slate-300"
          }`}
        >
          {cell.highlighted && changed ? "?" : cell.base}
          {cell.highlighted ? (
            <span className="sr-only">(highlighted gene position)</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * Lesson 3 — DNA Makes Us Different. A controlled one-gene mutation with a
 * simplified DNA strip, a prediction, a single "Change One Gene" action and a
 * side-by-side comparison. The mutation is a sandbox experiment and never
 * overwrites the real pet.
 */
export function DnaDifferenceActivity({
  step,
  isPreview,
  reducedMotion,
  pet,
  lesson,
  getEvidence,
  saveEvidence,
}: LessonActivityProps) {
  const gene = getLessonGene(LESSON_GENE_ID)!;
  const evidenceStepId = lesson.steps[lesson.steps.length - 1].id;
  const existing = getEvidence(evidenceStepId) as
    | DnaComparisonEvidence
    | undefined;

  const [original] = useState<LessonPetConfig>(() =>
    cloneLessonPetConfig(pet.startingConfig),
  );
  const [mutated, setMutated] = useState<LessonPetConfig | null>(null);
  const [predicted, setPredicted] = useState(existing?.predicted ?? "");
  const [observed, setObserved] = useState(existing?.observed ?? "");
  const [stayedSame, setStayedSame] = useState(existing?.stayedSame ?? "");
  const [kept, setKept] = useState(existing?.keptVariation ?? false);
  const [saved, setSaved] = useState(false);
  const [dnaResult, setDnaResult] = useState<PetUpdateResult | null>(null);
  const hasRealPet = useHasRealPet();

  const seed = `${original.alias}-${original.shape}-${original.pattern}`;

  const buildEvidence = (
    overrides: Partial<DnaComparisonEvidence> = {},
    appliedChange?: AppliedChangeMeta,
  ): DnaComparisonEvidence => ({
    kind: "dna-comparison",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    geneLabel: gene.label,
    predicted: overrides.predicted ?? predicted,
    observed: overrides.observed ?? observed,
    stayedSame: overrides.stayedSame ?? stayedSame,
    beforeConfigRef: { ...original },
    afterConfigRef: mutated ? { ...mutated } : undefined,
    keptVariation: overrides.keptVariation ?? kept,
    ...(appliedChange
      ? { appliedChange }
      : existing?.appliedChange
        ? { appliedChange: existing.appliedChange }
        : {}),
  });

  // "Keep This Variation" applies a controlled one-position genome change to
  // the REAL pet via the safe update API. The classroom mutation above stays
  // temporary until this explicit action.
  const keepVariation = () => {
    const result = applyDnaVariation(
      buildUpdateContext(isPreview, hasRealPet, lesson.id),
      { strand: "red60", index: 15 },
    );
    setDnaResult(result);
    if (result.ok) setKept(true);
    if (!isPreview) {
      saveEvidence(
        buildEvidence({ keptVariation: result.ok }, toAppliedChange(result)),
      );
    }
  };

  const restoreDna = () => {
    const result = restorePreviousDna();
    setDnaResult(result);
    if (result.ok) {
      setKept(false);
      if (!isPreview) {
        saveEvidence(
          buildEvidence({ keptVariation: false }, {
            appliedToPet: false,
            updateType: "dna-variation",
          }),
        );
      }
    }
  };

  if (step.kind === "introduce") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.introduce}
        instruction="Meet the original pet and a small section of its DNA. Each block is one piece of genetic information."
      >
        <div className="flex flex-col items-center gap-4">
          <PetStage config={original} reducedMotion={reducedMotion} />
          <DnaStrip seed={seed} changed={false} />
        </div>
      </StepShell>
    );
  }

  if (step.kind === "observe") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.observe}
        instruction={`We will change one gene: the ${gene.label}. What do you think might change?`}
      >
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <DnaStrip seed={seed} changed={false} />
          <ChoiceGrid
            legend="My prediction"
            options={gene.predictionOptions.map((label, i) => ({
              id: `p${i}`,
              label,
            }))}
            value={
              predicted
                ? `p${gene.predictionOptions.indexOf(predicted)}`
                : null
            }
            onChange={(id) => {
              const idx = Number(id.slice(1));
              const value = gene.predictionOptions[idx] ?? "";
              setPredicted(value);
              if (!isPreview) saveEvidence(buildEvidence({ predicted: value }));
            }}
            columns={2}
            disabled={isPreview}
          />
        </div>
      </StepShell>
    );
  }

  if (step.kind === "interact") {
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.interact}
        instruction="Press the button to change one gene. Watch what happens."
      >
        <div className="flex flex-col items-center gap-5">
          <PetStage
            config={mutated ?? original}
            reducedMotion={reducedMotion}
          />
          <DnaStrip seed={seed} changed={mutated !== null} />
          <Button
            type="button"
            size="lg"
            disabled={isPreview}
            onClick={() => setMutated(gene.mutate(original))}
            className="min-h-14 bg-amber-300 px-8 text-base text-slate-950 hover:bg-amber-200"
          >
            <Dna className="mr-2 h-5 w-5" aria-hidden="true" />
            {mutated ? "Change Again" : "Change One Gene"}
          </Button>
          {mutated ? (
            <p className="text-sm text-emerald-300" role="status">
              One gene changed. Compare it with the original next.
            </p>
          ) : null}
        </div>
      </StepShell>
    );
  }

  if (step.kind === "discuss") {
    const changed = mutated ?? gene.mutate(original);
    return (
      <StepShell
        kindLabel={STEP_KIND_LABEL.discuss}
        instruction="Compare the two pets. What changed? What stayed the same?"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Original
            </p>
            <PetStage config={original} reducedMotion={reducedMotion} size="sm" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
              Changed
            </p>
            <PetStage config={changed} reducedMotion={reducedMotion} size="sm" />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-slate-300">
          The <strong>{gene.label}</strong> changed the surface pattern. The
          shape, colour and movement stayed the same.
        </p>
      </StepShell>
    );
  }

  // complete
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL.complete}
      instruction="Record your discovery."
    >
      <div className="mx-auto max-w-md space-y-3">
        <EvidenceText
          label="I predicted…"
          value={predicted}
          onChange={setPredicted}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          disabled={isPreview}
        />
        <EvidenceText
          label="I observed…"
          value={observed}
          onChange={setObserved}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          disabled={isPreview}
        />
        <EvidenceText
          label="One thing that stayed the same was…"
          value={stayedSame}
          onChange={setStayedSame}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          disabled={isPreview}
        />
        <p className="rounded-2xl border border-slate-700/60 bg-slate-800/30 px-3 py-2 text-xs text-slate-400">
          The change you made earlier was a temporary experiment. Your real
          Meta-Pet only changes if you press <strong>Keep This Variation</strong>.
        </p>
        {hasRealPet ? (
          <div className="space-y-2">
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                onClick={keepVariation}
                disabled={isPreview}
                className="bg-amber-300 text-slate-950 hover:bg-amber-200"
              >
                <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Keep This Variation
              </Button>
              {kept ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={restoreDna}
                  disabled={isPreview}
                  className="border-slate-700 bg-slate-800/40 text-slate-200 hover:bg-slate-800"
                >
                  Restore Previous DNA
                </Button>
              ) : null}
            </div>
            <ApplyResultBanner
              result={dnaResult}
              onUndo={kept ? restoreDna : undefined}
              showViewPet
            />
          </div>
        ) : (
          <MissingPetNotice message="You can still record your discovery. Create a Meta-Pet to keep a real DNA variation." />
        )}
        <div className="flex justify-center">
          <SaveButton
            onClick={() => {
              if (!isPreview) saveEvidence(buildEvidence());
              setSaved(true);
            }}
            saved={saved}
            disabled={isPreview}
            label="Save discovery"
          />
        </div>
      </div>
    </StepShell>
  );
}

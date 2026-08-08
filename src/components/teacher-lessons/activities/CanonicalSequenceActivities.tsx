"use client";

import { useMemo, useState } from "react";

import type {
  BodyDesignComparisonEvidence,
  CauseEffectChainEvidence,
  DnaComparisonEvidence,
  ResponsibleCreatorPromiseEvidence,
} from "@/lib/teacher-lessons";
import { evidenceTimestamp } from "@/lib/teacher-lessons";

import type { LessonActivityProps } from "./types";
import { EvidenceText, SaveButton, STEP_KIND_LABEL, StepShell } from "./shared";

const optionClass = (selected: boolean) =>
  `min-h-12 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
    selected
      ? "border-emerald-300 bg-emerald-300/15 text-emerald-100"
      : "border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-500"
  }`;

function CanonicalShell({
  step,
  children,
}: Pick<LessonActivityProps, "step"> & { children: React.ReactNode }) {
  return (
    <StepShell
      kindLabel={STEP_KIND_LABEL[step.kind]}
      instruction={step.studentTask}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        {children}
        <p className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-xs leading-5 text-slate-300">
          <strong className="text-white">Teacher prompt:</strong>{" "}
          {step.teacherPrompt}
        </p>
      </div>
    </StepShell>
  );
}

/** Session 3: compare representations without changing the companion. */
export function RepresentationActivity(props: LessonActivityProps) {
  const { step, lesson, isPreview, getEvidence, saveEvidence, pet } = props;
  const evidenceStepId = lesson.steps.at(-1)!.id;
  const existing = getEvidence(evidenceStepId) as DnaComparisonEvidence | undefined;
  const [shared, setShared] = useState(existing?.stayedSame ?? "");
  const [saved, setSaved] = useState(false);
  const config = pet.startingConfig;
  const identityCode = useMemo(
    () => `${config.shape}-${config.pattern}-${config.expression}`.toUpperCase(),
    [config.expression, config.pattern, config.shape],
  );

  const buildEvidence = (): DnaComparisonEvidence => ({
    kind: "dna-comparison",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    geneLabel: "same identity, different representation",
    predicted: "The displays will look different.",
    observed: `Picture and code both describe ${config.alias}.`,
    stayedSame: shared,
    beforeConfigRef: { ...config },
    afterConfigRef: { representation: identityCode },
    keptVariation: false,
  });

  return (
    <CanonicalShell step={step}>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Picture view</p>
          <p className="mt-4 text-3xl" aria-hidden="true">◉</p>
          <p className="mt-3 text-sm text-slate-200">
            {config.alias}: {config.shape} shape, {config.pattern} surface,
            {" "}{config.expression} expression.
          </p>
        </article>
        <article className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Code view</p>
          <p className="mt-4 break-words font-mono text-lg text-white">{identityCode}</p>
          <p className="mt-3 text-sm text-slate-300">
            The format changed. The companion did not.
          </p>
        </article>
      </div>
      {step.kind === "discuss" || step.kind === "complete" ? (
        <EvidenceText
          label="What stayed the same in both views?"
          value={shared}
          onChange={setShared}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          placeholder="The same shape and identity…"
          disabled={isPreview}
        />
      ) : null}
      {step.kind === "complete" ? (
        <SaveButton
          label="Save the comparison"
          disabled={isPreview}
          saved={saved}
          onClick={() => {
            if (!isPreview) saveEvidence(buildEvidence());
            setSaved(true);
          }}
        />
      ) : null}
    </CanonicalShell>
  );
}

const ALGORITHM_OPTIONS = [
  { id: "rest-feed", label: "Rest, then feed", result: "Energy settles before hunger rises." },
  { id: "feed-rest", label: "Feed, then rest", result: "Hunger rises before energy settles." },
] as const;

/** Session 4: predict, test, reset, then compare two orders. */
export function AlgorithmSequenceActivity(props: LessonActivityProps) {
  const { step, lesson, isPreview, saveEvidence } = props;
  const evidenceStepId = lesson.steps.at(-1)!.id;
  const [prediction, setPrediction] = useState("");
  const [tested, setTested] = useState<string[]>([]);
  const [preferred, setPreferred] = useState("");
  const [saved, setSaved] = useState(false);

  const buildEvidence = (): CauseEffectChainEvidence => ({
    kind: "cause-effect-chain",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    action: preferred || prediction,
    immediateEffect: "The first step changes the starting state.",
    secondaryEffect: "The second step acts on that changed state.",
    petResponse: "Resetting made a fair comparison possible.",
    balancingActions: tested,
  });

  return (
    <CanonicalShell step={step}>
      <div className="grid gap-3 sm:grid-cols-2">
        {ALGORITHM_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={optionClass((step.kind === "observe" ? prediction : preferred) === option.id)}
            disabled={isPreview}
            onClick={() => {
              if (step.kind === "observe") setPrediction(option.id);
              else {
                setTested((current) => current.includes(option.id) ? current : [...current, option.id]);
                setPreferred(option.id);
              }
            }}
          >
            <span className="block font-semibold">{option.label}</span>
            <span className="mt-1 block text-xs text-slate-400">{option.result}</span>
          </button>
        ))}
      </div>
      {step.kind === "interact" ? (
        <button
          type="button"
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
          onClick={() => setPreferred("")}
          disabled={isPreview}
        >
          Reset before the second order
        </button>
      ) : null}
      {step.kind === "complete" ? (
        <SaveButton
          label="Save the order comparison"
          disabled={isPreview || tested.length < 2}
          saved={saved}
          onClick={() => {
            if (!isPreview) saveEvidence(buildEvidence());
            setSaved(true);
          }}
        />
      ) : null}
    </CanonicalShell>
  );
}

const PRIVACY_EXAMPLES = [
  { id: "lesson-progress", label: "Which session this device reached" },
  { id: "photo", label: "A student's photo" },
  { id: "real-name", label: "A student's full real name" },
] as const;
const PRIVACY_CHOICES = ["keep", "ask-first", "never"] as const;

/** Session 5: the declared keep / ask first / never sort. */
export function PrivacySortActivity(props: LessonActivityProps) {
  const { step, lesson, isPreview, saveEvidence } = props;
  const evidenceStepId = lesson.steps.at(-1)!.id;
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [rule, setRule] = useState("");
  const [saved, setSaved] = useState(false);

  const buildEvidence = (): ResponsibleCreatorPromiseEvidence => ({
    kind: "responsible-creator-promise",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    scenarioChoices: Object.entries(choices).map(([scenarioId, choiceId]) => ({
      scenarioId,
      choiceId,
      responsible: choiceId !== "keep" || scenarioId === "lesson-progress",
    })),
    promise: rule,
  });

  return (
    <CanonicalShell step={step}>
      <div className="space-y-3">
        {PRIVACY_EXAMPLES.map((example) => (
          <fieldset key={example.id} className="rounded-2xl border border-slate-700 p-4">
            <legend className="px-2 text-sm font-semibold text-white">{example.label}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {PRIVACY_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={optionClass(choices[example.id] === choice)}
                  disabled={isPreview}
                  onClick={() => setChoices((current) => ({ ...current, [example.id]: choice }))}
                >
                  {choice === "ask-first" ? "Ask first" : choice[0].toUpperCase() + choice.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {step.kind === "discuss" || step.kind === "complete" ? (
        <EvidenceText
          label="One rule I would give a designer"
          value={rule}
          onChange={setRule}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          placeholder="Ask before keeping anything about a person."
          disabled={isPreview}
        />
      ) : null}
      {step.kind === "complete" ? (
        <SaveButton
          label="Save the design rule"
          disabled={isPreview || Object.keys(choices).length !== PRIVACY_EXAMPLES.length}
          saved={saved}
          onClick={() => {
            if (!isPreview) saveEvidence(buildEvidence());
            setSaved(true);
          }}
        />
      ) : null}
    </CanonicalShell>
  );
}

const FEATURE_CHANGES = [
  { id: "contrast", label: "Increase colour contrast", helps: "people who find low contrast hard to read" },
  { id: "motion", label: "Reduce decorative motion", helps: "people who need a calmer screen" },
  { id: "labels", label: "Add plain-language labels", helps: "people meeting the feature for the first time" },
] as const;

/** Session 6: exactly one design change, followed by a justification. */
export function SingleFeatureDesignActivity(props: LessonActivityProps) {
  const { step, lesson, isPreview, saveEvidence, pet } = props;
  const evidenceStepId = lesson.steps.at(-1)!.id;
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [saved, setSaved] = useState(false);
  const choice = FEATURE_CHANGES.find((item) => item.id === selected);

  const buildEvidence = (): BodyDesignComparisonEvidence => ({
    kind: "body-design-comparison",
    version: 1,
    lessonId: lesson.id,
    stepId: evidenceStepId,
    createdAt: evidenceTimestamp(),
    before: { ...pet.startingConfig },
    after: { ...pet.startingConfig, singleDesignChange: selected },
    chosenFeatures: {
      shape: selected || "unchanged",
      face: "unchanged",
      movement: "unchanged",
      surface: "unchanged",
    },
    reason: reason || (choice ? `This helps ${choice.helps}.` : ""),
    applied: false,
  });

  return (
    <CanonicalShell step={step}>
      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURE_CHANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={optionClass(selected === item.id)}
            disabled={isPreview}
            onClick={() => setSelected(item.id)}
          >
            <span className="block font-semibold">{item.label}</span>
            <span className="mt-2 block text-xs text-slate-400">Helps {item.helps}.</span>
          </button>
        ))}
      </div>
      {step.kind === "discuss" || step.kind === "complete" ? (
        <EvidenceText
          label="Who does your one change help, and who might it not help?"
          value={reason}
          onChange={setReason}
          onBlur={() => !isPreview && saveEvidence(buildEvidence())}
          placeholder="It helps… It might not help…"
          disabled={isPreview}
        />
      ) : null}
      {step.kind === "complete" ? (
        <SaveButton
          label="Save the one-change design"
          disabled={isPreview || !selected}
          saved={saved}
          onClick={() => {
            if (!isPreview) saveEvidence(buildEvidence());
            setSaved(true);
          }}
        />
      ) : null}
    </CanonicalShell>
  );
}

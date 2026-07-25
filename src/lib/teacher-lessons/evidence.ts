/**
 * Meta-Pet Teacher Lesson System — typed lesson evidence (Pass 2).
 *
 * Replaces the Pass 1 generic per-step text placeholder with a structured,
 * versioned, corruption-safe evidence model. Each lesson produces one evidence
 * kind (see {@link LessonEvidenceType}); the Runner and activities read/write
 * these entries through the progress store.
 *
 * Privacy contract (unchanged): no student real names, no accounts, local-only.
 * The structured data captured here is deliberately shaped so Pass 4 can build
 * a printable Learning Passport export without further migration.
 */

import type { LessonEvidenceType, LessonId } from "./types";

/** Current evidence schema version. Bump + migrate on breaking changes. */
export const LESSON_EVIDENCE_VERSION = 1;

/**
 * Timestamp helper for evidence entries. Activities call this from event
 * handlers (never during render) when building a {@link LessonEvidence}.
 */
export function evidenceTimestamp(): number {
  return Date.now();
}

/**
 * Optional record of whether/how an evidence entry's choice was applied to the
 * student's real Meta-Pet. Compact by design — never a full pet snapshot.
 */
export interface AppliedChangeMeta {
  appliedToPet: boolean;
  appliedAt?: number;
  updateType?:
    | "alias"
    | "body-design"
    | "dna-variation"
    | "preferred-visualisation";
  previousSnapshotAvailable?: boolean;
  undoAvailable?: boolean;
  applicationError?: string;
  appliedSummary?: string;
}

/** Fields shared by every evidence entry. */
export interface LessonEvidenceBase {
  kind: LessonEvidenceType;
  version: number;
  lessonId: LessonId;
  stepId: string;
  /** Optional short free-text the student added. Never a real name. */
  text?: string;
  /** Epoch ms when the evidence was saved. */
  createdAt: number;
  /** Optional real-pet application metadata (Pass 3). */
  appliedChange?: AppliedChangeMeta;
}

/** Lesson 1 — pet observation card. */
export interface PetObservationCardEvidence extends LessonEvidenceBase {
  kind: "pet-observation-card";
  alias: string;
  observations: {
    shape: string;
    surface: string;
    movement: string;
  };
  question: string;
  /** Predict stage: what the student expected before checking. */
  prediction?: string;
  /** Explain stage: what a changed signal tells us about the system inside. */
  explanation?: string;
  /** Optional compact config reference of the observed pet. */
  petConfigRef?: Record<string, unknown>;
}

/** Lesson 2 — before/after body design comparison. */
export interface BodyDesignComparisonEvidence extends LessonEvidenceBase {
  kind: "body-design-comparison";
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  chosenFeatures: {
    shape: string;
    face: string;
    movement: string;
    surface: string;
  };
  reason: string;
  /** Whether the student committed the design to their lesson pet. */
  applied: boolean;
  /** Predict stage: what the student expected before choosing a shape. */
  shapePrediction?: string;
}

/** Lesson 3 — single-gene DNA comparison. */
export interface DnaComparisonEvidence extends LessonEvidenceBase {
  kind: "dna-comparison";
  geneLabel: string;
  predicted: string;
  observed: string;
  stayedSame: string;
  beforeConfigRef?: Record<string, unknown>;
  afterConfigRef?: Record<string, unknown>;
  keptVariation: boolean;
}

/** Lesson 4 — cause and effect chain. */
export interface CauseEffectChainEvidence extends LessonEvidenceBase {
  kind: "cause-effect-chain";
  action: string;
  immediateEffect: string;
  secondaryEffect: string;
  petResponse: string;
  balancingActions: string[];
  /** Create stage: is the loop the class built helpful or harmful? */
  loopType?: "helpful" | "harmful";
  /** Create stage: prediction for changing only one part of the loop. */
  changedPartPrediction?: string;
}

/** Lesson 5 — emotion reflection. */
export interface EmotionReflectionEvidence extends LessonEvidenceBase {
  kind: "emotion-reflection";
  clues: string[];
  interpretation: string;
  helpedBy: string;
  alternativeExplanation: string;
  /** Predict stage: first guess made before gathering clue evidence. */
  firstGuess?: string;
}

/** Lesson 6 — visualisation selection. */
export interface VisualisationSelectionEvidence extends LessonEvidenceBase {
  kind: "visualisation-selection";
  selectedMode: string;
  patternNoticed: string;
  sharedFeature: string;
  reason: string;
  /** Predict stage: which representation the student expected to look like. */
  predictedMode?: string;
}

/** Lesson 7 — responsible creator promise. */
export interface ResponsibleCreatorPromiseEvidence extends LessonEvidenceBase {
  kind: "responsible-creator-promise";
  scenarioChoices: {
    scenarioId: string;
    choiceId: string;
    responsible: boolean;
    reasoning?: string;
  }[];
  promise: string;
  /** Predict stage: which competing need the class expected to matter most. */
  predictedPriorityNeed?: string;
  /** Explain stage: one trade-off the class made and why. */
  tradeOffExplanation?: string;
  /** Create stage: three system rules the class designed for the habitat. */
  systemRules?: string[];
  /** Create stage: a simple cause -> effect diagram for the habitat plan. */
  causeEffectDiagram?: { cause: string; effect: string }[];
}

/** Discriminated union of every evidence kind. */
export type LessonEvidence =
  | PetObservationCardEvidence
  | BodyDesignComparisonEvidence
  | DnaComparisonEvidence
  | CauseEffectChainEvidence
  | EmotionReflectionEvidence
  | VisualisationSelectionEvidence
  | ResponsibleCreatorPromiseEvidence;

const EVIDENCE_KINDS: LessonEvidenceType[] = [
  "pet-observation-card",
  "body-design-comparison",
  "dna-comparison",
  "cause-effect-chain",
  "emotion-reflection",
  "visualisation-selection",
  "responsible-creator-promise",
];

/** Type guard: is this string a known evidence kind? */
export function isEvidenceKind(value: unknown): value is LessonEvidenceType {
  return (
    typeof value === "string" &&
    EVIDENCE_KINDS.includes(value as LessonEvidenceType)
  );
}

/**
 * Validate an unknown value as a usable {@link LessonEvidence}, or return null.
 * Deliberately permissive about optional fields but strict about the
 * discriminant and required identifiers so corrupted local storage is dropped
 * rather than surfaced to a classroom.
 */
export function validateEvidence(raw: unknown): LessonEvidence | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<LessonEvidence> & Record<string, unknown>;
  if (!isEvidenceKind(value.kind)) return null;
  if (typeof value.lessonId !== "string") return null;
  if (typeof value.stepId !== "string") return null;

  const base = {
    kind: value.kind,
    version:
      typeof value.version === "number"
        ? value.version
        : LESSON_EVIDENCE_VERSION,
    lessonId: value.lessonId as LessonId,
    stepId: value.stepId,
    text: typeof value.text === "string" ? value.text : undefined,
    createdAt:
      typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    appliedChange: sanitizeAppliedChange(value.appliedChange),
  } satisfies LessonEvidenceBase;

  // Each kind keeps its own extra fields; we trust the activity that wrote them
  // but coerce arrays/strings defensively where they drive UI.
  switch (value.kind) {
    case "pet-observation-card":
      return {
        ...base,
        kind: "pet-observation-card",
        alias: asString(value.alias),
        observations: {
          shape: asString((value.observations as never)?.["shape"]),
          surface: asString((value.observations as never)?.["surface"]),
          movement: asString((value.observations as never)?.["movement"]),
        },
        question: asString(value.question),
        prediction: asOptionalString(value.prediction),
        explanation: asOptionalString(value.explanation),
        petConfigRef: asRecord(value.petConfigRef),
      };
    case "body-design-comparison":
      return {
        ...base,
        kind: "body-design-comparison",
        before: asRecord(value.before) ?? {},
        after: asRecord(value.after) ?? {},
        chosenFeatures: {
          shape: asString((value.chosenFeatures as never)?.["shape"]),
          face: asString((value.chosenFeatures as never)?.["face"]),
          movement: asString((value.chosenFeatures as never)?.["movement"]),
          surface: asString((value.chosenFeatures as never)?.["surface"]),
        },
        reason: asString(value.reason),
        applied: value.applied === true,
        shapePrediction: asOptionalString(value.shapePrediction),
      };
    case "dna-comparison":
      return {
        ...base,
        kind: "dna-comparison",
        geneLabel: asString(value.geneLabel),
        predicted: asString(value.predicted),
        observed: asString(value.observed),
        stayedSame: asString(value.stayedSame),
        beforeConfigRef: asRecord(value.beforeConfigRef),
        afterConfigRef: asRecord(value.afterConfigRef),
        keptVariation: value.keptVariation === true,
      };
    case "cause-effect-chain":
      return {
        ...base,
        kind: "cause-effect-chain",
        action: asString(value.action),
        immediateEffect: asString(value.immediateEffect),
        secondaryEffect: asString(value.secondaryEffect),
        petResponse: asString(value.petResponse),
        balancingActions: asStringArray(value.balancingActions),
        loopType:
          value.loopType === "helpful" || value.loopType === "harmful"
            ? value.loopType
            : undefined,
        changedPartPrediction: asOptionalString(value.changedPartPrediction),
      };
    case "emotion-reflection":
      return {
        ...base,
        kind: "emotion-reflection",
        clues: asStringArray(value.clues),
        interpretation: asString(value.interpretation),
        helpedBy: asString(value.helpedBy),
        alternativeExplanation: asString(value.alternativeExplanation),
        firstGuess: asOptionalString(value.firstGuess),
      };
    case "visualisation-selection":
      return {
        ...base,
        kind: "visualisation-selection",
        selectedMode: asString(value.selectedMode),
        patternNoticed: asString(value.patternNoticed),
        sharedFeature: asString(value.sharedFeature),
        reason: asString(value.reason),
        predictedMode: asOptionalString(value.predictedMode),
      };
    case "responsible-creator-promise":
      return {
        ...base,
        kind: "responsible-creator-promise",
        scenarioChoices: Array.isArray(value.scenarioChoices)
          ? value.scenarioChoices
              .filter((c) => !!c && typeof c === "object")
              .map((entry) => {
                const c = entry as Record<string, unknown>;
                return {
                  scenarioId: asString(c["scenarioId"]),
                  choiceId: asString(c["choiceId"]),
                  responsible: c["responsible"] === true,
                  reasoning:
                    typeof c["reasoning"] === "string"
                      ? (c["reasoning"] as string)
                      : undefined,
                };
              })
          : [],
        promise: asString(value.promise),
        predictedPriorityNeed: asOptionalString(value.predictedPriorityNeed),
        tradeOffExplanation: asOptionalString(value.tradeOffExplanation),
        systemRules: Array.isArray(value.systemRules)
          ? asStringArray(value.systemRules)
          : undefined,
        causeEffectDiagram: Array.isArray(value.causeEffectDiagram)
          ? value.causeEffectDiagram
              .filter((c) => !!c && typeof c === "object")
              .map((entry) => {
                const c = entry as Record<string, unknown>;
                return {
                  cause: asString(c["cause"]),
                  effect: asString(c["effect"]),
                };
              })
          : undefined,
      };
    default:
      return null;
  }
}

const UPDATE_TYPES = [
  "alias",
  "body-design",
  "dna-variation",
  "preferred-visualisation",
] as const;

/** Validate optional applied-change metadata, or return undefined. */
function sanitizeAppliedChange(raw: unknown): AppliedChangeMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Partial<AppliedChangeMeta> & Record<string, unknown>;
  const updateType =
    typeof value.updateType === "string" &&
    (UPDATE_TYPES as readonly string[]).includes(value.updateType)
      ? (value.updateType as AppliedChangeMeta["updateType"])
      : undefined;
  return {
    appliedToPet: value.appliedToPet === true,
    appliedAt: typeof value.appliedAt === "number" ? value.appliedAt : undefined,
    updateType,
    previousSnapshotAvailable:
      typeof value.previousSnapshotAvailable === "boolean"
        ? value.previousSnapshotAvailable
        : undefined,
    undoAvailable:
      typeof value.undoAvailable === "boolean" ? value.undoAvailable : undefined,
    applicationError:
      typeof value.applicationError === "string"
        ? value.applicationError
        : undefined,
    appliedSummary:
      typeof value.appliedSummary === "string" ? value.appliedSummary : undefined,
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

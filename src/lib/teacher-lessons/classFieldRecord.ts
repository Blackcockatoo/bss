/**
 * Meta-Pet Teacher Lesson System — Class Field Record.
 *
 * A lightweight, DERIVED (never separately stored) classroom evidence
 * summary — deliberately not an automated grade. For each lesson it surfaces
 * only: whether the lesson was completed, a class prediction, a class
 * observation, the lesson's key concept, and a class reflection, pulled from
 * whichever typed evidence fields best match those categories for that
 * lesson's evidence kind. No student names are included by default and no
 * sensitive information is stored — this mirrors the Learning Passport's
 * corruption-safe derivation in passport.ts.
 */

import { LESSON_DEFINITIONS } from "./lessonDefinitions";
import { selectLessonStatus } from "./lessonProgressStore";
import type { LessonEvidence } from "./evidence";
import type { LessonId, LessonProgressState } from "./types";

export const CLASS_FIELD_RECORD_VERSION = 1;

export interface ClassFieldRecordEntry {
  lessonId: LessonId;
  lessonNumber: number;
  lessonTitle: string;
  completed: boolean;
  completedAt: number | null;
  keyConcept: string;
  /** Class prediction, or a plain placeholder when not yet recorded. */
  classPrediction: string;
  /** Class observation, or a plain placeholder when not yet recorded. */
  classObservation: string;
  /** Class reflection, or a plain placeholder when not yet recorded. */
  classReflection: string;
  hasEvidence: boolean;
}

export interface ClassFieldRecord {
  version: number;
  generatedAt: number;
  entries: ClassFieldRecordEntry[];
  completedLessons: number;
  totalLessons: number;
}

const NOT_RECORDED = "Not recorded yet";

/**
 * Pull the closest-matching prediction / observation / reflection text out of
 * one lesson's typed evidence. Every lesson's evidence kind is shaped
 * differently, so this is a small, explicit mapping rather than a generic
 * reflection over unknown fields.
 */
function extractClassFields(evidence: LessonEvidence): {
  prediction: string;
  observation: string;
  reflection: string;
} {
  switch (evidence.kind) {
    case "pet-observation-card":
      return {
        prediction: evidence.prediction || NOT_RECORDED,
        observation:
          [
            evidence.observations.shape,
            evidence.observations.surface,
            evidence.observations.movement,
          ]
            .filter(Boolean)
            .join(", ") || NOT_RECORDED,
        reflection: evidence.explanation || evidence.question || NOT_RECORDED,
      };
    case "body-design-comparison":
      return {
        prediction: evidence.shapePrediction || NOT_RECORDED,
        observation:
          [
            evidence.chosenFeatures.shape,
            evidence.chosenFeatures.face,
            evidence.chosenFeatures.movement,
            evidence.chosenFeatures.surface,
          ]
            .filter(Boolean)
            .join(", ") || NOT_RECORDED,
        reflection: evidence.reason || NOT_RECORDED,
      };
    case "dna-comparison":
      return {
        prediction: evidence.predicted || NOT_RECORDED,
        observation: evidence.observed || NOT_RECORDED,
        reflection: evidence.stayedSame || NOT_RECORDED,
      };
    case "cause-effect-chain":
      return {
        prediction: evidence.changedPartPrediction || NOT_RECORDED,
        observation:
          [evidence.immediateEffect, evidence.secondaryEffect]
            .filter(Boolean)
            .join(" then ") || NOT_RECORDED,
        reflection: evidence.loopType
          ? `The class classified this loop as ${evidence.loopType}.`
          : NOT_RECORDED,
      };
    case "emotion-reflection":
      return {
        prediction: evidence.firstGuess || NOT_RECORDED,
        observation: evidence.clues.join(", ") || NOT_RECORDED,
        reflection:
          evidence.alternativeExplanation || evidence.helpedBy || NOT_RECORDED,
      };
    case "visualisation-selection":
      return {
        prediction: evidence.predictedMode || NOT_RECORDED,
        observation:
          evidence.patternNoticed || evidence.sharedFeature || NOT_RECORDED,
        reflection: evidence.reason || NOT_RECORDED,
      };
    case "responsible-creator-promise":
      return {
        prediction: evidence.predictedPriorityNeed || NOT_RECORDED,
        observation: evidence.tradeOffExplanation || NOT_RECORDED,
        reflection: evidence.promise || NOT_RECORDED,
      };
    default:
      return { prediction: NOT_RECORDED, observation: NOT_RECORDED, reflection: NOT_RECORDED };
  }
}

/**
 * Derive the Class Field Record from local lesson progress. Always returns a
 * usable object, even from an empty or partly-corrupted progress state — the
 * same safety contract as {@link deriveLearningPassport}.
 */
export function deriveClassFieldRecord(
  progress: LessonProgressState,
  now: number = Date.now(),
): ClassFieldRecord {
  const entries: ClassFieldRecordEntry[] = [];
  let completedLessons = 0;

  for (const lesson of LESSON_DEFINITIONS) {
    const record = progress?.records?.[lesson.id];
    let status: ReturnType<typeof selectLessonStatus> = "not-started";
    try {
      status = selectLessonStatus(progress, lesson.id);
    } catch {
      status = "not-started";
    }
    const completed = status === "completed";
    if (completed) completedLessons += 1;

    const evidenceStepId = lesson.steps[lesson.steps.length - 1]?.id;
    const rawEvidence =
      record && evidenceStepId ? record.evidenceEntries?.[evidenceStepId] : undefined;
    const evidence: LessonEvidence | null =
      rawEvidence && rawEvidence.kind === lesson.evidenceType ? rawEvidence : null;

    const fields = evidence
      ? extractClassFields(evidence)
      : { prediction: NOT_RECORDED, observation: NOT_RECORDED, reflection: NOT_RECORDED };

    entries.push({
      lessonId: lesson.id,
      lessonNumber: lesson.number,
      lessonTitle: lesson.title,
      completed,
      completedAt: record?.completedAt ?? null,
      keyConcept: lesson.keyConcept,
      classPrediction: fields.prediction,
      classObservation: fields.observation,
      classReflection: fields.reflection,
      hasEvidence: evidence !== null,
    });
  }

  return {
    version: CLASS_FIELD_RECORD_VERSION,
    generatedAt: now,
    entries,
    completedLessons,
    totalLessons: LESSON_DEFINITIONS.length,
  };
}

/** Whether the record has anything worth showing/printing yet. */
export function classFieldRecordHasContent(record: ClassFieldRecord): boolean {
  return record.entries.some((entry) => entry.completed || entry.hasEvidence);
}

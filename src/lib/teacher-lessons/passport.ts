/**
 * Meta-Pet Teacher Lesson System — Learning Passport model (Pass 3).
 *
 * A derived, versioned view aggregating typed evidence from all seven lessons
 * plus the current pet's safe display data. It is DERIVED, never stored as a
 * large duplicated object: the lesson evidence remains the source of truth.
 * Derivation is corruption-safe — a bad section degrades to a placeholder and
 * never breaks the passport.
 */

import { LESSON_DEFINITIONS } from "./lessonDefinitions";
import { selectLessonStatus } from "./lessonProgressStore";
import type { LessonEvidence } from "./evidence";
import type {
  LessonCardStatus,
  LessonEvidenceType,
  LessonId,
  LessonProgressState,
} from "./types";

export const LEARNING_PASSPORT_VERSION = 1;

export interface PassportLessonSection {
  lessonId: LessonId;
  number: number;
  title: string;
  status: LessonCardStatus;
  expectedEvidenceType: LessonEvidenceType;
  /** The typed evidence for this lesson, if present and valid. */
  evidence: LessonEvidence | null;
  hasEvidence: boolean;
  /** True when a completed lesson is missing its evidence. */
  missingEvidence: boolean;
  /** True when stored evidence doesn't match the expected kind. */
  corrupted: boolean;
}

export interface PassportAppliedChange {
  lessonId: LessonId;
  updateType: string;
  summary: string;
  appliedAt: number | null;
}

export interface LearningPassport {
  version: number;
  /** Safe display alias (may be empty). */
  alias: string;
  hasPet: boolean;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  sections: PassportLessonSection[];
  appliedChanges: PassportAppliedChange[];
  dateRange: { first: number | null; last: number | null };
  createdAt: number;
}

/** Inputs the passport is derived from (kept minimal + explicit for testing). */
export interface PassportInputs {
  progress: LessonProgressState;
  alias: string;
  hasPet: boolean;
}

/**
 * Derive the Learning Passport. Always returns a usable object, even from an
 * empty or partly-corrupted progress state.
 */
export function deriveLearningPassport(inputs: PassportInputs): LearningPassport {
  const { progress, alias, hasPet } = inputs;
  const sections: PassportLessonSection[] = [];
  const appliedChanges: PassportAppliedChange[] = [];
  let completed = 0;
  let first: number | null = null;
  let last: number | null = null;
  let evidenceAlias = "";

  for (const lesson of LESSON_DEFINITIONS) {
    const record = progress?.records?.[lesson.id];
    const status = safeStatus(progress, lesson.id);
    if (status === "completed") completed += 1;

    const evidenceStepId = lesson.steps[lesson.steps.length - 1]?.id;
    const rawEvidence =
      record && evidenceStepId
        ? record.evidenceEntries?.[evidenceStepId]
        : undefined;

    const evidence: LessonEvidence | null = rawEvidence ?? null;
    const corrupted =
      evidence !== null && evidence.kind !== lesson.evidenceType;
    const hasEvidence = evidence !== null && !corrupted;
    const missingEvidence = status === "completed" && !hasEvidence;

    if (evidence) {
      if (
        !evidenceAlias &&
        evidence.kind === "pet-observation-card" &&
        typeof evidence.alias === "string"
      ) {
        evidenceAlias = evidence.alias.trim();
      }
      if (typeof evidence.createdAt === "number") {
        first = first === null ? evidence.createdAt : Math.min(first, evidence.createdAt);
        last = last === null ? evidence.createdAt : Math.max(last, evidence.createdAt);
      }
      const applied = evidence.appliedChange;
      if (applied?.appliedToPet && applied.updateType) {
        appliedChanges.push({
          lessonId: lesson.id,
          updateType: applied.updateType,
          summary: applied.appliedSummary ?? "Change applied to Meta-Pet.",
          appliedAt: applied.appliedAt ?? null,
        });
      }
    }

    sections.push({
      lessonId: lesson.id,
      number: lesson.number,
      title: lesson.title,
      status,
      expectedEvidenceType: lesson.evidenceType,
      evidence: corrupted ? null : evidence,
      hasEvidence,
      missingEvidence,
      corrupted,
    });
  }

  const total = LESSON_DEFINITIONS.length;
  return {
    version: LEARNING_PASSPORT_VERSION,
    alias:
      typeof alias === "string" && alias.trim()
        ? alias.trim()
        : evidenceAlias,
    hasPet: hasPet === true,
    completedLessons: completed,
    totalLessons: total,
    completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    sections,
    appliedChanges,
    dateRange: { first, last },
    createdAt: Date.now(),
  };
}

function safeStatus(
  progress: LessonProgressState | undefined,
  lessonId: LessonId,
): LessonCardStatus {
  if (!progress) return "not-started";
  try {
    return selectLessonStatus(progress, lessonId);
  } catch {
    return "not-started";
  }
}

/** Whether a passport has anything worth showing/printing. */
export function passportHasContent(passport: LearningPassport): boolean {
  return (
    passport.completedLessons > 0 ||
    passport.sections.some((s) => s.hasEvidence)
  );
}

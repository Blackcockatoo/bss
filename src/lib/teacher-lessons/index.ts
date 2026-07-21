/**
 * Meta-Pet Teacher Lesson System — public module surface (Pass 1).
 *
 * Components and routes import from here so later passes can reorganise the
 * internals without touching call sites.
 */

export * from "./types";
export {
  LESSON_DEFINITIONS,
  LESSON_IDS,
  TOTAL_LESSONS,
  getLessonById,
  getLessonBySlug,
  isLessonId,
} from "./lessonDefinitions";
export {
  TEACHER_HUB_PATH,
  LESSON_BASE_PATH,
  buildTeacherHubPath,
  buildLessonPath,
  resolveStepIndex,
  resolveLessonId,
  parsePreviewFlag,
  parseViewMode,
  type LessonLinkOptions,
} from "./lessonRouting";
export {
  LESSON_PROGRESS_STORAGE_KEY,
  useLessonProgressStore,
  useLessonProgressHydrated,
  sanitizeState,
  selectRecord,
  selectLessonStatus,
  selectProgressSummary,
  type LessonProgressStore,
} from "./lessonProgressStore";
export {
  LESSON_EVIDENCE_VERSION,
  evidenceTimestamp,
  isEvidenceKind,
  validateEvidence,
  type LessonEvidence,
  type LessonEvidenceBase,
  type PetObservationCardEvidence,
  type BodyDesignComparisonEvidence,
  type DnaComparisonEvidence,
  type CauseEffectChainEvidence,
  type EmotionReflectionEvidence,
  type VisualisationSelectionEvidence,
  type ResponsibleCreatorPromiseEvidence,
} from "./evidence";
export * from "./lessonPet";
export * from "./lessonVitals";
export {
  isFeatureAvailable,
  resolveLessonAvailability,
  setFeatureAvailabilityOverrides,
  type FeatureAvailability,
} from "./featureFlags";
export {
  LESSON_TIMING_MODES,
  DEFAULT_TIMING_MODE,
  getTimingModeMeta,
  isTimingMode,
  type LessonTimingMode,
  type LessonTimingModeMeta,
} from "./timing";

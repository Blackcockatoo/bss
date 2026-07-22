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
export {
  PET_PROFILE_STORAGE_KEY,
  MIN_ALIAS_LENGTH,
  MAX_ALIAS_LENGTH,
  usePetProfileStore,
  usePetProfileHydrated,
  normaliseAlias,
  getAliasError,
  isPreferredDnaView,
  sanitizePetProfile,
  type PreferredDnaView,
  type PetProfileState,
} from "./petProfile";
export {
  PET_UPDATE_STORAGE_KEY,
  usePetUpdateStore,
  readRealPetSnapshot,
  isValidGenome,
  toAppliedChange,
  applyAlias,
  undoAlias,
  applyBodyDesign,
  undoBodyDesign,
  applyDnaVariation,
  restorePreviousDna,
  applyPreferredVisualisation,
  undoPreferredVisualisation,
  type PetUpdateType,
  type PetUpdateContext,
  type PetUpdateResult,
  type RealPetSnapshot,
} from "./petUpdate";
export {
  LEARNING_PASSPORT_VERSION,
  deriveLearningPassport,
  passportHasContent,
  type LearningPassport,
  type PassportLessonSection,
  type PassportAppliedChange,
  type PassportInputs,
} from "./passport";
export {
  type AppliedChangeMeta,
} from "./evidence";
export {
  setClassroomFocusActive,
  isClassroomFocusActive,
  useClassroomFocusActive,
} from "./classroomFocusSignal";
export {
  PILOT_STORAGE_KEY,
  PILOT_CHECKLIST,
  PILOT_FEEDBACK_QUESTIONS,
  usePilotStore,
  sanitizePilotState,
  type PilotFeedbackEntry,
} from "./pilot";

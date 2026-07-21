import type {
  LessonDefinition,
  LessonEvidence,
  LessonPresentationMode,
  LessonProgressRecord,
  LessonStepDefinition,
  LessonTimingModeMeta,
  LessonViewMode,
} from "@/lib/teacher-lessons";
import type { LessonPetContext } from "./useLessonPet";

/**
 * The single, generic contract every lesson activity component receives. The
 * shared LessonRunner passes this down without any per-lesson branching; each
 * activity adapts internally to the current step, view mode and presentation.
 */
export interface LessonActivityProps {
  lesson: LessonDefinition;
  step: LessonStepDefinition;
  stepIndex: number;
  viewMode: LessonViewMode;
  /** Preview mode is read-only: activities must not persist anything. */
  isPreview: boolean;
  presentationMode: LessonPresentationMode;
  timing: LessonTimingModeMeta;
  reducedMotion: boolean;
  pet: LessonPetContext;
  /** The live progress record for the current lesson (read-only view). */
  record: LessonProgressRecord;
  /** Read any saved evidence for the current lesson, keyed by step id. */
  getEvidence: (stepId: string) => LessonEvidence | undefined;
  /** Save a typed evidence entry against the current step. No-op in preview. */
  saveEvidence: (evidence: LessonEvidence) => void;
  /** Open the "Ask teacher for help" surface. */
  onAskForHelp: () => void;
}

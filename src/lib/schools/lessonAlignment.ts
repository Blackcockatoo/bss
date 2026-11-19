import {
  curriculumAlignmentForSession,
  type CurriculumAlignment,
} from "@/lib/schools/curriculumAlignment";
import { foundationAlignmentFor } from "@/lib/schools/foundationCurriculum";
import { isFoundationSessionId } from "@/lib/schools/foundationSequence";

/**
 * Curriculum codes and official wording already attached to a lesson.
 * Looks up F–2 lessons by id so their 1–7 numbering cannot collide with
 * the Years 3–6 sequence.
 */
export function curriculumAlignmentForLesson(lesson: {
  id: string;
  number: number;
}): CurriculumAlignment {
  if (isFoundationSessionId(lesson.id)) {
    return foundationAlignmentFor(lesson.id);
  }
  return curriculumAlignmentForSession(lesson.number);
}

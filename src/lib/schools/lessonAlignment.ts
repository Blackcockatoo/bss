import {
  curriculumAlignmentForSession,
  type CurriculumAlignment,
} from "@/lib/schools/curriculumAlignment";
import {
  foundationAlignmentFor,
  officialWordingForCodes as officialF2WordingForCodes,
} from "@/lib/schools/foundationCurriculum";
import { isFoundationSessionId } from "@/lib/schools/foundationSequence";
import {
  officialY78WordingForCodes,
  years78AlignmentFor,
} from "@/lib/schools/years78Curriculum";
import { isYears78SessionId } from "@/lib/schools/years78Sequence";
import {
  officialTopicalWordingForCodes,
  topicalAlignmentFor,
} from "@/lib/schools/topicalCurriculum";
import { isTopicalSessionId } from "@/lib/schools/topicalSequence";
import type { OfficialContentDescription } from "@/lib/schools/foundationCurriculum";

/**
 * Curriculum codes and official wording already attached to a lesson.
 * Looks up F–2 and Years 7–8 lessons by id so their 1–7 numbering cannot
 * collide with the Years 3–6 sequence.
 */
export function curriculumAlignmentForLesson(lesson: {
  id: string;
  number: number;
}): CurriculumAlignment {
  if (isFoundationSessionId(lesson.id)) {
    return foundationAlignmentFor(lesson.id);
  }
  if (isYears78SessionId(lesson.id)) {
    return years78AlignmentFor(lesson.id);
  }
  if (isTopicalSessionId(lesson.id)) {
    return topicalAlignmentFor(lesson.id);
  }
  return curriculumAlignmentForSession(lesson.number);
}

/** Official wording already copied from ACARA sources for a lesson’s codes. */
export function officialWordingForLessonCodes(
  codes: readonly string[],
): OfficialContentDescription[] {
  const seen = new Set<string>();
  const wording: OfficialContentDescription[] = [];
  for (const official of [
    ...officialF2WordingForCodes(codes),
    ...officialY78WordingForCodes(codes),
    ...officialTopicalWordingForCodes(codes),
  ]) {
    if (seen.has(official.code)) continue;
    seen.add(official.code);
    wording.push(official);
  }
  return wording;
}

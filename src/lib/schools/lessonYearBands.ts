export const LESSON_AUDIENCE_BANDS = [
  "foundation",
  "years-1-2",
  "years-3-6",
] as const;

export type LessonAudienceBand = (typeof LESSON_AUDIENCE_BANDS)[number];

export const LESSON_AUDIENCE_BAND_LABELS: Record<LessonAudienceBand, string> = {
  foundation: "Foundation",
  "years-1-2": "Years 1–2",
  "years-3-6": "Years 3–6",
};

export function lessonAudienceLabel(yearBand: LessonAudienceBand): string {
  return LESSON_AUDIENCE_BAND_LABELS[yearBand];
}

export function lessonSetLabel(yearBand: LessonAudienceBand): string {
  return yearBand === "years-3-6" ? "Years 3–6" : "F–2 unplugged";
}

export function lessonDisplayTitle(lesson: {
  yearBand: LessonAudienceBand;
  number: number;
  title: string;
}): string {
  if (lesson.yearBand === "years-3-6") {
    return `Lesson ${lesson.number}: ${lesson.title}`;
  }
  return `${lessonAudienceLabel(lesson.yearBand)} lesson ${lesson.number}: ${lesson.title}`;
}

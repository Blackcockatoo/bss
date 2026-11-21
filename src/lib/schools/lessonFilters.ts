import { plannerExtrasFor } from "@/lib/schools/classroomPack";
import { mergeLearningAreas } from "@/lib/schools/curriculumAlignment";
import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { lessonAudienceLabel, lessonSetLabel } from "@/lib/schools/lessonYearBands";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

export const LESSON_YEAR_BAND_FILTERS = ["f", "1-2", "3-4", "5-6", "7-8"] as const;
export const LESSON_MINUTES_FILTERS = [15, 20, 45] as const;

export type LessonYearBandFilter = (typeof LESSON_YEAR_BAND_FILTERS)[number];
export type LessonMinutesFilter = (typeof LESSON_MINUTES_FILTERS)[number];

export interface LessonSearchFilters {
  query: string;
  yearBand: LessonYearBandFilter | null;
  minutes: LessonMinutesFilter | null;
  code: string | null;
  paperFriendly: boolean;
}

export const EMPTY_LESSON_FILTERS: LessonSearchFilters = {
  query: "",
  yearBand: null,
  minutes: null,
  code: null,
  paperFriendly: false,
};

export const LESSON_YEAR_BAND_LABELS: Record<LessonYearBandFilter, string> = {
  f: "Foundation",
  "1-2": "Years 1–2",
  "3-4": "Years 3–4",
  "5-6": "Years 5–6",
  "7-8": "Years 7–8",
};

/**
 * The year identifier already present in a published AC v9 code string:
 * F for Foundation, 2 for Years 1–2, 4 for Years 3–4, 6 for Years 5–6,
 * 8 for Years 7–8. This reads the code only; it does not add a new
 * curriculum claim.
 */
export function yearBandsInPublishedCode(
  code: string,
): readonly LessonYearBandFilter[] {
  if (/^AC9[A-Z]+F/.test(code)) return ["f"];
  const match = /^AC9[A-Z]+([2468])/.exec(code);
  if (match?.[1] === "2") return ["1-2"];
  if (match?.[1] === "4") return ["3-4"];
  if (match?.[1] === "6") return ["5-6"];
  if (match?.[1] === "8") return ["7-8"];
  return [];
}

export function publishedCurriculumCodes(): string[] {
  const codes = new Set<string>();
  for (const lesson of ALL_LESSON_DEFINITIONS) {
    for (const code of curriculumAlignmentForLesson(lesson).codes) {
      codes.add(code);
    }
  }
  return [...codes].sort();
}

export function isPaperFriendlyLesson(lesson: LessonDefinition): boolean {
  const paper = plannerExtrasFor(lesson.id).paper;
  return (
    paper.kind === "works-on-paper" ||
    paper.label.startsWith("Can be run on paper")
  );
}

function firstParam(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
  key: string,
): string {
  if (params instanceof URLSearchParams) {
    return params.get(key)?.trim() ?? "";
  }
  const value = params[key];
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function parseLessonSearchParams(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
): LessonSearchFilters {
  const query = firstParam(params, "q");
  const yearRaw = firstParam(params, "years");
  const minutesRaw = Number(firstParam(params, "minutes"));
  const codeRaw = firstParam(params, "code");
  const paperRaw = firstParam(params, "paper").toLowerCase();
  const yearBand = LESSON_YEAR_BAND_FILTERS.includes(
    yearRaw as LessonYearBandFilter,
  )
    ? (yearRaw as LessonYearBandFilter)
    : null;
  const minutes = LESSON_MINUTES_FILTERS.includes(
    minutesRaw as LessonMinutesFilter,
  )
    ? (minutesRaw as LessonMinutesFilter)
    : null;
  const allowedCodes = publishedCurriculumCodes();
  const code = allowedCodes.includes(codeRaw) ? codeRaw : null;
  const paperFriendly = paperRaw === "yes" || paperRaw === "1";

  return {
    query: query.slice(0, 120),
    yearBand,
    minutes,
    code,
    paperFriendly,
  };
}

export function lessonFilterSearchString(
  filters: LessonSearchFilters,
): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.yearBand) params.set("years", filters.yearBand);
  if (filters.minutes) params.set("minutes", String(filters.minutes));
  if (filters.code) params.set("code", filters.code);
  if (filters.paperFriendly) params.set("paper", "yes");
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function hasActiveLessonFilters(filters: LessonSearchFilters): boolean {
  return Boolean(
    filters.query ||
      filters.yearBand ||
      filters.minutes ||
      filters.code ||
      filters.paperFriendly,
  );
}

function normaliseSearchText(value: string): string {
  return value.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}

export function lessonSearchHaystack(lesson: LessonDefinition): string {
  const alignment = curriculumAlignmentForLesson(lesson);
  const areas = mergeLearningAreas(lesson.learningAreas, alignment.learningAreas);
  const paper = plannerExtrasFor(lesson.id).paper;
  return [
    `lesson ${lesson.number}`,
    `session ${lesson.number}`,
    lesson.title,
    lesson.shortDescription,
    lesson.learningIntention,
    lesson.slug,
    `${lesson.durationMinutes} minutes`,
    lessonAudienceLabel(lesson.yearBand),
    lessonSetLabel(lesson.yearBand),
    lesson.yearBand === "years-3-6" ? "" : "unplugged",
    ...areas,
    ...alignment.codes,
    paper.label,
    paper.kind,
  ].join(" ");
}

export function lessonMatchesFilters(
  lesson: LessonDefinition,
  filters: LessonSearchFilters,
): boolean {
  if (filters.minutes && lesson.durationMinutes !== filters.minutes) {
    return false;
  }
  if (filters.paperFriendly && !isPaperFriendlyLesson(lesson)) {
    return false;
  }

  const alignment = curriculumAlignmentForLesson(lesson);
  if (filters.code && !alignment.codes.includes(filters.code)) {
    return false;
  }
  if (filters.yearBand) {
    const matchesBand = alignment.codes.some((code) =>
      yearBandsInPublishedCode(code).includes(filters.yearBand!),
    );
    if (!matchesBand) return false;
  }
  if (filters.query) {
    const haystack = normaliseSearchText(lessonSearchHaystack(lesson));
    const needle = normaliseSearchText(filters.query);
    if (!needle || !haystack.includes(needle)) return false;
  }
  return true;
}

export function filterLessons(
  lessons: readonly LessonDefinition[],
  filters: LessonSearchFilters,
): LessonDefinition[] {
  return lessons.filter((lesson) => lessonMatchesFilters(lesson, filters));
}

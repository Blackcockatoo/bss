/**
 * Australian Curriculum v9 alignment already published on the /schools page.
 * This module inverts that mapping so lesson cards can show the same codes
 * without inventing new ones.
 */

export interface LearningOutcome {
  statement: string;
  lessons: string;
  codes: string[];
}

export const learningOutcomes: LearningOutcome[] = [
  {
    statement:
      "Explain that a digital system responds to inputs and changes state over time.",
    lessons: "Sessions 1, 2 and 4",
    codes: ["AC9TDI4K01", "AC9TDI4P02", "AC9TDI6P02"],
  },
  {
    statement:
      "Read the signals a system shows and use them to make a reasoned choice.",
    lessons: "Sessions 1, 2 and 3",
    codes: ["AC9TDI4K03", "AC9TDI4P04", "AC9TDI6K03"],
  },
  {
    statement:
      "Describe simple if-then rules, cause and effect, and patterns in a system.",
    lessons: "Sessions 4 and 7",
    codes: ["AC9TDI4P02", "AC9TDI6P05", "AC9TDI6P06"],
  },
  {
    statement:
      "Use classroom wellbeing language to name a signal, a response and a settling strategy.",
    lessons: "Sessions 2 and 5",
    codes: ["AC9HP4P05", "AC9HP6P05", "AC9HP4P08"],
  },
  {
    statement:
      "Work with others to compare observations, justify a design choice and reflect on responsible digital use.",
    lessons: "Sessions 3, 5, 6 and 7",
    codes: ["AC9HP4P03", "AC9HP6P03", "AC9HP6P08"],
  },
];

const CODE_LEARNING_AREAS: { prefix: string; area: string }[] = [
  { prefix: "AC9TDI", area: "Digital Technologies" },
  { prefix: "AC9HP", area: "Health and Physical Education" },
];

export function sessionNumbersFromLessonsLabel(lessons: string): number[] {
  return [...lessons.matchAll(/\d+/g)].map((match) => Number(match[0]));
}

export function outcomesForSession(sessionNumber: number): LearningOutcome[] {
  return learningOutcomes.filter((outcome) =>
    sessionNumbersFromLessonsLabel(outcome.lessons).includes(sessionNumber),
  );
}

export function curriculumCodesForSession(sessionNumber: number): string[] {
  const codes = outcomesForSession(sessionNumber).flatMap(
    (outcome) => outcome.codes,
  );
  return [...new Set(codes)];
}

export function learningAreasFromCodes(codes: readonly string[]): string[] {
  const areas: string[] = [];
  for (const { prefix, area } of CODE_LEARNING_AREAS) {
    if (codes.some((code) => code.startsWith(prefix))) {
      areas.push(area);
    }
  }
  return areas;
}

export interface CurriculumAlignment {
  codes: string[];
  learningAreas: string[];
  outcomes: LearningOutcome[];
}

export function curriculumAlignmentForSession(sessionNumber: number): CurriculumAlignment {
  const outcomes = outcomesForSession(sessionNumber);
  const codes = curriculumCodesForSession(sessionNumber);
  return {
    codes,
    learningAreas: learningAreasFromCodes(codes),
    outcomes,
  };
}

export function mergeLearningAreas(
  authored: readonly string[],
  fromCodes: readonly string[],
): string[] {
  const merged: string[] = [];
  for (const area of [...fromCodes, ...authored]) {
    if (!merged.includes(area)) {
      merged.push(area);
    }
  }
  return merged;
}

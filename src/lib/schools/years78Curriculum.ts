import type {
  CurriculumAlignment,
  LearningOutcome,
} from "@/lib/schools/curriculumAlignment";
import { learningAreasFromCodes } from "@/lib/schools/curriculumAlignment";
import {
  type Years78SessionId,
  YEARS_78_SESSIONS,
} from "@/lib/schools/years78Sequence";

/**
 * Official Australian Curriculum v9 Digital Technologies wording for the
 * Years 7–8 bridge unit. Content-description text is taken from official
 * ACARA sources listed below. No wording has been added or invented.
 *
 * Sources checked on 20 November 2026, Australia/Sydney (HTTP 200):
 * - official ACARA 7–10 Digital Technologies curriculum content document
 * - official ACARA F–10 Digital Technologies scope and sequence
 */

export interface OfficialContentDescription {
  code: string;
  wording: string;
}

export const YEARS_78_CURRICULUM_SOURCES = [
  {
    title: "Digital Technologies curriculum content 7–10 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-curriculum-content-7-10-v9.docx",
    publisher: "ACARA",
    notes:
      "Official downloadable curriculum content for Years 7 to 10. Checked 20 November 2026, Australia/Sydney (HTTP 200).",
  },
  {
    title: "Digital Technologies scope and sequence F–10 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-scope-and-sequence-f-10-v9.docx",
    publisher: "ACARA",
    notes:
      "Official downloadable scope and sequence. Checked 20 November 2026, Australia/Sydney (HTTP 200).",
  },
] as const;

export const OFFICIAL_Y78_CONTENT_DESCRIPTIONS = {
  AC9TDI8K01: {
    code: "AC9TDI8K01",
    wording:
      "explain how hardware specifications affect performance and select appropriate hardware for particular tasks and workloads",
  },
  AC9TDI8K03: {
    code: "AC9TDI8K03",
    wording:
      "investigate how digital systems represent text, image and audio data using integers",
  },
  AC9TDI8K04: {
    code: "AC9TDI8K04",
    wording:
      "explain how and why digital systems represent integers in binary",
  },
  AC9TDI8P04: {
    code: "AC9TDI8P04",
    wording:
      "define and decompose real-world problems with design criteria and by creating user stories",
  },
  AC9TDI8P05: {
    code: "AC9TDI8P05",
    wording:
      "design algorithms involving nested control structures and represent them using flowcharts and pseudocode",
  },
  AC9TDI8P06: {
    code: "AC9TDI8P06",
    wording:
      "trace algorithms to predict output for a given input and to identify errors",
  },
  AC9TDI8P10: {
    code: "AC9TDI8P10",
    wording:
      "evaluate existing and student solutions against the design criteria, user stories and possible future impact",
  },
  AC9TDI8P14: {
    code: "AC9TDI8P14",
    wording:
      "investigate and manage the digital footprint existing systems and student solutions collect, and assess if the data is essential to their purpose",
  },
} as const satisfies Record<string, OfficialContentDescription>;

export type OfficialY78Code = keyof typeof OFFICIAL_Y78_CONTENT_DESCRIPTIONS;

export const ALLOWED_Y78_CURRICULUM_CODES: readonly OfficialY78Code[] = [
  "AC9TDI8K01",
  "AC9TDI8K03",
  "AC9TDI8K04",
  "AC9TDI8P06",
  "AC9TDI8P05",
  "AC9TDI8P14",
  "AC9TDI8P04",
  "AC9TDI8P10",
];

const SESSION_CODES: Record<Years78SessionId, readonly OfficialY78Code[]> = {
  "hardware-for-the-job": ["AC9TDI8K01"],
  "data-as-numbers": ["AC9TDI8K03"],
  "why-binary": ["AC9TDI8K04"],
  "trace-the-algorithm": ["AC9TDI8P06"],
  "design-an-algorithm": ["AC9TDI8P05"],
  "what-data-is-essential": ["AC9TDI8P14"],
  "evaluate-a-system-for-a-user": ["AC9TDI8P04", "AC9TDI8P10"],
};

function officialOutcome(
  codes: readonly OfficialY78Code[],
  lessons: string,
): LearningOutcome {
  return {
    statement: codes
      .map((code) => OFFICIAL_Y78_CONTENT_DESCRIPTIONS[code].wording)
      .join("; "),
    lessons,
    codes: [...codes],
  };
}

const SESSION_OUTCOMES: Record<Years78SessionId, LearningOutcome[]> =
  Object.fromEntries(
    YEARS_78_SESSIONS.map((session) => {
      const codes = SESSION_CODES[session.id];
      return [
        session.id,
        [
          officialOutcome(
            codes,
            `Years 7–8 lesson ${session.number}: ${session.title}`,
          ),
        ],
      ];
    }),
  ) as Record<Years78SessionId, LearningOutcome[]>;

export function officialY78WordingForCodes(
  codes: readonly string[],
): OfficialContentDescription[] {
  return codes.flatMap((code) => {
    const official =
      OFFICIAL_Y78_CONTENT_DESCRIPTIONS[code as OfficialY78Code];
    return official ? [official] : [];
  });
}

export function years78AlignmentFor(id: Years78SessionId): CurriculumAlignment {
  const outcomes = SESSION_OUTCOMES[id] ?? [];
  const codes = [...(SESSION_CODES[id] ?? [])];
  return {
    codes,
    learningAreas: learningAreasFromCodes(codes),
    outcomes,
  };
}

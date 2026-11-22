import type {
  CurriculumAlignment,
  LearningOutcome,
} from "@/lib/schools/curriculumAlignment";
import { learningAreasFromCodes } from "@/lib/schools/curriculumAlignment";
import type { OfficialContentDescription } from "@/lib/schools/foundationCurriculum";
import {
  OFFICIAL_Y78_CONTENT_DESCRIPTIONS,
  type OfficialY78Code,
} from "@/lib/schools/years78Curriculum";
import {
  type TopicalSessionId,
  TOPICAL_SESSIONS,
} from "@/lib/schools/topicalSequence";

/**
 * Official Australian Curriculum v9 Digital Technologies wording for the
 * Years 5–8 topical mini-lessons. Content-description text is copied from the
 * official ACARA sources listed below. No wording has been added or invented.
 *
 * Sources checked on 22 November 2026, Australia/Melbourne (HTTP 200):
 * - official ACARA F–6 Digital Technologies curriculum content document
 * - official ACARA 7–10 Digital Technologies curriculum content document
 * - official ACARA F–10 Digital Technologies scope and sequence
 */

export const TOPICAL_CURRICULUM_CHECKED_AT =
  "22 November 2026, Australia/Melbourne";

export const TOPICAL_CURRICULUM_SOURCES = [
  {
    title: "Digital Technologies curriculum content F–6 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-curriculum-content-f-6-v9.docx",
    publisher: "ACARA",
    notes: `Official downloadable curriculum content for Foundation to Year 6. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "Digital Technologies curriculum content 7–10 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-curriculum-content-7-10-v9.docx",
    publisher: "ACARA",
    notes: `Official downloadable curriculum content for Years 7 to 10. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "Digital Technologies scope and sequence F–10 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-scope-and-sequence-f-10-v9.docx",
    publisher: "ACARA",
    notes: `Official downloadable scope and sequence. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
] as const;

export const OFFICIAL_Y56_CONTENT_DESCRIPTIONS = {
  AC9TDI6P01: {
    code: "AC9TDI6P01",
    wording:
      "define problems with given or codeveloped design criteria and by creating user stories",
  },
  AC9TDI6P02: {
    code: "AC9TDI6P02",
    wording:
      "design algorithms involving multiple alternatives (branching) and iteration",
  },
  AC9TDI6P06: {
    code: "AC9TDI6P06",
    wording:
      "evaluate existing and student solutions against the design criteria and user stories and their broader community impact",
  },
  AC9TDI6P10: {
    code: "AC9TDI6P10",
    wording:
      "explain the creation and permanence of their digital footprint and consider privacy when collecting user data",
  },
} as const satisfies Record<string, OfficialContentDescription>;

export type OfficialY56Code = keyof typeof OFFICIAL_Y56_CONTENT_DESCRIPTIONS;

export type OfficialTopicalCode = OfficialY56Code | OfficialY78Code;

export const OFFICIAL_TOPICAL_CONTENT_DESCRIPTIONS: Record<
  string,
  OfficialContentDescription
> = {
  ...OFFICIAL_Y56_CONTENT_DESCRIPTIONS,
  AC9TDI8P04: OFFICIAL_Y78_CONTENT_DESCRIPTIONS.AC9TDI8P04,
  AC9TDI8P10: OFFICIAL_Y78_CONTENT_DESCRIPTIONS.AC9TDI8P10,
  AC9TDI8P14: OFFICIAL_Y78_CONTENT_DESCRIPTIONS.AC9TDI8P14,
};

export const ALLOWED_TOPICAL_CURRICULUM_CODES: readonly OfficialTopicalCode[] = [
  "AC9TDI6P01",
  "AC9TDI6P02",
  "AC9TDI6P06",
  "AC9TDI6P10",
  "AC9TDI8P04",
  "AC9TDI8P10",
  "AC9TDI8P14",
];

const SESSION_CODES: Record<TopicalSessionId, readonly OfficialTopicalCode[]> = {
  "chatbots-and-checking": [
    "AC9TDI6P01",
    "AC9TDI6P06",
    "AC9TDI8P04",
    "AC9TDI8P10",
  ],
  "feeds-and-recommendations": ["AC9TDI6P02", "AC9TDI6P10", "AC9TDI8P14"],
  "loot-boxes-and-purchases": [
    "AC9TDI6P01",
    "AC9TDI6P06",
    "AC9TDI8P04",
    "AC9TDI8P10",
  ],
};

function officialOutcome(
  codes: readonly OfficialTopicalCode[],
  lessons: string,
): LearningOutcome {
  return {
    statement: codes
      .map((code) => OFFICIAL_TOPICAL_CONTENT_DESCRIPTIONS[code].wording)
      .join("; "),
    lessons,
    codes: [...codes],
  };
}

const SESSION_OUTCOMES: Record<TopicalSessionId, LearningOutcome[]> =
  Object.fromEntries(
    TOPICAL_SESSIONS.map((session) => {
      const codes = SESSION_CODES[session.id];
      return [
        session.id,
        [
          officialOutcome(
            codes,
            `Years 5–8 topical lesson ${session.number}: ${session.title}`,
          ),
        ],
      ];
    }),
  ) as Record<TopicalSessionId, LearningOutcome[]>;

export function officialTopicalWordingForCodes(
  codes: readonly string[],
): OfficialContentDescription[] {
  return codes.flatMap((code) => {
    const official = OFFICIAL_TOPICAL_CONTENT_DESCRIPTIONS[code];
    return official ? [official] : [];
  });
}

export function topicalAlignmentFor(id: TopicalSessionId): CurriculumAlignment {
  const outcomes = SESSION_OUTCOMES[id] ?? [];
  const codes = [...(SESSION_CODES[id] ?? [])];
  return {
    codes,
    learningAreas: learningAreasFromCodes(codes),
    outcomes,
  };
}

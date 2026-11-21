import type { LearningOutcome } from "@/lib/schools/curriculumAlignment";
import {
  learningAreasFromCodes,
  type CurriculumAlignment,
} from "@/lib/schools/curriculumAlignment";
import {
  type FoundationSessionId,
  FOUNDATION_SESSIONS,
} from "@/lib/schools/foundationSequence";

/**
 * Official Australian Curriculum v9 Digital Technologies wording for the
 * F–2 starter set. The content-description text is taken from official ACARA
 * sources listed below. Ampersands in the F–6 on-a-page PDF are written as
 * "and" here, matching the official Foundation work sample and ordinary
 * sentence form. No other wording has been added or invented.
 *
 * Sources checked on 19 November 2026, Australia/Melbourne (HTTP 200):
 * - official ACARA F–6 Digital Technologies curriculum content document
 * - official ACARA F–10 Digital Technologies scope and sequence
 * - official ACARA Foundation work sample (AC9TDIFK01 and AC9TDIFK02)
 */

export interface OfficialContentDescription {
  code: string;
  wording: string;
}

export const FOUNDATION_CURRICULUM_SOURCES = [
  {
    title: "Digital Technologies curriculum content F–6 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-curriculum-content-f-6-v9.docx",
    publisher: "ACARA",
    notes:
      "Official downloadable curriculum content for Foundation to Year 6. Checked 19 November 2026, Australia/Melbourne (HTTP 200).",
  },
  {
    title: "Digital Technologies scope and sequence F–10 (Australian Curriculum v9)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/technologies/digital-technologies/technologies-digital-technologies-scope-and-sequence-f-10-v9.docx",
    publisher: "ACARA",
    notes:
      "Official downloadable scope and sequence. Checked 19 November 2026, Australia/Melbourne (HTTP 200).",
  },
  {
    title: "Foundation work sample — Observations: Data is all around us",
    href: "https://www.australiancurriculum.edu.au/resources/work-samples/technologies/digital-technologies/foundation/ws01-observations-data-is-all-around-us",
    publisher: "ACARA",
    notes:
      "Official work sample that states the AC9TDIFK01 and AC9TDIFK02 content descriptions. Checked 19 November 2026, Australia/Melbourne (HTTP 200).",
  },
] as const;

export const OFFICIAL_F2_CONTENT_DESCRIPTIONS = {
  AC9TDIFK01: {
    code: "AC9TDIFK01",
    wording:
      "recognise and explore digital systems (hardware and software) for a purpose",
  },
  AC9TDIFK02: {
    code: "AC9TDIFK02",
    wording: "represent data as objects, pictures and symbols",
  },
  AC9TDIFP01: {
    code: "AC9TDIFP01",
    wording: "identify some data that is personal and owned by them",
  },
  AC9TDI2K01: {
    code: "AC9TDI2K01",
    wording:
      "identify and explore digital systems and their components for a purpose",
  },
  AC9TDI2K02: {
    code: "AC9TDI2K02",
    wording: "represent data as pictures, symbols, numbers and words",
  },
  AC9TDI2P01: {
    code: "AC9TDI2P01",
    wording:
      "investigate simple problems for known users that can be solved with digital systems",
  },
  AC9TDI2P02: {
    code: "AC9TDI2P02",
    wording:
      "follow and describe algorithms involving a sequence of steps, branching (decisions) and iteration (repetition)",
  },
  AC9TDI2P03: {
    code: "AC9TDI2P03",
    wording:
      "discuss how existing digital systems satisfy identified needs for known users",
  },
} as const satisfies Record<string, OfficialContentDescription>;

export type OfficialF2Code = keyof typeof OFFICIAL_F2_CONTENT_DESCRIPTIONS;

export const ALLOWED_F2_CURRICULUM_CODES: readonly OfficialF2Code[] = [
  "AC9TDIFK01",
  "AC9TDIFK02",
  "AC9TDIFP01",
  "AC9TDI2K01",
  "AC9TDI2K02",
  "AC9TDI2P02",
  "AC9TDI2P01",
  "AC9TDI2P03",
];

const SESSION_CODES: Record<FoundationSessionId, readonly OfficialF2Code[]> = {
  "meet-a-system": ["AC9TDIFK01"],
  "show-it-two-ways": ["AC9TDIFK02"],
  "what-is-mine-to-keep": ["AC9TDIFP01"],
  "parts-of-a-system": ["AC9TDI2K01"],
  "the-same-data-many-ways": ["AC9TDI2K02"],
  "follow-the-steps": ["AC9TDI2P02"],
  "a-problem-for-someone-we-know": ["AC9TDI2P01", "AC9TDI2P03"],
};

function officialOutcome(
  codes: readonly OfficialF2Code[],
  lessons: string,
): LearningOutcome {
  return {
    statement: codes
      .map((code) => OFFICIAL_F2_CONTENT_DESCRIPTIONS[code].wording)
      .join("; "),
    lessons,
    codes: [...codes],
  };
}

const SESSION_OUTCOMES: Record<FoundationSessionId, LearningOutcome[]> =
  Object.fromEntries(
    FOUNDATION_SESSIONS.map((session) => {
      const codes = SESSION_CODES[session.id];
      return [
        session.id,
        [
          officialOutcome(
            codes,
            `F–2 lesson ${session.number}: ${session.title}`,
          ),
        ],
      ];
    }),
  ) as Record<FoundationSessionId, LearningOutcome[]>;

export function officialWordingForCodes(
  codes: readonly string[],
): OfficialContentDescription[] {
  return codes.flatMap((code) => {
    const official =
      OFFICIAL_F2_CONTENT_DESCRIPTIONS[code as OfficialF2Code];
    return official ? [official] : [];
  });
}

export function foundationAlignmentFor(
  id: FoundationSessionId,
): CurriculumAlignment {
  const outcomes = SESSION_OUTCOMES[id] ?? [];
  const codes = [...(SESSION_CODES[id] ?? [])];
  return {
    codes,
    learningAreas: learningAreasFromCodes(codes),
    outcomes,
  };
}

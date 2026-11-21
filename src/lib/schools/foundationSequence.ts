import foundationSequenceData from "./foundationSequence.data.json";

/**
 * The F–2 unplugged starter set. Separate from the Years 3–6 canonical
 * sequence so the two year bands can be filtered, printed and planned
 * without sharing session numbers or curriculum codes.
 *
 * Session content lives in `foundationSequence.data.json`. Tests check that
 * shipped lesson pages, planners and slides stay in step with this file.
 */

export const FOUNDATION_YEAR_BANDS = ["foundation", "years-1-2"] as const;

export type FoundationYearBand = (typeof FOUNDATION_YEAR_BANDS)[number];

/** Stable identifier for each F–2 unplugged session. Also the URL slug. */
export type FoundationSessionId =
  | "meet-a-system"
  | "show-it-two-ways"
  | "what-is-mine-to-keep"
  | "parts-of-a-system"
  | "the-same-data-many-ways"
  | "follow-the-steps"
  | "a-problem-for-someone-we-know";

export interface FoundationSession {
  /** 1-based number inside the F–2 starter set. */
  number: number;
  id: FoundationSessionId;
  slug: string;
  title: string;
  minutes: 15 | 20;
  yearBand: FoundationYearBand;
  learningIntention: string;
  teacherIntroduction: string;
  childActivity: string;
  reflectionPrompt: string;
  movementMoment: string;
  stoppingPoint: string;
  lightEvidence: string;
  bestFit: string;
}

export const FOUNDATION_SESSIONS: readonly FoundationSession[] =
  foundationSequenceData as FoundationSession[];

export const FOUNDATION_SESSION_COUNT = FOUNDATION_SESSIONS.length;

export const FOUNDATION_SESSION_IDS: readonly FoundationSessionId[] =
  FOUNDATION_SESSIONS.map((session) => session.id);

const SESSION_BY_ID = new Map<FoundationSessionId, FoundationSession>(
  FOUNDATION_SESSIONS.map((session) => [session.id, session]),
);

export function isFoundationSessionId(
  value: string | null | undefined,
): value is FoundationSessionId {
  if (!value) return false;
  return SESSION_BY_ID.has(value as FoundationSessionId);
}

export function getFoundationSession(
  id: string | null | undefined,
): FoundationSession | undefined {
  if (!id) return undefined;
  return SESSION_BY_ID.get(id as FoundationSessionId);
}

export const FOUNDATION_SEQUENCE_SUMMARY =
  "Seven short, fully unplugged teacher-led sessions of about 15–20 minutes each, designed for Foundation and Years 1–2. Students do not need devices or accounts, and the lessons do not collect names or photos.";

export const FOUNDATION_ALIGNMENT_CAVEAT =
  "This is classroom alignment to Australian Curriculum v9 Digital Technologies codes, not an official ACARA endorsement.";

export function foundationYearBandLabel(yearBand: FoundationYearBand): string {
  return yearBand === "foundation" ? "Foundation" : "Years 1–2";
}

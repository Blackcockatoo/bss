import topicalSequenceData from "./topicalSequence.data.json";

/**
 * Three short topical mini-lessons for Years 5–8. They sit beside the F–2,
 * Years 3–6 and Years 7–8 sequences, with their own session numbers and codes.
 *
 * Session content lives in `topicalSequence.data.json`.
 */

export const TOPICAL_YEAR_BAND = "years-5-8" as const;

export type TopicalYearBand = typeof TOPICAL_YEAR_BAND;

export type TopicalSessionId =
  | "chatbots-and-checking"
  | "feeds-and-recommendations"
  | "loot-boxes-and-purchases";

export interface TopicalSession {
  number: number;
  id: TopicalSessionId;
  slug: string;
  title: string;
  minutes: 25;
  yearBand: TopicalYearBand;
  learningIntention: string;
  teacherIntroduction: string;
  childActivity: string;
  reflectionPrompt: string;
  movementMoment: string;
  stoppingPoint: string;
  lightEvidence: string;
  bestFit: string;
}

export const TOPICAL_SESSIONS: readonly TopicalSession[] =
  topicalSequenceData as TopicalSession[];

export const TOPICAL_SESSION_COUNT = TOPICAL_SESSIONS.length;

export const TOPICAL_SESSION_IDS: readonly TopicalSessionId[] =
  TOPICAL_SESSIONS.map((session) => session.id);

const SESSION_BY_ID = new Map<TopicalSessionId, TopicalSession>(
  TOPICAL_SESSIONS.map((session) => [session.id, session]),
);

export function isTopicalSessionId(
  value: string | null | undefined,
): value is TopicalSessionId {
  if (!value) return false;
  return SESSION_BY_ID.has(value as TopicalSessionId);
}

export function getTopicalSession(
  id: string | null | undefined,
): TopicalSession | undefined {
  if (!id) return undefined;
  return SESSION_BY_ID.get(id as TopicalSessionId);
}

export const TOPICAL_SEQUENCE_SUMMARY =
  "Three teacher-led mini-lessons of about 25 minutes each, designed for Years 5–8. They can be used on their own, or beside the longer Years 3–6 and Years 7–8 units. Students do not need accounts. Lessons are unplugged, and they do not collect student names or personal data.";

export const TOPICAL_ALIGNMENT_CAVEAT =
  "This is classroom alignment to Australian Curriculum v9 Digital Technologies codes, not an official ACARA endorsement.";

export const TOPICAL_PERIOD_NOTE =
  "Each lesson is planned for 25 minutes. If you have 20 minutes, trim the discussion step. If you have 30 minutes, use the extra time for the exit task or the extension.";

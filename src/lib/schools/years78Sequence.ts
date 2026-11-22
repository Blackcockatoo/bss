import years78SequenceData from "./years78Sequence.data.json";

/**
 * The Years 7–8 bridge unit. Separate from the Years 3–6 canonical
 * sequence and the F–2 unplugged starter set so year bands can be
 * filtered, printed and planned without sharing session numbers or codes.
 *
 * Session content lives in `years78Sequence.data.json`.
 */

export const YEARS_78_YEAR_BAND = "years-7-8" as const;

export type Years78YearBand = typeof YEARS_78_YEAR_BAND;

export type Years78SessionId =
  | "hardware-for-the-job"
  | "data-as-numbers"
  | "why-binary"
  | "trace-the-algorithm"
  | "design-an-algorithm"
  | "what-data-is-essential"
  | "evaluate-a-system-for-a-user";

export interface Years78Session {
  number: number;
  id: Years78SessionId;
  slug: string;
  title: string;
  minutes: 45;
  yearBand: Years78YearBand;
  learningIntention: string;
  teacherIntroduction: string;
  childActivity: string;
  reflectionPrompt: string;
  movementMoment: string;
  stoppingPoint: string;
  lightEvidence: string;
  bestFit: string;
}

export const YEARS_78_SESSIONS: readonly Years78Session[] =
  years78SequenceData as Years78Session[];

export const YEARS_78_SESSION_COUNT = YEARS_78_SESSIONS.length;

export const YEARS_78_SESSION_IDS: readonly Years78SessionId[] =
  YEARS_78_SESSIONS.map((session) => session.id);

const SESSION_BY_ID = new Map<Years78SessionId, Years78Session>(
  YEARS_78_SESSIONS.map((session) => [session.id, session]),
);

export function isYears78SessionId(
  value: string | null | undefined,
): value is Years78SessionId {
  if (!value) return false;
  return SESSION_BY_ID.has(value as Years78SessionId);
}

export function getYears78Session(
  id: string | null | undefined,
): Years78Session | undefined {
  if (!id) return undefined;
  return SESSION_BY_ID.get(id as Years78SessionId);
}

export const YEARS_78_SEQUENCE_SUMMARY =
  "Seven teacher-led lessons of about 45 minutes each, designed for Years 7–8. They extend the Years 3–6 ‘how digital systems work’ ideas. Students do not need accounts. Lessons are unplugged or use only the teacher’s shared screen, and they do not collect student names or personal data.";

export const YEARS_78_ALIGNMENT_CAVEAT =
  "This is classroom alignment to Australian Curriculum v9 Digital Technologies codes, not an official ACARA endorsement.";

export const YEARS_78_PERIOD_NOTE =
  "Each lesson is planned for 45 minutes, a typical secondary period. If your period is 40 minutes, trim the discussion step. If it is 50 or 60 minutes, use the extra time for the exit task or the extension.";

import canonicalSequenceData from "./canonicalSequence.data.json";

/**
 * The one canonical MetaPet School session sequence.
 *
 * Session content lives in `canonicalSequence.data.json` so the app, tests and
 * downloadable DOCX generator all consume the same data. Adding a session,
 * renaming one, or changing its teaching structure is a change to that file
 * first; `canonicalSequence.test.ts` fails if a shipped surface drifts.
 *
 * Content rules each session must satisfy (checked by test):
 * - one learning intention;
 * - one teacher introduction;
 * - one interactive activity;
 * - one optional movement moment;
 * - one brief reflection;
 * - one visible stopping point;
 * - light teacher evidence with no marking queue;
 * - 15–20 minutes.
 */

/** Stable identifier for each canonical session. Also the URL slug. */
export type CanonicalSessionId =
  | "meet-the-system"
  | "read-the-signals"
  | "one-identity-many-representations"
  | "choices-and-algorithms"
  | "privacy-and-responsible-design"
  | "design-a-better-feature"
  | "test-reflect-and-improve";

export interface CanonicalSession {
  /** 1-based session number. Matches array position. */
  number: number;
  id: CanonicalSessionId;
  /** URL slug. Deliberately identical to the id. */
  slug: string;
  title: string;
  /** Planned classroom minutes. Always 15 or 20. */
  minutes: 15 | 20;
  /** The single learning intention for the session. */
  learningIntention: string;
  /** What the teacher says to open the session. */
  teacherIntroduction: string;
  /** One sentence a child could read: what they actually do. */
  childActivity: string;
  /** The one whole-class reflection question. */
  reflectionPrompt: string;
  /** Optional movement or physical participation moment. */
  movementMoment: string;
  /** The visible stopping point that ends the session. */
  stoppingPoint: string;
  /** Light evidence a teacher can capture without marking anything. */
  lightEvidence: string;
  /** Where this session fits in a normal school week. */
  bestFit: string;
}

export const CANONICAL_SESSIONS: readonly CanonicalSession[] =
  canonicalSequenceData as CanonicalSession[];

/** Number of sessions in the canonical sequence. */
export const CANONICAL_SESSION_COUNT = CANONICAL_SESSIONS.length;

/** Canonical session ids, in order. */
export const CANONICAL_SESSION_IDS: readonly CanonicalSessionId[] =
  CANONICAL_SESSIONS.map((session) => session.id);

/** Canonical session titles, in order. */
export const CANONICAL_SESSION_TITLES: readonly string[] =
  CANONICAL_SESSIONS.map((session) => session.title);

const SESSION_BY_ID = new Map<CanonicalSessionId, CanonicalSession>(
  CANONICAL_SESSIONS.map((session) => [session.id, session]),
);

export function getCanonicalSession(
  id: string | null | undefined,
): CanonicalSession | undefined {
  if (!id) return undefined;
  return SESSION_BY_ID.get(id as CanonicalSessionId);
}

/** The first session — the one a cold-visit teacher should be able to reach. */
export const FIRST_CANONICAL_SESSION = CANONICAL_SESSIONS[0];

/**
 * Shortest honest description of the whole sequence, used wherever a single
 * line has to stand in for the seven sessions.
 */
export const CANONICAL_SEQUENCE_SUMMARY =
  "Seven short, teacher-led sessions of about 15–20 minutes each, designed for Years 3–6.";

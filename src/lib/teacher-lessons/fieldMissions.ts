/**
 * Meta-Pet Teacher Lesson System — Field Missions.
 *
 * Field Missions are short (5-10 minute), teacher-optional activities that
 * reuse the existing lesson architecture (types, evidence patterns, class
 * consequences) rather than introducing a second, competing lesson runtime.
 * They can run inside a lesson (as a quick detour) or between lessons (as a
 * warm-up, filler or revision activity). Every mission:
 *
 * - takes about 5-10 minutes
 * - requires minimal preparation
 * - is teacher-optional (never blocks lesson progress or completion)
 * - avoids scores, rankings and competition by default
 * - includes an off-screen action where suitable
 *
 * Completing a mission nudges class-level consequences (see
 * classConsequences.ts) through one deterministic, explainable action — never
 * a random reward.
 */

import type { ClassConsequenceActionId } from "./classConsequences";
import type { LessonId } from "./types";

export type FieldMissionId =
  | "silent-signal"
  | "one-change-only"
  | "broken-loop"
  | "pet-detective"
  | "privacy-inspector"
  | "pattern-mutation"
  | "low-tech-rescue"
  | "explain-it-simply";

export interface FieldMissionDefinition {
  id: FieldMissionId;
  slug: string;
  title: string;
  /** One-line summary shown on the mission card. */
  summary: string;
  minutes: number;
  /** What the teacher sets up or says to launch the mission. */
  teacherPrompt: string;
  /** What students actually do. */
  studentTask: string;
  /** The off-screen / physical component, if any (kept short and optional). */
  offScreenAction: string;
  /** One short reflection question to close the mission. */
  reflectionPrompt: string;
  /** Lessons this mission connects to best (for teacher discovery only). */
  relatedLessonIds: LessonId[];
  /** The single deterministic class-consequence action a completed mission records. */
  consequenceActionId: ClassConsequenceActionId;
}

export const FIELD_MISSIONS: FieldMissionDefinition[] = [
  {
    id: "silent-signal",
    slug: "silent-signal",
    title: "Silent Signal",
    summary:
      "Watch the Meta-Pet in complete silence and notice one signal, without discussing it yet.",
    minutes: 5,
    teacherPrompt:
      "Ask for total silence. Show the Meta-Pet for about 60 seconds without explaining anything.",
    studentTask:
      "In silence, watch the Meta-Pet for about a minute. Write down one signal you notice (eyes, posture, breathing, colour or movement) and one careful guess about what it might mean.",
    offScreenAction:
      "Turn away from the screen and, using only posture and stillness, show a partner the signal you noticed — no words.",
    reflectionPrompt: "What made that signal easy or hard to read?",
    relatedLessonIds: ["meet-your-metapet", "feelings-without-words"],
    consequenceActionId: "careful-observation",
  },
  {
    id: "one-change-only",
    slug: "one-change-only",
    title: "One Change Only",
    summary:
      "Predict, then change exactly one variable, then explain what happened and what stayed the same.",
    minutes: 10,
    teacherPrompt:
      "Pick one changeable thing (a body part, a gene, or a care action) and ask students to predict its effect before it changes.",
    studentTask:
      "Predict the effect of one change. Make the one change. Explain what happened, and name one thing that stayed the same.",
    offScreenAction:
      "In small groups, physically swap one object in a small classroom display (for example, one block in a tower) and discuss what changed and what didn't.",
    reflectionPrompt: "Why is it useful to change only one thing at a time?",
    relatedLessonIds: ["build-a-body", "dna-differences", "needs-and-consequences"],
    consequenceActionId: "balanced-choice",
  },
  {
    id: "broken-loop",
    slug: "broken-loop",
    title: "Broken Loop",
    summary:
      "Find the single step that would turn a harmful feedback loop into a helpful one.",
    minutes: 10,
    teacherPrompt:
      "Present a short harmful loop (for example: less rest → lower energy → less play → lower mood).",
    studentTask:
      "Identify the loop's four steps. Find the one step you would change to turn it into a helpful loop, and explain your fix.",
    offScreenAction:
      "Arrange four cards (or drawn boxes) on the floor or desk as the loop, then physically swap out one card to fix it.",
    reflectionPrompt: "How did changing one step change the whole loop?",
    relatedLessonIds: ["needs-and-consequences"],
    consequenceActionId: "balanced-choice",
  },
  {
    id: "pet-detective",
    slug: "pet-detective",
    title: "Pet Detective",
    summary:
      "Gather at least three clues before making one careful, non-certain conclusion.",
    minutes: 8,
    teacherPrompt:
      "Frame this as detective work: no guessing before at least three clues are gathered.",
    studentTask:
      "Investigate the Meta-Pet's current signals like a detective. Gather at least three clues, then make one careful, non-certain conclusion ('it may be…').",
    offScreenAction:
      "Play detective in the room: notice three clues about the weather, a plant, or the classroom (without asking anyone), then check your guess respectfully with a partner.",
    reflectionPrompt: "Which clue changed your mind, and why?",
    relatedLessonIds: ["meet-your-metapet", "feelings-without-words"],
    consequenceActionId: "careful-observation",
  },
  {
    id: "privacy-inspector",
    slug: "privacy-inspector",
    title: "Privacy Inspector",
    summary:
      "Sort information types into required, optional, and should-not-be-collected.",
    minutes: 8,
    teacherPrompt:
      "Prepare (or write on the board) a short list of information types, for example: pet nickname, favourite colour, home address, full name, school, a photo.",
    studentTask:
      "Sort each information type into three piles: information that is required, information that is optional, and information that should not be collected at all.",
    offScreenAction:
      "Sort printed or hand-written cards into the three piles as a class, then agree on the trickiest one together.",
    reflectionPrompt:
      "Why should good technology collect less information, not more?",
    relatedLessonIds: ["responsible-creator"],
    consequenceActionId: "responsible-privacy-choice",
  },
  {
    id: "pattern-mutation",
    slug: "pattern-mutation",
    title: "Pattern Mutation",
    summary:
      "Change exactly one rule in a pattern, then challenge a partner to spot and describe it.",
    minutes: 8,
    teacherPrompt:
      "Show or arrange a simple repeating pattern, then ask students to change exactly one rule.",
    studentTask:
      "Take a pattern and change one rule (for example, alternate colours instead of repeating one). Challenge a partner to spot the rule change and describe it precisely.",
    offScreenAction:
      "Arrange a row of classroom objects (blocks, counters, pencils) in a repeating pattern, then swap one object to mutate the rule.",
    reflectionPrompt: "How did you describe the rule so someone else could test it?",
    relatedLessonIds: ["patterns-behind-the-pet"],
    consequenceActionId: "creative-experiment",
  },
  {
    id: "low-tech-rescue",
    slug: "low-tech-rescue",
    title: "Low-Tech Rescue",
    summary:
      "With the screen off, explain a Meta-Pet's needs from memory and agree on one caring action.",
    minutes: 7,
    teacherPrompt:
      "Turn the screen off (or close the lid). This mission runs entirely without the device.",
    studentTask:
      "With the screen off, explain to a partner what a Meta-Pet needs and why, using only memory or a printed lesson card. Agree on one caring action together.",
    offScreenAction:
      "The whole mission is off-screen: a paired discussion with no device in view.",
    reflectionPrompt: "What did you remember without needing to look at the screen?",
    relatedLessonIds: ["needs-and-consequences", "responsible-creator"],
    consequenceActionId: "physical-activity-completed",
  },
  {
    id: "explain-it-simply",
    slug: "explain-it-simply",
    title: "Explain It Simply",
    summary:
      "Explain one key concept from a lesson to a partner in 60 seconds, with no technical words.",
    minutes: 5,
    teacherPrompt:
      "Set a 60-second timer. Ask each student to pick one key concept from a completed lesson.",
    studentTask:
      "In 60 seconds, explain one key concept to a partner using no technical words at all. Swap roles.",
    offScreenAction:
      "Do this as a 'walk and talk': pairs walk slowly around the room while explaining, then swap.",
    reflectionPrompt: "What was the simplest way you found to explain it?",
    relatedLessonIds: [],
    consequenceActionId: "reflection-completed",
  },
];

const FIELD_MISSION_BY_SLUG: Map<string, FieldMissionDefinition> = new Map(
  FIELD_MISSIONS.map((mission) => [mission.slug, mission]),
);

export const FIELD_MISSION_IDS: FieldMissionId[] = FIELD_MISSIONS.map(
  (mission) => mission.id,
);

export function getFieldMissionBySlug(
  slug: string | null | undefined,
): FieldMissionDefinition | undefined {
  if (!slug) return undefined;
  return FIELD_MISSION_BY_SLUG.get(slug);
}

export function isFieldMissionId(value: unknown): value is FieldMissionId {
  return (
    typeof value === "string" &&
    FIELD_MISSIONS.some((mission) => mission.id === value)
  );
}

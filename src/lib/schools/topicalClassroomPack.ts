import type {
  EaldNotes,
  LessonPlannerExtras,
  OfficialLink,
  PaperPath,
  VocabEntry,
} from "@/lib/schools/classroomPack";
import type { TopicalSessionId } from "@/lib/schools/topicalSequence";
import { TOPICAL_SESSIONS } from "@/lib/schools/topicalSequence";
import { TOPICAL_CURRICULUM_CHECKED_AT } from "@/lib/schools/topicalCurriculum";

export const TOPICAL_SHARED_MATERIALS: readonly string[] = [
  "A teacher to lead a Years 5–8 class",
  "Paper and pencils for notes, a tally or an exit ticket",
];

export const TOPICAL_SHARED_CONDITIONS =
  "Unplugged. No student accounts, no live chatbot or feed use, and no collection of real student data, spending details or digital footprints.";

const UNPLUGGED: PaperPath = {
  kind: "works-on-paper",
  label: "Works fully unplugged",
  summary:
    "This lesson is designed to run on paper and on the board. Students do not need accounts or their own devices, and the lesson does not collect personal data.",
};

export const TOPICAL_PAPER_PATHS: Record<TopicalSessionId, PaperPath> = {
  "chatbots-and-checking": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use teacher-prepared prompt, reply and fact cards on paper. Do not open a live chatbot, and do not type personal information.",
  },
  "feeds-and-recommendations": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use a fictional feed and invented data cards on paper. Do not log in, and do not inspect anyone’s real feed or digital footprint.",
  },
  "loot-boxes-and-purchases": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use teacher-prepared chance cards and a fictional game card on paper. Do not ask about real spending or games students play at home.",
  },
};

export const TOPICAL_LESSON_MATERIALS: Record<
  TopicalSessionId,
  readonly string[]
> = {
  "chatbots-and-checking": [
    "Two or three short prompt cards (invented questions only)",
    "For each prompt, two reply cards: one that matches the fact card, and one fluent reply that is wrong",
    "A short teacher-provided fact card for each prompt, on paper — not a live search and not a student device",
    "Space to write a user story, two design criteria, a judgement and one suggested change",
  ],
  "feeds-and-recommendations": [
    "A fictional viewing-history strip with invented video titles (not anyone’s real history)",
    "Blank feed slots to fill by following a rule",
    "Cards or a list of invented data items the system might collect",
    "Two heading cards: Essential to the purpose, and Not essential",
  ],
  "loot-boxes-and-purchases": [
    "Ten teacher-prepared cards: one marked rare, nine marked common",
    "A class tally table on the board or on paper",
    "A short fictional game card that describes a loot-box design",
    "Space to write a user story, design criteria, a judgement, a possible future impact and one suggested change",
  ],
};

export const TOPICAL_VOCAB: Record<TopicalSessionId, readonly VocabEntry[]> = {
  "chatbots-and-checking": [
    { word: "chatbot", meaning: "A computer program that writes a reply in everyday language." },
    { word: "fluent", meaning: "Smooth and confident in the way it is written, even if it is wrong." },
    { word: "check", meaning: "Compare a reply with a trusted source before you rely on it." },
    { word: "user story", meaning: "A short statement of a user by role, what they need, and why." },
    { word: "design criteria", meaning: "The tests we will use to judge a solution." },
  ],
  "feeds-and-recommendations": [
    { word: "feed", meaning: "A list of posts or videos chosen for a person." },
    { word: "recommendation system", meaning: "A system that chooses what to show next, using data and rules." },
    { word: "algorithm", meaning: "A precise sequence of steps to follow." },
    { word: "branching", meaning: "A decision in a rule: if this, do one thing; if not, do another." },
    { word: "iteration", meaning: "Repeating a step, such as filling the next slot in a feed." },
    { word: "digital footprint", meaning: "The data a system collects and keeps about people who use it." },
    { word: "essential", meaning: "Needed for that purpose." },
  ],
  "loot-boxes-and-purchases": [
    { word: "loot box", meaning: "A purchase in a game that gives a chance item." },
    { word: "chance", meaning: "The result is not chosen by the player; it could go one way or another." },
    { word: "tally", meaning: "A count of results, used to support an explanation." },
    { word: "user story", meaning: "A short statement of a user by role, what they need, and why." },
    { word: "design criteria", meaning: "The tests we will use to judge a solution." },
    { word: "evaluate", meaning: "Judge how well something meets the tests you set." },
  ],
};

export const TOPICAL_EALD_NOTES: Record<TopicalSessionId, EaldNotes> = {
  "chatbots-and-checking": {
    preteach: ["chatbot", "fluent", "check", "user story", "design criteria"],
    sentenceStarters: [
      "The chatbot makes text by ___.",
      "A reply can be wrong because ___.",
      "I checked this reply against ___.",
      "As a ___, I need ___ so that ___.",
    ],
    duringLesson:
      "Pre-teach chatbot, fluent, check, user story and design criteria. Students can use the support option: Check the first reply with a partner using the fact card. Complete: “This reply matches / does not match the fact card because ___.”",
  },
  "feeds-and-recommendations": {
    preteach: [
      "feed",
      "recommendation system",
      "algorithm",
      "branching",
      "iteration",
      "digital footprint",
      "essential",
    ],
    sentenceStarters: [
      "If the last video was ___, show ___.",
      "I repeated the rule to fill ___.",
      "This data is essential because ___.",
      "This data is not essential because ___.",
    ],
    duringLesson:
      "State clearly: we will not log in, and we will not look at anyone’s real feed. Students can use the support option: Use the starter rule: “If the last video was sport, show sport; if it was cooking, show cooking.” Repeat it to fill the feed, then sort two data cards already discussed as a class.",
  },
  "loot-boxes-and-purchases": {
    preteach: ["loot box", "chance", "tally", "user story", "design criteria", "evaluate"],
    sentenceStarters: [
      "A loot box is ___.",
      "The tally shows ___.",
      "As a player, I need ___ so that ___.",
      "This design does / does not meet this test because ___.",
      "One change I would make is ___.",
    ],
    duringLesson:
      "Do the first draw as a class so the chance model is clear. Remind the class that we will not talk about real spending. Students can use the support option: Use the sentence starters: “A loot box is ___.” “The tally shows ___.” “As a player, I need ___ so that ___.” “This design does / does not meet this test because ___.”",
  },
};

/**
 * Official eSafety Commissioner pages checked live (HTTP 200 after following
 * redirects) on {@link TOPICAL_CURRICULUM_CHECKED_AT}. These are teacher
 * background links, not an eSafety endorsement of MetaPet School, and they
 * are not quoted as lesson claims.
 */
export const TOPICAL_ESAFETY_LINKS: readonly OfficialLink[] = [
  {
    title: "eSafety Guide — ChatGPT",
    href: "https://www.esafety.gov.au/key-topics/esafety-guide/chatgpt",
    note: `Official eSafety Guide entry: “ChatGPT | What is ChatGPT and is it safe?”. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200). The lesson itself stays unplugged and does not require ChatGPT.`,
  },
  {
    title: "Echo chambers and your feed",
    href: "https://www.esafety.gov.au/young-people/echo-chambers-and-your-feed",
    note: `Official eSafety page for young people about algorithms and recommender systems that shape a feed. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "Recommender systems and algorithms — position statement",
    href: "https://www.esafety.gov.au/industry/tech-trends-and-challenges/recommender-systems-and-algorithms",
    note: `Official eSafety industry position statement. Teacher background, not a student handout. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "Gaming",
    href: "https://www.esafety.gov.au/key-topics/staying-safe/gaming",
    note: `Official eSafety Gaming page. It is a general gaming safety page, not a loot-box factsheet. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "Gaming — guide for parents",
    href: "https://www.esafety.gov.au/parents/issues-and-advice/gaming",
    note: `Official eSafety guide for parents and carers about gaming, including spending in games. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
  {
    title: "eSafety Commissioner — educators",
    href: "https://www.esafety.gov.au/educators",
    note: `Starting point for official educator guidance and classroom resources. Checked ${TOPICAL_CURRICULUM_CHECKED_AT} (HTTP 200).`,
  },
];

export function topicalPlannerExtrasFor(
  sessionId: TopicalSessionId,
): LessonPlannerExtras {
  return {
    sessionId,
    materials: TOPICAL_LESSON_MATERIALS[sessionId],
    paper: TOPICAL_PAPER_PATHS[sessionId],
    vocab: TOPICAL_VOCAB[sessionId],
  };
}

export function topicalEaldNotesFor(sessionId: TopicalSessionId): EaldNotes {
  return TOPICAL_EALD_NOTES[sessionId];
}

export const TOPICAL_CLASSROOM_PACK_IDS = TOPICAL_SESSIONS.map(
  (session) => session.id,
);

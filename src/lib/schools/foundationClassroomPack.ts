import type {
  EaldNotes,
  LessonPlannerExtras,
  PaperPath,
  VocabEntry,
} from "@/lib/schools/classroomPack";
import type { FoundationSessionId } from "@/lib/schools/foundationSequence";

export const FOUNDATION_SHARED_MATERIALS: readonly string[] = [
  "A teacher to lead a Foundation or Years 1–2 class",
  "Paper, pencils or crayons if students will draw, point or use an exit ticket",
];

export const FOUNDATION_SHARED_CONDITIONS =
  "Fully unplugged for students. No student accounts, no student devices, and no names or photos collected.";

const UNPLUGGED_PAPER: PaperPath = {
  kind: "works-on-paper",
  label: "Works fully unplugged",
  summary:
    "This lesson is designed to run without student devices. Use classroom objects, paper, movement and teacher-prepared examples. Nothing is lost if there is no shared screen, except that the teacher script on this planner is easier to read from a print-out or a board.",
};

export const FOUNDATION_PAPER_PATHS: Record<FoundationSessionId, PaperPath> = {
  "meet-a-system": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use one classroom digital system the teacher already has, or a clear picture of one if the real system cannot be shown safely. Students point, talk and may draw. They do not need their own devices.",
  },
  "show-it-two-ways": UNPLUGGED_PAPER,
  "what-is-mine-to-keep": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use teacher-prepared generic example cards and two hoops or signs with a simple picture on each. Do not use real student names, addresses, birthdays, photographs, voice recordings, or a student's actual work.",
  },
  "parts-of-a-system": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "The teacher may use one classroom digital system already in the room so the class can name components. Students do not need devices. If no system can be used, a clear labelled picture of one is enough for naming components and a purpose.",
  },
  "the-same-data-many-ways": UNPLUGGED_PAPER,
  "follow-the-steps": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Act out the algorithm in a clear space and show the steps on a board or on paper. No devices are required.",
  },
  "a-problem-for-someone-we-know": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Describe the known user by role only, and discuss one existing school digital system. Students may point, use thumbs and talk. No names or photos.",
  },
};

export const FOUNDATION_LESSON_MATERIALS: Record<
  FoundationSessionId,
  readonly string[]
> = {
  "meet-a-system": [
    "One classroom digital system the teacher already has (for example a classroom screen, a digital clock, or a simple classroom speaker), or a clear picture of one",
    "Paper and pencils if students will draw the exit",
  ],
  "show-it-two-ways": [
    "One everyday object per pair or table (for example a block, a pencil or a cup)",
    "Paper and pencils for a drawing and a simple symbol",
    "Board or cards if you want to show the teacher's example symbol to the whole class",
  ],
  "what-is-mine-to-keep": [
    "Teacher-prepared generic example cards only — words or simple drawings, not real photographs, voice recordings, or student work",
    "Two hoops, signs or floor spaces labelled “Personal and owned” and “Not personal”, each with a simple picture so pre-readers can use them",
  ],
  "parts-of-a-system": [
    "One classroom digital system the teacher already has, or a clear labelled picture of one",
    "Paper and pencils if students will draw two components and the purpose",
  ],
  "the-same-data-many-ways": [
    "A small set of countable classroom objects per pair",
    "Paper and pencils so students can show a picture, a symbol, a number and a word",
  ],
  "follow-the-steps": [
    "A clear space such as the mat or a line",
    "A circle card and a square card, or two other clear object cards, for the decision",
    "The algorithm written or drawn in simple words or pictures on a board or paper",
    "Optional decision and repeat cards for students who need a visual support",
  ],
  "a-problem-for-someone-we-know": [
    "A teacher-chosen known user described by role only (for example the librarian or a teacher taking the roll)",
    "One existing school digital system to discuss, or a picture of one",
    "Optional user, problem and system cards for pointing",
  ],
};

export const FOUNDATION_VOCAB: Record<
  FoundationSessionId,
  readonly VocabEntry[]
> = {
  "meet-a-system": [
    { word: "system", meaning: "Something we use to do a job." },
    { word: "hardware", meaning: "The parts of a digital system we can touch." },
    {
      word: "software",
      meaning: "The instructions that tell a digital system what to do.",
    },
    { word: "purpose", meaning: "The job we are using the system for." },
  ],
  "show-it-two-ways": [
    { word: "data", meaning: "Information we can show." },
    { word: "object", meaning: "The real thing." },
    { word: "picture", meaning: "A drawing of the thing." },
    { word: "symbol", meaning: "A simple mark that stands for the thing." },
  ],
  "what-is-mine-to-keep": [
    { word: "data", meaning: "Information we can show or keep." },
    {
      word: "personal",
      meaning: "Information that is about a person.",
    },
    {
      word: "owned",
      meaning: "It belongs to someone, and is theirs to keep.",
    },
    {
      word: "keep",
      meaning: "Hold on to, and not share with everyone.",
    },
  ],
  "parts-of-a-system": [
    { word: "system", meaning: "Something we use to do a job." },
    {
      word: "component",
      meaning: "One part of a system.",
    },
    { word: "hardware", meaning: "The parts of a digital system we can touch." },
    {
      word: "software",
      meaning: "The instructions that tell a digital system what to do.",
    },
    { word: "purpose", meaning: "The job we are using the system for." },
  ],
  "the-same-data-many-ways": [
    { word: "data", meaning: "Information we can show." },
    { word: "picture", meaning: "A drawing that shows the data." },
    { word: "symbol", meaning: "A simple mark that stands for the data." },
    { word: "number", meaning: "Digits that show how many or how much." },
    { word: "word", meaning: "Letters that say the same data in writing." },
  ],
  "follow-the-steps": [
    { word: "algorithm", meaning: "A set of steps we can follow." },
    { word: "sequence", meaning: "The order of the steps." },
    {
      word: "decision",
      meaning: "A choice in the steps, sometimes called branching.",
    },
    {
      word: "repeat",
      meaning: "Doing a step more than once, sometimes called iteration.",
    },
  ],
  "a-problem-for-someone-we-know": [
    {
      word: "user",
      meaning: "The person who would use the system, described by their job or role.",
    },
    { word: "problem", meaning: "Something the user needs help with." },
    { word: "need", meaning: "What the user wants the system to help with." },
    {
      word: "existing",
      meaning: "A system that is already there, not one we are inventing today.",
    },
  ],
};

export const FOUNDATION_EALD_NOTES: Record<FoundationSessionId, EaldNotes> = {
  "meet-a-system": {
    preteach: ["system", "hardware", "software", "purpose"],
    sentenceStarters: [
      "This is a ___.",
      "I can touch ___.",
      "The job is ___.",
    ],
    duringLesson:
      "Keep the real system in view. Point to each word-wall word as you say it. Students can use the support option: Point to the hardware part the teacher named, and repeat the job in one word or by pointing to a picture of that job.",
  },
  "show-it-two-ways": {
    preteach: ["data", "object", "picture", "symbol"],
    sentenceStarters: [
      "This is the object: ___.",
      "This is the picture.",
      "This is the symbol.",
    ],
    duringLesson:
      "Hold up the object, the picture and the symbol as you name them. Students can use the support option: Point to the object, the picture and the symbol when the teacher names each one.",
  },
  "what-is-mine-to-keep": {
    preteach: ["data", "personal", "owned", "keep"],
    sentenceStarters: [
      "This data is personal.",
      "This data is not personal.",
      "I point to this card.",
    ],
    duringLesson:
      "Use only the prepared cards. Point to the hoop or sign as you sort each one, and model one example in each group first. Do not ask students to talk about their own information. Students can use the support option: When the teacher holds up an example, point to the matching hoop after a classmate has modelled it.",
  },
  "parts-of-a-system": {
    preteach: ["system", "component", "hardware", "software", "purpose"],
    sentenceStarters: [
      "This system is ___.",
      "One component is ___.",
      "The purpose is ___.",
    ],
    duringLesson:
      "Touch each component as you name it. Students can use the support option: Point to two components the teacher has already named, and repeat the purpose in a short phrase.",
  },
  "the-same-data-many-ways": {
    preteach: ["data", "picture", "symbol", "number", "word"],
    sentenceStarters: [
      "This is the picture.",
      "This is the symbol.",
      "This is the number.",
      "This is the word.",
      "They show the same data.",
    ],
    duringLesson:
      "Point to the four representations in the same order each time. Students can use the support option: Point to each of the four teacher examples when they are named, and copy one of them.",
  },
  "follow-the-steps": {
    preteach: ["algorithm", "sequence", "decision", "repeat"],
    sentenceStarters: [
      "First we ___.",
      "The decision is ___.",
      "We repeat ___.",
    ],
    duringLesson:
      "Act out each word as you say it, and leave the steps visible. Students can use the support option: Stand with the teacher and copy each step, then point to the card that shows the decision or the repeat.",
  },
  "a-problem-for-someone-we-know": {
    preteach: ["user", "problem", "need", "existing"],
    sentenceStarters: [
      "The user is ___.",
      "The problem is ___.",
      "The system would help / would not help because ___.",
    ],
    duringLesson:
      "Keep three cards visible: user, problem and system. Students can use the support option: Point to the user card and the system card, then use thumbs to show whether the system would help.",
  },
};

export function foundationPlannerExtrasFor(
  sessionId: FoundationSessionId,
): LessonPlannerExtras {
  return {
    sessionId,
    materials: FOUNDATION_LESSON_MATERIALS[sessionId],
    paper: FOUNDATION_PAPER_PATHS[sessionId],
    vocab: FOUNDATION_VOCAB[sessionId],
  };
}

export function foundationEaldNotesFor(
  sessionId: FoundationSessionId,
): EaldNotes {
  return FOUNDATION_EALD_NOTES[sessionId];
}

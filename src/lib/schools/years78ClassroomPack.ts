import type {
  EaldNotes,
  LessonPlannerExtras,
  PaperPath,
  VocabEntry,
} from "@/lib/schools/classroomPack";
import type { Years78SessionId } from "@/lib/schools/years78Sequence";
import { YEARS_78_SESSIONS } from "@/lib/schools/years78Sequence";

export const YEARS_78_SHARED_MATERIALS: readonly string[] = [
  "A teacher to lead a Years 7–8 class",
  "Paper and pencils for traces, diagrams or exit notes",
];

export const YEARS_78_SHARED_CONDITIONS =
  "Unplugged, or the teacher’s shared screen only. No student accounts, and no collection of real student data or digital footprints.";

const UNPLUGGED_OR_TEACHER_SCREEN: PaperPath = {
  kind: "works-on-paper",
  label: "Works unplugged, or with the teacher’s screen only",
  summary:
    "This lesson is designed to run on paper and on the board. A shared screen is optional for showing a prepared example. Students do not need accounts or their own devices, and the lesson does not collect personal data.",
};

export const YEARS_78_PAPER_PATHS: Record<Years78SessionId, PaperPath> = {
  "hardware-for-the-job": {
    kind: "works-on-paper",
    label: "Works unplugged, or with the teacher’s screen only",
    summary:
      "Use teacher-prepared hardware and task cards on paper, or show the same cards on the teacher’s screen. Students write a selection and a reason. No student devices or accounts are needed.",
  },
  "data-as-numbers": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use a teacher-provided table and grids on paper. Do not use student photos, names or recordings.",
  },
  "why-binary": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use a binary place-value row on paper or the board. No student devices are required.",
  },
  "trace-the-algorithm": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Trace the prepared algorithm on paper with a given input. No student accounts or devices are needed.",
  },
  "design-an-algorithm": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Design the algorithm on paper as a flowchart and as pseudocode. The board can hold the model. No student devices are required.",
  },
  "what-data-is-essential": {
    kind: "works-on-paper",
    label: "Works fully unplugged",
    summary:
      "Use only a teacher-prepared, fictional system description and invented data items. Do not log in, and do not inspect anyone’s real digital footprint.",
  },
  "evaluate-a-system-for-a-user": {
    kind: "works-on-paper",
    label: "Works unplugged, or with the teacher’s screen only",
    summary:
      "Use a paper mock of an existing system, or show one example on the teacher’s screen only. Describe the user by role, not by a person’s name. No student logins.",
  },
};

export const YEARS_78_LESSON_MATERIALS: Record<
  Years78SessionId,
  readonly string[]
> = {
  "hardware-for-the-job": [
    "Two short task cards, such as show a slideshow to a class, and edit a short video",
    "Three hardware cards with processing, memory, storage and display specifications (use invented but realistic figures; do not invent benchmark claims)",
    "Student paper, or a copy of the cards on the teacher’s screen",
  ],
  "data-as-numbers": [
    "A teacher-provided table that maps letters or characters to integers",
    "A 4×4 image grid (0–1 or 0–3)",
    "A short sound pattern as a sequence of integers (loud/soft or pitch), on paper — no student recordings",
  ],
  "why-binary": [
    "A binary place-value row (8 4 2 1), on paper or the board",
    "A short list of integers to convert (for example 3, 5, 6, 10, 13)",
    "One binary number to convert back (for example 1110)",
  ],
  "trace-the-algorithm": [
    "A short teacher-prepared algorithm on paper or the board, with one deliberate error",
    "A trace table with columns for each step or variable",
    "A given input, for example a short list of numbers",
  ],
  "design-an-algorithm": [
    "A short school-task brief (for example, sorting returned books)",
    "Flowchart shape reminders: start/end, process, decision, and an arrow for a repeat",
    "A short model of matching flowchart and pseudocode, with a nested structure labelled",
  ],
  "what-data-is-essential": [
    "A teacher-prepared description of a generic, fictional existing system and its purpose",
    "Cards or a list of data items the system collects — invented examples only, not data about the class",
    "Two heading cards: Essential to the purpose, and Not essential",
  ],
  "evaluate-a-system-for-a-user": [
    "A short real-world school problem, with the user described by role only",
    "A paper mock or a teacher-screen view of an existing system — no student logins",
    "Space to write a user story, design criteria, a judgement and a possible future impact",
  ],
};

export const YEARS_78_VOCAB: Record<
  Years78SessionId,
  readonly VocabEntry[]
> = {
  "hardware-for-the-job": [
    { word: "hardware", meaning: "The equipment we can touch, such as a laptop or a projector." },
    { word: "specification", meaning: "A measured feature of hardware, such as memory or display size." },
    { word: "performance", meaning: "How well the hardware can do the job." },
    { word: "workload", meaning: "The amount and kind of work the hardware is asked to do." },
  ],
  "data-as-numbers": [
    { word: "integer", meaning: "A whole number, such as 0, 1 or 65." },
    { word: "represent", meaning: "Show the same data in another form." },
    { word: "text data", meaning: "Letters and words stored by a digital system." },
    { word: "image data", meaning: "A picture stored as numbers, often on a grid." },
    { word: "audio data", meaning: "A sound stored as a sequence of numbers." },
  ],
  "why-binary": [
    { word: "binary", meaning: "A way of writing numbers using only 0 and 1." },
    { word: "bit", meaning: "One binary digit, a 0 or a 1." },
    { word: "place value", meaning: "The value of a digit because of its position, such as 8, 4, 2 or 1." },
    { word: "integer", meaning: "A whole number, such as 5 or 10." },
  ],
  "trace-the-algorithm": [
    { word: "algorithm", meaning: "A precise sequence of steps to follow." },
    { word: "trace", meaning: "Follow each step and write the values as you go." },
    { word: "input", meaning: "The data the algorithm is given to work with." },
    { word: "output", meaning: "The result the algorithm produces." },
    { word: "error", meaning: "A step that is wrong, or that does not do what was intended." },
  ],
  "design-an-algorithm": [
    { word: "algorithm", meaning: "A precise sequence of steps to follow." },
    { word: "nested control structure", meaning: "A decision or a repeat placed inside another decision or repeat." },
    { word: "flowchart", meaning: "A diagram of the steps, using shapes and arrows." },
    { word: "pseudocode", meaning: "The steps written in clear, ordered language that is not a particular programming language." },
  ],
  "what-data-is-essential": [
    { word: "digital footprint", meaning: "The data a system collects and keeps about people who use it." },
    { word: "purpose", meaning: "What the system is meant to do." },
    { word: "essential", meaning: "Needed for that purpose." },
    { word: "manage", meaning: "Decide what to collect, keep, or delete." },
  ],
  "evaluate-a-system-for-a-user": [
    { word: "user story", meaning: "A short statement of a user by role, what they need, and why." },
    { word: "design criteria", meaning: "The tests we will use to judge a solution." },
    { word: "decompose", meaning: "Break a problem into parts." },
    { word: "evaluate", meaning: "Judge how well something meets the tests you set." },
    { word: "future impact", meaning: "Something that might happen later because of how the system works or what it collects." },
  ],
};

export const YEARS_78_EALD_NOTES: Record<Years78SessionId, EaldNotes> = {
  "hardware-for-the-job": {
    preteach: ["hardware", "specification", "performance", "workload"],
    sentenceStarters: [
      "For this task I would choose ___.",
      "The specification that matters is ___.",
      "This would affect performance by ___.",
    ],
    duringLesson:
      "Pre-teach hardware, specification, performance and workload. Students can use the support option: Use the highlighted specification on each card. Complete: “For this task I would choose ___ because the ___ would affect performance by ___.”",
  },
  "data-as-numbers": {
    preteach: ["integer", "represent", "text data", "image data", "audio data"],
    sentenceStarters: [
      "This text is represented as ___.",
      "This image is represented as ___.",
      "One thing that was lost is ___.",
    ],
    duringLesson:
      "Use the table and the grid first, then the sound sequence. Students can use the support option: Complete the first text example and the first row of the image grid with a partner, using the teacher’s table.",
  },
  "why-binary": {
    preteach: ["binary", "bit", "place value", "integer"],
    sentenceStarters: [
      "In binary, ___ is written as ___.",
      "The place values I used are ___.",
      "Two states are useful because ___.",
    ],
    duringLesson:
      "Work 5 and 10 as a class first. Students can use the support option: Use a place-value row (8 4 2 1). Convert 5 and 10 with a partner, ticking the columns you need.",
  },
  "trace-the-algorithm": {
    preteach: ["algorithm", "trace", "input", "output", "error"],
    sentenceStarters: [
      "The predicted output is ___.",
      "The error is at step ___.",
      "The correction is ___.",
    ],
    duringLesson:
      "Label the table columns before students begin. Students can use the support option: Use the trace table with the columns already labelled. Work the first two steps with a partner, then continue.",
  },
  "design-an-algorithm": {
    preteach: ["algorithm", "nested control structure", "flowchart", "pseudocode"],
    sentenceStarters: [
      "The nested structure is ___.",
      "In the flowchart, this step is ___.",
      "In the pseudocode, this step is ___.",
    ],
    duringLesson:
      "Show the model first and point to the inner decision. Students can use the support option: Use the prepared school task and the starter flowchart shapes. Place the inner decision in the box already marked “inside the repeat”.",
  },
  "what-data-is-essential": {
    preteach: ["digital footprint", "purpose", "essential", "manage"],
    sentenceStarters: [
      "This data is essential because ___.",
      "This data is not essential because ___.",
      "One way to manage the footprint is ___.",
    ],
    duringLesson:
      "State clearly: we will not log in, and we will not look at anyone’s real digital footprint. Students can use the support option: Sort the cards with a partner. Start with two obvious items already discussed as a class.",
  },
  "evaluate-a-system-for-a-user": {
    preteach: ["user story", "design criteria", "decompose", "evaluate", "future impact"],
    sentenceStarters: [
      "As a ___, I need ___ so that ___.",
      "One design criterion is ___.",
      "The system does / does not meet this because ___.",
      "A possible future impact is ___.",
    ],
    duringLesson:
      "Leave the sentence starters visible. Students can use the support option: Use the sentence starters: “As a ___, I need ___ so that ___.” “One design criterion is ___.” “The system does / does not meet this because ___.”",
  },
};

export function years78PlannerExtrasFor(
  sessionId: Years78SessionId,
): LessonPlannerExtras {
  return {
    sessionId,
    materials: YEARS_78_LESSON_MATERIALS[sessionId],
    paper: YEARS_78_PAPER_PATHS[sessionId],
    vocab: YEARS_78_VOCAB[sessionId],
  };
}

export function years78EaldNotesFor(sessionId: Years78SessionId): EaldNotes {
  return YEARS_78_EALD_NOTES[sessionId];
}

export const YEARS_78_CLASSROOM_PACK_IDS = YEARS_78_SESSIONS.map(
  (session) => session.id,
);

/**
 * Years 3–6 classroom pack helpers: planners, explainers, paper paths,
 * vocabulary and official eSafety links. Teaching copy is taken from the
 * canonical sessions and lesson definitions. Curriculum codes are not invented
 * here — use {@link curriculumAlignmentForSession}.
 */

import {
  FIELD_MODE_CURRICULUM_PATH,
  FIELD_MODE_VERIFIED_PATH,
} from "@/lib/childSafeBaseline";
import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";
import type { CanonicalSessionId } from "@/lib/schools/canonicalSequence";
import {
  FOUNDATION_CURRICULUM_SOURCES,
} from "@/lib/schools/foundationCurriculum";
import {
  foundationEaldNotesFor,
  foundationPlannerExtrasFor,
} from "@/lib/schools/foundationClassroomPack";
import {
  FOUNDATION_SESSIONS,
  isFoundationSessionId,
} from "@/lib/schools/foundationSequence";
import {
  YEARS_78_CURRICULUM_SOURCES,
} from "@/lib/schools/years78Curriculum";
import { ALL_STATE_CURRICULUM_SOURCES } from "@/lib/schools/stateCurriculumSources";
import {
  years78EaldNotesFor,
  years78PlannerExtrasFor,
} from "@/lib/schools/years78ClassroomPack";
import {
  YEARS_78_SESSIONS,
  isYears78SessionId,
} from "@/lib/schools/years78Sequence";
import {
  LESSON_DEFINITIONS,
  getLessonById,
} from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition, LessonId } from "@/lib/teacher-lessons/types";

/** Date and zone for outbound official-link checks done for this pack. */
export const OFFICIAL_LINK_CHECKED_AT =
  "19 November 2026, Australia/Melbourne";

export { FIELD_MODE_CURRICULUM_PATH, FIELD_MODE_VERIFIED_PATH };
export const FIELD_MODE_PRINT_TICKETS_PATH = "/schools/field/print/tickets";
export const FIELD_MODE_PRINT_WORD_WALLS_PATH =
  "/schools/field/print/word-walls";
export const FIELD_MODE_PRINT_CHECKLIST_PATH =
  "/schools/field/print/checklist";
export const FIELD_MODE_PRINT_RELIEF_PATH = "/schools/field/print/relief";
export const FIELD_MODE_PRINT_PARENT_LETTER_PATH =
  "/schools/field/print/parent-letter";
export const FIELD_MODE_PRINT_LEADERSHIP_PATH =
  "/schools/field/print/leadership";
export const FIELD_MODE_PRINT_NO_TECH_PATH = "/schools/field/print/no-tech";
export const FIELD_MODE_PRINT_VERIFIED_PATH =
  "/schools/field/print/verified";
export const FIELD_MODE_PRINT_STAFF_PD_PATH =
  "/schools/field/print/staff-pd";
export const FIELD_MODE_PRINT_ROLLOUT_PATH =
  "/schools/field/print/rollout";
export const FIELD_MODE_PRINT_F2_ALL_PATH = "/schools/field/print/f2";
export const FIELD_MODE_PRINT_YEARS_78_ALL_PATH =
  "/schools/field/print/years-7-8";
export const FIELD_MODE_PRINT_CURRICULUM_PATH =
  "/schools/field/print/curriculum";

export interface OfficialLink {
  title: string;
  href: string;
  /** What a teacher will find, not a paraphrase of official advice. */
  note: string;
}

/**
 * Official eSafety Commissioner pages checked live (HTTP 200 after following
 * redirects) on {@link OFFICIAL_LINK_CHECKED_AT}. Do not add a URL unless it
 * has been checked the same way.
 */
export const ESAFETY_TEACHER_LINKS: readonly OfficialLink[] = [
  {
    title: "eSafety Commissioner — educators",
    href: "https://www.esafety.gov.au/educators",
    note: "Starting point for official educator guidance and classroom resources.",
  },
  {
    title: "Classroom resources",
    href: "https://www.esafety.gov.au/educators/classroom-resources",
    note: "Index of official classroom resources for teachers.",
  },
  {
    title: "Online boundaries and consent",
    href: "https://www.esafety.gov.au/educators/classroom-resources/online-boundaries-and-consent",
    note: "Official classroom suite labelled for middle and upper primary.",
  },
  {
    title: "Be Secure",
    href: "https://www.esafety.gov.au/educators/classroom-resources/be-secure",
    note: "Official classroom suite labelled for middle and upper primary, covering device safety, privacy and getting help.",
  },
  {
    title: "eSafety Kids",
    href: "https://www.esafety.gov.au/kids",
    note: "Official student-facing area. Use under teacher guidance.",
  },
  {
    title: "eSafety — parents",
    href: "https://www.esafety.gov.au/parents",
    note: "Official information for parents and carers.",
  },
  {
    title: "Report to eSafety",
    href: "https://www.esafety.gov.au/report",
    note: "Official reporting pathway. School child-safety procedures remain the first authority in the classroom.",
  },
];

/**
 * Official Australian Curriculum pages already linked from /schools, re-checked
 * live on {@link OFFICIAL_LINK_CHECKED_AT}. The Digital Technologies PDF href
 * on /schools uses the v9 host and resolved to the www host with HTTP 200.
 */
export const CURRICULUM_SOURCE_LINKS: readonly OfficialLink[] = [
  {
    title: "Digital Technologies Years F–6 achievement standards (PDF)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/digital-technologies-in-focus/resources/planning/v9-years-f-6-australian-curriculum-digital-technologies-achievement-standards-and-aligned-content-descriptions-on-a-page-a3.pdf",
    note: "Official AC v9 planning PDF. Checked at the www host after a redirect from the v9 host listed on /schools.",
  },
  {
    title: "Mental health and wellbeing curriculum connection",
    href: "https://www.australiancurriculum.edu.au/curriculum-information/understand-this-curriculum-connection/mental-health-and-wellbeing",
    note: "Official Australian Curriculum curriculum-connection page.",
  },
  {
    title: "Health and Physical Education scope and sequence F–10 (Word)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/health-and-physical-education/health-and-physical-education-scope-and-sequence-f-10-v9.docx",
    note: "Official AC v9 HPE document.",
  },
  {
    title: "Health and Physical Education curriculum content F–6 (Word)",
    href: "https://www.australiancurriculum.edu.au/content/dam/en/curriculum/ac-version-9/downloads/health-and-physical-education/health-and-physical-education-curriculum-content-f-6-v9.docx",
    note: "Official AC v9 HPE document.",
  },
  ...FOUNDATION_CURRICULUM_SOURCES.map((source) => ({
    title: source.title,
    href: source.href,
    note: source.notes,
  })),
  ...YEARS_78_CURRICULUM_SOURCES.map((source) => ({
    title: source.title,
    href: source.href,
    note: source.notes,
  })),
  ...ALL_STATE_CURRICULUM_SOURCES.map((source) => ({
    title: source.title,
    href: source.href,
    note: source.notes,
  })),
];

export type PaperPathKind = "works-on-paper" | "paper-fallback";

export interface PaperPath {
  kind: PaperPathKind;
  label: string;
  summary: string;
}

export interface VocabEntry {
  word: string;
  meaning: string;
}

export interface TwoMinuteExplainer {
  intention: string;
  sayThis: string;
  studentsDoThis: string;
  stopHere: string;
}

export interface LessonPlannerExtras {
  sessionId: LessonId;
  materials: readonly string[];
  paper: PaperPath;
  vocab: readonly VocabEntry[];
}

export const SHARED_LESSON_MATERIALS: readonly string[] = [
  "A teacher to lead a Years 3–6 class",
  "Paper and pencils if you use an exit ticket or a word wall",
];

/** Conditions, not materials — shown under the materials list. */
export const SHARED_LESSON_CONDITIONS =
  "No student accounts and nothing to install.";

const SCREEN_MATERIALS: readonly string[] = [
  "A browser and a shared screen or projector for the demonstration companion",
];

const PAPER_MATERIALS: readonly string[] = [
  "The printed lesson planner, or space on a board to draw and write",
];

const PAPER_PATHS: Record<CanonicalSessionId, PaperPath> = {
  "meet-the-system": {
    kind: "paper-fallback",
    label: "Better on a shared screen; paper fallback available",
    summary:
      "The live lesson uses the demonstration companion so the class can see one real input and one change. If you have no device, draw a simple system (a box that waits, then changes), give it one input, and have students label what changed. That keeps the same idea; it is not the same as watching the live companion.",
  },
  "read-the-signals": {
    kind: "paper-fallback",
    label: "Better on a shared screen; paper fallback available",
    summary:
      "The live lesson depends on signals the companion shows. If you have no device, draw or print two or three simple signals (for example a colour, an icon and a word) and ask what each might mean and what else it could mean. Students cannot read a live companion state on paper.",
  },
  "one-identity-many-representations": {
    kind: "paper-fallback",
    label: "Can be run on paper",
    summary:
      "The live lesson compares two views on the shared screen. On paper, show the same companion as a picture, a word and a number, then find what stayed the same. The thinking is the same; the live lesson just uses the on-screen views.",
  },
  "choices-and-algorithms": {
    kind: "paper-fallback",
    label: "Better on a shared screen; paper fallback available",
    summary:
      "The live lesson lets the class predict, try an order, reset, and try a different order on the demonstration companion. On paper, write a simple if–then rule, predict, act it out or tick a result row, then reset (wipe the row) and try a different order. You will not get the live reset behaviour.",
  },
  "privacy-and-responsible-design": {
    kind: "works-on-paper",
    label: "Works well on paper",
    summary:
      "Students sort examples into keep, ask first and never, then give a reason. That activity does not need the demonstration companion. Use a board, cards or the printed planner, and choose a few concrete examples from ordinary classroom or home life. This pack does not list those examples for you.",
  },
  "design-a-better-feature": {
    kind: "paper-fallback",
    label: "Can be run on paper",
    summary:
      "The live lesson starts from what is on the screen now. On paper, students look at a simple printed or drawn feature, change one part only, and say who the change helps and who it might not. Keep the one-change limit; that is the teaching.",
  },
  "test-reflect-and-improve": {
    kind: "paper-fallback",
    label: "Better after earlier lessons; paper fallback available",
    summary:
      "The live lesson looks back across the sequence and may use the pattern view on screen. On paper, students name one pattern they noticed in earlier sessions and one example that supports it, then say what they would try next time. This is weaker if the class has not done the earlier sessions.",
  },
};

const LESSON_MATERIALS: Record<CanonicalSessionId, readonly string[]> = {
  "meet-the-system": [...SCREEN_MATERIALS, ...PAPER_MATERIALS],
  "read-the-signals": [
    ...SCREEN_MATERIALS,
    "Or, for the paper fallback, two or three simple signal examples drawn or printed by the teacher",
  ],
  "one-identity-many-representations": [
    ...SCREEN_MATERIALS,
    "Paper so students can draw a second view of the same companion",
  ],
  "choices-and-algorithms": [
    ...SCREEN_MATERIALS,
    "Or, for the paper fallback, a simple if–then rule written on the board and a way to reset (wipe and start a new row)",
  ],
  "privacy-and-responsible-design": [
    "Three labels or corners of the room: keep, ask first, and never",
    "A few concrete examples to sort, spoken or written",
    "A shared screen or projector is optional for this lesson",
    ...PAPER_MATERIALS,
  ],
  "design-a-better-feature": [
    ...SCREEN_MATERIALS,
    "Paper for the one design change and the reason",
  ],
  "test-reflect-and-improve": [
    ...SCREEN_MATERIALS,
    "Or paper for one pattern statement and one supporting example from earlier sessions",
  ],
};

const VOCAB: Record<CanonicalSessionId, readonly VocabEntry[]> = {
  "meet-the-system": [
    {
      word: "system",
      meaning: "Something that waits for an input, then changes what it shows.",
    },
    {
      word: "input",
      meaning: "One thing we do that the system can respond to.",
    },
    {
      word: "change",
      meaning: "What is different after the input.",
    },
  ],
  "read-the-signals": [
    {
      word: "signal",
      meaning: "Something the system shows that we can notice and talk about.",
    },
    {
      word: "guess",
      meaning: "One possible meaning, not a fact.",
    },
    {
      word: "response",
      meaning: "What we choose to do after reading a signal.",
    },
  ],
  "one-identity-many-representations": [
    {
      word: "view",
      meaning: "One way of showing the same thing, such as a picture, a word or a number.",
    },
    {
      word: "same",
      meaning: "What did not change in both views, even if they looked different.",
    },
    {
      word: "different",
      meaning: "How two views can look unlike each other and still show the same thing.",
    },
  ],
  "choices-and-algorithms": [
    {
      word: "if–then",
      meaning: "A simple rule: if this happens, then that follows.",
    },
    {
      word: "predict",
      meaning: "Say what you think will happen before you try it.",
    },
    {
      word: "reset",
      meaning: "Go back to the start and try again.",
    },
    {
      word: "order",
      meaning: "Which step you do first, second and next.",
    },
  ],
  "privacy-and-responsible-design": [
    {
      word: "keep",
      meaning: "Something a system may remember.",
    },
    {
      word: "ask first",
      meaning: "Something a system should only remember if a person agrees.",
    },
    {
      word: "never",
      meaning: "Something a system should not remember.",
    },
    {
      word: "remember",
      meaning: "What a system stores after someone uses it.",
    },
  ],
  "design-a-better-feature": [
    {
      word: "feature",
      meaning: "One part of the design you can change.",
    },
    {
      word: "design",
      meaning: "The way something is put together, which you can change on purpose.",
    },
    {
      word: "change",
      meaning: "The single difference you choose to make.",
    },
  ],
  "test-reflect-and-improve": [
    {
      word: "test",
      meaning: "Try one idea and see what happens.",
    },
    {
      word: "pattern",
      meaning: "Something that happened more than once across the lessons.",
    },
    {
      word: "improve",
      meaning: "Look back, then decide what to try next so it works better.",
    },
  ],
};

/**
 * Suggested minutes for each of the five guided steps. These are planning
 * estimates only; they always add up to the session length.
 */
export function estimatedStepMinutes(
  totalMinutes: number,
  stepCount: number,
  stepIndex: number,
): number {
  if (stepCount <= 0) return 0;
  if (stepCount === 5 && totalMinutes === 15) {
    return [2, 3, 4, 4, 2][stepIndex] ?? 0;
  }
  if (stepCount === 5 && totalMinutes === 20) {
    return [3, 4, 5, 5, 3][stepIndex] ?? 0;
  }
  if (stepCount === 5 && totalMinutes === 45) {
    return [5, 8, 15, 12, 5][stepIndex] ?? 0;
  }
  const base = Math.floor(totalMinutes / stepCount);
  const remainder = totalMinutes - base * stepCount;
  return base + (stepIndex < remainder ? 1 : 0);
}

export function twoMinuteExplainerFor(
  lesson: LessonDefinition,
): TwoMinuteExplainer {
  const session =
    CANONICAL_SESSIONS.find((candidate) => candidate.id === lesson.id) ??
    FOUNDATION_SESSIONS.find((candidate) => candidate.id === lesson.id) ??
    YEARS_78_SESSIONS.find((candidate) => candidate.id === lesson.id);
  return {
    intention: lesson.learningIntention,
    sayThis: lesson.teacherScript,
    studentsDoThis: session?.childActivity ?? lesson.studentInstructions,
    stopHere: session?.stoppingPoint ?? lesson.stoppingPoint,
  };
}

export function plannerExtrasFor(sessionId: LessonId): LessonPlannerExtras {
  if (isFoundationSessionId(sessionId)) {
    return foundationPlannerExtrasFor(sessionId);
  }
  if (isYears78SessionId(sessionId)) {
    return years78PlannerExtrasFor(sessionId);
  }
  return {
    sessionId,
    materials: LESSON_MATERIALS[sessionId],
    paper: PAPER_PATHS[sessionId],
    vocab: VOCAB[sessionId],
  };
}

export function lessonSourceText(lesson: LessonDefinition): string {
  const session =
    CANONICAL_SESSIONS.find((candidate) => candidate.id === lesson.id) ??
    FOUNDATION_SESSIONS.find((candidate) => candidate.id === lesson.id) ??
    YEARS_78_SESSIONS.find((candidate) => candidate.id === lesson.id);
  return [
    lesson.title,
    lesson.shortDescription,
    lesson.learningIntention,
    lesson.teacherIntroduction,
    lesson.teacherScript,
    lesson.studentInstructions,
    lesson.extensionActivity,
    lesson.supportActivity,
    ...lesson.successCriteria,
    ...lesson.discussionPrompts,
    ...lesson.steps.flatMap((step) => [
      step.title,
      step.teacherPrompt,
      step.studentTask,
      step.whatDoINow,
      step.expectedOutcome,
    ]),
    session?.childActivity,
    session?.reflectionPrompt,
    session?.teacherIntroduction,
    session?.stoppingPoint,
    session?.lightEvidence,
    session?.movementMoment,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLowerCase();
}

export const PARENT_LETTER_BLANKS: readonly string[] = [
  "School name",
  "Class or year",
  "Teacher name",
  "Date",
  "School contact",
  "Return by (optional)",
];

export const PARENT_NOTE_SOURCE_PATH =
  "public/docs/schools-au/teacher-pack/parent-note.md";

/** Observation checklist copied from the published assessment document. */
export const TEACHER_OBSERVATION_CHECKLIST_ITEMS: readonly string[] = [
  "Reads companion state before acting",
  "Explains cause and effect",
  "Uses systems language",
  "Suggests a regulation strategy",
  "Works collaboratively",
];

export const STUDENT_REFLECTION_PROMPTS: readonly string[] = [
  "My digital companion was showing this visible state:",
  "I chose this action:",
  "The system changed in this way:",
  "This shows cause and effect because:",
  "One pattern I noticed was:",
  "One strategy that helped the companion recover or settle was:",
  "One thing I learned about working with a partner or listening to others was:",
];

export const ASSESSMENT_SOURCE_PATH =
  "public/docs/schools-au/03-assessment-and-reflection.md";

export const LEADERSHIP_ONE_PAGER = {
  title: "MetaPet School — principal and ICT one-pager",
  whatItIs:
    "A teacher-led classroom tool for Years 3–6, with a fully unplugged starter set for Foundation and Years 1–2, and a Years 7–8 bridge unit of seven lessons of about 45 minutes. The F–6 sessions are about 15 or 20 minutes. Students do not need accounts. Ordinary page requests still go to the website host; classroom records stay in the browser during routine use. The F–2 and Years 7–8 lessons do not collect names or personal data.",
  whatItTeaches:
    "Systems thinking, digital responsibility, and online safety habits, using the Australian Curriculum v9 codes already listed on the lesson cards. This is a classroom alignment, not an official ACARA endorsement.",
  whatItAvoids:
    "Student accounts, social features, open chat, and features designed to keep students coming back outside the lesson.",
  operatingRules: [
    "Use aliases only; do not enter real student names.",
    "Keep each session to the planned time: about 15 or 20 minutes for F–6, or about 45 minutes for Years 7–8.",
    "Do not position it as therapy or counselling.",
    "Confirm the school’s family participation process before the first lesson.",
    "Review any export before it leaves the device.",
    "Teachers can delete local classroom data at any time. Automatic removal after 35 days only happens when a school page next opens.",
  ],
  reviewFirst: [
    "This one-pager and the what’s-verified page",
    "The parent and carer letter",
    "The teacher pack and the curriculum overview",
    "The ICT/privacy review checklist and the privacy pack, if you are approving a pilot",
  ],
} as const;

export type VerificationStatus = "checked" | "not-checked";

export interface VerificationItem {
  title: string;
  status: VerificationStatus;
  detail: string;
}

export const VERIFICATION_ITEMS: readonly VerificationItem[] = [
  {
    title: "Official eSafety Commissioner pages linked from this pack",
    status: "checked",
    detail: `Each listed eSafety URL returned HTTP 200 after following redirects, checked on ${OFFICIAL_LINK_CHECKED_AT}. This confirms the page was reachable, not that eSafety has endorsed MetaPet School.`,
  },
  {
    title: "Official Australian Curriculum documents already linked from /schools",
    status: "checked",
    detail: `Each listed Australian Curriculum URL returned HTTP 200 after following redirects, checked on ${OFFICIAL_LINK_CHECKED_AT}. This confirms the file or page was reachable.`,
  },
  {
    title: "Offline Pack on school hardware",
    status: "not-checked",
    detail:
      "The Offline Pack has not been verified on school hardware. Treat it as untested in that setting, follow the prep and rollback steps, and keep the printed pack as a fallback.",
  },
  {
    title: "School browsers, devices and networks",
    status: "not-checked",
    detail:
      "No school device, browser or network test results are recorded here. Do not assume a particular classroom setup has been trialled.",
  },
  {
    title: "Production website already showing this classroom pack",
    status: "not-checked",
    detail:
      "This pack is source-code work. It does not claim that www.metapet.school has already been updated. Confirm against the live site after a release.",
  },
  {
    title: "Third-party security, accessibility or curriculum audit",
    status: "not-checked",
    detail:
      "This page does not record an external security audit, accessibility audit, or an official ACARA, eSafety, VCAA or NESA endorsement.",
  },
  {
    title: "Rollout plan and private teacher feedback storage",
    status: "checked",
    detail:
      "In this source, the whole-school rollout plan and the private teacher feedback tool write only to this browser, with an export or copy option for feedback. They do not add a server endpoint, a third-party feedback service, or product analytics. This is a statement about the current source, not a production-host audit.",
  },
  {
    title: "F–2 Digital Technologies content descriptions in the unplugged starter set",
    status: "checked",
    detail:
      `The eight Australian Curriculum v9 codes used in the F–2 starter set, and the content-description wording shown beside them, were copied from official ACARA Digital Technologies documents that returned HTTP 200 on ${OFFICIAL_LINK_CHECKED_AT}: the F–6 curriculum content download, the F–10 scope and sequence, and, for AC9TDIFK01 and AC9TDIFK02, the Foundation work sample “Observations: Data is all around us”. This is classroom alignment, not an official ACARA endorsement.`,
  },
  {
    title: "Years 7–8 Digital Technologies content descriptions in the bridge unit",
    status: "checked",
    detail:
      "The eight Australian Curriculum v9 codes used in the Years 7–8 bridge unit, and the content-description wording shown beside them, were copied from official ACARA Digital Technologies documents that returned HTTP 200 on 20 November 2026, Australia/Sydney: the 7–10 curriculum content download, and the F–10 scope and sequence. This is classroom alignment, not an official ACARA endorsement.",
  },
  {
    title: "Victorian Curriculum 2.0 and NSW syllabus maps",
    status: "checked",
    detail:
      "Victorian Curriculum F–10 Version 2.0 Digital Technologies wording used in the state maps was copied from the official vic.gov.au Version 2.0 Technologies Word download and the official full-curriculum CSV extract dated 20 October 2026. Those files, and the official downloads page, returned HTTP 200 on 21 November 2026, Australia/Sydney. The official F–10 website at f10.vcaa.vic.edu.au was in maintenance and directed readers to that downloads page; victoriancurriculum.vcaa.vic.edu.au returned HTTP 503. NSW outcome wording was copied from official NESA pages for the Science and Technology K–6 Syllabus (2024) and the Technology 7–8 Syllabus (2023), each HTTP 200 on the same date. Rows marked “not mapped yet” were left unmapped rather than guessed. This is classroom alignment, not a VCAA, NESA or Victorian Government endorsement.",
  },
];


export interface EaldNotes {
  /** Word-wall words to say, show and repeat before the activity. */
  preteach: readonly string[];
  /** Stems taken from the lesson's own evidence or instructions. */
  sentenceStarters: readonly string[];
  /** What to do in the lesson, using the existing support option. */
  duringLesson: string;
}

const EALD_NOTES: Record<CanonicalSessionId, EaldNotes> = {
  "meet-the-system": {
    preteach: ["system", "input", "change"],
    sentenceStarters: [
      "I did ___ and the system showed ___.",
      "It changed because ___.",
    ],
    duringLesson:
      "Show the word wall and say each word once before you start. Students can use the support option: Point to one thing on the screen and say one word about it. A one-word answer or a completed sentence starter is enough.",
  },
  "read-the-signals": {
    preteach: ["signal", "guess", "response"],
    sentenceStarters: [
      "I can see this signal: ___.",
      "It might mean ___. It could also mean ___.",
      "My response is ___.",
    ],
    duringLesson:
      "Keep the three words visible. Students can use the support option: Point to one signal and say one word for how it looks. They do not need a long explanation.",
  },
  "one-identity-many-representations": {
    preteach: ["view", "same", "different"],
    sentenceStarters: [
      "This view shows ___.",
      "This stayed the same in both views: ___.",
      "This looks different, but it is still ___.",
    ],
    duringLesson:
      "Point as you say view, same and different. Students can use the support option: Point to one part that looks the same in both views.",
  },
  "choices-and-algorithms": {
    preteach: ["if–then", "predict", "reset", "order"],
    sentenceStarters: [
      "I predict ___.",
      "If ___, then ___.",
      "We will reset and try this order: ___.",
    ],
    duringLesson:
      "Act out if, then, predict and reset with a simple hand signal as you say the word. Students can use the support option: Say one action and one thing it might change.",
  },
  "privacy-and-responsible-design": {
    preteach: ["keep", "ask first", "never", "remember"],
    sentenceStarters: [
      "I would keep ___, because ___.",
      "I would ask first about ___, because ___.",
      "I would never remember ___, because ___.",
    ],
    duringLesson:
      "Leave the three labels (keep, ask first, never) where everyone can see them. Students can use the support option: Choose one example and say keep, ask first, or never.",
  },
  "design-a-better-feature": {
    preteach: ["feature", "design", "change"],
    sentenceStarters: [
      "The feature I will change is ___.",
      "My change is ___.",
      "This change helps ___. It might not help ___.",
    ],
    duringLesson:
      "Hold up or point to the one part being changed as you use the words feature, design and change. Students can use the support option: Choose one part and say why you like it.",
  },
  "test-reflect-and-improve": {
    preteach: ["test", "pattern", "improve"],
    sentenceStarters: [
      "The idea I will test is ___.",
      "The pattern I noticed is ___.",
      "Next time I would try ___.",
    ],
    duringLesson:
      "Write test, pattern and improve on the board and leave them up. Students can use the support option: Point to one thing that happened more than once.",
  },
};

export function ealdNotesFor(sessionId: LessonId): EaldNotes {
  if (isFoundationSessionId(sessionId)) {
    return foundationEaldNotesFor(sessionId);
  }
  if (isYears78SessionId(sessionId)) {
    return years78EaldNotesFor(sessionId);
  }
  return EALD_NOTES[sessionId];
}

export function allPlannerLessons(): LessonDefinition[] {
  return LESSON_DEFINITIONS.map((lesson) => {
    const found = getLessonById(lesson.id);
    return found ?? lesson;
  });
}


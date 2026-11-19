/**
 * Years 3–6 classroom pack helpers: planners, explainers, paper paths,
 * vocabulary and official eSafety links. Teaching copy is taken from the
 * canonical sessions and lesson definitions. Curriculum codes are not invented
 * here — use {@link curriculumAlignmentForSession}.
 */

import { FIELD_MODE_VERIFIED_PATH } from "@/lib/childSafeBaseline";
import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";
import type { CanonicalSessionId } from "@/lib/schools/canonicalSequence";
import {
  LESSON_DEFINITIONS,
  getLessonById,
} from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

/** Date and zone for outbound official-link checks done for this pack. */
export const OFFICIAL_LINK_CHECKED_AT =
  "19 November 2026, Australia/Melbourne";

export { FIELD_MODE_VERIFIED_PATH };
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
  sessionId: CanonicalSessionId;
  materials: readonly string[];
  paper: PaperPath;
  vocab: readonly VocabEntry[];
}

export const SHARED_LESSON_MATERIALS: readonly string[] = [
  "A Years 3–6 class and a teacher to lead the lesson",
  "The suggested time on the lesson card (15 or 20 minutes)",
  "Paper and pencils if you use an exit ticket or a word wall",
  "No student accounts and nothing to install",
];

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
      "Students sort examples into keep, ask first and never, then give a reason. That activity does not need the demonstration companion. Use a board, cards or the printed planner.",
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
      meaning: "A possible meaning, not a proved fact.",
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
      meaning: "What stayed true in both views, even if they looked different.",
    },
    {
      word: "different",
      meaning: "How the two views do not look alike, even when they show one thing.",
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
      meaning: "Go back to the start and try again, without treating the first try as a failure.",
    },
    {
      word: "order",
      meaning: "The sequence of steps you try.",
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
      word: "change",
      meaning: "The single difference you choose to make.",
    },
    {
      word: "help",
      meaning: "Who is better off because of your change, and who might not be.",
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
      meaning: "Say what you would try next time, after looking back.",
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
  const base = Math.floor(totalMinutes / stepCount);
  const remainder = totalMinutes - base * stepCount;
  return base + (stepIndex < remainder ? 1 : 0);
}

export function twoMinuteExplainerFor(
  lesson: LessonDefinition,
): TwoMinuteExplainer {
  const session = CANONICAL_SESSIONS.find(
    (candidate) => candidate.id === lesson.id,
  );
  return {
    intention: lesson.learningIntention,
    sayThis: lesson.teacherScript,
    studentsDoThis: session?.childActivity ?? lesson.studentInstructions,
    stopHere: session?.stoppingPoint ?? lesson.stoppingPoint,
  };
}

export function plannerExtrasFor(
  sessionId: CanonicalSessionId,
): LessonPlannerExtras {
  return {
    sessionId,
    materials: LESSON_MATERIALS[sessionId],
    paper: PAPER_PATHS[sessionId],
    vocab: VOCAB[sessionId],
  };
}

export function lessonSourceText(lesson: LessonDefinition): string {
  const session = CANONICAL_SESSIONS.find(
    (candidate) => candidate.id === lesson.id,
  );
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
    "A teacher-led, low-data classroom tool for Years 3–6. Seven short sessions of about 15–20 minutes.",
  whatItTeaches:
    "Systems thinking, digital responsibility, and online safety habits, aligned to published Australian Curriculum v9 codes already listed on the lesson cards.",
  whatItAvoids:
    "Student accounts, social features, open chat, and retention pressure loops.",
  operatingRules: [
    "Use aliases only; do not enter real student names.",
    "Keep sessions time-bounded.",
    "Do not position it as therapy or counselling.",
    "Confirm the school’s family participation process before the first lesson.",
    "Review any export before it leaves the device.",
    "Teachers can delete local classroom data at any time.",
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
      "This page does not record an external security audit, accessibility audit, or an official ACARA or eSafety endorsement.",
  },
];

export function allPlannerLessons(): LessonDefinition[] {
  return LESSON_DEFINITIONS.map((lesson) => {
    const found = getLessonById(lesson.id);
    return found ?? lesson;
  });
}


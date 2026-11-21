/**
 * Optional Invisible Trail classroom planner pack. Curriculum codes are only
 * those already stated on the lab: AC9TDI4P09, VC2TDI4D05, AC9TDI6P10 and
 * VC2TDI6D06. Timings add to the lab’s stated 30 minutes.
 */

import type { EaldNotes, VocabEntry } from "@/lib/schools/classroomPack";
import type { OfficialStateDescription } from "@/lib/schools/stateLessonMaps";
import {
  INVISIBLE_TRAIL_STATED_CODES,
  OFFICIAL_VC2_DIGITAL_TECHNOLOGIES,
} from "@/lib/schools/stateLessonMaps";

export const INVISIBLE_TRAIL_TITLE = "The Invisible Trail";
export const INVISIBLE_TRAIL_DURATION_MINUTES = 30;
export const INVISIBLE_TRAIL_LAB_PATH =
  "/schools/field/play/invisible-trail";
export const INVISIBLE_TRAIL_SLIDES_PATH =
  "/schools/field/play/invisible-trail/slides";
export const INVISIBLE_TRAIL_COMMENTS_PATH =
  "/schools/field/play/invisible-trail/comments";
export const INVISIBLE_TRAIL_PRINT_PLANNER_PATH =
  "/schools/field/print/invisible-trail";
export const INVISIBLE_TRAIL_STATIC_GUIDE_PATH =
  "/schools/field/print/invisible-trail.html";

export const INVISIBLE_TRAIL_INTENTION =
  "I can notice how a digital trail can form from ordinary actions, using only fictional examples, and talk about what should stay private.";

export interface InvisibleTrailTiming {
  id: string;
  minutes: number;
  title: string;
  teacherDoes: string;
}

export const INVISIBLE_TRAIL_TIMINGS: readonly InvisibleTrailTiming[] = [
  {
    id: "purpose",
    minutes: 3,
    title: "Purpose and safety",
    teacherDoes:
      "Say that this is a 30-minute optional companion. All examples are fictional. Students do not sign in, and they should not use real names, photos or their own accounts.",
  },
  {
    id: "missions",
    minutes: 15,
    title: "Five missions on the teacher screen",
    teacherDoes:
      "Run the five missions on the shared screen only. Students watch, talk, and may jot notes on paper. They do not need a device.",
  },
  {
    id: "discuss",
    minutes: 10,
    title: "Discuss and redraw one example",
    teacherDoes:
      "Choose one fictional trail. Talk about what was collected, who might see it, and what should stay private. Students redraw or label that one example on paper.",
  },
  {
    id: "exit",
    minutes: 2,
    title: "Exit ticket",
    teacherDoes:
      "Students write or say one thing a system might keep, and one thing that should stay private. Collect the paper or listen; do not record real names.",
  },
];

export function invisibleTrailTimingTotal(): number {
  return INVISIBLE_TRAIL_TIMINGS.reduce((sum, step) => sum + step.minutes, 0);
}

export const INVISIBLE_TRAIL_MATERIALS: readonly string[] = [
  "A teacher to lead a Years 3–6 class",
  "One shared screen or projector for the teacher-led lab",
  "A browser, with no student accounts and nothing to install",
  "Paper and pencils for the redraw and the exit ticket",
  "The printed planner or the no-JavaScript teacher guide if the network may drop out",
];

export const INVISIBLE_TRAIL_CONDITIONS =
  "No student accounts. Use only the fictional examples in the lab. Do not collect student names, photos or personal data.";

export const INVISIBLE_TRAIL_PAPER = {
  kind: "paper-fallback" as const,
  label: "Better on a shared screen; paper fallback available",
  summary:
    "The live lab uses fictional trails on the teacher’s screen. If you have no device, use the printed teacher guide and redraw one example on paper. The discussion is the same; students will not see the interactive missions.",
};

export const INVISIBLE_TRAIL_VOCAB: readonly VocabEntry[] = [
  {
    word: "trail",
    meaning: "What a digital system may keep after an ordinary action.",
  },
  {
    word: "fictional",
    meaning: "Made-up examples only; not about anyone in this class.",
  },
  {
    word: "private",
    meaning: "Something that should not be collected or shown without a good reason.",
  },
  {
    word: "footprint",
    meaning: "The trail of data that can remain and be seen later.",
  },
];

export const INVISIBLE_TRAIL_EALD: EaldNotes = {
  preteach: ["trail", "fictional", "private", "footprint"],
  sentenceStarters: [
    "The system kept ___.",
    "This should stay private because ___.",
  ],
  duringLesson:
    "Show the word wall and say each word once before you start. Students can point to one part of the trail and use a sentence starter or a one-word answer. That is enough.",
};

export const INVISIBLE_TRAIL_EXIT_TICKET = {
  title: "Exit ticket — The Invisible Trail",
  minutes: 2,
  prompts: [
    "Write or say one thing a system might keep after an ordinary action. Use a fictional example, not a real name.",
    "Write or say one thing that should stay private, and why.",
  ],
};

export const INVISIBLE_TRAIL_STATED_CURRICULUM: readonly {
  code: string;
  wording: string;
  source: string;
}[] = [
  {
    code: "AC9TDI4P09",
    wording:
      "identify what personal data is stored and shared in their online accounts and discuss any associated risks",
    source: "Australian Curriculum v9 Digital Technologies, already stated on the lab",
  },
  {
    code: "VC2TDI4D05",
    wording: OFFICIAL_VC2_DIGITAL_TECHNOLOGIES.VC2TDI4D05.wording,
    source: "Victorian Curriculum F–10 Version 2.0, already stated on the lab",
  },
  {
    code: "AC9TDI6P10",
    wording:
      "explain the creation and permanence of their digital footprint and consider privacy when collecting user data",
    source: "Australian Curriculum v9 Digital Technologies, already stated on the lab",
  },
  {
    code: "VC2TDI6D06",
    wording: OFFICIAL_VC2_DIGITAL_TECHNOLOGIES.VC2TDI6D06.wording,
    source: "Victorian Curriculum F–10 Version 2.0, already stated on the lab",
  },
];

export const INVISIBLE_TRAIL_REPORT_STARTERS = {
  "working-towards":
    "[alias] is beginning to notice how a digital trail can form, using a fictional example. Next step: name one thing that should stay private.",
  at: "[alias] can notice how a digital trail can form from ordinary actions, using only fictional examples, and talk about what should stay private.",
  above:
    "[alias] can notice how a digital trail can form from ordinary actions, using only fictional examples, and can explain why one piece of data should stay private.",
};

// Keep the stated-code list in one place so the pack cannot drift.
export const INVISIBLE_TRAIL_PACK_CODES: readonly string[] = [
  ...INVISIBLE_TRAIL_STATED_CODES,
];

export function invisibleTrailOfficialVictorian(): OfficialStateDescription[] {
  return [
    OFFICIAL_VC2_DIGITAL_TECHNOLOGIES.VC2TDI4D05,
    OFFICIAL_VC2_DIGITAL_TECHNOLOGIES.VC2TDI6D06,
  ];
}

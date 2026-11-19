import type { ProjectorSlide } from "@/components/field-mode/ProjectorSlides";
import {
  LEADERSHIP_ONE_PAGER,
  VERIFICATION_ITEMS,
} from "@/lib/schools/classroomPack";
import { SCHOOL_PRIVACY_COMMITMENTS } from "@/lib/schools/privacyTruth";
import { SCHOOLS_LOCAL_DATA_RETENTION_DAYS } from "@/lib/schools/privacyTruth";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export interface StaffPdSlide extends ProjectorSlide {
  minutes: number;
}

export const STAFF_PD_TITLE = "MetaPet School — 15-minute staff briefing";

const lessonLines = LESSON_DEFINITIONS.map(
  (lesson) =>
    `Lesson ${lesson.number}: ${lesson.title} (${lesson.durationMinutes} min)`,
);

const checkedItems = VERIFICATION_ITEMS.filter((item) => item.status === "checked").map(
  (item) => item.title,
);
const notCheckedItems = VERIFICATION_ITEMS.filter(
  (item) => item.status === "not-checked",
).map((item) => item.title);

export const STAFF_PD_SLIDES: readonly StaffPdSlide[] = [
  {
    id: "title",
    kicker: "Staff briefing · about 15 minutes",
    title: STAFF_PD_TITLE,
    body: "A short, teacher-led classroom sequence for Australian Years 3–6. This briefing uses only what the classroom pack already states.",
    notes:
      "About 1 minute. Thank colleagues and say this is a 15-minute overview, not a full training day. Speaker notes stay hidden on the projector until you show them.",
    minutes: 1,
  },
  {
    id: "what-it-is",
    kicker: "What it is",
    title: "A teacher-led classroom tool for Years 3–6",
    body: LEADERSHIP_ONE_PAGER.whatItIs,
    notes:
      "About 2 minutes. Stress that students do not need accounts, and that ordinary page requests still go to the website host.",
    minutes: 2,
  },
  {
    id: "lessons",
    kicker: "The seven lessons",
    title: "Seven short sessions, in a set sequence",
    bullets: lessonLines,
    notes:
      "About 2 minutes. Sessions 1 and 2 are 15 minutes; sessions 3 to 7 are 20 minutes. You can start with Lesson 1 and follow the sequence.",
    minutes: 2,
  },
  {
    id: "how-it-runs",
    kicker: "How a lesson runs",
    title: "The teacher leads; the class works from a script",
    bullets: [
      "A two-minute explainer sits on each planner: intention, what you say, what students do, and where to stop.",
      "Each lesson has five guided steps with estimated minutes that add up to the session.",
      "A paper path is on every planner if a shared screen is not available.",
    ],
    notes:
      "About 3 minutes. If time allows, open the Lesson 1 planner or projector slides and show the script, the five steps and the stop point.",
    minutes: 3,
  },
  {
    id: "privacy",
    kicker: "Privacy posture",
    title: "Aliases only, and no student accounts to create",
    bullets: [
      SCHOOL_PRIVACY_COMMITMENTS.accountsShort,
      SCHOOL_PRIVACY_COMMITMENTS.localRecords,
      "Ordinary page requests still go to the website host.",
      `Automatic removal after ${SCHOOLS_LOCAL_DATA_RETENTION_DAYS} days only happens when a school page next opens.`,
    ],
    notes:
      "About 2 minutes. Ask staff not to enter real student names. Teachers can delete local classroom data at any time.",
    minutes: 2,
  },
  {
    id: "printables",
    kicker: "Printables and relief",
    title: "A paper pack is ready if the network drops out",
    bullets: [
      "Print the full classroom pack, or open one planner at a time.",
      "The relief pack includes a runnable Lesson 1 planner.",
      "There is an editable parent and carer letter, a leadership one-pager, exit tickets, word walls and a no-tech path.",
    ],
    notes:
      "About 1 minute. Point colleagues to the classroom pack on the home page and the printable relief pack.",
    minutes: 1,
  },
  {
    id: "tools",
    kicker: "Classroom tools",
    title: "Filters, a timer, groups and comment starters",
    bullets: [
      "The lessons page can be searched and filtered, including a shareable link.",
      "The timer and group maker stay on this device; groups can use the local alias roster.",
      "Report comment starters must be personalised. They are not official achievement standards.",
    ],
    notes:
      "About 1 minute. These are optional supports. They do not require student accounts.",
    minutes: 1,
  },
  {
    id: "verified",
    kicker: "What’s verified, and what is not",
    title: "Say only what this pack has actually checked",
    bullets: [
      `Checked in this pack: ${checkedItems.join("; ")}.`,
      `Not checked: ${notCheckedItems.join("; ")}.`,
      "Reachable official links are not an eSafety or ACARA endorsement.",
    ],
    notes:
      "About 2 minutes. Open the what’s-verified page if you can. Do not tell staff the Offline Pack or school hardware has been trialled unless they have done that work themselves.",
    minutes: 2,
  },
  {
    id: "next",
    kicker: "Next steps",
    title: "Review, try Lesson 1, then plan the term",
    bullets: [
      "Read the what’s-verified page and the principal and ICT one-pager.",
      "Confirm the school’s family participation process, then use the parent letter if it is needed.",
      "Try Lesson 1, fill in the whole-school rollout plan, and leave private teacher feedback after a lesson if you want a record on this device.",
    ],
    notes:
      "About 1 minute. Leave time for questions. The rollout plan and teacher feedback stay in this browser unless someone copies or prints them.",
    minutes: 1,
  },
];

export function staffPdTotalMinutes(): number {
  return STAFF_PD_SLIDES.reduce((sum, slide) => sum + slide.minutes, 0);
}

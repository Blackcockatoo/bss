"use client";

import { ProjectorSlides } from "@/components/field-mode/ProjectorSlides";
import { FIELD_MODE_LESSONS_PATH } from "@/lib/childSafeBaseline";
import {
  INVISIBLE_TRAIL_COMMENTS_PATH,
  INVISIBLE_TRAIL_DURATION_MINUTES,
  INVISIBLE_TRAIL_INTENTION,
  INVISIBLE_TRAIL_LAB_PATH,
  INVISIBLE_TRAIL_PRINT_PLANNER_PATH,
  INVISIBLE_TRAIL_TIMINGS,
  INVISIBLE_TRAIL_TITLE,
} from "@/lib/schools/invisibleTrailPack";

const linkClassName =
  "inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold";

const slides = [
  {
    id: "title",
    kicker: `Optional companion · Years 3–6 · ${INVISIBLE_TRAIL_DURATION_MINUTES} minutes`,
    title: INVISIBLE_TRAIL_TITLE,
    body: "A teacher-led privacy lab that uses only fictional examples. Students do not sign in.",
    notes:
      "Open with the class looking at the shared screen. Hide these notes when you present.",
  },
  {
    id: "intention",
    kicker: "Learning intention",
    title: INVISIBLE_TRAIL_INTENTION,
    body: "Listen first. Then we will look at one fictional trail together.",
    notes:
      "Remind the class that examples are made up. No real names, photos or accounts.",
  },
  ...INVISIBLE_TRAIL_TIMINGS.map((step, index) => ({
    id: step.id,
    kicker: `Step ${index + 1} of ${INVISIBLE_TRAIL_TIMINGS.length} · ${step.minutes} minutes`,
    title: step.title,
    body: step.teacherDoes,
    notes: "Stay with the fictional examples on the teacher screen or paper.",
  })),
  {
    id: "stop",
    kicker: "Stop here",
    title: "We stop after the exit ticket.",
    body: "No student accounts were used. Classroom records, if any, stay in this browser and can be deleted.",
    notes: "Do not collect real names or personal data on the exit tickets.",
  },
];

export function InvisibleTrailSlides() {
  return (
    <ProjectorSlides
      slides={slides}
      links={
        <>
          <a href={INVISIBLE_TRAIL_LAB_PATH} className={linkClassName}>
            Exit to the lab
          </a>
          <a href={INVISIBLE_TRAIL_PRINT_PLANNER_PATH} className={linkClassName}>
            Planner
          </a>
          <a href={INVISIBLE_TRAIL_COMMENTS_PATH} className={linkClassName}>
            Report comment starters
          </a>
          <a href={FIELD_MODE_LESSONS_PATH} className={linkClassName}>
            Lesson launchpad
          </a>
        </>
      }
    />
  );
}

"use client";

import { useMemo } from "react";

import { ProjectorSlides } from "@/components/field-mode/ProjectorSlides";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PRINT_PATH_PREFIX,
  FIELD_MODE_TOOLS_PATH,
} from "@/lib/childSafeBaseline";
import { twoMinuteExplainerFor } from "@/lib/schools/classroomPack";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

const linkClassName =
  "inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold";

function buildSlides(lesson: LessonDefinition) {
  const explainer = twoMinuteExplainerFor(lesson);
  return [
    {
      id: "title",
      kicker: `Years 3–6 · ${lesson.durationMinutes} minutes`,
      title: `Lesson ${lesson.number}: ${lesson.title}`,
      body: lesson.shortDescription,
      notes: "Open with the class looking at the shared screen. Hide these notes when you present.",
    },
    {
      id: "intention",
      kicker: "Learning intention",
      title: explainer.intention,
      body: "Listen first. Then we will try it together.",
      notes: lesson.teacherIntroduction,
    },
    {
      id: "script",
      kicker: "The teacher says",
      title: explainer.sayThis,
      body: explainer.studentsDoThis,
      notes: "Say the script as written, then move to the first step.",
    },
    ...lesson.steps.map((step, index) => ({
      id: step.id,
      kicker: `Step ${index + 1} of ${lesson.steps.length}`,
      title: step.studentTask,
      body: step.title,
      notes: step.teacherPrompt,
    })),
    {
      id: "discuss",
      kicker: "Talk together",
      title: lesson.discussionPrompts[0] ?? "What did you notice?",
      body: lesson.discussionPrompts.slice(1).join(" "),
      notes: lesson.discussionPrompts.join(" · "),
    },
    {
      id: "stop",
      kicker: "Stop here",
      title: explainer.stopHere,
      body: lesson.reflectionPrompt,
      notes: lesson.lightEvidence,
    },
  ];
}

export function LessonSlides({ lesson }: { lesson: LessonDefinition }) {
  const slides = useMemo(() => buildSlides(lesson), [lesson]);

  return (
    <ProjectorSlides
      slides={slides}
      links={
        <>
          <a href={`${FIELD_MODE_LESSONS_PATH}/${lesson.slug}`} className={linkClassName}>
            Exit to lesson
          </a>
          <a href={`${FIELD_MODE_PRINT_PATH_PREFIX}/${lesson.slug}`} className={linkClassName}>
            Print planner
          </a>
          <a href={FIELD_MODE_TOOLS_PATH} className={linkClassName}>
            Timer and groups
          </a>
          <a href={FIELD_MODE_HOME_PATH} className={linkClassName}>
            Home
          </a>
        </>
      }
    />
  );
}

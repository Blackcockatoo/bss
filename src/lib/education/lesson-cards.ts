import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import type { EngagementCategory } from "./engagement";
import type { CurriculumFitTag } from "./curriculum-fit";
import type { DnaMode, FocusArea } from "./types";

export interface LessonStep {
  order: number;
  durationMinutes: number;
  instruction: string;
  teacherSays: string | null;
  studentAction: string;
}

export interface ScriptedLessonCard {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  durationMinutes: number;
  pillar: string;
  dnaMode: DnaMode;
  focusArea: FocusArea;
  engagementCategory: EngagementCategory;
  curriculumFit: CurriculumFitTag[];
  steps: LessonStep[];
  prePrompt: string;
  postPrompt: string;
  rubricCriteria: string[];
  safetyNote: string;
}

const DNA_MODES: DnaMode[] = [
  "spiral",
  "journey",
  "particles",
  "mandala",
  "journey",
  "mandala",
  "spiral",
];

const FOCUS_AREAS: FocusArea[] = [
  "pattern-recognition",
  "reflection",
  "pattern-recognition",
  "geometry-creation",
  "reflection",
  "geometry-creation",
  "collaboration",
];

/**
 * Legacy education-queue adapter. There is deliberately no second lesson
 * sequence here: every card is projected from the canonical Field definition.
 */
export const SCRIPTED_LESSONS: ScriptedLessonCard[] = LESSON_DEFINITIONS.map(
  (lesson, index) => ({
    id: lesson.id,
    number: lesson.number,
    title: lesson.title,
    subtitle: lesson.shortDescription,
    durationMinutes: lesson.durationMinutes,
    pillar: lesson.learningAreas[0] ?? "Digital Technologies",
    dnaMode: DNA_MODES[index] ?? null,
    focusArea: FOCUS_AREAS[index] ?? "reflection",
    engagementCategory: "learning",
    curriculumFit: ["stem", "digital-literacy", "relief-teaching"],
    steps: lesson.steps.map((step) => ({
      order: step.order,
      durationMinutes: 4,
      instruction: step.whatDoINow,
      teacherSays: step.teacherPrompt,
      studentAction: step.studentTask,
    })),
    prePrompt: lesson.discussionPrompts[0] ?? lesson.learningIntention,
    postPrompt: lesson.optionalReflection,
    rubricCriteria: [lesson.successStatement],
    safetyNote: `${lesson.safeStopCondition} ${lesson.resetDeleteReminder}`,
  }),
);

export type EngagementCategory =
  | "health-digital-use"
  | "learning"
  | "exploring"
  | "training-practice"
  | "mindfulness-regulation"
  | "vegging-passive-consumption";

export interface EngagementCategoryDefinition {
  label: string;
  shortLabel: string;
  description: string;
  operationalMarkers: string[];
  teacherVisibility: "high" | "medium" | "low";
  primaryMode: string;
  acceptableSchoolUse: string;
  riskMarker: string;
}

export const DEFAULT_ENGAGEMENT_CATEGORY: EngagementCategory = "learning";

export const ENGAGEMENT_CATEGORY_ORDER: EngagementCategory[] = [
  "health-digital-use",
  "learning",
  "exploring",
  "training-practice",
  "mindfulness-regulation",
  "vegging-passive-consumption",
];

export const ENGAGEMENT_CATEGORY_DEFINITIONS: Record<
  EngagementCategory,
  EngagementCategoryDefinition
> = {
  "health-digital-use": {
    label: "Health Digital Use",
    shortLabel: "Health",
    description:
      "Students maintain or inspect the Meta-Pet's vitals through calm care loops such as feeding, hydrating, resting, or checking homeostasis.",
    operationalMarkers: [
      "Short care actions",
      "Vitals check-ins",
      "Cause-and-effect observation",
    ],
    teacherVisibility: "medium",
    primaryMode: "Active + reflective",
    acceptableSchoolUse:
      "Systems thinking, responsibility routines, and wellbeing check-ins.",
    riskMarker:
      "Watch for repetitive care loops that replace broader learning time.",
  },
  learning: {
    label: "Learning",
    shortLabel: "Learning",
    description:
      "Students complete teacher-directed, curriculum-linked activities with a clear goal, duration, and reflection or assessment point.",
    operationalMarkers: [
      "Teacher-assigned lesson",
      "Defined objective",
      "Checkpoint or rubric",
    ],
    teacherVisibility: "high",
    primaryMode: "Guided + active",
    acceptableSchoolUse:
      "Curriculum-aligned classroom quests, structured reflection, and standards-linked tasks.",
    riskMarker:
      "Do not turn progress data into hidden grading or public comparison.",
  },
  exploring: {
    label: "Exploring",
    shortLabel: "Exploring",
    description:
      "Students investigate tools freely without a predetermined outcome, using sandbox-style experimentation and 'what if' questions.",
    operationalMarkers: [
      "Open-ended sandbox",
      "Student-led experimentation",
      "No fixed end state",
    ],
    teacherVisibility: "medium",
    primaryMode: "Exploratory",
    acceptableSchoolUse:
      "Curiosity-building sessions before or between structured lessons.",
    riskMarker:
      "Keep exploration inside the child-safe baseline and away from external content or distractions.",
  },
  "training-practice": {
    label: "Training / Practice",
    shortLabel: "Practice",
    description:
      "Students repeat a focused skill or pattern to build fluency, usually with immediate feedback and a narrow success condition.",
    operationalMarkers: [
      "Repeated pattern work",
      "Skill drill",
      "Immediate feedback",
    ],
    teacherVisibility: "medium",
    primaryMode: "Repetitive + active",
    acceptableSchoolUse:
      "Pattern recall, sequence practice, and rehearsal before harder tasks.",
    riskMarker:
      "Avoid streaks, countdown pressure, leaderboards, or shame-based scoring.",
  },
  "mindfulness-regulation": {
    label: "Mindfulness / Regulation",
    shortLabel: "Mindfulness",
    description:
      "Students pause for reflection, self-regulation, or calm observation through prompts, journaling, or untimed recall activities.",
    operationalMarkers: [
      "Calm reflection",
      "Untimed regulation prompt",
      "Optional private response",
    ],
    teacherVisibility: "low",
    primaryMode: "Reflective",
    acceptableSchoolUse:
      "SEL check-ins, emotional vocabulary practice, and calm transitions.",
    riskMarker:
      "Do not force disclosure or export identifiable reflection data without consent.",
  },
  "vegging-passive-consumption": {
    label: "Vegging / Passive Consumption",
    shortLabel: "Passive",
    description:
      "Students watch, listen, or observe without active input. Use only for short, teacher-approved breaks or guided decompression.",
    operationalMarkers: [
      "Lean-back viewing",
      "No active response",
      "Short break content",
    ],
    teacherVisibility: "low",
    primaryMode: "Passive",
    acceptableSchoolUse:
      "Short recovery breaks using local or teacher-curated media.",
    riskMarker:
      "Do not allow autoplay feeds, ads, social content, or passive drift to dominate class time.",
  },
};

export const ENGAGEMENT_CATEGORY_OPTIONS = ENGAGEMENT_CATEGORY_ORDER.map(
  (category) => ({
    value: category,
    label: ENGAGEMENT_CATEGORY_DEFINITIONS[category].label,
  }),
);

export function normalizeEngagementCategory(
  value: string | null | undefined,
): EngagementCategory {
  if (!value) {
    return DEFAULT_ENGAGEMENT_CATEGORY;
  }

  return ENGAGEMENT_CATEGORY_ORDER.includes(value as EngagementCategory)
    ? (value as EngagementCategory)
    : DEFAULT_ENGAGEMENT_CATEGORY;
}

export function getEngagementCategoryDefinition(
  value: string | null | undefined,
): EngagementCategoryDefinition {
  return ENGAGEMENT_CATEGORY_DEFINITIONS[normalizeEngagementCategory(value)];
}

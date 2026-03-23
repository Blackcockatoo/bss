export type CurriculumFitTag =
  | "stem"
  | "wellbeing"
  | "digital-literacy"
  | "end-of-week"
  | "relief-teaching"
  | "sel";

export interface CurriculumFitInfo {
  tag: CurriculumFitTag;
  label: string;
  description: string;
  useCases: string[];
}

export const CURRICULUM_FIT_INFO: Record<CurriculumFitTag, CurriculumFitInfo> = {
  stem: {
    tag: "stem",
    label: "STEM",
    description: "Supports pattern recognition, observation skills, and scientific reasoning.",
    useCases: [
      "Science lesson on observation and evidence",
      "Maths lesson on pattern and sequence",
      "Technology session on digital systems",
    ],
  },
  wellbeing: {
    tag: "wellbeing",
    label: "Wellbeing",
    description: "Builds self-awareness, emotional regulation, and mindful focus.",
    useCases: [
      "Pastoral care or wellbeing session",
      "Morning check-in activity",
      "Cool-down after high-energy lessons",
    ],
  },
  "digital-literacy": {
    tag: "digital-literacy",
    label: "Digital Literacy",
    description: "Introduces responsible digital interaction and data awareness.",
    useCases: [
      "Digital citizenship lesson",
      "Computing or ICT session",
      "Online safety awareness",
    ],
  },
  "end-of-week": {
    tag: "end-of-week",
    label: "End-of-Week",
    description: "Low-prep, self-contained activity that works as a reward or wind-down.",
    useCases: [
      "Friday afternoon reward session",
      "End-of-term activity",
      "Golden time choice",
    ],
  },
  "relief-teaching": {
    tag: "relief-teaching",
    label: "Relief Teaching",
    description: "Zero-prep activity a relief or substitute teacher can run immediately.",
    useCases: [
      "Emergency cover lesson",
      "Substitute teacher with no plans left",
      "Unexpected free period",
    ],
  },
  sel: {
    tag: "sel",
    label: "SEL",
    description: "Social-emotional learning through reflection, collaboration, and self-regulation.",
    useCases: [
      "SEL curriculum session",
      "Circle time or class meeting",
      "Conflict resolution follow-up",
    ],
  },
};

export const CURRICULUM_FIT_TAGS: CurriculumFitTag[] = [
  "stem",
  "wellbeing",
  "digital-literacy",
  "end-of-week",
  "relief-teaching",
  "sel",
];

export const CURRICULUM_FIT_BADGE_CLASSNAMES: Record<CurriculumFitTag, string> = {
  stem: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  wellbeing: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  "digital-literacy": "border-violet-400/30 bg-violet-500/10 text-violet-200",
  "end-of-week": "border-amber-400/30 bg-amber-500/10 text-amber-200",
  "relief-teaching": "border-rose-400/30 bg-rose-500/10 text-rose-200",
  sel: "border-pink-400/30 bg-pink-500/10 text-pink-200",
};

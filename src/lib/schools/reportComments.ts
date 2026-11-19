import { curriculumAlignmentForSession } from "@/lib/schools/curriculumAlignment";
import type { CanonicalSessionId } from "@/lib/schools/canonicalSequence";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition } from "@/lib/teacher-lessons/types";

export const REPORT_LEVELS = [
  "working-towards",
  "at",
  "above",
] as const;

export type ReportLevel = (typeof REPORT_LEVELS)[number];

export const REPORT_LEVEL_LABELS: Record<ReportLevel, string> = {
  "working-towards": "Working towards",
  at: "At",
  above: "Above",
};

export const REPORT_COMMENT_CAVEAT =
  "These are short starters only. They use this lesson’s learning intention and the Australian Curriculum v9 codes already listed on the lesson. They are not official achievement standards, and they are not ACARA text. Replace [alias] and change the wording so it describes what you actually saw this student do.";

export interface ReportCommentBank {
  lessonId: CanonicalSessionId;
  intention: string;
  codes: readonly string[];
  starters: Record<ReportLevel, string>;
}

const INTENTION_CLAUSE = /^I can\s+/i;

export function intentionClause(intention: string): string {
  return intention.replace(INTENTION_CLAUSE, "").replace(/\.$/, "");
}

function atStarter(intention: string): string {
  return `[alias] can ${intentionClause(intention)}.`;
}

/**
 * Next-step and “above” clauses stay inside each lesson’s published
 * intention. They do not quote or invent achievement-standard text.
 */
const SUPPORTING_CLAUSES: Record<
  CanonicalSessionId,
  { nextStep: string; above: string }
> = {
  "meet-the-system": {
    nextStep: "Next step: name one input and one change.",
    above: "and can talk through a clear example of that change.",
  },
  "read-the-signals": {
    nextStep: "Next step: say one thing a signal might mean.",
    above: "and can suggest another possible meaning.",
  },
  "one-identity-many-representations": {
    nextStep: "Next step: point to what stayed the same.",
    above: "and can say what stayed the same across those views.",
  },
  "choices-and-algorithms": {
    nextStep: "Next step: predict what the rule will do before trying it.",
    above: "and can say whether the result matched the prediction.",
  },
  "privacy-and-responsible-design": {
    nextStep: "Next step: give one reason for a choice.",
    above: "and can compare two different choices.",
  },
  "design-a-better-feature": {
    nextStep: "Next step: say who the change might help.",
    above: "and can notice who it might not help.",
  },
  "test-reflect-and-improve": {
    nextStep: "Next step: explain one thing they noticed.",
    above: "and can support that thinking with a clear example from earlier lessons.",
  },
};

function beginningClause(intention: string): string {
  const clause = intentionClause(intention);
  if (clause.startsWith("explain ")) {
    return `is beginning to explain ${clause.slice("explain ".length)}`;
  }
  if (clause.startsWith("decide ")) {
    return `is beginning to decide ${clause.slice("decide ".length)}`;
  }
  if (clause.startsWith("design ")) {
    return `is beginning to design ${clause.slice("design ".length)}`;
  }
  if (clause.startsWith("describe ")) {
    return `is beginning to describe ${clause.slice("describe ".length)}`;
  }
  if (clause.startsWith("read ")) {
    return `is beginning to read ${clause.slice("read ".length)}`;
  }
  if (clause.startsWith("test ")) {
    return `is beginning to test ${clause.slice("test ".length)}`;
  }
  return `is beginning to ${clause}`;
}

export function reportCommentBankFor(
  lesson: LessonDefinition,
): ReportCommentBank {
  const support = SUPPORTING_CLAUSES[lesson.id];
  const clause = intentionClause(lesson.learningIntention);
  return {
    lessonId: lesson.id,
    intention: lesson.learningIntention,
    codes: curriculumAlignmentForSession(lesson.number).codes,
    starters: {
      "working-towards": `[alias] ${beginningClause(lesson.learningIntention)}. ${support.nextStep}`,
      at: atStarter(lesson.learningIntention),
      above: `[alias] can ${clause}, ${support.above}`,
    },
  };
}

export function allReportCommentBanks(): ReportCommentBank[] {
  return LESSON_DEFINITIONS.map(reportCommentBankFor);
}

import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonDefinition, LessonId } from "@/lib/teacher-lessons/types";

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
  lessonId: LessonId;
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
  LessonId,
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
  "meet-a-system": {
    nextStep: "Next step: point to a part they can touch and name the job.",
    above: "and can say the purpose in their own words.",
  },
  "show-it-two-ways": {
    nextStep: "Next step: point to the object, the picture and the symbol.",
    above: "and can say why those three show the same data.",
  },
  "what-is-mine-to-keep": {
    nextStep: "Next step: point to one example that is personal and owned.",
    above: "and can sort a new example without sharing personal details.",
  },
  "parts-of-a-system": {
    nextStep: "Next step: name two components of the system.",
    above: "and can say which components the purpose needed.",
  },
  "the-same-data-many-ways": {
    nextStep: "Next step: show the same data in one more way.",
    above: "and can say what stayed the same across the four ways.",
  },
  "follow-the-steps": {
    nextStep: "Next step: name the decision or the repeat.",
    above: "and can describe the sequence, the decision and the repeat in order.",
  },
  "a-problem-for-someone-we-know": {
    nextStep: "Next step: say who the user is and what they need.",
    above: "and can give a reason whether the existing system would meet that need.",
  },
  "hardware-for-the-job": {
    nextStep: "Next step: name one specification and say how it would affect performance.",
    above: "and can give a clear reason for selecting hardware for a particular task.",
  },
  "data-as-numbers": {
    nextStep: "Next step: represent one more kind of data as integers.",
    above: "and can say what was gained or lost in that representation.",
  },
  "why-binary": {
    nextStep: "Next step: convert one more integer to binary.",
    above: "and can explain why two states are useful in digital hardware.",
  },
  "trace-the-algorithm": {
    nextStep: "Next step: record the values for one more input.",
    above: "and can identify an error and say how to correct it.",
  },
  "design-an-algorithm": {
    nextStep: "Next step: show the same algorithm in the other representation.",
    above: "and can point to the nested control structure in both representations.",
  },
  "what-data-is-essential": {
    nextStep: "Next step: say whether one collected item is essential to the purpose.",
    above: "and can suggest a way to manage the digital footprint.",
  },
  "evaluate-a-system-for-a-user": {
    nextStep: "Next step: write the user story or one design criterion more clearly.",
    above: "and can judge the system against those tests and note a possible future impact.",
  },
  "chatbots-and-checking": {
    nextStep: "Next step: check one more reply against the fact card and say whether it matches.",
    above: "and can judge the fictional chatbot against the design criteria they wrote.",
  },
  "feeds-and-recommendations": {
    nextStep: "Next step: say whether one collected item is essential to the purpose.",
    above: "and can explain how repeating the rule fills the feed.",
  },
  "loot-boxes-and-purchases": {
    nextStep: "Next step: use the class tally to support one statement about chance.",
    above: "and can suggest one design change that would make the chance clearer.",
  },
};

function beginningClause(intention: string): string {
  const clause = intentionClause(intention);
  if (clause.startsWith("investigate ")) {
    return `is beginning to investigate ${clause.slice("investigate ".length)}`;
  }
  if (clause.startsWith("trace ")) {
    return `is beginning to trace ${clause.slice("trace ".length)}`;
  }
  if (clause.startsWith("define ")) {
    return `is beginning to define ${clause.slice("define ".length)}`;
  }
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
    codes: curriculumAlignmentForLesson(lesson).codes,
    starters: {
      "working-towards": `[alias] ${beginningClause(lesson.learningIntention)}. ${support.nextStep}`,
      at: atStarter(lesson.learningIntention),
      above: `[alias] can ${clause}, ${support.above}`,
    },
  };
}

export function allReportCommentBanks(): ReportCommentBank[] {
  return ALL_LESSON_DEFINITIONS.map(reportCommentBankFor);
}

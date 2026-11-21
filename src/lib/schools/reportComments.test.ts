import { describe, expect, it } from "vitest";

import { curriculumAlignmentForLesson } from "@/lib/schools/lessonAlignment";
import { ALL_LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import {
  REPORT_COMMENT_CAVEAT,
  allReportCommentBanks,
  intentionClause,
  reportCommentBankFor,
} from "./reportComments";

describe("report comment starters", () => {
  it("ties every bank to the lesson's own intention and published codes", () => {
    expect(allReportCommentBanks()).toHaveLength(ALL_LESSON_DEFINITIONS.length);
    for (const lesson of ALL_LESSON_DEFINITIONS) {
      const bank = reportCommentBankFor(lesson);
      const codes = curriculumAlignmentForLesson(lesson).codes;
      expect(bank.intention).toBe(lesson.learningIntention);
      expect([...bank.codes]).toEqual(codes);
      expect(bank.starters.at).toBe(
        `[alias] can ${intentionClause(lesson.learningIntention)}.`,
      );
      expect(bank.starters["working-towards"]).toContain("[alias]");
      expect(bank.starters.above).toContain("[alias]");
      expect(bank.starters.above).toContain(
        intentionClause(lesson.learningIntention),
      );
    }
  });

  it("does not invent codes or quote achievement-standard language", () => {
    const published = new Set(
      ALL_LESSON_DEFINITIONS.flatMap(
        (lesson) => curriculumAlignmentForLesson(lesson).codes,
      ),
    );
    const starterText = allReportCommentBanks()
      .flatMap((bank) => [bank.intention, ...Object.values(bank.starters)])
      .join("\n");

    expect(REPORT_COMMENT_CAVEAT).toMatch(/not official achievement standards/i);
    expect(REPORT_COMMENT_CAVEAT).toMatch(/not ACARA text/i);
    expect(starterText).not.toMatch(/achievement standard/i);
    expect(starterText).not.toMatch(/research shows|endorsed by ACARA/i);

    for (const match of starterText.matchAll(/AC9[A-Z0-9]+/g)) {
      expect(published.has(match[0]), match[0]).toBe(true);
    }
  });
});

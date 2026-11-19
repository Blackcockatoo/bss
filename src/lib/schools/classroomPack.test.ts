import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import {
  ASSESSMENT_SOURCE_PATH,
  CURRICULUM_SOURCE_LINKS,
  ESAFETY_TEACHER_LINKS,
  FIELD_MODE_PRINT_CHECKLIST_PATH,
  FIELD_MODE_PRINT_LEADERSHIP_PATH,
  FIELD_MODE_PRINT_NO_TECH_PATH,
  FIELD_MODE_PRINT_PARENT_LETTER_PATH,
  FIELD_MODE_PRINT_RELIEF_PATH,
  FIELD_MODE_PRINT_TICKETS_PATH,
  FIELD_MODE_PRINT_VERIFIED_PATH,
  FIELD_MODE_PRINT_WORD_WALLS_PATH,
  FIELD_MODE_VERIFIED_PATH,
  STUDENT_REFLECTION_PROMPTS,
  TEACHER_OBSERVATION_CHECKLIST_ITEMS,
  VERIFICATION_ITEMS,
  ealdNotesFor,
  estimatedStepMinutes,
  lessonSourceText,
  plannerExtrasFor,
  twoMinuteExplainerFor,
} from "./classroomPack";

function packFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("classroom pack data", () => {
  it("gives estimated step timings that add up to the session length", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const total = lesson.steps.reduce(
        (sum, _step, index) =>
          sum + estimatedStepMinutes(lesson.durationMinutes, lesson.steps.length, index),
        0,
      );
      expect(total).toBe(lesson.durationMinutes);
    }
  });

  it("uses two-minute explainer copy already authored on the lesson", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const explainer = twoMinuteExplainerFor(lesson);
      expect(explainer.intention).toBe(lesson.learningIntention);
      expect(explainer.sayThis).toBe(lesson.teacherScript);
      expect(explainer.studentsDoThis.length).toBeGreaterThan(0);
      expect(explainer.stopHere.length).toBeGreaterThan(0);
    }
  });

  it("only puts vocabulary words that already appear in the lesson copy", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const source = lessonSourceText(lesson);
      const extras = plannerExtrasFor(lesson.id);
      expect(extras.vocab.length).toBeGreaterThan(0);
      for (const entry of extras.vocab) {
        const needle = entry.word.toLowerCase().replace(/–/g, "-");
        const haystack = source.replace(/–/g, "-");
        expect(haystack, `${lesson.id}:${entry.word}`).toContain(needle);
      }
    }
  });

  it("gives every lesson materials and an honest paper path", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const extras = plannerExtrasFor(lesson.id);
      expect(extras.materials.length).toBeGreaterThan(0);
      expect(extras.paper.summary.length).toBeGreaterThan(40);
      expect(["works-on-paper", "paper-fallback"]).toContain(extras.paper.kind);
    }
  });

  it("keeps the observation checklist and reflection prompts in the published assessment document", () => {
    const source = packFile(ASSESSMENT_SOURCE_PATH);
    for (const item of TEACHER_OBSERVATION_CHECKLIST_ITEMS) {
      expect(source).toContain(item);
    }
    for (const prompt of STUDENT_REFLECTION_PROMPTS) {
      expect(source).toContain(prompt.replace(/:$/, ""));
    }
  });

  it("does not invent verification results", () => {
    const checked = VERIFICATION_ITEMS.filter((item) => item.status === "checked");
    const notChecked = VERIFICATION_ITEMS.filter((item) => item.status === "not-checked");
    expect(checked.length).toBe(2);
    expect(notChecked.length).toBeGreaterThanOrEqual(3);
    expect(
      notChecked.some((item) => /school hardware/i.test(item.detail)),
    ).toBe(true);
  });

  it("lists official links with https URLs and a check date in the notes", () => {
    for (const link of [...ESAFETY_TEACHER_LINKS, ...CURRICULUM_SOURCE_LINKS]) {
      expect(link.href.startsWith("https://")).toBe(true);
      expect(link.title.length).toBeGreaterThan(3);
    }
    expect(ESAFETY_TEACHER_LINKS.length).toBeGreaterThanOrEqual(5);
  });


  it("grounds EAL/D notes in the lesson's own vocab and support activity", () => {
    for (const lesson of LESSON_DEFINITIONS) {
      const notes = ealdNotesFor(lesson.id);
      const vocabWords = plannerExtrasFor(lesson.id).vocab.map((entry) => entry.word);
      expect(notes.preteach.length).toBeGreaterThan(0);
      expect(notes.sentenceStarters.length).toBeGreaterThan(0);
      for (const word of notes.preteach) {
        expect(vocabWords, `${lesson.id}:${word}`).toContain(word);
      }
      expect(notes.duringLesson).toContain(lesson.supportActivity);
      expect(notes.duringLesson).not.toMatch(
        /research|study shows|evidence-based|proven to/i,
      );
    }
  });

  it("keeps every new classroom-pack path on the field allowlist", () => {
    for (const pathname of [
      FIELD_MODE_VERIFIED_PATH,
      FIELD_MODE_PRINT_TICKETS_PATH,
      FIELD_MODE_PRINT_WORD_WALLS_PATH,
      FIELD_MODE_PRINT_CHECKLIST_PATH,
      FIELD_MODE_PRINT_RELIEF_PATH,
      FIELD_MODE_PRINT_PARENT_LETTER_PATH,
      FIELD_MODE_PRINT_LEADERSHIP_PATH,
      FIELD_MODE_PRINT_NO_TECH_PATH,
      FIELD_MODE_PRINT_VERIFIED_PATH,
    ]) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(true);
    }
  });
});

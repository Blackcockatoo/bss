import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { lessonCards } from "@/app/schools/content";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import {
  CANONICAL_SESSIONS,
  CANONICAL_SESSION_COUNT,
  CANONICAL_SESSION_IDS,
  CANONICAL_SESSION_TITLES,
  FIRST_CANONICAL_SESSION,
  getCanonicalSession,
} from "./canonicalSequence";

const REPO_ROOT = path.resolve(__dirname, "../../..");

/** The sequence the product has committed to publicly. */
const APPROVED_TITLES = [
  "Meet the System",
  "Read the Signals",
  "One Identity, Many Representations",
  "Choices and Algorithms",
  "Privacy and Responsible Design",
  "Design a Better Feature",
  "Test, Reflect and Improve",
];

/**
 * Titles from the three sequences this module replaced. If any of them
 * reappears in a shipped surface, two sequences are live again.
 */
const SUPERSEDED_TITLES = [
  "Meet Your Meta-Pet",
  "Build a Body",
  "DNA Makes Us Different",
  "Needs, Actions and Consequences",
  "Feelings Without Words",
  "Patterns Behind the Pet",
  "The Responsible Creator Challenge",
  "Meet the Digital Companion",
  "Read the Companion State",
  "Feelings, Signals and Regulation",
  "Repair and Reset",
  "Systems and Feedback Loops",
  "Patterns Over Time",
  "Explain Your Thinking",
];

describe("canonical session sequence", () => {
  it("is exactly the seven approved sessions in order", () => {
    expect(CANONICAL_SESSION_COUNT).toBe(7);
    expect([...CANONICAL_SESSION_TITLES]).toEqual(APPROVED_TITLES);
    expect(CANONICAL_SESSIONS.map((s) => s.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("gives every session the structure a teacher was promised", () => {
    for (const session of CANONICAL_SESSIONS) {
      expect(session.minutes).toBeGreaterThanOrEqual(15);
      expect(session.minutes).toBeLessThanOrEqual(20);
      expect(session.learningIntention.length).toBeGreaterThan(0);
      expect(session.teacherIntroduction.length).toBeGreaterThan(0);
      expect(session.childActivity.length).toBeGreaterThan(0);
      expect(session.reflectionPrompt.length).toBeGreaterThan(0);
      expect(session.movementMoment.length).toBeGreaterThan(0);
      expect(session.stoppingPoint.length).toBeGreaterThan(0);
      expect(session.lightEvidence.length).toBeGreaterThan(0);
    }
  });

  it("uses the id as the slug so a URL cannot drift from an id", () => {
    for (const session of CANONICAL_SESSIONS) {
      expect(session.slug).toBe(session.id);
    }
    expect(new Set(CANONICAL_SESSION_IDS).size).toBe(7);
  });

  it("starts at Session One", () => {
    expect(FIRST_CANONICAL_SESSION.number).toBe(1);
    expect(FIRST_CANONICAL_SESSION.title).toBe("Meet the System");
    expect(getCanonicalSession("meet-the-system")).toBe(
      FIRST_CANONICAL_SESSION,
    );
    expect(getCanonicalSession("build-a-body")).toBeUndefined();
  });

  it("drives the runnable lessons from the canonical sequence", () => {
    expect(LESSON_DEFINITIONS.map((lesson) => lesson.title)).toEqual(
      APPROVED_TITLES,
    );
    expect(LESSON_DEFINITIONS.map((lesson) => lesson.id)).toEqual([
      ...CANONICAL_SESSION_IDS,
    ]);
    for (const lesson of LESSON_DEFINITIONS) {
      const session = getCanonicalSession(lesson.id);
      expect(session).toBeDefined();
      expect(lesson.durationMinutes).toBe(session?.minutes);
      expect(lesson.learningIntention).toBe(session?.learningIntention);
    }
  });

  it("drives the public lesson snapshot from the canonical sequence", () => {
    expect(lessonCards.map((card) => card.title)).toEqual(APPROVED_TITLES);
    expect(lessonCards.map((card) => card.session)).toEqual([
      "Session 1",
      "Session 2",
      "Session 3",
      "Session 4",
      "Session 5",
      "Session 6",
      "Session 7",
    ]);
  });

  it("leaves no superseded lesson title anywhere in the shipped app", () => {
    // A stale title in a component or a doc is exactly the failure this module
    // exists to prevent: a teacher sold one sequence and handed another.
    const sources = [
      "src/app/schools/content.ts",
      "src/app/schools/page.tsx",
      "src/lib/teacher-lessons/lessonDefinitions.ts",
      "docs/schools-au/02-lesson-cards.md",
      "public/docs/schools-au/02-lesson-cards.md",
      "docs/schools-au/01-overview-and-alignment.md",
      "docs/schools-au/teacher-pack/teacher-guide.md",
      "scripts/generate-school-docs.cjs",
    ];

    const offenders: string[] = [];
    for (const relative of sources) {
      const contents = readFileSync(path.join(REPO_ROOT, relative), "utf8");
      for (const title of SUPERSEDED_TITLES) {
        if (contents.includes(title)) {
          offenders.push(`${relative} → ${title}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("publishes the same seven sessions in the printable teacher pack", () => {
    const doc = readFileSync(
      path.join(REPO_ROOT, "docs/schools-au/02-lesson-cards.md"),
      "utf8",
    );

    for (const session of CANONICAL_SESSIONS) {
      expect(doc).toContain(`## Session ${session.number}: ${session.title}`);
      expect(doc).toContain(`**Time:** ${session.minutes} minutes`);
      expect(doc).toContain(session.learningIntention);
      expect(doc).toContain(session.reflectionPrompt);
      expect(doc).toContain(session.stoppingPoint);
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  deriveLearningPassport,
  passportHasContent,
  type PassportInputs,
} from "./passport";
import { sanitizeState } from "./lessonProgressStore";
import type { LessonProgressState } from "./types";
import type { PetObservationCardEvidence } from "./evidence";

function emptyProgress(): LessonProgressState {
  return sanitizeState(null);
}

function withEvidence(): LessonProgressState {
  const state = sanitizeState(null);
  const card: PetObservationCardEvidence = {
    kind: "pet-observation-card",
    version: 1,
    lessonId: "meet-your-metapet",
    stepId: "meet-your-metapet-step-5",
    createdAt: 1000,
    alias: "Pip",
    observations: { shape: "round", surface: "shiny", movement: "floaty" },
    question: "How does it see me?",
    appliedChange: {
      appliedToPet: true,
      updateType: "alias",
      appliedSummary: "Alias set to “Pip”.",
      appliedAt: 1000,
    },
  };
  state.records["meet-your-metapet"] = {
    lessonId: "meet-your-metapet",
    currentStep: 4,
    completedSteps: [0, 1, 2, 3, 4],
    completed: true,
    paused: false,
    startedAt: 1,
    lastActiveAt: 1000,
    completedAt: 1000,
    evidence: {},
    evidenceEntries: { "meet-your-metapet-step-5": card },
  };
  return state;
}

describe("Learning Passport derivation", () => {
  it("produces an empty passport safely", () => {
    const passport = deriveLearningPassport({
      progress: emptyProgress(),
      alias: "",
      hasPet: false,
    });
    expect(passport.totalLessons).toBe(7);
    expect(passport.completedLessons).toBe(0);
    expect(passport.sections).toHaveLength(7);
    expect(passportHasContent(passport)).toBe(false);
  });

  it("reflects a partial journey with evidence and applied changes", () => {
    const passport = deriveLearningPassport({
      progress: withEvidence(),
      alias: "Pip",
      hasPet: true,
    });
    expect(passport.completedLessons).toBe(1);
    expect(passport.completionPercent).toBe(Math.round((1 / 7) * 100));
    const meet = passport.sections.find(
      (s) => s.lessonId === "meet-your-metapet",
    )!;
    expect(meet.hasEvidence).toBe(true);
    expect(meet.evidence?.kind).toBe("pet-observation-card");
    expect(passport.appliedChanges).toHaveLength(1);
    expect(passport.appliedChanges[0].updateType).toBe("alias");
    expect(passportHasContent(passport)).toBe(true);
  });

  it("flags a completed lesson that is missing evidence", () => {
    const state = emptyProgress();
    state.records["build-a-body"] = {
      lessonId: "build-a-body",
      currentStep: 4,
      completedSteps: [0, 1, 2, 3, 4],
      completed: true,
      paused: false,
      startedAt: 1,
      lastActiveAt: 2,
      completedAt: 2,
      evidence: {},
      evidenceEntries: {},
    };
    const passport = deriveLearningPassport({
      progress: state,
      alias: "",
      hasPet: true,
    });
    const section = passport.sections.find(
      (s) => s.lessonId === "build-a-body",
    )!;
    expect(section.status).toBe("completed");
    expect(section.missingEvidence).toBe(true);
  });

  it("marks mismatched evidence as corrupted without crashing", () => {
    const state = emptyProgress();
    // Wrong evidence kind stored under a lesson.
    state.records["dna-differences"] = {
      lessonId: "dna-differences",
      currentStep: 4,
      completedSteps: [0, 1, 2, 3, 4],
      completed: true,
      paused: false,
      startedAt: 1,
      lastActiveAt: 2,
      completedAt: 2,
      evidence: {},
      evidenceEntries: {
        "dna-differences-step-5": {
          kind: "emotion-reflection",
          version: 1,
          lessonId: "dna-differences",
          stepId: "dna-differences-step-5",
          createdAt: 2,
          clues: [],
          interpretation: "",
          helpedBy: "",
          alternativeExplanation: "",
        },
      },
    };
    const passport = deriveLearningPassport({
      progress: state,
      alias: "",
      hasPet: true,
    });
    const section = passport.sections.find(
      (s) => s.lessonId === "dna-differences",
    )!;
    expect(section.corrupted).toBe(true);
    expect(section.evidence).toBeNull();
  });

  it("handles a fully corrupted progress object", () => {
    const passport = deriveLearningPassport({
      // deliberately malformed
      progress: { records: "nope" } as never,
      alias: 123 as never,
      hasPet: "yes" as never,
    } as PassportInputs);
    expect(passport.totalLessons).toBe(7);
    expect(passport.alias).toBe("");
    expect(passport.hasPet).toBe(false);
  });
});

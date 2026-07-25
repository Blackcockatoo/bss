import { describe, expect, it } from "vitest";

import { classFieldRecordHasContent, deriveClassFieldRecord } from "./classFieldRecord";
import { sanitizeState } from "./lessonProgressStore";
import type { LessonProgressState } from "./types";
import type { DnaComparisonEvidence } from "./evidence";

function emptyProgress(): LessonProgressState {
  return sanitizeState(null);
}

describe("Class Field Record derivation", () => {
  it("produces an empty, no-content record safely", () => {
    const record = deriveClassFieldRecord(emptyProgress(), 1000);
    expect(record.totalLessons).toBe(7);
    expect(record.completedLessons).toBe(0);
    expect(record.entries).toHaveLength(7);
    expect(classFieldRecordHasContent(record)).toBe(false);
    for (const entry of record.entries) {
      expect(entry.keyConcept.length).toBeGreaterThan(0);
      expect(entry.classPrediction).toBe("Not recorded yet");
    }
  });

  it("never includes a student name field anywhere in an entry", () => {
    const record = deriveClassFieldRecord(emptyProgress());
    for (const entry of record.entries) {
      expect(Object.keys(entry)).not.toContain("studentName");
      expect(Object.keys(entry)).not.toContain("alias");
    }
  });

  it("extracts a class prediction, observation and reflection from typed evidence", () => {
    const state = emptyProgress();
    const evidence: DnaComparisonEvidence = {
      kind: "dna-comparison",
      version: 1,
      lessonId: "dna-differences",
      stepId: "dna-differences-step-7",
      createdAt: 5,
      geneLabel: "Pattern gene",
      predicted: "The surface pattern will change",
      observed: "It changed from spotted to striped",
      stayedSame: "The shape and colour",
      keptVariation: true,
    };
    state.records["dna-differences"] = {
      lessonId: "dna-differences",
      currentStep: 6,
      completedSteps: [0, 1, 2, 3, 4, 5, 6],
      completed: true,
      paused: false,
      startedAt: 1,
      lastActiveAt: 5,
      completedAt: 5,
      evidence: {},
      evidenceEntries: { "dna-differences-step-7": evidence },
    };

    const record = deriveClassFieldRecord(state, 1000);
    const entry = record.entries.find((e) => e.lessonId === "dna-differences")!;
    expect(entry.completed).toBe(true);
    expect(entry.classPrediction).toBe("The surface pattern will change");
    expect(entry.classObservation).toBe("It changed from spotted to striped");
    expect(entry.classReflection).toBe("The shape and colour");
    expect(entry.hasEvidence).toBe(true);
    expect(classFieldRecordHasContent(record)).toBe(true);
    expect(record.completedLessons).toBe(1);
  });

  it("falls back to a plain placeholder when evidence doesn't match the lesson's expected kind", () => {
    const state = emptyProgress();
    state.records["dna-differences"] = {
      lessonId: "dna-differences",
      currentStep: 6,
      completedSteps: [0, 1, 2, 3, 4, 5, 6],
      completed: true,
      paused: false,
      startedAt: 1,
      lastActiveAt: 5,
      completedAt: 5,
      evidence: {},
      evidenceEntries: {
        "dna-differences-step-7": {
          kind: "emotion-reflection",
          version: 1,
          lessonId: "dna-differences",
          stepId: "dna-differences-step-7",
          createdAt: 5,
          clues: [],
          interpretation: "",
          helpedBy: "",
          alternativeExplanation: "",
        },
      },
    };
    const record = deriveClassFieldRecord(state);
    const entry = record.entries.find((e) => e.lessonId === "dna-differences")!;
    expect(entry.hasEvidence).toBe(false);
    expect(entry.classPrediction).toBe("Not recorded yet");
  });

  it("handles a fully corrupted progress object without throwing", () => {
    const record = deriveClassFieldRecord({ records: "nope" } as never);
    expect(record.totalLessons).toBe(7);
    expect(record.completedLessons).toBe(0);
  });
});

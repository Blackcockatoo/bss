import { describe, expect, it } from "vitest";

import {
  evidenceTimestamp,
  isEvidenceKind,
  validateEvidence,
  type LessonEvidence,
} from "./evidence";

const validCard: LessonEvidence = {
  kind: "pet-observation-card",
  version: 1,
  lessonId: "meet-the-system",
  stepId: "meet-the-system-step-5",
  createdAt: 1,
  alias: "Pip",
  observations: { shape: "round", surface: "shiny", movement: "floaty" },
  question: "How does it see me?",
};

describe("evidence model", () => {
  it("recognises evidence kinds", () => {
    expect(isEvidenceKind("dna-comparison")).toBe(true);
    expect(isEvidenceKind("observation-note")).toBe(false);
    expect(isEvidenceKind(5)).toBe(false);
  });

  it("provides a timestamp", () => {
    expect(typeof evidenceTimestamp()).toBe("number");
  });

  it("validates a well-formed entry", () => {
    const result = validateEvidence(validCard);
    expect(result).not.toBeNull();
    expect(result?.kind).toBe("pet-observation-card");
  });

  it("rejects entries with a bad discriminant or missing ids", () => {
    expect(validateEvidence(null)).toBeNull();
    expect(validateEvidence({ kind: "nope" })).toBeNull();
    expect(
      validateEvidence({ kind: "dna-comparison", stepId: "x" }),
    ).toBeNull();
    expect(
      validateEvidence({ kind: "dna-comparison", lessonId: "x" }),
    ).toBeNull();
  });

  it("repairs missing structured sub-fields without throwing", () => {
    const repaired = validateEvidence({
      kind: "cause-effect-chain",
      lessonId: "choices-and-algorithms",
      stepId: "choices-and-algorithms-step-5",
      // action/immediateEffect etc missing
      balancingActions: ["Feed", 5, "Play"],
    });
    expect(repaired?.kind).toBe("cause-effect-chain");
    if (repaired?.kind === "cause-effect-chain") {
      expect(repaired.action).toBe("");
      // Non-string entries dropped from the array.
      expect(repaired.balancingActions).toEqual(["Feed", "Play"]);
    }
  });

  it("coerces privacy-and-responsible-design scenario choices safely", () => {
    const repaired = validateEvidence({
      kind: "responsible-creator-promise",
      lessonId: "privacy-and-responsible-design",
      stepId: "privacy-and-responsible-design-step-5",
      scenarioChoices: [
        { scenarioId: "privacy", choiceId: "use-alias", responsible: true },
        null,
        "garbage",
      ],
      promise: "I will keep information private.",
    });
    expect(repaired?.kind).toBe("responsible-creator-promise");
    if (repaired?.kind === "responsible-creator-promise") {
      expect(repaired.scenarioChoices).toHaveLength(1);
      expect(repaired.scenarioChoices[0].responsible).toBe(true);
    }
  });
});

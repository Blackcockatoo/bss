import { describe, expect, it } from "vitest";
import {
  explanationRequestSchema,
  simulationRequestSchema,
  sonifyParamsSchema,
} from "./genomeResonance";

describe("genomeResonance request limits", () => {
  it("accepts a normal simulation request", () => {
    expect(
      simulationRequestSchema.safeParse({
        selectedTraitId: "focus",
        deltas: { focus: 0.2, sociality: -0.1 },
      }).success,
    ).toBe(true);
  });

  it("rejects too many deltas and non-finite numbers", () => {
    const deltas = Object.fromEntries(
      Array.from({ length: 65 }, (_, i) => [`t${i}`, 0.1]),
    );
    expect(simulationRequestSchema.safeParse({ deltas }).success).toBe(false);
    expect(
      simulationRequestSchema.safeParse({ deltas: { focus: Number.POSITIVE_INFINITY } }).success,
    ).toBe(false);
    expect(simulationRequestSchema.safeParse({ deltas: { focus: Number.NaN } }).success).toBe(false);
  });

  it("caps string lengths and simulation array size", () => {
    const base = {
      petId: "pet-1",
      viewStateKey: "view",
      tone: "story" as const,
      simulation: [],
    };
    expect(explanationRequestSchema.safeParse(base).success).toBe(true);
    expect(explanationRequestSchema.safeParse({ ...base, petId: "x".repeat(201) }).success).toBe(false);
    const result = {
      traitId: "focus",
      estimate: 1,
      lowerBound: 0,
      upperBound: 2,
      feasibility: 0.5,
    };
    expect(
      explanationRequestSchema.safeParse({ ...base, simulation: Array(65).fill(result) }).success,
    ).toBe(false);
    expect(
      explanationRequestSchema.safeParse({
        ...base,
        simulation: [{ ...result, tradeoffWarning: "w".repeat(501) }],
      }).success,
    ).toBe(false);
    expect(sonifyParamsSchema.safeParse({ petId: "p".repeat(201) }).success).toBe(false);
  });
});

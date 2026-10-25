import { describe, it, expect } from "vitest";
import {
  adaptation,
  DEFAULT_INPUT,
  runActivity,
  validInput,
  validProject,
  type Project,
} from "./activities";
import { canUseForgeTool, FORGE_TOOLS, forgeContract } from "./registry";
const project: Project = {
  version: 1,
  id: "p1",
  toolId: "pattern-forge",
  title: "My pattern",
  createdAt: 1,
  updatedAt: 1,
  revision: 1,
  spark: { spot: "", prediction: "", reflection: "" },
  input: structuredClone(DEFAULT_INPUT),
};
describe("Six trusted instruments", () => {
  it("validates variable rhythm and blocks school execution at the engine boundary", () => {
    expect(
      runActivity("sound-studio", {
        ...DEFAULT_INPUT,
        sequence: [0, 12],
        repeats: 1,
        tempo: 60,
        rhythm: [0.5, 2],
      }).summary,
    ).toContain("2.50 seconds");
    expect(validInput({ ...DEFAULT_INPUT, rhythm: [1000] })).toBe(false);
    expect(() => runActivity("pattern-forge", DEFAULT_INPUT, "field")).toThrow(
      "not approved",
    );
  });

  it("computes constant differences without claiming a unique rule", () => {
    expect(runActivity("pattern-forge", DEFAULT_INPUT).summary).toContain(
      "next value 9",
    );
    expect(
      runActivity("pattern-forge", { ...DEFAULT_INPUT, sequence: [1, 3, 6] })
        .values,
    ).toEqual([2, 3]);
  });
  it("doubles pitch after twelve semitones; tempo does not alter pitch", () => {
    const first = runActivity("sound-studio", {
      ...DEFAULT_INPUT,
      sequence: [0, 12],
    });
    expect(first.values).toEqual([220, 440]);
    expect(
      runActivity("sound-studio", {
        ...DEFAULT_INPUT,
        sequence: [0, 12],
        tempo: 150,
      }).values,
    ).toEqual(first.values);
  });
  it("models free fall and controls independent variables", () => {
    expect(
      runActivity("discovery-lab", { ...DEFAULT_INPUT, height: 4, gravity: 8 })
        .values,
    ).toEqual([1, 8]);
    expect(
      runActivity("discovery-lab", { ...DEFAULT_INPUT, height: 1, gravity: 8 })
        .values[0],
    ).toBe(0.5);
  });
  it("supports authored branching text without generating words", () => {
    const input = {
      ...DEFAULT_INPUT,
      paragraphs: ["One day.", "Go left!", "Go right?"],
      choice: 2,
    };
    expect(runActivity("story-workshop", input).values).toEqual([6, 3]);
    expect(input.paragraphs[2]).toBe("Go right?");
  });
  it("runs only bounded visual instructions to reach a goal", () => {
    expect(
      runActivity("maker-bench", {
        ...DEFAULT_INPUT,
        steps: ["forward", "forward", "right", "forward", "forward"],
      }).summary,
    ).toContain("Goal (2, 2): reached");
    expect(validInput({ ...DEFAULT_INPUT, steps: ["fetch(secret)"] })).toBe(
      false,
    );
  });
  it("adds practical task durations and exposes uncertainty", () => {
    const result = runActivity("life-compass", {
      ...DEFAULT_INPUT,
      tasks: [
        { text: "Prepare", minutes: 5 },
        { text: "Make", minutes: 10 },
      ],
    });
    expect(result.values).toEqual([15]);
    expect(result.explanation).toContain("independent source");
  });
  it("rejects NaN, code, oversized text, versions, and malformed shapes", () => {
    for (const patch of [
      { gravity: NaN },
      { sequence: [1, Infinity] },
      { tempo: 1 },
      { choice: 1.5 },
      { title: "x".repeat(101) },
      { tasks: [{ text: "x", minutes: -1 }] },
    ])
      expect(validInput({ ...DEFAULT_INPUT, ...patch })).toBe(false);
    expect(validProject({ ...project, version: 99 })).toBe(false);
    expect(() =>
      runActivity("maker-bench", {
        ...DEFAULT_INPUT,
        steps: ["eval"] as never,
      }),
    ).toThrow();
  });
  it("keeps all tools family-only with explicit static contracts", () => {
    for (const id of Object.keys(FORGE_TOOLS) as (keyof typeof FORGE_TOOLS)[]) {
      expect(canUseForgeTool(id, "family")).toBe(true);
      for (const context of ["school", "field", "studio"] as const)
        expect(canUseForgeTool(id, context)).toBe(false);
      expect(forgeContract(id).network).toBe(false);
    }
    expect(canUseForgeTool("__proto__", "family")).toBe(false);
  });
  it("replays deterministic acquired behaviour without mutating genome or work", () => {
    const before = JSON.stringify(project);
    const response = adaptation("immutable-genome", [project]);
    expect(adaptation("immutable-genome", [structuredClone(project)])).toEqual(
      response,
    );
    expect(JSON.stringify(project)).toBe(before);
    expect(adaptation("immutable-genome", []).source).toBeNull();
    expect(
      adaptation("immutable-genome", [
        { ...project, input: { ...project.input, sequence: [2, 4] } },
      ]).sequence,
    ).not.toEqual(response.sequence);
  });
});

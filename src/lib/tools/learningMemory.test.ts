import { describe, expect, it } from "vitest";
import {
  addForgeDiscovery,
  companionMotif,
  emptyForgeMemory,
  normaliseForgeMemory,
} from "./learningMemory";
import { FORGE_TOOLS, getForgeTool } from "./registry";

const sample = {
  id: "test-1",
  toolId: "pattern-forge" as const,
  createdAt: 100,
  sequence: [1, 3, 5, 2] as [number, number, number, number],
  tempo: 90,
  prediction: "a wider shape",
  reflection: "Bigger numbers made bigger circles",
  motif: "Ripple" as const,
};

describe("Project Forge local learning contract", () => {
  it("registers only bounded offline child-local instruments", () => {
    expect(Object.values(FORGE_TOOLS)).toHaveLength(6);
    expect(getForgeTool("untrusted")).toBeNull();
    expect(
      Object.values(FORGE_TOOLS).every(
        (tool) => tool.offline && tool.safetyClass === "child-local",
      ),
    ).toBe(true);
  });

  it("retains a same-pet discovery across JSON roundtrips", () => {
    const memory = addForgeDiscovery(emptyForgeMemory("pet-1"), sample);
    expect(
      normaliseForgeMemory(JSON.parse(JSON.stringify(memory)), "pet-1"),
    ).toEqual(memory);
    expect(normaliseForgeMemory(memory, "pet-2").discoveries).toEqual([]);
  });

  it("rejects malformed older or potentially dangerous input", () => {
    expect(
      normaliseForgeMemory(
        { version: 2, petId: "p", discoveries: [sample] },
        "p",
      ).discoveries,
    ).toEqual([]);
    expect(
      normaliseForgeMemory(
        {
          version: 1,
          petId: "p",
          discoveries: [
            { ...sample, tempo: 9999 },
            { ...sample, toolId: "untrusted" },
          ],
        },
        "p",
      ).discoveries,
    ).toEqual([]);
  });

  it("caps history with no streak or daily-attendance penalty", () => {
    let memory = emptyForgeMemory("p");
    for (let index = 0; index < 55; index++) {
      memory = addForgeDiscovery(memory, { ...sample, id: String(index) });
    }
    expect(memory.discoveries).toHaveLength(50);
    expect(memory.discoveries[0].id).toBe("5");
  });

  it("makes the companion motif deterministic from seed and experiment", () => {
    const first = companionMotif("dna-seed", [1, 3, 5, 2], 90);
    expect(companionMotif("dna-seed", [1, 3, 5, 2], 90)).toEqual(first);
  });
});

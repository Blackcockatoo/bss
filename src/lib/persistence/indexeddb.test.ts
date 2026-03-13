import { afterEach, describe, expect, it, vi } from "vitest";

import { importPetFromJSON, isPersistenceAvailable } from "./indexeddb";

const validBaseRecord = {
  id: "pet-test",
  vitals: {
    hunger: 20,
    hygiene: 80,
    mood: 70,
    energy: 90,
  },
  genomeHash: {
    redHash: "red-hash",
    blueHash: "blue-hash",
    blackHash: "black-hash",
  },
  traits: {},
  evolution: {
    state: "GENETICS",
    birthTime: 1,
    lastEvolutionTime: 1,
    experience: 0,
    level: 1,
    currentLevelXp: 0,
    totalXp: 0,
    totalInteractions: 0,
    canEvolve: false,
  },
  crest: {
    vault: "blue",
    rotation: "CW",
    tail: [1, 2, 3, 4],
    coronatedAt: 1,
    dnaHash: "dna-hash",
    mirrorHash: "mirror-hash",
    signature: "signature",
  },
  heptaDigits: Array(42).fill(0),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("indexeddb persistence helpers", () => {
  it("returns false when indexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);

    await expect(isPersistenceAvailable()).resolves.toBe(false);
  });

  it("allows genome validation to be skipped for imports", () => {
    const imported = importPetFromJSON(
      JSON.stringify({
        ...validBaseRecord,
        genome: null,
      }),
      { skipGenomeValidation: true },
    );

    expect(imported.id).toBe("pet-test");
    expect(imported.genome.red60).toHaveLength(60);
    expect(imported.genome.blue60.every((value) => value === 0)).toBe(true);
    expect(imported.genome.black60.every((value) => value === 0)).toBe(true);
  });
});

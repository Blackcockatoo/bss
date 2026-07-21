import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateRandomGenome, decodeGenome, type Genome } from "@/lib/genome";
import { useStore } from "@/lib/store";
import { loadForgedBody } from "@/visual-dna/bodyForgeAdapter";
import { DEFAULT_BODY_SPEC } from "@/components/body-forge/PetBodyRenderer";
import {
  applyAlias,
  applyBodyDesign,
  applyDnaVariation,
  applyPreferredVisualisation,
  isValidGenome,
  readRealPetSnapshot,
  restorePreviousDna,
  undoAlias,
  undoBodyDesign,
  usePetUpdateStore,
  type PetUpdateContext,
} from "./petUpdate";
import { usePetProfileStore } from "./petProfile";

const REAL_CTX: PetUpdateContext = {
  isPreview: false,
  isDemo: false,
  lessonId: "build-a-body",
};

function seedRealPet(): Genome {
  const genome = generateRandomGenome(() => 0.42);
  useStore.getState().setGenome(genome, decodeGenome(genome));
  return genome;
}

function clearRealPet() {
  useStore.setState({ genome: null, traits: null });
}

beforeEach(() => {
  window.localStorage.clear();
  usePetProfileStore.getState().reset();
  usePetUpdateStore.getState().reset();
  clearRealPet();
});

afterEach(() => {
  window.localStorage.clear();
  usePetProfileStore.getState().reset();
  usePetUpdateStore.getState().reset();
  clearRealPet();
});

describe("safe pet update — guards", () => {
  it("rejects preview mode", () => {
    seedRealPet();
    const result = applyAlias("Pip", { ...REAL_CTX, isPreview: true });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/preview/i);
    expect(usePetProfileStore.getState().alias).toBe("");
  });

  it("rejects demonstration pets", () => {
    seedRealPet();
    const result = applyBodyDesign(DEFAULT_BODY_SPEC, {
      ...REAL_CTX,
      isDemo: true,
    });
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/classroom example/i);
    expect(loadForgedBody()).toBeNull();
  });

  it("rejects when no real pet exists", () => {
    const result = applyDnaVariation(REAL_CTX);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/create a meta-pet/i);
  });
});

describe("safe pet update — alias", () => {
  it("applies a valid alias and records a snapshot", () => {
    seedRealPet();
    const result = applyAlias("  Sparky ", REAL_CTX);
    expect(result.ok).toBe(true);
    expect(usePetProfileStore.getState().alias).toBe("Sparky");
    expect(result.undoAvailable).toBe(true);
  });

  it("rejects unsafe alias values", () => {
    seedRealPet();
    expect(applyAlias("someone@example.com", REAL_CTX).ok).toBe(false);
    expect(applyAlias("", REAL_CTX).ok).toBe(false);
    expect(applyAlias("x".repeat(50), REAL_CTX).ok).toBe(false);
  });

  it("undoes an alias change", () => {
    seedRealPet();
    usePetProfileStore.getState().setAlias("Original");
    applyAlias("Changed", REAL_CTX);
    expect(usePetProfileStore.getState().alias).toBe("Changed");
    const undo = undoAlias();
    expect(undo.ok).toBe(true);
    expect(usePetProfileStore.getState().alias).toBe("Original");
  });
});

describe("safe pet update — body design", () => {
  it("applies an approved design and preserves the genome", () => {
    const genome = seedRealPet();
    const result = applyBodyDesign(
      { ...DEFAULT_BODY_SPEC, shape: "crystal" },
      REAL_CTX,
    );
    expect(result.ok).toBe(true);
    expect(loadForgedBody()?.shape).toBe("crystal");
    // Unrelated pet data (genome) is preserved.
    expect(useStore.getState().genome).toEqual(genome);
  });

  it("undoes to the previous body (or clears when none existed)", () => {
    seedRealPet();
    expect(loadForgedBody()).toBeNull();
    applyBodyDesign({ ...DEFAULT_BODY_SPEC, shape: "crystal" }, REAL_CTX);
    expect(loadForgedBody()).not.toBeNull();
    const undo = undoBodyDesign();
    expect(undo.ok).toBe(true);
    // No previous body existed, so undo clears it.
    expect(loadForgedBody()).toBeNull();
  });
});

describe("safe pet update — DNA variation", () => {
  it("keeps a variation that differs in exactly one position", () => {
    const genome = seedRealPet();
    const result = applyDnaVariation(REAL_CTX, { strand: "red60", index: 0 });
    expect(result.ok).toBe(true);
    const after = useStore.getState().genome!;
    expect(after.red60[0]).not.toBe(genome.red60[0]);
    // Only one position changed.
    let diffs = 0;
    for (let i = 0; i < 60; i += 1) {
      if (after.red60[i] !== genome.red60[i]) diffs += 1;
      if (after.blue60[i] !== genome.blue60[i]) diffs += 1;
      if (after.black60[i] !== genome.black60[i]) diffs += 1;
    }
    expect(diffs).toBe(1);
  });

  it("restores the previous DNA", () => {
    const genome = seedRealPet();
    applyDnaVariation(REAL_CTX, { strand: "red60", index: 3 });
    const restore = restorePreviousDna();
    expect(restore.ok).toBe(true);
    expect(useStore.getState().genome).toEqual(genome);
  });

  it("keeps the genome valid after mutation", () => {
    seedRealPet();
    applyDnaVariation(REAL_CTX, { strand: "black60", index: 12 });
    expect(isValidGenome(useStore.getState().genome)).toBe(true);
  });
});

describe("safe pet update — preferred visualisation", () => {
  it("saves a preferred view without changing the genome", () => {
    const genome = seedRealPet();
    const result = applyPreferredVisualisation("vortex", {
      ...REAL_CTX,
      lessonId: "patterns-behind-the-pet",
    });
    expect(result.ok).toBe(true);
    expect(usePetProfileStore.getState().preferredDnaView).toBe("vortex");
    expect(useStore.getState().genome).toEqual(genome);
  });

  it("rejects an invalid view", () => {
    seedRealPet();
    const result = applyPreferredVisualisation("rainbow", {
      ...REAL_CTX,
      lessonId: "patterns-behind-the-pet",
    });
    expect(result.ok).toBe(false);
  });
});

describe("safe pet update — snapshot + refresh", () => {
  it("persists the undo snapshot to local storage (survives refresh)", () => {
    seedRealPet();
    applyBodyDesign({ ...DEFAULT_BODY_SPEC, shape: "crystal" }, REAL_CTX);
    const raw = window.localStorage.getItem("metapet-teacher-pet-update");
    expect(raw).toContain("body");
  });

  it("reads a real-pet snapshot", () => {
    seedRealPet();
    usePetProfileStore.getState().setAlias("Comet");
    const snap = readRealPetSnapshot();
    expect(snap.hasPet).toBe(true);
    expect(snap.alias).toBe("Comet");
  });
});

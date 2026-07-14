import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_BODY_SPEC } from "../components/body-forge/PetBodyRenderer";
import type { EvolutionData, EvolutionState } from "../evolution/types";
import type { DerivedTraits, Genome } from "../genome/types";
import { DEFAULT_VITALS } from "../vitals";
import { resolveVisualDNA } from "./resolveVisualDNA";
import {
  applyEvolutionGrowth,
  BODY_FORGE_STORAGE_KEY,
  clearForgedBody,
  createDNAReadyBodyPacket,
  createGenomeBodySpec,
  genomeToVisualGenes,
  getGenomeVisualFingerprint,
  importBodyForgeTransfer,
  LEGACY_BODY_FORGE_STORAGE_KEY,
  loadForgedBody,
  loadForgedBodyPacket,
  PREVIOUS_BODY_FORGE_STORAGE_KEY,
  resolveBodySpec,
  saveForgedBody,
  sanitizeBodySpec,
} from "./bodyForgeAdapter";

const traits: DerivedTraits = {
  physical: {
    bodyType: "Crystalline",
    primaryColor: "#123456",
    secondaryColor: "#abcdef",
    pattern: "Iridescent",
    texture: "Metallic",
    size: 0.92,
    proportions: { headRatio: 1, limbRatio: 0.8, tailRatio: 1.15 },
    features: ["Wings", "Third Eye"],
  },
  personality: {
    temperament: "Curious",
    energy: 76,
    social: 65,
    curiosity: 88,
    discipline: 52,
    affection: 72,
    independence: 48,
    playfulness: 81,
    loyalty: 79,
    quirks: ["orbits shiny things"],
  },
  latent: {
    evolutionPath: "Lattice Seraph",
    rareAbilities: ["phase-fold"],
    potential: { physical: 72, mental: 91, social: 75 },
    hiddenGenes: [3, 7, 1, 2, 3, 4, 5, 6, 2, 1, 0, 4, 5, 3, 2],
  },
  elementWeb: {
    usedResidues: [1, 3, 7],
    pairSlots: [2, 8],
    frontierSlots: [5],
    voidSlotsHit: [0],
    coverage: 0.74,
    frontierAffinity: 0.22,
    bridgeCount: 6,
    voidDrift: 0.12,
  },
};

const evolution: EvolutionData = {
  state: "NEURO",
  birthTime: 0,
  lastEvolutionTime: 0,
  experience: 0,
  level: 1,
  currentLevelXp: 0,
  totalXp: 0,
  totalInteractions: 0,
  canEvolve: false,
};

function emptyGenome(): Genome {
  return {
    red60: Array(60).fill(0),
    blue60: Array(60).fill(0),
    black60: Array(60).fill(0),
  };
}

function changeGene(genome: Genome, geneIndex: number): Genome {
  const copy: Genome = {
    red60: [...genome.red60],
    blue60: [...genome.blue60],
    black60: [...genome.black60],
  };
  const flatIndex = geneIndex * 6;
  const lane = Math.floor(flatIndex / 60);
  const laneIndex = flatIndex % 60;
  [copy.red60, copy.blue60, copy.black60][lane][laneIndex] = 9;
  return copy;
}

function phenotype(hunger = 35) {
  return resolveVisualDNA({
    traits,
    vitals: { ...DEFAULT_VITALS, hunger },
    evolution,
    now: 10_000,
  });
}

describe("Body Forge visual genome bridge", () => {
  it("imports the standalone Body Forge envelope into a complete v3 BodySpec", () => {
    const imported = importBodyForgeTransfer({
      version: 1,
      kind: "bss.body-forge-transfer",
      source: "bs-body-forge",
      body: {
        name: "Manta Witness",
        shape: "manta",
        pattern: "pearl",
        expression: "fierce",
        primary: "#123456",
        shadow: "#07101f",
        accent: "#f7c94b",
        width: 144,
        height: 121,
        genderFrame: "female",
        shoulders: 38,
        waist: 34,
        hips: 78,
        textureScale: 62,
        textureDepth: 74,
        textureRoughness: 19,
        eyes: 17,
        eyeGap: 55,
        gazeX: 3,
        wing: 96,
        wingStyle: "moth",
        wingPurpose: "attract",
        horn: 31,
        glow: 73,
        tilt: -4,
        bounce: 12,
        wings: true,
        horns: false,
        thirdEye: true,
        flame: false,
        auraStyle: "void",
        auraMotion: "implode",
        emotionIndex: -100,
      },
    });

    // v3 accepts the workshop's expression and material vocabulary
    // natively — no field the workshop supports is silently dropped.
    expect(imported).toMatchObject({
      name: "Manta Witness",
      shape: "manta",
      pattern: "pearl",
      expression: "fierce",
      genderFrame: "female",
      shoulders: 38,
      waist: 34,
      hips: 78,
      wingStyle: "moth",
      wingPurpose: "attract",
      auraStyle: "void",
      auraMotion: "implode",
      emotionIndex: -100,
      features: ["wings", "thirdEye"],
    });
    // The result is a complete, renderable v3 body.
    expect(imported ? Object.keys(imported).sort() : []).toEqual(
      Object.keys(DEFAULT_BODY_SPEC).sort(),
    );
  });

  it("rejects transfer payloads that are not the workshop envelope", () => {
    expect(importBodyForgeTransfer(null)).toBeNull();
    expect(importBodyForgeTransfer({ version: 2 })).toBeNull();
    expect(
      importBodyForgeTransfer({ version: 1, kind: "other", body: {} }),
    ).toBeNull();
  });

  it("splits all 180 digits into thirty stable six-digit visual genes", () => {
    const genome: Genome = {
      red60: Array.from({ length: 60 }, (_, index) => index % 10),
      blue60: Array.from({ length: 60 }, (_, index) => (index + 3) % 10),
      black60: Array.from({ length: 60 }, (_, index) => (index + 6) % 10),
    };

    const genes = genomeToVisualGenes(genome);
    expect(genes).toHaveLength(30);
    expect(genes.slice(0, 3)).toEqual([12_345, 678_901, 234_567]);
    expect(genomeToVisualGenes(genome)).toEqual(genes);
  });

  it("lets every six-digit lane influence the permanent body specification", () => {
    const baseGenome = emptyGenome();
    const frame = phenotype();
    const baseBody = createGenomeBodySpec(frame, baseGenome);

    for (let geneIndex = 0; geneIndex < 30; geneIndex += 1) {
      const changedBody = createGenomeBodySpec(
        frame,
        changeGene(baseGenome, geneIndex),
      );
      expect(
        changedBody,
        `visual gene ${geneIndex} should affect the body`,
      ).not.toEqual(baseBody);
    }
  });

  it("keeps forged anatomy inherited while live vitals deform its expression and posture", () => {
    const genome = changeGene(emptyGenome(), 23);
    const stable = phenotype(35);
    const starving = phenotype(96);
    const forged = {
      ...createGenomeBodySpec(stable, genome),
      name: "Forged witness",
      shape: "toroid" as const,
      bodyWidth: 138,
      features: ["crown"] as const,
    };

    const stableBody = resolveBodySpec(stable, genome, {
      ...forged,
      features: [...forged.features],
    });
    const starvingBody = resolveBodySpec(starving, genome, {
      ...forged,
      features: [...forged.features],
    });

    expect(stableBody.shape).toBe("toroid");
    expect(starvingBody.shape).toBe("toroid");
    expect(starvingBody.bodyHeight).toBeLessThan(stableBody.bodyHeight);
    expect(starvingBody.expression).toBe("focused");
    // Vitals (hunger, here) never touch the feature set — only evolution and
    // the forge/genome own that, so it must be identical no matter how
    // hungry the pet currently is.
    expect(starvingBody.features).toEqual(stableBody.features);
    expect(stableBody.features).toContain("crown");
  });

  it("changes the visual fingerprint when any genome lane changes", () => {
    const genome = emptyGenome();
    expect(getGenomeVisualFingerprint(changeGene(genome, 0))).not.toBe(
      getGenomeVisualFingerprint(genome),
    );
    expect(getGenomeVisualFingerprint(changeGene(genome, 10))).not.toBe(
      getGenomeVisualFingerprint(genome),
    );
    expect(getGenomeVisualFingerprint(changeGene(genome, 20))).not.toBe(
      getGenomeVisualFingerprint(genome),
    );
  });

  it("lets evolution permanently grant its own stage feature as the pet matures, stacking on every earlier stage without ever removing one", () => {
    const genome = changeGene(emptyGenome(), 5);
    const stages: EvolutionState[] = [
      "GENETICS",
      "NEURO",
      "QUANTUM",
      "SPECIATION",
    ];
    const revealed = stages.map((state) => {
      const frame = resolveVisualDNA({
        traits,
        vitals: DEFAULT_VITALS,
        evolution: { ...evolution, state },
        now: 10_000,
      });
      const base = {
        ...createGenomeBodySpec(frame, genome),
        features: ["wings"] as const,
      };
      return applyEvolutionGrowth(
        { ...base, features: [...base.features] },
        frame,
      ).features;
    });

    expect(revealed[0]).toEqual(["wings"]);
    expect(revealed[1]).toEqual(["wings"]);
    expect(revealed[2].sort()).toEqual(["thirdEye", "wings"].sort());
    expect(revealed[3].sort()).toEqual(["crown", "thirdEye", "wings"].sort());

    for (let index = 1; index < revealed.length; index += 1) {
      for (const feature of revealed[index - 1]) {
        expect(
          revealed[index],
          `stage ${stages[index]} should keep ${feature}`,
        ).toContain(feature);
      }
    }
  });

  it("never lets evolution growth remove a feature the genome or Body Forge already granted", () => {
    const genome = changeGene(emptyGenome(), 12);
    const genetics = resolveVisualDNA({
      traits,
      vitals: DEFAULT_VITALS,
      evolution: { ...evolution, state: "GENETICS" },
      now: 10_000,
    });
    const forged = {
      ...createGenomeBodySpec(genetics, genome),
      features: ["tailFlame"] as const,
    };

    const grown = applyEvolutionGrowth(
      { ...forged, features: [...forged.features] },
      genetics,
    );

    expect(grown.features).toContain("tailFlame");
  });
});

describe("forged body persistence", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a saved forged body through the versioned packet", () => {
    const genome = changeGene(emptyGenome(), 8);
    const spec = {
      ...DEFAULT_BODY_SPEC,
      name: "Round Trip",
      bodyWidth: 111,
      features: ["crown", "wings"] as const,
    };

    saveForgedBody({ ...spec, features: [...spec.features] }, genome, 42);

    expect(loadForgedBody()).toEqual({ ...spec, features: [...spec.features] });
  });

  it("round-trips the complete silhouette, surface, wing, aura and emotion contract", () => {
    const richSpec = {
      ...DEFAULT_BODY_SPEC,
      shape: "manta" as const,
      pattern: "pearl" as const,
      genderFrame: "female" as const,
      shoulders: 41,
      waist: 33,
      hips: 79,
      wingStyle: "moth" as const,
      wingPurpose: "attract" as const,
      auraStyle: "5d" as const,
      auraMotion: "spiral" as const,
      auraDimension: 8,
      auraColor: "#123abc",
      auraSecondary: "#fedcba",
      emotionIndex: 74,
    };

    saveForgedBody(richSpec);

    expect(loadForgedBody()).toEqual(richSpec);
    expect(
      JSON.parse(window.localStorage.getItem(BODY_FORGE_STORAGE_KEY) ?? "{}")
        .version,
    ).toBe(3);
  });

  it("migrates the previous v2 envelope into the v3 contract without losing its inherited body", () => {
    const previous = {
      ...DEFAULT_BODY_SPEC,
      name: "V2 survivor",
      shape: "toroid" as const,
    };
    window.localStorage.setItem(
      PREVIOUS_BODY_FORGE_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: 10,
        genomeFingerprint: "OLD",
        body: previous,
      }),
    );

    expect(loadForgedBody()).toEqual(previous);
    expect(
      window.localStorage.getItem(PREVIOUS_BODY_FORGE_STORAGE_KEY),
    ).toBeNull();
    expect(window.localStorage.getItem(BODY_FORGE_STORAGE_KEY)).not.toBeNull();
  });

  it("migrates a legacy pre-version save and removes the old key", () => {
    const legacySpec = {
      ...DEFAULT_BODY_SPEC,
      name: "Legacy Save",
      bodyWidth: 101,
    };
    window.localStorage.setItem(
      LEGACY_BODY_FORGE_STORAGE_KEY,
      JSON.stringify(legacySpec),
    );

    const loaded = loadForgedBody();

    expect(loaded).toEqual(legacySpec);
    expect(
      window.localStorage.getItem(LEGACY_BODY_FORGE_STORAGE_KEY),
    ).toBeNull();
    expect(window.localStorage.getItem(BODY_FORGE_STORAGE_KEY)).not.toBeNull();
    expect(loadForgedBody()).toEqual(legacySpec);
  });

  it("falls back field-by-field for a partially malformed saved body", () => {
    window.localStorage.setItem(
      BODY_FORGE_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        body: {
          ...DEFAULT_BODY_SPEC,
          bodyWidth: "banana",
          glow: Number.NaN,
          shape: "hexagon",
          features: ["nonsense", "wings", "wings"],
        },
      }),
    );

    const loaded = loadForgedBody();

    expect(loaded).not.toBeNull();
    expect(loaded?.bodyWidth).toBe(DEFAULT_BODY_SPEC.bodyWidth);
    expect(loaded?.glow).toBe(DEFAULT_BODY_SPEC.glow);
    expect(loaded?.shape).toBe(DEFAULT_BODY_SPEC.shape);
    expect(loaded?.features).toEqual(["wings"]);
  });

  it("returns null instead of inventing a body from unusable saved data", () => {
    window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, "not json{");
    expect(loadForgedBody()).toBeNull();

    window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, JSON.stringify(42));
    expect(loadForgedBody()).toBeNull();

    window.localStorage.setItem(
      BODY_FORGE_STORAGE_KEY,
      JSON.stringify([1, 2, 3]),
    );
    expect(loadForgedBody()).toBeNull();

    window.localStorage.setItem(BODY_FORGE_STORAGE_KEY, JSON.stringify(null));
    expect(loadForgedBody()).toBeNull();
  });

  it("sanitizeBodySpec never throws and always returns every BodySpec field", () => {
    for (const garbage of [
      undefined,
      null,
      "x",
      3,
      [],
      {},
      { features: "nope" },
    ]) {
      const sanitized = sanitizeBodySpec(garbage);
      expect(Object.keys(sanitized).sort()).toEqual(
        Object.keys(DEFAULT_BODY_SPEC).sort(),
      );
    }
  });

  it("clearForgedBody removes both the current and legacy keys", () => {
    window.localStorage.setItem(
      BODY_FORGE_STORAGE_KEY,
      JSON.stringify({ version: 2, body: DEFAULT_BODY_SPEC }),
    );
    window.localStorage.setItem(
      LEGACY_BODY_FORGE_STORAGE_KEY,
      JSON.stringify(DEFAULT_BODY_SPEC),
    );
    window.localStorage.setItem(
      PREVIOUS_BODY_FORGE_STORAGE_KEY,
      JSON.stringify({ version: 2, body: DEFAULT_BODY_SPEC }),
    );

    clearForgedBody();

    expect(window.localStorage.getItem(BODY_FORGE_STORAGE_KEY)).toBeNull();
    expect(
      window.localStorage.getItem(LEGACY_BODY_FORGE_STORAGE_KEY),
    ).toBeNull();
    expect(
      window.localStorage.getItem(PREVIOUS_BODY_FORGE_STORAGE_KEY),
    ).toBeNull();
    expect(loadForgedBody()).toBeNull();
  });

  it("records migration provenance and preserves it across re-saves", () => {
    window.localStorage.setItem(
      PREVIOUS_BODY_FORGE_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        body: { ...DEFAULT_BODY_SPEC, name: "Provenance" },
      }),
    );

    const packet = loadForgedBodyPacket();
    expect(packet?.version).toBe(3);
    expect(packet?.migratedFrom).toBe("v2");
    expect(packet?.body.name).toBe("Provenance");

    // A later plain re-save (e.g. the Forge saving an edit) keeps history.
    saveForgedBody({ ...packet!.body, bodyWidth: 99 });
    const resaved = loadForgedBodyPacket();
    expect(resaved?.migratedFrom).toBe("v2");
    expect(resaved?.body.bodyWidth).toBe(99);

    // A body authored under v3 carries no migration marker.
    window.localStorage.clear();
    saveForgedBody({ ...DEFAULT_BODY_SPEC, name: "Native" });
    expect(loadForgedBodyPacket()?.migratedFrom).toBeUndefined();
  });

  it("survives the full lifecycle: create → save → reload → export → import → return → reload", () => {
    const authored = {
      ...DEFAULT_BODY_SPEC,
      name: "Lifecycle Witness",
      shape: "hourglass" as const,
      pattern: "chrome" as const,
      expression: "mischief" as const,
      genderFrame: "female" as const,
      shoulders: 71,
      waist: 28,
      hips: 66,
      wingStyle: "veil" as const,
      wingPurpose: "defend" as const,
      auraStyle: "ribbons" as const,
      auraMotion: "breathe" as const,
      auraDensity: 88,
      auraRadius: 91,
      auraSpeed: 17,
      auraTurbulence: 64,
      auraDimension: 7,
      auraColor: "#22ccdd",
      auraSecondary: "#aa33ff",
      emotionIndex: -41,
      features: ["wings", "horns", "thirdEye"] as const,
    };
    const spec = { ...authored, features: [...authored.features] };

    // create → save → reload
    saveForgedBody(spec);
    const reloaded = loadForgedBody();
    expect(reloaded).toEqual(spec);

    // export → import (the Forge's JSON packet path)
    const exported = JSON.parse(
      JSON.stringify(createDNAReadyBodyPacket(reloaded!)),
    ) as { body: unknown };
    const imported = sanitizeBodySpec(exported.body);
    expect(imported).toEqual(spec);

    // return from Forge (save again) → reload: identity unchanged.
    saveForgedBody(imported);
    expect(loadForgedBody()).toEqual(spec);
  });
});

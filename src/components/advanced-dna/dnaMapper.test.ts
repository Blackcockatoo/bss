import { describe, expect, it } from "vitest";
import { decodeGenome, type Genome } from "@/lib/genome";
import { DEFAULT_VITALS } from "@/vitals";
import {
  DNA_BASE_COLORS,
  buildDnaVisualModel,
  mutationSignal,
} from "./dnaMapper";
import type { DnaVisualSource } from "./types";

function makeGenome(offset = 0): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => (index + offset) % 10),
    blue60: Array.from(
      { length: 60 },
      (_, index) => (index * 3 + 2 + offset) % 10,
    ),
    black60: Array.from(
      { length: 60 },
      (_, index) => (index * 7 + 1 + offset) % 10,
    ),
  };
}

function makeSource(genome = makeGenome(), mood = 60): DnaVisualSource {
  return {
    genome,
    traits: decodeGenome(genome),
    vitals: { ...DEFAULT_VITALS, mood },
    mutationLog: [],
    petId: "pet-test",
    petName: "Test Pet",
    isFallback: false,
  };
}

describe("advanced DNA mapper", () => {
  it("maps the complete registered genome into one deterministic identity", () => {
    const first = buildDnaVisualModel(makeSource());
    const second = buildDnaVisualModel(makeSource());

    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first.numericSeed).toBe(second.numericSeed);
    expect(first.loci).toEqual(second.loci);
    expect(first.groups).toEqual(second.groups);
    expect(first.loci).toHaveLength(180);
    expect(first.groups).toHaveLength(12);
    expect(
      Object.values(first.baseCounts).reduce((sum, count) => sum + count, 0),
    ).toBe(180);
  });

  it("keeps identity geometry stable while current mood changes behavior weights", () => {
    const calm = buildDnaVisualModel(makeSource(makeGenome(), 30));
    const bright = buildDnaVisualModel(makeSource(makeGenome(), 95));

    expect(calm.fingerprint).toBe(bright.fingerprint);
    expect(calm.loci).toEqual(bright.loci);
    expect(calm.traitWeights.mood).not.toBe(bright.traitWeights.mood);
  });

  it("changes the identity when any real DNA locus changes", () => {
    const firstGenome = makeGenome();
    const secondGenome = makeGenome();
    secondGenome.black60[47] = (secondGenome.black60[47] + 1) % 10;

    const first = buildDnaVisualModel(makeSource(firstGenome));
    const second = buildDnaVisualModel(makeSource(secondGenome));

    expect(first.fingerprint).not.toBe(second.fingerprint);
    expect(first.loci[167].phase).not.toBe(second.loci[167].phase);
  });

  it("uses one canonical base colour/shape identity and preserves mutation history", () => {
    const source = makeSource();
    source.mutationLog = [
      { strand: "blue", index: 17, before: 2, after: source.genome.blue60[17] },
    ];
    const model = buildDnaVisualModel(source);
    const mutated = model.loci[60 + 17];

    expect(mutated.explicitMutation).toBe(true);
    expect(mutated.expression).toBe("mutated");
    expect(mutated.color).toBe(DNA_BASE_COLORS[mutated.base]);
    expect(mutationSignal(mutated, 0)).toBe(1);
    expect(model.mutationCount).toBe(1);
  });
});

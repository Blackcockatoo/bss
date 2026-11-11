import { describe, expect, it } from "vitest";
import type { PetRecordV2 } from "@/lib/registry/record";
import { copyActivePetDna } from "./activePet";
import { ATLAS_STRANDS, circularWindow, inspectWindow, isSmallPrime } from "./atlas";
import { advanceExperiment, canonicalGenome, copyGenome, createExperiment, exportExperiment, importExperiment, LAB_VERSION, MAX_TICKS, normalizedTraits, runExperiment, windowResidues } from "./engine";
import { createLabRandom, RNG_VERSION, sha256 } from "./random";
import geometry from "./geometry.json";
import atlas from "./canonical-atlas.json";

describe("versioned laboratory random stream", () => {
  it("pins a cross-language seed vector and restores the next draw exactly", async () => {
    const rng = await createLabRandom("MOSS60");
    const expected = [1879230452021099, 3261467587107216, 3552560293841509, 6066829471707199, 5807069249898553];
    expect(expected.map(() => rng.next() * 2 ** 53)).toEqual(expected);
    const restored = await createLabRandom("", rng.snapshot());
    expect(Array.from({ length: 1000 }, () => restored.next())).toEqual(Array.from({ length: 1000 }, () => rng.next()));
  });

  it("keeps 64-bit state after a million draws and distinguishes the old A/Q alias", async () => {
    const rng = await createLabRandom("A");
    const other = await createLabRandom("Q");
    expect(rng.next()).not.toBe(other.next());
    for (let i = 0; i < 1_000_000; i++) {
      const value = rng.next();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error("Invalid random output");
    }
    expect(rng.snapshot().s0.length).toBeLessThanOrEqual(16);
    expect(rng.snapshot().s1.length).toBeLessThanOrEqual(16);
    await expect(createLabRandom("", { version: RNG_VERSION, s0: "0", s1: "0" })).rejects.toThrow("zero");
    await expect(createLabRandom("", { version: RNG_VERSION, s0: "1".repeat(17), s1: "1" })).rejects.toThrow("checkpoint");
  });
});

describe("canonical circular atlas", () => {
  it("preserves all source addresses, leading zeroes and direction reversals", () => {
    let count = 0;
    for (const [name, digits] of Object.entries(ATLAS_STRANDS)) {
      expect(atlas.flags[name as keyof typeof atlas.flags]).toHaveLength(2 * digits.length ** 2);
      for (let width = 1; width <= digits.length; width++) for (const direction of [1, -1] as const) for (let start = 0; start < digits.length; start++) {
        const reading = inspectWindow(digits, start, width, direction);
        const reverseStart = (start + direction * (width - 1) + digits.length) % digits.length;
        expect(circularWindow(digits, reverseStart, width, direction === 1 ? -1 : 1)).toBe(Array.from(reading.digits).reverse().join(""));
        if (width === 7) expect(reading.primeStatus === "prime").toBe(isSmallPrime(Number(reading.digits)));
        count++;
      }
    }
    expect(count).toBe(21_888);
    expect(inspectWindow(ATLAS_STRANDS.black, 0, 7).digits).toBe("0112358");
  });

  it("keeps symbolic one distinct from primes and labels full RED readings honestly", () => {
    expect(inspectWindow(ATLAS_STRANDS.red, 0, 1)).toMatchObject({ digits: "1", primeStatus: "not prime", symbolicGate: true });
    expect(inspectWindow(ATLAS_STRANDS.red, 1, 5)).toMatchObject({ digits: "13031", palindrome: true });
    expect(inspectWindow(ATLAS_STRANDS.red, 56, 60).primeStatus).toBe("probable prime");
    expect(inspectWindow(ATLAS_STRANDS.red, 24, 60, -1).primeStatus).toBe("probable prime");
    expect(inspectWindow("9".repeat(60), 0, 60).primeStatus).toBe("not classified");
    expect(() => circularWindow(ATLAS_STRANDS.red, -1, 7)).toThrow();
  });

  it("maps exactly sixty distinct face-corner positions in each spatial view", () => {
    for (const view of Object.values(geometry)) {
      expect(view.slots).toHaveLength(60);
      expect(new Set(view.slots.map(point => point.join(","))).size).toBe(60);
      expect(view.edges.every(edge => edge.every(index => index >= 0 && index < 60))).toBe(true);
    }
  });
});

describe("DNA and expression isolation", () => {
  it("validates explicit radix and rejects sparse or malformed DNA", () => {
    const genome = canonicalGenome();
    expect(() => copyGenome(genome, 7)).toThrow();
    expect(() => copyGenome({ ...genome, red60: new Array(60) }, 10)).toThrow();
    expect(() => copyGenome({ ...genome, blue60: Array(60).fill(NaN) }, 10)).toThrow();
    for (const radix of [7, 10] as const) {
      const max = { red60: Array(60).fill(radix - 1), blue60: Array(60).fill(radix - 1), black60: Array(60).fill(radix - 1) };
      expect(normalizedTraits(max, radix)).toMatchObject({ size: 2, personality: { energy: 100 }, potential: { physical: 100 } });
    }
  });

  it("takes a detached immutable copy and keeps dynamic state finite and bounded", async () => {
    const genome = canonicalGenome();
    const original = JSON.stringify(genome);
    const state = await createExperiment(genome, 10);
    runExperiment(state, MAX_TICKS, "spark");
    expect(JSON.stringify(genome)).toBe(original);
    expect(JSON.stringify(state.genome)).toBe(original);
    expect(state.genome.red60).not.toBe(genome.red60);
    expect(Object.isFrozen(state.genome.red60)).toBe(true);
    expect([...state.amplitude, ...state.expression].every(value => Number.isFinite(value) && value >= 0 && value <= 1)).toBe(true);
    expect(state.phase.every(value => value >= 0 && value < 2 * Math.PI)).toBe(true);
    expect(new Set(state.frequency).size).toBe(10);
    expect(state.tick).toBe(MAX_TICKS);
  });

  it("advances identically at 30, 60 and 120 frames per second", async () => {
    const states = await Promise.all([30, 60, 120].map(async fps => {
      const state = await createExperiment(canonicalGenome(), 10, "clock");
      for (let frame = 0; frame < fps * 10; frame++) advanceExperiment(state, 1 / fps, "quiet");
      return state;
    }));
    expect(states.map(state => state.tick)).toEqual([600, 600, 600]);
    for (const state of states.slice(1)) {
      expect(state.amplitude).toEqual(states[0].amplitude);
      expect(state.expression).toEqual(states[0].expression);
      expect(state.phase).toEqual(states[0].phase);
    }
  });

  it("rejects invalid advances without partial time or state changes", async () => {
    const state = await createExperiment(canonicalGenome(), 10);
    advanceExperiment(state, 1 / 120, "balanced");
    const before = exportExperiment(state);
    const amplitude = state.amplitude.slice();
    for (const elapsed of [-1, Infinity, NaN, 601]) expect(() => advanceExperiment(state, elapsed, "balanced")).toThrow();
    expect(exportExperiment(state)).toBe(before);
    expect(state.amplitude).toEqual(amplitude);
    advanceExperiment(state, 0, "balanced");
    expect(exportExperiment(state)).toBe(before);
  });

  it("replays mixed environments exactly, including a partial clock interval", async () => {
    const state = await createExperiment(canonicalGenome(), 10, "replay");
    runExperiment(state, 600, "spark");
    runExperiment(state, 600, "quiet");
    advanceExperiment(state, 1 / 120, "quiet");
    const imported = await importExperiment(exportExperiment(state));
    expect(imported.amplitude).toEqual(state.amplitude);
    expect(imported.expression).toEqual(state.expression);
    expect(imported.phase).toEqual(state.phase);
    expect(exportExperiment(imported)).toBe(exportExperiment(state));
    const control = await createExperiment(canonicalGenome(), 10, "replay");
    runExperiment(control, 1200, "balanced");
    expect(control.expression).not.toEqual(state.expression);
  });

  it("rejects changed DNA, unversioned payloads and unbounded replays", async () => {
    const state = await createExperiment(canonicalGenome(), 10);
    const payload = JSON.parse(exportExperiment(state));
    payload.genome.red60[0] = 9;
    await expect(importExperiment(JSON.stringify(payload))).rejects.toThrow("fingerprint");
    await expect(importExperiment(JSON.stringify({ ...payload, format: "moss60-experiment/v1" }))).rejects.toThrow("Unsupported");
    await expect(importExperiment(JSON.stringify({ ...payload, format: LAB_VERSION, events: [{ environment: "spark", steps: MAX_TICKS + 1 }] }))).rejects.toThrow("limit");
    await expect(importExperiment(JSON.stringify({ ...payload, events: [{ environment: "toString", steps: 1 }] }))).rejects.toThrow("event");
    await expect(importExperiment(" ".repeat(256_001))).rejects.toThrow("large");
  });

  it("derives a window profile without treating it as identity", () => {
    const genome = canonicalGenome();
    const bins = windowResidues(genome, 10);
    expect(bins.reduce((sum, count) => sum + count, 0)).toBe(180);
    expect(bins.filter(count => count > 0).length).toBeGreaterThan(10);
    genome.red60[0] = 9;
    expect(windowResidues(genome, 10)).not.toEqual(bins);
  });

  it("copies registered DNA only after checking the actual stored content hashes", async () => {
    const genome = canonicalGenome();
    const record = { genome, genomeRadix: 10, genomeHash: {
      redHash: await sha256(genome.red60.join("")), blueHash: await sha256(genome.blue60.join("")), blackHash: await sha256(genome.black60.join("")),
    } } as PetRecordV2;
    const before = JSON.stringify(record);
    const copied = await copyActivePetDna(record);
    copied.genome.red60[0] = 9;
    expect(JSON.stringify(record)).toBe(before);
    record.genome.blue60[0] = 9;
    await expect(copyActivePetDna(record)).rejects.toThrow("fingerprint");
  });
});

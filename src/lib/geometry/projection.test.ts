import { describe, expect, it } from "vitest";

import type { Genome } from "@/lib/genome";

import {
  CHAMBERS_BY_REGION,
  deriveSriYantraProjection,
  deriveSriYantraProjectionV2,
  ENGINE_SAMPLE_POSITIONS,
  fingerprintSriYantraProjection,
  SRI_YANTRA_PROJECTION_VERSION_V1,
} from "./projection";

function genome(): Genome {
  return {
    red60: Array.from({ length: 60 }, (_, index) => index % 10),
    blue60: Array.from({ length: 60 }, (_, index) => (index * 3 + 1) % 10),
    black60: Array.from({ length: 60 }, (_, index) => (index * 7 + 2) % 10),
  };
}

function mutate(source: Genome, flatIndex: number): Genome {
  const next = structuredClone(source);
  const lane = Math.floor(flatIndex / 60);
  const index = flatIndex % 60;
  const strand = [next.red60, next.blue60, next.black60][lane];
  strand[index] = (strand[index] + 1) % 10;
  return next;
}

describe("Sri Yantra chamber projection V2", () => {
  it("maps all twelve pentad chambers exactly once", () => {
    const mapped = CHAMBERS_BY_REGION.flat().sort((a, b) => a - b);
    expect(mapped).toEqual(Array.from({ length: 12 }, (_, index) => index));
  });

  it("writes ten region values into the exact positions the engine samples", () => {
    const projection = deriveSriYantraProjectionV2(genome());
    for (const lane of ["red", "blue", "black"] as const) {
      expect(projection.strands[lane]).toMatch(/^\d{60}$/);
      expect(projection.regionDigits[lane]).toHaveLength(10);
      ENGINE_SAMPLE_POSITIONS[lane].forEach((packetIndex, regionIndex) => {
        expect(Number(projection.strands[lane][packetIndex])).toBe(
          projection.regionDigits[lane][regionIndex],
        );
      });
    }
  });

  it("makes every one of the 180 loci alter a sampled engine input", () => {
    const source = genome();
    const baseline = deriveSriYantraProjectionV2(source).regionDigits;

    for (let flatIndex = 0; flatIndex < 180; flatIndex += 1) {
      const changed = deriveSriYantraProjectionV2(
        mutate(source, flatIndex),
      ).regionDigits;
      expect(changed, `locus ${flatIndex} must reach the renderer`).not.toEqual(
        baseline,
      );
    }
  });

  it("keeps legacy v1 as a direct, stable projection", () => {
    const source = genome();
    const projection = deriveSriYantraProjection(
      source,
      SRI_YANTRA_PROJECTION_VERSION_V1,
    );
    expect(projection.strands.red).toBe(source.red60.join(""));
  });

  it("fingerprints the exact projected packet and version", async () => {
    const base = deriveSriYantraProjectionV2(genome());
    const changed = deriveSriYantraProjectionV2(mutate(genome(), 179));
    await expect(fingerprintSriYantraProjection(base)).resolves.not.toBe(
      await fingerprintSriYantraProjection(changed),
    );
  });
});

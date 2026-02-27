import { describe, expect, it } from "vitest";

import {
  normalizeGraphChunkRequest,
  parseFutureBranches,
  parseGraphChunkResponse,
  parseSonifySummaryResponse,
} from "../../domain/genomeContracts";
import { getConstellationGraphChunk } from "./constellation";
import { projectFutures } from "./futures";
import { getSonifySummary } from "./sonify";

describe("genome route contracts", () => {
  it("round-trips constellation payload through JSON serialization", () => {
    const payload = getConstellationGraphChunk({ petId: "pet-1", cursor: 0, limit: 10 });
    const encoded = JSON.stringify(payload);
    const decoded = parseGraphChunkResponse(encoded);

    expect(decoded).toEqual(payload);
    expect(decoded.nodes).toHaveLength(10);
  });

  it("round-trips sonify payload through JSON serialization", () => {
    const payload = getSonifySummary("pet-1");
    const encoded = JSON.stringify(payload);
    const decoded = parseSonifySummaryResponse(encoded);

    expect(decoded).toEqual(payload);
    expect(decoded.normalizedTraitVector.length).toBeGreaterThan(0);
  });

  it("round-trips futures payload through JSON serialization", () => {
    const payload = projectFutures("pet-1", {
      diet: "balanced",
      activity: "high",
      enrichment: "medium",
    });

    const encoded = JSON.stringify(payload);
    const decoded = parseFutureBranches(encoded);

    expect(decoded).toEqual(payload);
    expect(decoded[0].confidence).toBeLessThanOrEqual(1);
  });

  it("enforces constellation pagination boundaries", () => {
    expect(() => normalizeGraphChunkRequest({ petId: "pet-1", cursor: -1 })).toThrow(
      "cursor must be greater than or equal to 0",
    );
    expect(() => normalizeGraphChunkRequest({ petId: "pet-1", limit: 0 })).toThrow(
      "limit must be between 1 and 100",
    );
    expect(() => normalizeGraphChunkRequest({ petId: "pet-1", limit: 101 })).toThrow(
      "limit must be between 1 and 100",
    );
  });

  it("applies filter precedence in constellation endpoint", () => {
    const payload = getConstellationGraphChunk({
      petId: "pet-1",
      chromosome: "chr2",
      cluster: "cluster-2",
      cursor: 0,
      limit: 20,
    });

    expect(payload.nodes.every((node) => node.chromosome === "chr2")).toBe(true);
    expect(payload.nodes.every((node) => node.cluster === "cluster-2")).toBe(true);
    expect(payload.nextCursor).toBeNull();
  });
});

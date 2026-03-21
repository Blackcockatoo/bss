import { describe, expect, it } from "vitest";

import { buildDigitalDNARevealModel } from "@/lib/digitalDnaReveal";

describe("digital DNA reveal model", () => {
  it("builds an instant decode with visible constellation nodes", () => {
    const model = buildDigitalDNARevealModel();

    expect(model.nodes).toHaveLength(10);
    expect(model.resonanceClass.length).toBeGreaterThan(0);
    expect(model.liveMutationSeed).toMatch(/^\d(-\d){4}$/);
    expect(model.dominantLattice.length).toBeGreaterThan(0);
  });
});

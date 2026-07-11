import { describe, expect, it } from "vitest";

import { PORTAL_DESCRIPTION, PORTAL_TAGLINE } from "@/lib/portalTruth";

describe("portal truth", () => {
  it("keeps the canonical core tagline", () => {
    expect(PORTAL_TAGLINE).toBe(
      "Privacy-first digital learning companion for classrooms and families.",
    );
  });

  it("builds the launch description path summary from the main ladder labels", () => {
    expect(PORTAL_DESCRIPTION).toContain(
      "Meta-Pet turns care, pattern learning, and digital responsibility into short guided activities.",
    );
    expect(PORTAL_DESCRIPTION).toContain(
      "Start with try demo, then review school pilot, privacy, and dna engine.",
    );
  });
});

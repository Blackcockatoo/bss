import { describe, expect, it } from "vitest";

import { PORTAL_DESCRIPTION, PORTAL_TAGLINE } from "@/lib/portalTruth";

describe("portal truth", () => {
  it("keeps the canonical tagline pinned", () => {
    expect(PORTAL_TAGLINE).toBe(
      "Privacy-first digital learning companion for classrooms and families.",
    );
  });

  it("keeps the shared launch description in one canonical string", () => {
    expect(PORTAL_DESCRIPTION).toBe(
      "Meta-Pet turns care, pattern learning, and digital responsibility into short guided activities. It runs browser-first and local-first: no ads, no trackers, no student accounts, and no unnecessary data collection. Start with try demo, then review school pilot, privacy, and dna engine.",
    );
  });
});

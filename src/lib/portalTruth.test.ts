import { describe, expect, it } from "vitest";

import { PORTAL_DESCRIPTION, PORTAL_TAGLINE } from "@/lib/portalTruth";

describe("portal truth", () => {
  it("builds the portal tagline from the main ladder labels", () => {
    expect(PORTAL_TAGLINE).toBe(
      "Start with the pet, then climb into school, identity, and DNA.",
    );
  });

  it("keeps the shared launch description in one canonical string", () => {
    expect(PORTAL_DESCRIPTION).toBe(
      "Care builds the bond, school turns that bond into pattern learning, identity keeps ownership local-first, and DNA reveals the hidden engine underneath all three.",
    );
  });
});

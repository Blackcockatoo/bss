import { describe, expect, it } from "vitest";

import {
  ACTIVE_STUDIO_EMAIL,
  SCHOOL_CONTACT_EMAILS,
  buildMailto,
  getSurfaceContact,
} from "./contact";

describe("surface contact configuration", () => {
  it("falls back to the active studio inbox until school addresses are live", () => {
    const school = getSurfaceContact("school");
    // Dedicated school mailboxes are declared but not yet active/approved.
    expect(SCHOOL_CONTACT_EMAILS.schools.active).toBe(false);
    expect(school.email).toBe(ACTIVE_STUDIO_EMAIL);
    expect(school.dedicated).toBe(false);
  });

  it("uses the active studio inbox on the studio surface", () => {
    const studio = getSurfaceContact("studio");
    expect(studio.email).toBe(ACTIVE_STUDIO_EMAIL);
  });

  it("builds an encoded mailto link", () => {
    const mailto = buildMailto(getSurfaceContact("school"));
    expect(mailto).toBe(
      `mailto:${ACTIVE_STUDIO_EMAIL}?subject=MetaPet%20School%20Pilot%20Enquiry`,
    );
  });
});

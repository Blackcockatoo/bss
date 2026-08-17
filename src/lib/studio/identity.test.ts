import { describe, expect, it } from "vitest";

import {
  SCHOOL_PITCH,
  STUDIO_HOME,
  STUDIO_PILLARS,
  STUDIO_ROSTER,
  STUDIO_ROUTE,
} from "./identity";
import {
  CHILD_SAFE_ROUTE_POLICIES,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";

describe("studio identity", () => {
  /**
   * The studio page carries the sponsored-artist roster, which links to
   * independent sites outside the studio's editorial control. It must never be
   * reachable from a classroom surface.
   */
  it("keeps the studio route outside every child-safe route policy", () => {
    const policyIds = Object.keys(
      CHILD_SAFE_ROUTE_POLICIES,
    ) as (keyof typeof CHILD_SAFE_ROUTE_POLICIES)[];

    for (const policyId of policyIds) {
      expect(
        isPathnameAllowedByPolicy(STUDIO_ROUTE, policyId),
        `${STUDIO_ROUTE} must not be allowed by the "${policyId}" policy`,
      ).toBe(false);
    }
  });

  it("gives every roster member an off-site https link and a unique id", () => {
    const ids = STUDIO_ROSTER.map((member) => member.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const member of STUDIO_ROSTER) {
      expect(member.href.startsWith("https://"), member.id).toBe(true);
      expect(member.quote.length, member.id).toBeGreaterThan(0);
    }
  });

  it("points studio pillars at real internal routes", () => {
    for (const pillar of STUDIO_PILLARS) {
      expect(pillar.href.startsWith("/"), pillar.title).toBe(true);
    }
  });

  /**
   * MetaPet School's funding language is enforced elsewhere
   * (`@/lib/schools/contribution`). This guards the consumer-side retelling
   * from drifting into trial or freemium framing, which is the exact
   * misreading the schools copy was rewritten to avoid.
   *
   * Naming those models to rule them out ("not a trial, not a freemium tier")
   * is the point of the copy, so the terms are allowed only when negated. A
   * plain substring ban would fail the very sentence doing the work.
   */
  it("only mentions trial or tier pricing in order to rule it out", () => {
    const pitch = [
      SCHOOL_PITCH.headline,
      ...SCHOOL_PITCH.body,
      ...SCHOOL_PITCH.proofPoints,
    ]
      .join(" ")
      .toLowerCase();

    const negatable = ["trial", "freemium", "paid tier", "licence"];

    for (const term of negatable) {
      for (const match of pitch.matchAll(new RegExp(term, "g"))) {
        const preceding = pitch.slice(0, match.index);
        expect(
          /\b(no|not|never)\b[\s\w]*$/.test(preceding),
          `"${term}" must only appear negated, at index ${match.index}`,
        ).toBe(true);
      }
    }

    // These have no legitimate negated form in this pitch.
    for (const forbidden of [
      "upgrade to",
      "per student price",
      "starting at",
      "request a quote",
    ]) {
      expect(pitch, `pitch must not say "${forbidden}"`).not.toContain(
        forbidden,
      );
    }

    expect(pitch).toContain("a$0");
    expect(pitch).toContain("permanently");
  });

  it("sends school traffic to the dedicated classroom domain", () => {
    expect(SCHOOL_PITCH.href).toBe("https://www.metapet.school");
    expect(SCHOOL_PITCH.reviewHref.startsWith("/")).toBe(true);
    expect(STUDIO_HOME.startsWith("https://")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import { PORTAL_DESCRIPTION, PORTAL_TAGLINE } from "@/lib/portalTruth";
import {
  ROUTE_PROGRESSION,
  ROUTE_PROGRESSION_SEQUENCE,
} from "@/lib/routeProgression";

function formatPortalLabel(label: string) {
  return label === label.toUpperCase() ? label : label.toLowerCase();
}

function joinWithOxfordComma(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function expectedPathSummary() {
  const labels = ROUTE_PROGRESSION_SEQUENCE.map((routeKey) =>
    formatPortalLabel(ROUTE_PROGRESSION[routeKey].shortLabel),
  );
  const [launch = "pet", ...next] = labels;

  return next.length > 0
    ? `Start with ${launch}, then review ${joinWithOxfordComma(next)}.`
    : `Start with ${launch}.`;
}

describe("portal truth", () => {
  it("uses the canonical core-profile tagline", () => {
    expect(PORTAL_TAGLINE).toBe(
      "Privacy-first digital learning companion for classrooms and families.",
    );
  });

  it("keeps the launch description anchored to the fixed privacy promise", () => {
    expect(PORTAL_DESCRIPTION).toBe(
      "Meta-Pet turns care, pattern learning, and digital responsibility into short guided activities. It runs browser-first and local-first: no ads, no trackers, no student accounts, and no unnecessary data collection. " +
        expectedPathSummary(),
    );
  });

  it("closes the launch description with a route-derived path summary", () => {
    expect(PORTAL_DESCRIPTION).toContain(expectedPathSummary());
    expect(PORTAL_DESCRIPTION.endsWith(".")).toBe(true);
  });
});

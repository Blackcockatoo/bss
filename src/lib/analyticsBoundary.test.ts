import { describe, expect, it } from "vitest";

import {
  ANALYTICS_EXCLUDED_PREFIXES,
  isAnalyticsAllowedPathname,
} from "./analyticsBoundary";
import {
  CHILD_SAFE_ROUTE_POLICIES,
  FIELD_MODE_HOME_PATH,
} from "./childSafeBaseline";

describe("analytics boundary", () => {
  it("never allows analytics on a Field Mode route", () => {
    expect(isAnalyticsAllowedPathname(FIELD_MODE_HOME_PATH)).toBe(false);
    expect(
      isAnalyticsAllowedPathname(`${FIELD_MODE_HOME_PATH}/lessons`),
    ).toBe(false);
    expect(
      isAnalyticsAllowedPathname(`${FIELD_MODE_HOME_PATH}/classroom`),
    ).toBe(false);
  });

  it("never allows analytics on any route the Field policy admits", () => {
    const fieldPolicy = CHILD_SAFE_ROUTE_POLICIES.field;
    const classroomRoutes = [...fieldPolicy.allowedExact].filter((route) =>
      route.startsWith("/schools") || route.startsWith("/school-game"),
    );

    expect(classroomRoutes.length).toBeGreaterThan(0);
    for (const route of classroomRoutes) {
      expect(isAnalyticsAllowedPathname(route)).toBe(false);
    }
  });

  it("never allows analytics on adult school or teacher surfaces", () => {
    for (const pathname of [
      "/schools",
      "/schools/contribute",
      "/schools/parents",
      "/schools/data",
      "/teachers",
      "/teachers/pilot",
      "/school-game",
      "/docs/schools-au/01-overview-and-alignment.md",
    ]) {
      expect(isAnalyticsAllowedPathname(pathname)).toBe(false);
    }
  });

  it("treats an unresolved pathname as excluded", () => {
    expect(isAnalyticsAllowedPathname(null)).toBe(false);
    expect(isAnalyticsAllowedPathname(undefined)).toBe(false);
    expect(isAnalyticsAllowedPathname("")).toBe(false);
  });

  it("still allows analytics on consumer routes", () => {
    for (const pathname of ["/", "/pet", "/app/wellness", "/pricing"]) {
      expect(isAnalyticsAllowedPathname(pathname)).toBe(true);
    }
  });

  it("does not exclude an unrelated route that merely shares a prefix string", () => {
    // `/schoolsomething` is not `/schools`; prefix matching must be segment
    // aware so the exclusion list stays honest about what it covers.
    expect(isAnalyticsAllowedPathname("/schoolsomething")).toBe(true);
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain("/schools");
  });
});

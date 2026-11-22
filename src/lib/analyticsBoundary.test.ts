import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  ANALYTICS_ALLOWED_PREFIXES,
  ANALYTICS_EXCLUDED_PREFIXES,
  isAnalyticsAllowedPathname,
} from "./analyticsBoundary";
import { getArcadeCrawlRoutes } from "./games/arcade";
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
      "/legal/privacy",
      "/legal/safety",
      "/legal/boundaries",
    ]) {
      expect(isAnalyticsAllowedPathname(pathname)).toBe(false);
    }
  });

  it("excludes companion and Forge learning surfaces", () => {
    expect(isAnalyticsAllowedPathname("/pet")).toBe(false);
    expect(isAnalyticsAllowedPathname("/project-forge")).toBe(false);
  });

  it("treats an unresolved pathname as excluded", () => {
    expect(isAnalyticsAllowedPathname(null)).toBe(false);
    expect(isAnalyticsAllowedPathname(undefined)).toBe(false);
    expect(isAnalyticsAllowedPathname("")).toBe(false);
  });

  it("allows analytics only on the adult marketing allowlist", () => {
    for (const pathname of ["/pricing", "/studio"]) {
      expect(isAnalyticsAllowedPathname(pathname), pathname).toBe(true);
    }
  });

  it("is off by default on every kid-facing consumer route", () => {
    for (const pathname of [
      "/",
      "/app",
      "/app/wellness",
      "/app/moss60",
      "/app/pet",
      "/app/battle",
      "/pet",
      "/shop",
      "/arcade",
      "/moss60",
      "/identity",
      "/digital-dna",
      "/dna-hub",
      "/genome-explorer",
      "/body-forge",
      "/geometry-sound",
      "/space-jewbles",
      "/monkey-invaders",
      "/qr-messaging",
      "/share/demo",
      "/legal",
      "/legal/terms",
      "/a-route-added-next-month",
    ]) {
      expect(isAnalyticsAllowedPathname(pathname), pathname).toBe(false);
    }
  });

  it("never allows analytics on any arcade route from the registry", () => {
    for (const route of getArcadeCrawlRoutes()) {
      expect(isAnalyticsAllowedPathname(route), route).toBe(false);
    }
  });

  it("allows analytics on no top-level app route outside the allowlist", () => {
    const appDir = path.resolve(__dirname, "../app");
    const topLevelRoutes = readdirSync(appDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith("(") && !name.startsWith("_") && name !== "api")
      .map((name) => `/${name}`);

    expect(topLevelRoutes.length).toBeGreaterThan(10);
    for (const route of topLevelRoutes) {
      const allowlisted = (ANALYTICS_ALLOWED_PREFIXES as readonly string[]).includes(route);
      expect(isAnalyticsAllowedPathname(route), route).toBe(allowlisted);
    }
  });

  it("never lets the allowlist overlap the exclusion list", () => {
    for (const allowed of ANALYTICS_ALLOWED_PREFIXES) {
      expect(
        (ANALYTICS_EXCLUDED_PREFIXES as readonly string[]).includes(allowed),
        allowed,
      ).toBe(false);
    }
  });

  it("matches allowlisted prefixes by path segment", () => {
    expect(isAnalyticsAllowedPathname("/pricingsomething")).toBe(false);
    expect(isAnalyticsAllowedPathname("/studiofake")).toBe(false);
    expect(isAnalyticsAllowedPathname("/studio/team")).toBe(true);
    expect(ANALYTICS_EXCLUDED_PREFIXES).toContain("/schools");
  });
});

import { describe, expect, it } from "vitest";

import {
  CHILD_SAFE_ROUTE_POLICIES,
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_NAV_ITEMS,
  getPolicyFallbackPathname,
  isPathnameAllowedByPolicy,
} from "@/lib/childSafeBaseline";
import { FIELD_MODE_INSTALL_ICON_PATHS } from "@/lib/fieldMode/pwa";

describe("declarative Field Mode route policy", () => {
  it("uses the Field entry as its safe fallback", () => {
    expect(CHILD_SAFE_ROUTE_POLICIES.field.id).toBe("field");
    expect(getPolicyFallbackPathname("field")).toBe(FIELD_MODE_HOME_PATH);
  });

  it("allows every visible Field navigation destination", () => {
    for (const item of FIELD_MODE_NAV_ITEMS) {
      expect(isPathnameAllowedByPolicy(item.href, "field"), item.href).toBe(true);
    }
  });

  it("allows approved classroom, evidence and safety routes", () => {
    for (const pathname of [
      "/schools",
      "/schools/field",
      "/schools/field/lessons/meet-your-metapet",
      "/schools/field/classroom",
      "/schools/field/passport",
      "/schools/field/review",
      "/schools/field/offline",
      "/schools/field/guide",
      "/schools/field/safety",
      "/schools/field/pack.json",
      "/schools/field/print/build-a-body",
      "/sw.js",
      "/school-game",
      "/schools/docs/teacher-guide",
      "/docs/schools-au/02-lesson-cards.md",
      "/schools/parents",
      "/schools/safeguarding",
      "/legal/privacy",
    ]) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(true);
    }
  });

  it("allows every dedicated MetaPet.school install icon", () => {
    for (const pathname of FIELD_MODE_INSTALL_ICON_PATHS) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(true);
      expect(isPathnameAllowedByPolicy(pathname, "schools"), pathname).toBe(
        true,
      );
    }
  });

  it("blocks consumer and unrestricted teacher route categories", () => {
    for (const pathname of [
      "/shop",
      "/wallet",
      "/marketplace",
      "/breeding",
      "/identity",
      "/qr-messaging",
      "/rituals",
      "/alchemist",
      "/digital-dna",
      "/app/laboratory",
      "/social",
      "/share",
      "/teachers",
      "/teachers/passport",
      "/manifest.webmanifest",
      "/robots.txt",
      "/sitemap.xml",
    ]) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(false);
    }
  });

  it("does not turn the Field namespace into an unrestricted prefix", () => {
    expect(isPathnameAllowedByPolicy("/schools/field/shop", "field")).toBe(false);
    expect(isPathnameAllowedByPolicy("/schools/field/social", "field")).toBe(false);
  });
});

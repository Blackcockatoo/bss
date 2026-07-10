import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ALL_LIBRARY_ENTRIES, LIBRARY_SHELVES } from "./siteLibrary";

describe("site library", () => {
  it("has unique hrefs across all shelves", () => {
    const hrefs = ALL_LIBRARY_ENTRIES.map((entry) => entry.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every entry points at a real app route", () => {
    const appDir = join(process.cwd(), "src", "app");
    for (const entry of ALL_LIBRARY_ENTRIES) {
      const routeDir = join(appDir, ...entry.href.split("/").filter(Boolean));
      expect(
        existsSync(join(routeDir, "page.tsx")),
        `${entry.href} should have a page at ${routeDir}/page.tsx`,
      ).toBe(true);
    }
  });

  it("every shelf has a title, blurb, accent, and at least one entry", () => {
    for (const shelf of LIBRARY_SHELVES) {
      expect(shelf.title.length).toBeGreaterThan(0);
      expect(shelf.blurb.length).toBeGreaterThan(0);
      expect(shelf.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(shelf.entries.length).toBeGreaterThan(0);
    }
  });

  it("the school shelf stays fully teacher-visible", () => {
    const school = LIBRARY_SHELVES.find((shelf) => shelf.id === "school");
    expect(school).toBeDefined();
    for (const entry of school?.entries ?? []) {
      expect(entry.teacherVisible, `${entry.href} should be teacherVisible`).toBe(true);
    }
  });

  it("descriptions stay short enough to scan like a catalog card", () => {
    for (const entry of ALL_LIBRARY_ENTRIES) {
      expect(entry.description.length).toBeLessThanOrEqual(140);
    }
  });
});

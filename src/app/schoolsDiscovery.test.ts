import { afterEach, describe, expect, it, vi } from "vitest";

const hostMock = vi.hoisted(() => ({ value: "" }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: hostMock.value }),
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { METAPET_SCHOOL_ORIGIN } from "@/lib/fieldMode/identity";

function setHost(host: string) {
  hostMock.value = host;
}

afterEach(() => {
  hostMock.value = "";
  vi.unstubAllEnvs();
});

describe("robots.txt per public domain", () => {
  it("points metapet.school at its own sitemap, not Blue $nake Studio", async () => {
    setHost("www.metapet.school");
    const result = await robots();

    expect(result.sitemap).toBe(`${METAPET_SCHOOL_ORIGIN}/sitemap.xml`);
    expect(JSON.stringify(result)).not.toMatch(/bluesnakestudios/i);
  });

  it("keeps crawlers off consumer routes the classroom host redirects away", async () => {
    setHost("metapet.school");
    const result = await robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule?.disallow;

    expect(disallow).toContain("/shop");
    expect(disallow).toContain("/pet");
    expect(disallow).toContain("/api/");
  });

  it("leaves the Blue $nake Studio host unrestricted", async () => {
    setHost("www.bluesnakestudios.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.bluesnakestudios.com");
    const result = await robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rule?.disallow).toBeUndefined();
    expect(result.sitemap).toBe("https://www.bluesnakestudios.com/sitemap.xml");
  });
});

describe("sitemap.xml per public domain", () => {
  it("indexes the classroom product on the classroom domain", async () => {
    setHost("www.metapet.school");
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain(`${METAPET_SCHOOL_ORIGIN}/schools/field`);
    expect(urls).toContain(`${METAPET_SCHOOL_ORIGIN}/schools/field/lessons`);
    expect(urls.every((url) => url.startsWith(METAPET_SCHOOL_ORIGIN))).toBe(true);
  });

  it("never advertises routes the classroom host blocks", async () => {
    setHost("www.metapet.school");
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const blocked of ["/shop", "/pet", "/identity", "/genome-explorer"]) {
      expect(urls).not.toContain(`${METAPET_SCHOOL_ORIGIN}${blocked}`);
    }
  });

  it("lists every classroom lesson so they can be found individually", async () => {
    setHost("www.metapet.school");
    const { LESSON_DEFINITIONS } = await import(
      "@/lib/teacher-lessons/lessonDefinitions"
    );
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));

    expect(LESSON_DEFINITIONS.length).toBeGreaterThan(0);
    for (const lesson of LESSON_DEFINITIONS) {
      expect(
        urls.has(`${METAPET_SCHOOL_ORIGIN}/schools/field/lessons/${lesson.slug}`),
      ).toBe(true);
    }
  });

  it("still serves the full product index on Blue $nake Studio", async () => {
    setHost("www.bluesnakestudios.com");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.bluesnakestudios.com");
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://www.bluesnakestudios.com/pet");
    expect(urls).toContain("https://www.bluesnakestudios.com/schools");
  });
});

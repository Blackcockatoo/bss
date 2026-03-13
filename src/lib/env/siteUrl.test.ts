import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl, getSiteUrlObject } from "./siteUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com/");
    vi.stubEnv("NODE_ENV", "production");

    expect(getSiteUrl()).toBe("https://example.com");
    expect(getSiteUrlObject().toString()).toBe("https://example.com/");
  });

  it("falls back to Vercel production url in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "bss.example.vercel.app");

    expect(getSiteUrl()).toBe("https://bss.example.vercel.app");
  });

  it("uses localhost in non-production without env", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when no site url is available", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getSiteUrl()).toThrow(
      "NEXT_PUBLIC_SITE_URL must be set in production when no deployment URL is available.",
    );
  });
});

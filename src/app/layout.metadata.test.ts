import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadLayout(isSchoolsProfile: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/env/features", () => ({
    IS_SCHOOLS_PROFILE: isSchoolsProfile,
  }));
  vi.doMock("@/lib/env/siteUrl", () => ({
    findSiteUrl: () =>
      isSchoolsProfile
        ? "https://schools.example.com"
        : "https://core.example.com",
    findSiteUrlObject: () =>
      new URL(
        isSchoolsProfile
          ? "https://schools.example.com"
          : "https://core.example.com",
      ),
  }));
  vi.doMock("./ClientBody", () => ({
    default: ({ children }: { children: ReactNode }) => children,
  }));

  return import("./layout");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env/features");
  vi.doUnmock("@/lib/env/siteUrl");
  vi.doUnmock("./ClientBody");
});

describe("layout metadata", () => {
  it("uses MetaPet Schools metadata in the schools profile", async () => {
    const { metadata } = await loadLayout(true);
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("MetaPet Schools");
    expect(metadata.description).toMatch(/teacher-led, low-data classroom tool/i);
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(appleWebApp?.title).toBe("MetaPet Schools");
    expect(metadata.openGraph?.siteName).toBe("MetaPet Schools");
  });

  it("keeps Blue Snake Studios metadata in the core profile", async () => {
    const { metadata } = await loadLayout(false);
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("Blue Snake Studios");
    expect(appleWebApp?.title).toBe("Blue Snake Studios");
    expect(metadata.openGraph?.siteName).toBe("Blue Snake Studios");
  });
});

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FIELD_MODE_APPLE_TOUCH_ICON_PATH,
  FIELD_MODE_ICON_192_PATH,
} from "@/lib/fieldMode/pwa";

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
  it("uses MetaPet School metadata in the schools profile", async () => {
    const { metadata } = await loadLayout(true);
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("MetaPet School");
    expect(metadata.description).toMatch(/teacher-led, local-first classroom tool/i);
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.icons).toMatchObject({
      icon: FIELD_MODE_ICON_192_PATH,
      apple: FIELD_MODE_APPLE_TOUCH_ICON_PATH,
    });
    expect(appleWebApp?.title).toBe("MetaPet School");
    expect(metadata.openGraph?.siteName).toBe("MetaPet School");
  });

  it("keeps Blue $nake Studio metadata in the core profile", async () => {
    const { metadata } = await loadLayout(false);
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("Blue $nake Studio");
    expect(metadata.icons).toMatchObject({
      icon: "/icon.svg",
      apple: "/icon.svg",
    });
    expect(appleWebApp?.title).toBe("Blue $nake Studio");
    expect(metadata.openGraph?.siteName).toBe("Blue $nake Studio");
  });
});

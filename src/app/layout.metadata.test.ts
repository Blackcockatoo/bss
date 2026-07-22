import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProductSurface } from "@/lib/domain/surface";

async function loadLayout(surface: ProductSurface) {
  vi.resetModules();
  vi.doMock("@/lib/domain/serverSurface", () => ({
    resolveServerSurface: async () => surface,
  }));
  vi.doMock("@/lib/env/siteUrl", () => ({
    findSiteUrl: () => "https://fallback.example.com",
    findSiteUrlObject: () => new URL("https://fallback.example.com"),
  }));
  vi.doMock("./ClientBody", () => ({
    default: ({ children }: { children: ReactNode }) => children,
  }));

  return import("./layout");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/domain/serverSurface");
  vi.doUnmock("@/lib/env/siteUrl");
  vi.doUnmock("./ClientBody");
});

describe("layout metadata", () => {
  it("uses MetaPet School metadata and canonical domain on the school surface", async () => {
    const { generateMetadata } = await loadLayout("school");
    const metadata = await generateMetadata();
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("MetaPet School");
    expect(metadata.description).toMatch(/australian classroom/i);
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(appleWebApp?.title).toBe("MetaPet School");
    expect(metadata.openGraph?.siteName).toBe("MetaPet School");
    expect(metadata.metadataBase?.toString()).toBe("https://metapet.school/");
    expect(metadata.openGraph?.url?.toString()).toBe("https://metapet.school/");
  });

  it("keeps Blue Snake Studios metadata and canonical domain on the studio surface", async () => {
    const { generateMetadata } = await loadLayout("studio");
    const metadata = await generateMetadata();
    const appleWebApp =
      metadata.appleWebApp && typeof metadata.appleWebApp !== "boolean"
        ? metadata.appleWebApp
        : null;

    expect(metadata.title).toBe("Blue Snake Studios");
    expect(appleWebApp?.title).toBe("Blue Snake Studios");
    expect(metadata.openGraph?.siteName).toBe("Blue Snake Studios");
    expect(metadata.metadataBase?.toString()).toBe(
      "https://www.bluesnakestudios.com/",
    );
  });
});

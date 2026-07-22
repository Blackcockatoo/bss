import { afterEach, describe, expect, it, vi } from "vitest";

import type { ProductSurface } from "@/lib/domain/surface";

async function loadManifest(surface: ProductSurface) {
  vi.resetModules();
  vi.doMock("@/lib/domain/serverSurface", () => ({
    resolveServerSurface: async () => surface,
  }));

  return (await import("./manifest")).default;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/domain/serverSurface");
});

describe("app manifest", () => {
  it("emits a school-safe manifest on the school surface", async () => {
    const manifest = await loadManifest("school");
    const result = await manifest();

    expect(result.name).toBe("MetaPet School");
    expect(result.short_name).toBe("MetaPet School");
    // Clean school-native start URL, not the internal /schools path.
    expect(result.start_url).toBe("/");
    expect(result.description).toMatch(/classroom/i);
    expect(result.description).not.toMatch(/genome|evolution/i);
  });

  it("keeps the consumer manifest on the studio surface", async () => {
    const manifest = await loadManifest("studio");
    const result = await manifest();

    expect(result.name).toBe("Meta-Pet");
    expect(result.start_url).toBe("/");
    expect(result.description).toMatch(/genome-based evolution/i);
  });
});

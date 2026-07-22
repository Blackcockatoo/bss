import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
  FIELD_MODE_MASKABLE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

async function loadManifest(isSchoolsProfile: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/env/features", () => ({
    IS_SCHOOLS_PROFILE: isSchoolsProfile,
  }));

  return (await import("./manifest")).default;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env/features");
});

describe("app manifest", () => {
  it("emits a school-safe manifest in the schools profile", async () => {
    const manifest = await loadManifest(true);
    const result = manifest();

    expect(result.name).toBe("MetaPet Schools");
    expect(result.short_name).toBe("MetaPet Schools");
    expect(result.start_url).toBe("/schools");
    expect(result.description).toMatch(/teacher-led/i);
    expect(result.description).not.toMatch(/genome|evolution/i);
    expect(result.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: FIELD_MODE_ICON_192_PATH,
          sizes: "192x192",
          purpose: "any",
        }),
        expect.objectContaining({
          src: FIELD_MODE_ICON_512_PATH,
          sizes: "512x512",
          purpose: "any",
        }),
        expect.objectContaining({
          src: FIELD_MODE_MASKABLE_ICON_512_PATH,
          sizes: "512x512",
          purpose: "maskable",
        }),
      ]),
    );
  });

  it("keeps the consumer manifest in the core profile", async () => {
    const manifest = await loadManifest(false);
    const result = manifest();

    expect(result.name).toBe("Meta-Pet");
    expect(result.start_url).toBe("/");
    expect(result.description).toMatch(/genome-based evolution/i);
    expect(result.icons?.[0]?.src).toBe("/icon.svg");
  });
});

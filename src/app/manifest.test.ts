import { afterEach, describe, expect, it, vi } from "vitest";

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
  });

  it("keeps the consumer manifest in the core profile", async () => {
    const manifest = await loadManifest(false);
    const result = manifest();

    expect(result.name).toBe("Meta-Pet");
    expect(result.start_url).toBe("/");
    expect(result.description).toMatch(/genome-based evolution/i);
  });
});

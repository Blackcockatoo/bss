import { afterEach, describe, expect, it, vi } from "vitest";

async function loadChildSafeBaseline(isSchoolsProfile: boolean) {
  vi.resetModules();
  vi.doMock("@/lib/env/features", () => ({
    IS_SCHOOLS_PROFILE: isSchoolsProfile,
  }));

  return import("./childSafeBaseline");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env/features");
});

describe("child-safe route boundary", () => {
  it("keeps the core allowlist limited to the core child-safe routes", async () => {
    const childSafe = await loadChildSafeBaseline(false);

    expect(childSafe.isChildSafeAllowedPathname("/app")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/pet")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/docs/example")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/schools")).toBe(false);
    expect(childSafe.isChildSafeAllowedPathname("/identity")).toBe(false);
    expect(childSafe.getChildSafeFallbackPathname("/docs/example")).toBe(
      "/legal",
    );
    expect(childSafe.getChildSafeFallbackPathname("/identity")).toBe("/app");
    expect([...childSafe.CHILD_SAFE_NAV_ROUTES]).toEqual([
      "/",
      "/pet",
      "/school-game",
    ]);
  });

  it("keeps the schools allowlist constrained to the school deployment", async () => {
    const childSafe = await loadChildSafeBaseline(true);

    expect(childSafe.isChildSafeAllowedPathname("/")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/schools")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/school-game")).toBe(true);
    expect(childSafe.isChildSafeAllowedPathname("/legal/privacy")).toBe(true);
    expect(
      childSafe.isChildSafeAllowedPathname(
        "/docs/schools-au/governance/privacy-policy.md",
      ),
    ).toBe(
      true,
    );
    expect(childSafe.isChildSafeAllowedPathname("/app")).toBe(false);
    expect(childSafe.isChildSafeAllowedPathname("/pet")).toBe(false);
    expect(childSafe.isChildSafeAllowedPathname("/identity")).toBe(false);
    expect(childSafe.isChildSafeAllowedPathname("/genome-resonance")).toBe(
      false,
    );
    expect(childSafe.getChildSafeFallbackPathname("/pet")).toBe("/schools");
    expect([...childSafe.CHILD_SAFE_NAV_ROUTES]).toEqual([
      "/schools",
      "/school-game",
      "/legal/privacy",
    ]);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE, FIELD_MODE_HOME_PATH, isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

afterEach(() => { vi.resetModules(); vi.doUnmock("@/lib/env/features"); });

describe("observatory route compatibility", () => {
  it("remains outside the schools and Field Mode allowlists", () => {
    for (const policy of ["schools", "field"] as const) expect(isPathnameAllowedByPolicy("/app/moss60-lab", policy)).toBe(false);
  });

  it("lets the consumer route through and redirects school hosts and Field cookies", async () => {
    vi.doMock("@/lib/env/features", () => ({ APP_PROFILE: "core", IS_SCHOOLS_PROFILE: false, ENFORCE_CHILD_SAFE_BOUNDARY: false }));
    const { proxy } = await import("@/proxy");
    expect(proxy(new NextRequest("https://www.bluesnakestudios.com/app/moss60-lab")).headers.get("location")).toBeNull();
    const school = proxy(new NextRequest("https://metapet.school/app/moss60-lab"));
    expect(new URL(school.headers.get("location")!).pathname).toBe(FIELD_MODE_HOME_PATH);
    const request = new NextRequest("https://www.bluesnakestudios.com/app/moss60-lab");
    request.cookies.set(FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE);
    expect(new URL(proxy(request).headers.get("location")!).pathname).toBe(FIELD_MODE_HOME_PATH);
  });

  it("redirects the route under the schools build profile", async () => {
    vi.doMock("@/lib/env/features", () => ({ APP_PROFILE: "schools", IS_SCHOOLS_PROFILE: true, ENFORCE_CHILD_SAFE_BOUNDARY: true }));
    const { proxy } = await import("@/proxy");
    const response = proxy(new NextRequest("https://example.com/app/moss60-lab"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).not.toContain("moss60-lab");
  });
});

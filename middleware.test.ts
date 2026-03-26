import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AppProfile = "schools" | "core";

async function loadMiddleware(profile: AppProfile) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE = "";

  const mockFeatures = {
    APP_PROFILE: profile,
    IS_SCHOOLS_PROFILE: profile === "schools",
  };

  vi.doMock("./src/lib/env/features", () => mockFeatures);
  vi.doMock("@/lib/env/features", () => mockFeatures);

  return import("./middleware");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("./src/lib/env/features");
  vi.doUnmock("@/lib/env/features");
  delete process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE;
});

describe("middleware school profile boundary", () => {
  it("redirects the school profile root to /schools", async () => {
    const { middleware } = await loadMiddleware("schools");

    const response = middleware(new NextRequest("https://example.com/"));

    expect(response.headers.get("location")).toBe(
      "https://example.com/schools",
    );
  });

  it("redirects blocked school profile routes back to /schools", async () => {
    const { middleware } = await loadMiddleware("schools");

    for (const pathname of [
      "/pet",
      "/app",
      "/app/moss60",
      "/identity",
      "/moss60",
      "/digital-dna",
      "/pricing",
      "/shop",
    ]) {
      const response = middleware(
        new NextRequest(`https://example.com${pathname}`),
      );

      expect(response.headers.get("location")).toBe(
        "https://example.com/schools",
      );
    }
  });

  it("keeps allowed school profile routes inside the schools deployment", async () => {
    const { middleware } = await loadMiddleware("schools");

    for (const pathname of [
      "/schools",
      "/school-game",
      "/schools/docs/privacy-policy",
      "/legal/privacy",
      "/manifest.webmanifest",
    ]) {
      const response = middleware(
        new NextRequest(`https://example.com${pathname}`),
      );

      expect(response.headers.get("location")).toBeNull();
    }
  });
});

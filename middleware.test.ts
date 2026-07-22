import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AppProfile = "schools" | "core";

type MiddlewareEnvironment = {
  siteUrl?: string;
  vercelEnv?: string;
};

async function loadMiddleware(
  profile: AppProfile,
  environment: MiddlewareEnvironment = {},
) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_CHILD_SAFE_BASELINE = "";

  if (environment.siteUrl) {
    process.env.NEXT_PUBLIC_SITE_URL = environment.siteUrl;
  } else {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (environment.vercelEnv) {
    process.env.VERCEL_ENV = environment.vercelEnv;
  } else {
    delete process.env.VERCEL_ENV;
  }

  const mockFeatures = {
    APP_PROFILE: profile,
    IS_SCHOOLS_PROFILE: profile === "schools",
    // Baseline flag is cleared above, so the boundary is enforced iff the
    // schools profile is active (mirrors ENFORCE_CHILD_SAFE_BOUNDARY).
    ENFORCE_CHILD_SAFE_BOUNDARY: profile === "schools",
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
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_ENV;
});

describe("middleware canonical BSS origin", () => {
  it("redirects the bare production domain to the canonical www origin", async () => {
    const { middleware } = await loadMiddleware("core");

    const response = middleware(
      new NextRequest("https://bluesnakestudios.com/body-forge?mode=live"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bluesnakestudios.com/body-forge?mode=live",
    );
  });

  it("redirects production Vercel aliases to the configured canonical origin", async () => {
    const { middleware } = await loadMiddleware("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });

    const response = middleware(
      new NextRequest("https://bss-l8cw.vercel.app/app/activities?tab=vimana"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bluesnakestudios.com/app/activities?tab=vimana",
    );
  });

  it("keeps the canonical host and preview deployments available", async () => {
    const canonical = await loadMiddleware("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });

    expect(
      canonical.middleware(
        new NextRequest("https://www.bluesnakestudios.com/body-forge"),
      ).headers.get("location"),
    ).toBeNull();

    const preview = await loadMiddleware("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "preview",
    });

    expect(
      preview.middleware(
        new NextRequest("https://bss-git-feature.vercel.app/body-forge"),
      ).headers.get("location"),
    ).toBeNull();
  });

  it("does not force school deployments onto the core BSS domain", async () => {
    const { middleware } = await loadMiddleware("schools", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });

    const response = middleware(new NextRequest("https://school-pilot.vercel.app/"));

    expect(response.headers.get("location")).toBe(
      "https://school-pilot.vercel.app/schools",
    );
  });
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

  it("blocks non-allowlisted API routes with an opaque 404 instead of a redirect", async () => {
    const { middleware } = await loadMiddleware("schools");

    for (const pathname of [
      "/api/genome-resonance/simulate",
      "/api/genome-resonance/explain",
      "/api/genome/sonify/pet-123",
    ]) {
      const response = middleware(
        new NextRequest(`https://example.com${pathname}`),
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("location")).toBeNull();
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

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_UI_COOKIE,
} from "@/lib/childSafeBaseline";

type AppProfile = "schools" | "core";

type ProxyEnvironment = {
  siteUrl?: string;
  vercelEnv?: string;
  enforceBoundary?: boolean;
};

async function loadProxy(
  profile: AppProfile,
  environment: ProxyEnvironment = {},
) {
  vi.resetModules();

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
    ENABLE_CHILD_SAFE_BASELINE: profile === "schools",
    ENFORCE_CHILD_SAFE_BOUNDARY:
      environment.enforceBoundary ?? profile === "schools",
  };

  vi.doMock("@/lib/env/features", () => mockFeatures);
  return import("./src/proxy");
}

async function fieldRequest(pathname: string): Promise<NextRequest> {
  const { NextRequest: RuntimeNextRequest } = await import("next/server");
  const request = new RuntimeNextRequest(`https://example.com${pathname}`);
  request.cookies.set(FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE);
  return request;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/lib/env/features");
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_ENV;
});

describe("proxy canonical BSS origin", () => {
  it("redirects the bare production domain to the canonical www origin", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(
      new NextRequest("https://bluesnakestudios.com/body-forge?mode=live"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bluesnakestudios.com/body-forge?mode=live",
    );
  });

  it("redirects production Vercel aliases to the configured canonical origin", async () => {
    const { proxy } = await loadProxy("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });
    const response = proxy(
      new NextRequest("https://bss-l8cw.vercel.app/app/activities?tab=vimana"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bluesnakestudios.com/app/activities?tab=vimana",
    );
  });

  it("keeps the canonical host and preview deployments available", async () => {
    const canonical = await loadProxy("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });
    expect(
      canonical.proxy(
        new NextRequest("https://www.bluesnakestudios.com/body-forge"),
      ).headers.get("location"),
    ).toBeNull();

    const preview = await loadProxy("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "preview",
    });
    expect(
      preview.proxy(
        new NextRequest("https://bss-git-feature.vercel.app/body-forge"),
      ).headers.get("location"),
    ).toBeNull();
  });
});

describe("proxy school profile boundary", () => {
  it("redirects the school profile root to /schools", async () => {
    const { proxy } = await loadProxy("schools");
    const response = proxy(new NextRequest("https://example.com/"));
    expect(response.headers.get("location")).toBe(
      "https://example.com/schools",
    );
  });

  it("redirects blocked school routes and denies blocked APIs", async () => {
    const { proxy } = await loadProxy("schools");
    for (const pathname of [
      "/pet",
      "/app",
      "/identity",
      "/digital-dna",
      "/pricing",
      "/shop",
    ]) {
      expect(
        proxy(new NextRequest(`https://example.com${pathname}`)).headers.get(
          "location",
        ),
      ).toBe("https://example.com/schools");
    }

    const apiResponse = proxy(
      new NextRequest("https://example.com/api/wallet"),
    );
    expect(apiResponse.status).toBe(404);
    await expect(apiResponse.json()).resolves.toEqual({ error: "not_found" });
  });

  it("keeps approved school and teacher routes available", async () => {
    const { proxy } = await loadProxy("schools");
    for (const pathname of [
      "/schools",
      "/schools/field",
      "/school-game",
      "/teachers",
      "/teachers/lessons/meet-your-metapet",
      "/schools/docs/privacy-policy",
      "/legal/privacy",
      "/manifest.webmanifest",
    ]) {
      expect(
        proxy(new NextRequest(`https://example.com${pathname}`)).headers.get(
          "location",
        ),
      ).toBeNull();
    }
  });
});

describe("proxy Field Mode boundary", () => {
  it("activates Field Mode when its entry route is opened", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(
      new NextRequest("https://example.com/schools/field"),
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get(FIELD_MODE_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
    expect(response.cookies.get(FIELD_MODE_UI_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
  });

  it("keeps approved Field routes accessible after activation", async () => {
    const { proxy } = await loadProxy("core");
    for (const pathname of [
      "/schools/field",
      "/schools/field/lessons",
      "/schools/field/lessons/build-a-body",
      "/schools/field/classroom",
      "/schools/field/passport",
      "/schools/field/review",
      "/schools/field/offline",
      "/schools/field/guide",
      "/schools/field/safety",
      "/schools/field/pack.json",
      "/schools/field/print/build-a-body",
      "/sw.js",
      "/school-game",
      "/schools/docs/teacher-guide",
      "/schools/safeguarding",
      "/legal/privacy",
    ]) {
      expect(
        proxy(await fieldRequest(pathname)).headers.get("location"),
      ).toBeNull();
    }
  });

  it("redirects direct consumer URLs to the Field fallback", async () => {
    const { proxy } = await loadProxy("core");
    for (const pathname of [
      "/shop",
      "/wallet",
      "/marketplace",
      "/breeding",
      "/identity",
      "/qr",
      "/rituals",
      "/alchemist",
      "/digital-dna",
      "/teachers",
    ]) {
      const request = await fieldRequest(pathname);
      expect(
        proxy(request).headers.get("location"),
        pathname,
      ).toBe(
        "https://example.com/schools/field",
      );
    }
  });

  it("adds the presentation marker on approved support routes for an active Field session", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(await fieldRequest("/legal/privacy"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(FIELD_MODE_UI_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
  });

  it("denies direct API entry with an opaque 404", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(await fieldRequest("/api/marketplace/listings"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("does not restrict normal MetaPet before Field Mode is active", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(new NextRequest("https://example.com/shop"));
    expect(response.headers.get("location")).toBeNull();
  });
});

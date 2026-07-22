import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type AppProfile = "schools" | "core";

type MiddlewareEnvironment = {
  siteUrl?: string;
  vercelEnv?: string;
  devSurface?: string;
};

async function loadMiddleware(
  profile: AppProfile = "core",
  environment: MiddlewareEnvironment = {},
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

  if (environment.devSurface) {
    process.env.NEXT_PUBLIC_DEV_SURFACE = environment.devSurface;
  } else {
    delete process.env.NEXT_PUBLIC_DEV_SURFACE;
  }

  const mockFeatures = {
    APP_PROFILE: profile,
    IS_SCHOOLS_PROFILE: profile === "schools",
  };

  vi.doMock("./src/lib/env/features", () => mockFeatures);
  vi.doMock("@/lib/env/features", () => mockFeatures);

  return import("./middleware");
}

function rewriteTarget(response: Response): string | null {
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (!rewrite) return null;
  return new URL(rewrite).pathname;
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("./src/lib/env/features");
  vi.doUnmock("@/lib/env/features");
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PUBLIC_DEV_SURFACE;
});

describe("surface resolution by hostname", () => {
  it("tags every response with the resolved surface", async () => {
    const { middleware, SURFACE_HEADER } = await loadMiddleware();

    const school = middleware(new NextRequest("https://metapet.school/"));
    expect(school.headers.get(SURFACE_HEADER)).toBe("school");

    const studio = middleware(
      new NextRequest("https://www.bluesnakestudios.com/pet"),
    );
    expect(studio.headers.get(SURFACE_HEADER)).toBe("studio");
  });

  it("resolves www variants of both domains", async () => {
    const { middleware } = await loadMiddleware();

    // www.metapet.school "/" rewrites to the internal school landing.
    const school = middleware(
      new NextRequest("https://www.metapet.school/"),
    );
    expect(rewriteTarget(school)).toBe("/schools");

    // www studio host serves the consumer app directly.
    const studio = middleware(
      new NextRequest("https://www.bluesnakestudios.com/pet"),
    );
    expect(studio.headers.get("location")).toBeNull();
    expect(rewriteTarget(studio)).toBeNull();
  });
});

describe("school domain routing", () => {
  it("rewrites clean school URLs to internal implementations", async () => {
    const { middleware } = await loadMiddleware();

    expect(rewriteTarget(middleware(new NextRequest("https://metapet.school/")))).toBe(
      "/schools",
    );
    expect(
      rewriteTarget(middleware(new NextRequest("https://metapet.school/field"))),
    ).toBe("/schools/field");
    expect(
      rewriteTarget(middleware(new NextRequest("https://metapet.school/start"))),
    ).toBe("/school-game");
  });

  it("redirects blocked consumer routes to the school home", async () => {
    const { middleware } = await loadMiddleware();

    for (const pathname of [
      "/wallet",
      "/body-forge",
      "/breeding",
      "/shop",
      "/identity",
      "/digital-dna",
      "/pet",
    ]) {
      const response = middleware(
        new NextRequest(`https://metapet.school${pathname}`),
      );
      expect(response.headers.get("location")).toBe("https://metapet.school/");
    }
  });

  it("keeps internally-supported school routes reachable", async () => {
    const { middleware } = await loadMiddleware();

    for (const pathname of [
      "/schools/docs/privacy-policy",
      "/school-game",
      "/legal/privacy",
      "/manifest.webmanifest",
    ]) {
      const response = middleware(
        new NextRequest(`https://metapet.school${pathname}`),
      );
      expect(response.headers.get("location")).toBeNull();
      expect(rewriteTarget(response)).toBeNull();
    }
  });
});

describe("studio domain routing", () => {
  it("serves the full ecosystem", async () => {
    const { middleware } = await loadMiddleware();

    for (const pathname of ["/pet", "/body-forge", "/wallet", "/identity"]) {
      const response = middleware(
        new NextRequest(`https://www.bluesnakestudios.com${pathname}`),
      );
      expect(response.headers.get("location")).toBeNull();
      expect(rewriteTarget(response)).toBeNull();
    }
  });

  it("redirects old public school URLs to the school domain", async () => {
    const { middleware } = await loadMiddleware();

    expect(
      middleware(
        new NextRequest("https://www.bluesnakestudios.com/schools"),
      ).headers.get("location"),
    ).toBe("https://metapet.school/");

    expect(
      middleware(
        new NextRequest("https://www.bluesnakestudios.com/schools/field"),
      ).headers.get("location"),
    ).toBe("https://metapet.school/field");
  });

  it("redirects the bare production domain to the canonical www origin", async () => {
    const { middleware } = await loadMiddleware();

    const response = middleware(
      new NextRequest("https://bluesnakestudios.com/body-forge?mode=live"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.bluesnakestudios.com/body-forge?mode=live",
    );
  });

  it("redirects production Vercel aliases to the canonical origin", async () => {
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
});

describe("build-time school profile override", () => {
  it("forces the school surface on any host", async () => {
    const { middleware } = await loadMiddleware("schools");

    const home = middleware(new NextRequest("https://school-pilot.vercel.app/"));
    expect(rewriteTarget(home)).toBe("/schools");

    const blocked = middleware(
      new NextRequest("https://school-pilot.vercel.app/pet"),
    );
    expect(blocked.headers.get("location")).toBe(
      "https://school-pilot.vercel.app/",
    );
  });
});

describe("developer surface override", () => {
  it("allows a query override outside production", async () => {
    const { middleware } = await loadMiddleware();

    // Studio host, dev-only school override → school routing applies.
    const response = middleware(
      new NextRequest("https://localhost:3000/wallet?surface=school"),
    );
    expect(response.headers.get("location")).toBe("https://localhost:3000/");
  });

  it("refuses the query override in production (no safety bypass)", async () => {
    const { middleware } = await loadMiddleware("schools", {
      vercelEnv: "production",
    });

    // School surface forced; a query cannot switch it to studio to reach /wallet.
    const response = middleware(
      new NextRequest("https://metapet.school/wallet?surface=studio"),
    );
    expect(response.headers.get("location")).toBe("https://metapet.school/");
  });
});

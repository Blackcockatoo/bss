import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_UI_COOKIE,
} from "@/lib/childSafeBaseline";
import { FIELD_MODE_INSTALL_ICON_PATHS } from "@/lib/fieldMode/pwa";

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

describe("MetaPet.school hostname boundary", () => {
  it("sends the school-domain root directly to Field Mode", async () => {
    const { proxy } = await loadProxy("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });
    const response = proxy(new NextRequest("https://www.metapet.school/"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.metapet.school/schools/field",
    );
  });

  it("identifies the school domain from proxy headers, not just the parsed URL", async () => {
    const { proxy } = await loadProxy("core");

    // Behind a proxy the parsed URL carries the internal origin. If the
    // forwarded host were ignored, metapet.school visitors would be served the
    // full consumer product instead of the classroom boundary.
    const forwarded = proxy(
      new NextRequest("https://internal.example.com/pet", {
        headers: { "x-forwarded-host": "www.metapet.school" },
      }),
    );
    expect(forwarded.headers.get("location")).toContain("/schools/field");

    // `Host` is a forbidden header name in the Request constructor, so the
    // bare host-header fallback cannot be exercised here; it is covered by the
    // running server instead.
  });

  it("keeps redirects on the public host instead of an internal origin", async () => {
    const { proxy } = await loadProxy("core");

    const response = proxy(
      new NextRequest("http://internal.example.com/pet", {
        headers: {
          "x-forwarded-host": "www.metapet.school",
          "x-forwarded-proto": "https",
        },
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://www.metapet.school/schools/field",
    );
  });

  it("ignores a port and proxy chain when matching the school domain", async () => {
    const { proxy } = await loadProxy("core");

    const response = proxy(
      new NextRequest("https://internal.example.com/pet", {
        headers: {
          "x-forwarded-host": "www.metapet.school:443, internal.example.com",
        },
      }),
    );
    expect(response.headers.get("location")).toContain("/schools/field");
  });

  it("enforces Field Mode on the school domain without requiring a cookie", async () => {
    const { proxy } = await loadProxy("core");

    for (const pathname of [
      "/schools/field",
      "/schools/field/lessons",
      "/schools/field/classroom",
      "/schools/field/offline",
      "/schools/parents",
      "/school-game",
      "/legal/privacy",
      ...FIELD_MODE_INSTALL_ICON_PATHS,
    ]) {
      const response = proxy(
        new NextRequest(`https://www.metapet.school${pathname}`),
      );
      expect(response.headers.get("location"), pathname).toBeNull();
      expect(response.cookies.get(FIELD_MODE_UI_COOKIE)?.value, pathname).toBe(
        FIELD_MODE_COOKIE_VALUE,
      );
    }
  });

  it("keeps consumer routes and APIs outside MetaPet.school", async () => {
    const { proxy } = await loadProxy("core");

    for (const pathname of [
      "/pet",
      "/identity",
      "/digital-dna",
      "/body-forge",
      "/wallet",
      "/marketplace",
    ]) {
      expect(
        proxy(
          new NextRequest(`https://www.metapet.school${pathname}`),
        ).headers.get("location"),
        pathname,
      ).toBe("https://www.metapet.school/schools/field");
    }

    const apiResponse = proxy(
      new NextRequest("https://www.metapet.school/api/wallet"),
    );
    expect(apiResponse.status).toBe(404);
    await expect(apiResponse.json()).resolves.toEqual({ error: "not_found" });
  });

  it("serves robots.txt and sitemap.xml on the school domain instead of redirecting", async () => {
    const { proxy } = await loadProxy("core", {
      siteUrl: "https://www.bluesnakestudios.com",
      vercelEnv: "production",
    });

    for (const pathname of ["/robots.txt", "/sitemap.xml"]) {
      const response = proxy(
        new NextRequest(`https://www.metapet.school${pathname}`),
      );
      expect(response.status, pathname).toBe(200);
      expect(response.headers.get("location"), pathname).toBeNull();
    }
  });

  it("allows the legal pages on the school domain", async () => {
    const { proxy } = await loadProxy("core");

    for (const pathname of ["/legal/privacy", "/legal/terms"]) {
      expect(
        proxy(
          new NextRequest(`https://www.metapet.school${pathname}`),
        ).headers.get("location"),
        pathname,
      ).toBeNull();
    }
  });

  it("leaves the full MetaPet product available on Blue Snake Studios", async () => {
    const { proxy } = await loadProxy("core");

    for (const pathname of [
      "/pet",
      "/identity",
      "/digital-dna",
      "/body-forge",
      "/app/activities",
      "/app/wellness",
    ]) {
      expect(
        proxy(
          new NextRequest(`https://www.bluesnakestudios.com${pathname}`),
        ).headers.get("location"),
        pathname,
      ).toBeNull();
    }
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

  it("does not activate Field Mode for a speculative route prefetch", async () => {
    const { proxy } = await loadProxy("core");

    for (const [label, headers] of [
      ["Next router", { "next-router-prefetch": "1" }],
      ["Purpose", { purpose: "prefetch" }],
    ]) {
      const response = proxy(
        new NextRequest("https://example.com/schools/field", { headers }),
      );

      expect(response.status).toBe(200);
      expect(response.cookies.get(FIELD_MODE_COOKIE), label).toBeUndefined();
      expect(response.cookies.get(FIELD_MODE_UI_COOKIE), label).toBeUndefined();
    }
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

describe("short /print aliases", () => {
  it("sends known classroom pack shortcuts to the matching Field print packs", async () => {
    const { proxy } = await loadProxy("core");

    const cases = [
      ["/print/f2", "/schools/field/print/f2"],
      ["/print/years-7-8", "/schools/field/print/years-7-8"],
      ["/print/relief", "/schools/field/print/relief"],
      ["/print/all", "/schools/field/print/all"],
      ["/print/curriculum", "/schools/field/print/curriculum"],
      ["/print/invisible-trail", "/schools/field/print/invisible-trail"],
    ] as const;

    for (const [from, to] of cases) {
      const response = proxy(new NextRequest(`https://www.metapet.school${from}`));
      expect(response.status, from).toBe(308);
      expect(response.headers.get("location"), from).toBe(
        `https://www.metapet.school${to}`,
      );
    }
  });

  it("keeps an unknown short /print path on the Field home fallback", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(
      new NextRequest("https://www.metapet.school/print/not-a-pack"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://www.metapet.school/schools/field",
    );
  });

  it("preserves the query string on a short print alias", async () => {
    const { proxy } = await loadProxy("core");
    const response = proxy(
      new NextRequest("https://www.metapet.school/print/f2?view=teacher"),
    );
    expect(response.headers.get("location")).toBe(
      "https://www.metapet.school/schools/field/print/f2?view=teacher",
    );
  });
});

it("takes school teachers deliberately to the full teacher workspace", async () => {
  const { proxy } = await loadProxy("core");
  for (const path of ["/teach", "/teach/lab", "/teachers/passport"]) {
    expect(proxy(new NextRequest("https://www.metapet.school" + path)).headers.get("location"))
      .toBe("https://www.bluesnakestudios.com" + path);
  }
  expect(proxy(new NextRequest("https://www.metapet.school/schools/field/play/meet-the-system")).headers.get("location")).toBeNull();
});

it("preserves the public port when a Field redirect replaces the internal hostname", async () => {
  const { proxy } = await loadProxy("core");
  const { NextRequest: RuntimeNextRequest } = await import("next/server");
  const request = new RuntimeNextRequest("http://localhost:3001/project-forge");
  request.headers.set("host", "127.0.0.1:3001");
  request.cookies.set(FIELD_MODE_COOKIE, FIELD_MODE_COOKIE_VALUE);
  const response = proxy(request);
  expect(response.headers.get("location")).toBe("http://127.0.0.1:3001/schools/field");
});

describe("content security policy header", () => {
  it("sets a nonce CSP on app routes and forwards the nonce to rendering", async () => {
    const { proxy } = await loadProxy("core");
    const { NextRequest: RuntimeNextRequest } = await import("next/server");
    const response = proxy(new RuntimeNextRequest("https://www.bluesnakestudios.com/pet"));
    const csp = response.headers.get("content-security-policy") ?? "";
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce).toBeTruthy();
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("cdnjs");
    // NextResponse.next({ request: { headers } }) exposes overridden request
    // headers to the renderer through x-middleware-request-* headers.
    expect(response.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(response.headers.get("x-middleware-request-content-security-policy")).toBe(csp);
  });

  it("uses a fresh nonce per request", async () => {
    const { proxy } = await loadProxy("core");
    const { NextRequest: RuntimeNextRequest } = await import("next/server");
    const a = proxy(new RuntimeNextRequest("https://www.bluesnakestudios.com/"));
    const b = proxy(new RuntimeNextRequest("https://www.bluesnakestudios.com/"));
    expect(a.headers.get("content-security-policy")).not.toBe(
      b.headers.get("content-security-policy"),
    );
  });

  it("keeps the legacy inline policy for static HTML toys", async () => {
    const { proxy } = await loadProxy("core");
    const { NextRequest: RuntimeNextRequest } = await import("next/server");
    const response = proxy(
      new RuntimeNextRequest("https://www.bluesnakestudios.com/geometry-sound.html"),
    );
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'/);
    expect(csp).not.toContain("nonce-");
    expect(csp).not.toContain("cdnjs");
  });

  it("also sets CSP on redirects and on school-host responses", async () => {
    const { proxy } = await loadProxy("core");
    const { NextRequest: RuntimeNextRequest } = await import("next/server");
    const response = proxy(new RuntimeNextRequest("https://www.metapet.school/"));
    expect(response.status).toBe(308);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
  });
});

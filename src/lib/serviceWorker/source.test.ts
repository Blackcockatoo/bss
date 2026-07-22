import { describe, expect, it, vi } from "vitest";

import { generateServiceWorkerSource } from "@/lib/serviceWorker/source";

describe("generated service worker", () => {
  it("contains the versioned Field Pack protocol and valid JavaScript", () => {
    const source = generateServiceWorkerSource({ emergencyNoop: false });
    expect(() => new Function(source)).not.toThrow();
    expect(source).toContain("FIELD_PACK_INSTALL");
    expect(source).toContain("FIELD_PACK_ROLLBACK");
    expect(source).toContain("FIELD_PACK_EMERGENCY_NOOP");
    expect(source).toContain("-candidate-");
    expect(source).toContain("Required offline route is missing");
    expect(source).toContain("/_next/static/");
    expect(source).not.toContain("/legal/privacy");
  });

  it("generates a true no-op recovery worker when the kill switch is active", () => {
    const source = generateServiceWorkerSource({ emergencyNoop: true });
    expect(() => new Function(source)).not.toThrow();
    expect(source).toContain("self.registration.unregister");
    expect(source).toContain("caches.delete");
    expect(source).not.toContain("FIELD_PACK_INSTALL");
    expect(source).not.toContain('addEventListener("fetch"');
  });

  it("keeps the active pack intact after a failed candidate and can roll back", async () => {
    const source = generateServiceWorkerSource({ emergencyNoop: false });
    const handlers = new Map<string, (event: Record<string, unknown>) => void>();
    const stores = new Map<string, Map<string, Response>>();

    const normalize = (request: Request | string, ignoreSearch = false) => {
      const url = new URL(
        typeof request === "string" ? request : request.url,
        "https://example.com",
      );
      if (ignoreSearch) url.search = "";
      return url.href;
    };

    const cacheFor = (name: string) => {
      const entries = stores.get(name) ?? new Map<string, Response>();
      stores.set(name, entries);
      return {
        async put(request: Request | string, response: Response) {
          entries.set(normalize(request), response.clone());
        },
        async match(
          request: Request | string,
          options?: { ignoreSearch?: boolean },
        ) {
          const key = normalize(request, options?.ignoreSearch);
          if (!options?.ignoreSearch) return entries.get(key)?.clone();
          for (const [stored, response] of entries) {
            if (normalize(stored, true) === key) return response.clone();
          }
          return undefined;
        },
        async delete(request: Request | string) {
          return entries.delete(normalize(request));
        },
        async keys() {
          return [...entries.keys()].map((url) => new Request(url));
        },
        async add(path: string) {
          const response = await fetchMock(
            new Request(new URL(path, "https://example.com")),
          );
          entries.set(normalize(path), response.clone());
        },
      };
    };

    let failingPath: string | null = null;
    const fetchMock = vi.fn(async (request: Request) => {
      const pathname = new URL(request.url, "https://example.com").pathname;
      if (pathname === failingPath) throw new Error("network interrupted");
      if (pathname.endsWith(".js")) {
        return new Response("self.__fieldChunk = true;", {
          status: 200,
          headers: { "Content-Type": "application/javascript" },
        });
      }
      return new Response(
        '<!doctype html><script src="/_next/static/chunks/field.js"></script>',
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    });

    const fakeCaches = {
      async open(name: string) {
        return cacheFor(name);
      },
      async keys() {
        return [...stores.keys()];
      },
      async delete(name: string) {
        return stores.delete(name);
      },
    };
    const fakeSelf = {
      location: { origin: "https://example.com" },
      registration: {
        navigationPreload: { enable: async () => undefined },
        unregister: async () => true,
      },
      clients: {
        claim: async () => undefined,
        matchAll: async () => [],
      },
      skipWaiting: async () => undefined,
      addEventListener(
        type: string,
        handler: (event: Record<string, unknown>) => void,
      ) {
        handlers.set(type, handler);
      },
    };

    new Function("self", "caches", "fetch", "Request", "Response", source)(
      fakeSelf,
      fakeCaches,
      fetchMock,
      Request,
      Response,
    );

    const message = async (data: Record<string, unknown>) => {
      let work: Promise<void> | null = null;
      let reply: unknown;
      handlers.get("message")?.({
        data,
        ports: [{ postMessage: (value: unknown) => (reply = value) }],
        waitUntil: (value: Promise<void>) => (work = value),
      });
      if (!work) throw new Error("Worker did not register message work.");
      await work;
      return reply as {
        ok: boolean;
        result?: {
          active: { version: string } | null;
          previous: { version: string } | null;
        };
        error?: string;
      };
    };

    const manifest = (version: string) => ({
      schemaVersion: 1,
      version,
      emergencyNoop: false,
      routes: ["/schools/field", "/schools/field/lessons"],
      assets: [],
    });

    const first = await message({
      type: "FIELD_PACK_INSTALL",
      manifest: manifest("field-pass-4-one"),
    });
    expect(first.ok).toBe(true);
    expect(first.result?.active?.version).toBe("field-pass-4-one");

    const outsidePack = await message({
      type: "FIELD_PACK_INSTALL",
      manifest: {
        ...manifest("field-pass-4-outside"),
        routes: ["/schools/field", "/legal/privacy"],
      },
    });
    expect(outsidePack.ok).toBe(false);

    const stillFirst = await message({ type: "FIELD_PACK_STATUS" });
    expect(stillFirst.result?.active?.version).toBe("field-pass-4-one");

    failingPath = "/schools/field/lessons";
    const failed = await message({
      type: "FIELD_PACK_INSTALL",
      manifest: manifest("field-pass-4-two"),
    });
    expect(failed.ok).toBe(false);

    const unchanged = await message({ type: "FIELD_PACK_STATUS" });
    expect(unchanged.result?.active?.version).toBe("field-pass-4-one");

    failingPath = null;
    const updated = await message({
      type: "FIELD_PACK_INSTALL",
      manifest: manifest("field-pass-4-two"),
    });
    expect(updated.result?.active?.version).toBe("field-pass-4-two");
    expect(updated.result?.previous?.version).toBe("field-pass-4-one");

    const rolledBack = await message({ type: "FIELD_PACK_ROLLBACK" });
    expect(rolledBack.result?.active?.version).toBe("field-pass-4-one");
    expect(rolledBack.result?.previous?.version).toBe("field-pass-4-two");
  });
});

import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_LESSONS_PATH,
  FIELD_MODE_PACK_MANIFEST_PATH,
  FIELD_MODE_START_PATH,
} from "@/lib/childSafeBaseline";
import {
  FIELD_PACK_CACHE_POLICY,
  FIELD_PACK_ROUTE_PATHS,
  FIELD_PACK_STATIC_ASSET_PATHS,
} from "@/lib/fieldMode/cachePolicy";

export interface ServiceWorkerSourceOptions {
  emergencyNoop: boolean;
}

function emergencyNoopSource(): string {
  return String.raw`
const CACHE_PREFIXES = ["meta-pet-shell-", "meta-pet-field-pack-"];

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    await Promise.all(clients.map((client) =>
      client.navigate(client.url).catch(() => undefined)
    ));
  })());
});
`;
}

function fieldPackWorkerSource(): string {
  const policy = FIELD_PACK_CACHE_POLICY;

  return String.raw`
const SHELL_CACHE_PREFIX = ${JSON.stringify(policy.shellCachePrefix)};
const SHELL_CACHE_NAME = SHELL_CACHE_PREFIX + ${JSON.stringify(policy.shellCacheVersion)};
const FIELD_CACHE_PREFIX = ${JSON.stringify(policy.fieldCachePrefix)};
const FIELD_META_CACHE = ${JSON.stringify(policy.fieldMetadataCache)};
const FIELD_HOME_PATH = ${JSON.stringify(FIELD_MODE_HOME_PATH)};
const FIELD_START_PATH = ${JSON.stringify(FIELD_MODE_START_PATH)};
const FIELD_LESSONS_PATH = ${JSON.stringify(FIELD_MODE_LESSONS_PATH)};
const FIELD_PACK_MANIFEST_PATH = ${JSON.stringify(FIELD_MODE_PACK_MANIFEST_PATH)};
const MAX_DISCOVERED_ASSETS = ${policy.maximumDiscoveredAssets};
const APPROVED_PACK_PATHS = new Set(${JSON.stringify([
    ...FIELD_PACK_ROUTE_PATHS,
    ...FIELD_PACK_STATIC_ASSET_PATHS,
  ])});
const ACTIVE_META_PATH = "/__metapet_field_pack_active__";
const PREVIOUS_META_PATH = "/__metapet_field_pack_previous__";
const BYPASS_META_PATH = "/__metapet_field_pack_bypass__";
const SHELL_URLS = [
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
];

function absolute(path) {
  return new URL(path, self.location.origin).href;
}

function canonicalRequest(path) {
  const url = new URL(path, self.location.origin);
  url.search = "";
  url.hash = "";
  return new Request(url.href, { credentials: "same-origin" });
}

async function readMeta(path) {
  const cache = await caches.open(FIELD_META_CACHE);
  const response = await cache.match(canonicalRequest(path));
  if (!response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function writeMeta(path, value) {
  const cache = await caches.open(FIELD_META_CACHE);
  await cache.put(
    canonicalRequest(path),
    new Response(JSON.stringify(value), {
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function deleteMeta(path) {
  const cache = await caches.open(FIELD_META_CACHE);
  await cache.delete(canonicalRequest(path));
}

async function cacheExists(name) {
  if (!name) return false;
  return (await caches.keys()).includes(name);
}

async function fieldPackStatus() {
  const active = await readMeta(ACTIVE_META_PATH);
  const previous = await readMeta(PREVIOUS_META_PATH);
  const bypass = await readMeta(BYPASS_META_PATH);
  return {
    supported: true,
    active: active && await cacheExists(active.cacheName) ? active : null,
    previous: previous && await cacheExists(previous.cacheName) ? previous : null,
    bypassed: bypass?.enabled === true,
  };
}

function normalizeManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Field Pack manifest is missing.");
  }
  if (manifest.schemaVersion !== 1 || typeof manifest.version !== "string") {
    throw new Error("Field Pack manifest version is not supported.");
  }
  if (manifest.emergencyNoop === true) {
    throw new Error("Offline installation is temporarily disabled.");
  }
  if (!Array.isArray(manifest.routes) || !Array.isArray(manifest.assets)) {
    throw new Error("Field Pack manifest is incomplete.");
  }

  const urls = Array.from(new Set([...manifest.routes, ...manifest.assets]));
  if (urls.length === 0) {
    throw new Error("Field Pack contains no routes.");
  }
  for (const value of urls) {
    if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
      throw new Error("Field Pack contains an unsafe path.");
    }
    const pathname = new URL(value, self.location.origin).pathname;
    if (!APPROVED_PACK_PATHS.has(pathname)) {
      throw new Error("Field Pack contains a route outside the classroom boundary.");
    }
  }

  return {
    version: manifest.version.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
    urls,
    requiredRoutes: [...manifest.routes],
  };
}

function discoverAssets(text, baseUrl) {
  const found = new Set();
  const patterns = [
    /(?:src|href)=["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'](\/_next\/static\/[^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const url = new URL(match[1], baseUrl);
        if (url.origin !== self.location.origin) continue;
        const pathname = url.pathname;
        const assetExtension = /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpe?g|webp|gif|svg|mp3|wav|ogg)$/i;
        if (pathname.startsWith("/_next/static/") || assetExtension.test(pathname)) {
          url.hash = "";
          found.add(url.pathname + url.search);
        }
      } catch {
        // Ignore malformed references in generated HTML/CSS/JS.
      }
    }
  }

  return [...found];
}

async function fetchIntoCache(cache, path) {
  const request = new Request(absolute(path), {
    credentials: "same-origin",
    cache: "reload",
  });
  const response = await fetch(request);
  if (!response.ok) {
    throw new Error("Unable to cache " + path + " (HTTP " + response.status + ").");
  }

  await cache.put(canonicalRequest(path), response.clone());

  const contentType = response.headers.get("content-type") || "";
  if (!/(?:text\/html|text\/css|javascript)/i.test(contentType)) {
    return [];
  }

  try {
    return discoverAssets(await response.clone().text(), response.url || request.url);
  } catch {
    return [];
  }
}

async function installFieldPack(rawManifest) {
  const manifest = normalizeManifest(rawManifest);
  if (!manifest.version) {
    throw new Error("Field Pack version is empty.");
  }

  const candidateName =
    FIELD_CACHE_PREFIX + manifest.version + "-candidate-" + Date.now();
  await caches.delete(candidateName);
  const candidate = await caches.open(candidateName);
  const queued = new Set(manifest.urls);
  const queue = [...manifest.urls];

  try {
    while (queue.length > 0) {
      const batch = queue.splice(0, 6);
      const discoveries = await Promise.all(
        batch.map((path) => fetchIntoCache(candidate, path)),
      );
      for (const path of discoveries.flat()) {
        if (queued.size >= MAX_DISCOVERED_ASSETS) break;
        if (!queued.has(path)) {
          queued.add(path);
          queue.push(path);
        }
      }
    }

    for (const route of manifest.requiredRoutes) {
      const cached = await candidate.match(canonicalRequest(route));
      if (!cached) {
        throw new Error("Required offline route is missing: " + route);
      }
    }

    const itemCount = (await candidate.keys()).length;
    const current = await readMeta(ACTIVE_META_PATH);
    if (current && await cacheExists(current.cacheName)) {
      await writeMeta(PREVIOUS_META_PATH, current);
    }

    const active = {
      version: manifest.version,
      cacheName: candidateName,
      installedAt: Date.now(),
      itemCount,
    };
    await writeMeta(ACTIVE_META_PATH, active);
    await deleteMeta(BYPASS_META_PATH);

    const previous = await readMeta(PREVIOUS_META_PATH);
    const keep = new Set([FIELD_META_CACHE, active.cacheName, previous?.cacheName]);
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(FIELD_CACHE_PREFIX) && !keep.has(key))
        .map((key) => caches.delete(key)),
    );

    return fieldPackStatus();
  } catch (error) {
    await caches.delete(candidateName);
    throw error;
  }
}

async function removeFieldPacks() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(FIELD_CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  );
  return { supported: true, active: null, previous: null, bypassed: false };
}

async function rollbackFieldPack() {
  const active = await readMeta(ACTIVE_META_PATH);
  const previous = await readMeta(PREVIOUS_META_PATH);
  if (!previous || !(await cacheExists(previous.cacheName))) {
    throw new Error("No previous complete Field Pack is available.");
  }
  await writeMeta(ACTIVE_META_PATH, previous);
  if (active && await cacheExists(active.cacheName)) {
    await writeMeta(PREVIOUS_META_PATH, active);
  } else {
    await deleteMeta(PREVIOUS_META_PATH);
  }
  await deleteMeta(BYPASS_META_PATH);
  return fieldPackStatus();
}

async function setFieldPackBypass(enabled) {
  if (enabled) {
    await writeMeta(BYPASS_META_PATH, { enabled: true, updatedAt: Date.now() });
  } else {
    await deleteMeta(BYPASS_META_PATH);
  }
  return fieldPackStatus();
}

async function handleMessage(data) {
  switch (data?.type) {
    case "FIELD_PACK_STATUS":
      return fieldPackStatus();
    case "FIELD_PACK_INSTALL":
      return installFieldPack(data.manifest);
    case "FIELD_PACK_REMOVE":
      return removeFieldPacks();
    case "FIELD_PACK_ROLLBACK":
      return rollbackFieldPack();
    case "FIELD_PACK_BYPASS":
      return setFieldPackBypass(data.enabled === true);
    case "FIELD_PACK_EMERGENCY_NOOP":
      await removeFieldPacks();
      return setFieldPackBypass(true);
    default:
      throw new Error("Unknown Field Pack command.");
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE_NAME);
    await Promise.all(
      SHELL_URLS.map((url) => cache.add(url).catch(() => undefined)),
    );
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(SHELL_CACHE_PREFIX) && key !== SHELL_CACHE_NAME)
        .map((key) => caches.delete(key)),
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable().catch(() => undefined);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  event.waitUntil((async () => {
    try {
      const result = await handleMessage(event.data);
      event.ports?.[0]?.postMessage({ ok: true, result });
    } catch (error) {
      event.ports?.[0]?.postMessage({
        ok: false,
        error: error instanceof Error ? error.message : "Field Pack operation failed.",
      });
    }
  })());
});

async function activeFieldCache() {
  const status = await fieldPackStatus();
  if (status.bypassed || !status.active) return null;
  return caches.open(status.active.cacheName);
}

async function fieldNavigationResponse(event) {
  const cache = await activeFieldCache();
  if (cache) {
    const url = new URL(event.request.url);
    const cached = await cache.match(canonicalRequest(url.pathname));
    if (cached) return cached;
    if (url.pathname === FIELD_START_PATH) {
      const lessons = await cache.match(canonicalRequest(FIELD_LESSONS_PATH));
      if (lessons) return lessons;
    }
  }

  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    return await fetch(event.request);
  } catch {
    if (cache) {
      const home = await cache.match(canonicalRequest(FIELD_HOME_PATH));
      if (home) return home;
    }
    return new Response(
      "MetaPet Field Mode is offline and no complete Field Pack is installed.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}

async function assetResponse(request) {
  const cache = await activeFieldCache();
  if (cache) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
  }

  const url = new URL(request.url);
  if (SHELL_URLS.includes(url.pathname)) {
    const shell = await caches.open(SHELL_CACHE_NAME);
    const cached = await shell.match(request, { ignoreSearch: true });
    if (cached) return cached;
  }

  return fetch(request);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (
      url.pathname === FIELD_HOME_PATH ||
      url.pathname.startsWith(FIELD_HOME_PATH + "/")
    ) {
      event.respondWith(fieldNavigationResponse(event));
    }
    return;
  }

  if (url.pathname === FIELD_PACK_MANIFEST_PATH) {
    return;
  }

  event.respondWith(assetResponse(request));
});
`;
}

export function generateServiceWorkerSource(
  options: ServiceWorkerSourceOptions,
): string {
  return options.emergencyNoop
    ? emergencyNoopSource()
    : fieldPackWorkerSource();
}

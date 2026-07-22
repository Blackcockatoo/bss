const baseUrl = (
  process.argv[2] ||
  process.env.FIELD_SMOKE_BASE_URL ||
  "http://127.0.0.1:3000"
).replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, cookie, redirect = "follow") {
  return fetch(`${baseUrl}${path}`, {
    redirect,
    headers: {
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
}

async function mapWithConcurrency(values, limit, action) {
  const pending = [...values];
  const workers = Array.from({ length: Math.min(limit, pending.length) }, async () => {
    while (pending.length > 0) {
      const value = pending.shift();
      if (value !== undefined) await action(value);
    }
  });
  await Promise.all(workers);
}

const entry = await request("/schools/field", null, "manual");
assert(entry.status === 200, `Field entry returned HTTP ${entry.status}`);
const setCookie = entry.headers.get("set-cookie") || "";
const cookie = setCookie.split(";", 1)[0];
assert(cookie.startsWith("metapet-field-mode=active"), "Field cookie was not activated");

const manifestResponse = await request("/schools/field/pack.json", cookie);
assert(manifestResponse.status === 200, `Pack manifest returned HTTP ${manifestResponse.status}`);
assert(
  manifestResponse.headers.get("cache-control")?.includes("no-store"),
  "Pack manifest is not marked no-store",
);
const manifest = await manifestResponse.json();
assert(manifest.schemaVersion === 1, "Unexpected Field Pack schema");
assert(manifest.lessons?.length === 7, "Field Pack does not contain seven lessons");
assert(
  manifest.routes?.filter((path) => path.startsWith("/schools/field/print/")).length === 7,
  "Field Pack does not contain seven printable fallbacks",
);
assert(
  !manifest.routes.some((path) =>
    /shop|wallet|marketplace|breeding|identity|qr|ritual|alchemist|social|share/.test(path),
  ),
  "Field Pack contains a blocked consumer route",
);

await mapWithConcurrency([...manifest.routes, ...manifest.assets], 6, async (path) => {
  const response = await request(path, cookie);
  assert(response.ok, `${path} returned HTTP ${response.status}`);
  if (response.headers.get("content-type")?.includes("text/html")) {
    const html = await response.text();
    const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(
      (match) => match[1],
    );
    const blockedHref = hrefs.find((href) =>
      /^\/(?:shop|wallet|marketplace|breeding|identity|qr(?:-messaging)?|rituals|alchemist|digital-dna|social|share|teachers|pet)(?:\/|$)/.test(
        href,
      ),
    );
    assert(!blockedHref, `${path} exposes blocked link ${blockedHref}`);
  }
});

const worker = await request("/sw.js", cookie);
const workerSource = await worker.text();
assert(worker.ok, `Service worker returned HTTP ${worker.status}`);
assert(
  worker.headers.get("cache-control")?.includes("no-store"),
  "Service worker is not marked no-store",
);
assert(workerSource.includes("FIELD_PACK_INSTALL"), "Field Pack worker protocol is missing");
assert(workerSource.includes("FIELD_PACK_ROLLBACK"), "Field Pack rollback protocol is missing");

const blockedPage = await request("/shop", cookie, "manual");
assert(blockedPage.status === 307, `Blocked page returned HTTP ${blockedPage.status}`);
const blockedLocation = blockedPage.headers.get("location");
assert(
  blockedLocation &&
    new URL(blockedLocation, baseUrl).pathname === "/schools/field",
  "Blocked page did not return to the Field fallback",
);

const blockedApi = await request("/api/marketplace/listings", cookie, "manual");
assert(blockedApi.status === 404, `Blocked API returned HTTP ${blockedApi.status}`);

console.log(
  `Field Pack smoke passed: ${manifest.routes.length} routes, ${manifest.assets.length} declared assets, 7 lessons, 7 printable fallbacks.`,
);

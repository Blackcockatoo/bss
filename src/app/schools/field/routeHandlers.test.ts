import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET as exitField } from "@/app/schools/field/exit/route";
import { GET as fieldPack } from "@/app/schools/field/pack.json/route";
import { GET as fieldManifest } from "@/app/schools/field/manifest.webmanifest/route";
import { GET as startField } from "@/app/schools/field/start/route";
import { GET as serviceWorker } from "@/app/sw.js/route";
import {
  FIELD_MODE_COOKIE,
  FIELD_MODE_COOKIE_VALUE,
  FIELD_MODE_UI_COOKIE,
} from "@/lib/childSafeBaseline";
import {
  FIELD_MODE_APP_ID,
  FIELD_MODE_ICON_192_PATH,
  FIELD_MODE_ICON_512_PATH,
  FIELD_MODE_MASKABLE_ICON_512_PATH,
} from "@/lib/fieldMode/pwa";

describe("Field Mode entry and exit handlers", () => {
  it("starts at the approved Field lesson launchpad", () => {
    const response = startField(
      new NextRequest("https://example.com/schools/field/start"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/schools/field/lessons",
    );
    expect(response.cookies.get(FIELD_MODE_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
    expect(response.cookies.get(FIELD_MODE_UI_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
  });

  it("clears Field Mode and returns to the schools surface", () => {
    const response = exitField(
      new NextRequest("https://example.com/schools/field/exit"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/schools",
    );
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=0/i);
    expect(response.cookies.get(FIELD_MODE_UI_COOKIE)?.value).toBe(
      FIELD_MODE_COOKIE_VALUE,
    );
  });

  it("publishes a no-store complete pack manifest for all seven lessons", async () => {
    const response = fieldPack();
    const body = await response.json();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(body.lessons).toHaveLength(7);
    expect(body.routes).toContain("/schools/field/offline");
    expect(body.routes).toContain(
      "/schools/field/print/meet-your-metapet",
    );
    expect(body.guarantees.update).toBe("atomic-candidate");
  });

  it("publishes a separate install identity and complete school icon set", async () => {
    const response = fieldManifest();
    const body = await response.json();

    expect(response.headers.get("content-type")).toContain(
      "application/manifest+json",
    );
    expect(body.id).toBe(FIELD_MODE_APP_ID);
    expect(body.start_url).toBe("/schools/field");
    // A trailing slash on scope alone leaves start_url outside it, which
    // browsers reject as an install target.
    expect(body.start_url.startsWith(body.scope)).toBe(true);
    expect(body.name).toContain("MetaPet School");
    expect(body.name).not.toMatch(/Blue $nake Studio/i);
    expect(body.lang).toBe("en-AU");
    expect(body.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: FIELD_MODE_ICON_192_PATH }),
        expect.objectContaining({ src: FIELD_MODE_ICON_512_PATH }),
        expect.objectContaining({
          src: FIELD_MODE_MASKABLE_ICON_512_PATH,
          purpose: "maskable",
        }),
      ]),
    );
  });

  it("serves the generated worker with root scope and no HTTP caching", async () => {
    const response = serviceWorker();
    const source = await response.text();
    expect(response.headers.get("service-worker-allowed")).toBe("/");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(source).toContain("FIELD_PACK_INSTALL");
  });
});

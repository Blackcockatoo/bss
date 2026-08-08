import { describe, expect, it } from "vitest";

import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";
import {
  FIELD_PACK_LESSON_ROUTES,
  FIELD_PACK_PRINT_ROUTES,
  FIELD_PACK_ROUTE_PATHS,
  FIELD_PACK_STATIC_ASSET_PATHS,
  buildFieldPackManifest,
  resolveFieldPackVersion,
} from "@/lib/fieldMode/cachePolicy";
import { FIELD_MODE_INSTALL_ICON_PATHS } from "@/lib/fieldMode/pwa";

describe("Field Pack cache policy", () => {
  it("contains all seven guided lessons and seven printable fallbacks", () => {
    expect(FIELD_PACK_LESSON_ROUTES).toHaveLength(7);
    expect(FIELD_PACK_PRINT_ROUTES).toHaveLength(7);
    expect(new Set(FIELD_PACK_ROUTE_PATHS).size).toBe(
      FIELD_PACK_ROUTE_PATHS.length,
    );
  });

  it("keeps every cached route and asset inside the declarative Field boundary", () => {
    for (const pathname of [
      ...FIELD_PACK_ROUTE_PATHS,
      ...FIELD_PACK_STATIC_ASSET_PATHS,
    ]) {
      expect(isPathnameAllowedByPolicy(pathname, "field"), pathname).toBe(true);
    }
  });

  it("caches the school install icons instead of the consumer app icon", () => {
    expect(FIELD_PACK_STATIC_ASSET_PATHS).toEqual(
      expect.arrayContaining([...FIELD_MODE_INSTALL_ICON_PATHS]),
    );
    expect(FIELD_PACK_STATIC_ASSET_PATHS).not.toContain("/icon.svg");
  });

  it("never includes a consumer route category in the complete pack", () => {
    // Checked by route root rather than by substring: a lesson slug is allowed
    // to contain a word like "identity" (Session 3 is literally about identity
    // and representation), but a cached route may never live under a consumer
    // section such as /shop or /identity.
    const APPROVED_ROOTS = new Set(["schools", "school-game", "legal", "docs"]);
    const offenders = FIELD_PACK_ROUTE_PATHS.filter((pathname) => {
      const root = pathname.split("/").filter(Boolean)[0];
      return root !== undefined && !APPROVED_ROOTS.has(root);
    });

    expect(offenders).toEqual([]);
  });

  it("derives a stable release version from the deployment commit", () => {
    expect(
      resolveFieldPackVersion({ VERCEL_GIT_COMMIT_SHA: "ABCDEF1234567890zz" }),
    ).toBe("field-pass-4-abcdef1234567890");
    expect(resolveFieldPackVersion({})).toBe(
      "field-pass-4-development",
    );
  });

  it("publishes the atomic update, rollback and emergency contracts", () => {
    const manifest = buildFieldPackManifest(
      {
        GITHUB_SHA: "1234567890abcdef",
        FIELD_MODE_OFFLINE_EMERGENCY_NOOP: "true",
      },
      new Date("2026-07-22T00:00:00.000Z"),
    );
    expect(manifest.lessons).toHaveLength(7);
    expect(manifest.emergencyNoop).toBe(true);
    expect(manifest.guarantees).toEqual({
      update: "atomic-candidate",
      rollback: "previous-complete-pack",
      animationFallback: "static-when-offline",
      records: "local-device-only",
    });
    expect(manifest.generatedAt).toBe("2026-07-22T00:00:00.000Z");
  });
});

import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Field Mode's privacy claim is "no advertising, no behavioural tracking, no
 * third-party analytics during routine classroom use". That claim can only be
 * kept honest by checking the source that actually ships to a classroom
 * browser, so this test walks the school route tree and the Field components
 * and fails if a tracker, an error-reporting SDK or a cross-origin request
 * appears in any of them.
 *
 * If a genuinely necessary outbound call is added, declare it in
 * `DECLARED_SAME_ORIGIN_REQUESTS` (same origin only) or update the governance
 * pack — do not silence the test.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");

const SCANNED_DIRECTORIES = [
  "src/app/schools",
  "src/app/school-game",
  "src/app/teachers",
  "src/components/field-mode",
  "src/lib/fieldMode",
  "src/lib/schools",
];

/** Package specifiers that must never reach a classroom bundle. */
const FORBIDDEN_IMPORTS = [
  "@vercel/analytics",
  "@vercel/speed-insights",
  "posthog-js",
  "mixpanel",
  "amplitude",
  "@sentry/",
  "react-ga",
  "gtag",
  "hotjar",
  "logrocket",
  "@segment/",
];

/**
 * Same-origin request targets Field Mode is allowed to make. Each entry is a
 * classroom asset served by this app, not a third-party service.
 */
const DECLARED_SAME_ORIGIN_REQUESTS = [
  "/schools/field/pack.json",
  "/sw.js",
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

async function collectSourceFiles(directory: string): Promise<string[]> {
  const absolute = path.join(REPO_ROOT, directory);
  const entries = await readdir(absolute, {
    recursive: true,
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath ?? absolute, entry.name))
    .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
    .filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));
}

async function collectAllSourceFiles(): Promise<string[]> {
  const groups = await Promise.all(SCANNED_DIRECTORIES.map(collectSourceFiles));
  return groups.flat();
}

describe("Field Mode outbound boundary", () => {
  it("scans a non-empty set of classroom source files", async () => {
    const files = await collectAllSourceFiles();
    expect(files.length).toBeGreaterThan(20);
  });

  it("imports no analytics, tracking or error-reporting SDK", async () => {
    const files = await collectAllSourceFiles();
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const specifier of FORBIDDEN_IMPORTS) {
        if (source.includes(specifier)) {
          offenders.push(`${path.relative(REPO_ROOT, file)} → ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("makes no cross-origin request from a classroom surface", async () => {
    const files = await collectAllSourceFiles();
    const offenders: string[] = [];
    // Matches fetch/XHR/sendBeacon calls whose first argument is an absolute
    // URL literal. Same-origin string paths are the only permitted form.
    const crossOrigin =
      /\b(?:fetch|sendBeacon|open)\s*\(\s*[`'"]https?:\/\//g;

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (crossOrigin.test(source)) {
        offenders.push(path.relative(REPO_ROOT, file));
      }
      crossOrigin.lastIndex = 0;
    }

    expect(offenders).toEqual([]);
  });

  it("keeps every declared same-origin request inside this app", () => {
    for (const request of DECLARED_SAME_ORIGIN_REQUESTS) {
      expect(request.startsWith("/")).toBe(true);
      expect(request).not.toMatch(/^https?:/);
    }
  });
});

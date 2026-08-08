import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Claims discipline for every school-facing surface.
 *
 * MetaPet School's whole argument is that its statements are checkable. A
 * single absolute claim — "zero data", "fully compliant", "government
 * approved" — costs more credibility with a principal than any marketing line
 * could buy back, so the phrases below are simply not allowed to ship.
 *
 * If one of these ever becomes true and provable, remove it from this list in
 * the same change that adds the evidence.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");

const SCANNED_PATHS = [
  "src/app/schools",
  "src/app/teachers",
  "src/app/legal",
  "src/components/field-mode",
  "src/lib/schools",
  "docs/schools-au",
];

/**
 * Each entry is a regex plus why it is banned. Word boundaries matter: a page
 * is allowed to say it does *not* claim something.
 */
const BANNED_CLAIMS: readonly { pattern: RegExp; reason: string }[] = [
  { pattern: /\bwe collect no data\b/i, reason: "absolute; local records exist" },
  { pattern: /\bzero data\b/i, reason: "absolute" },
  { pattern: /\bzero privacy risk\b/i, reason: "absolute" },
  { pattern: /\bcompletely anonymous\b/i, reason: "aliases are not anonymity" },
  { pattern: /\bfully compliant\b/i, reason: "no compliance assessment exists" },
  { pattern: /\bfully accessible\b/i, reason: "accessibility is being verified" },
  { pattern: /\bgovernment[- ]approved\b/i, reason: "no such approval exists" },
  {
    pattern: /\bendorsed by the australian government\b/i,
    reason: "no such endorsement exists",
  },
  { pattern: /\bcertified safe\b/i, reason: "no certification exists" },
  { pattern: /\bscientifically proven\b/i, reason: "no study exists" },
  { pattern: /\bmarket leader\b/i, reason: "unsupported" },
  { pattern: /australia'?s number one/i, reason: "unsupported" },
  { pattern: /\bguarantees? engagement\b/i, reason: "unsupported and undesirable" },
  {
    pattern: /\bimproves emotional regulation\b/i,
    reason: "efficacy claim with no evidence",
  },
  { pattern: /\bcompletely offline\b/i, reason: "offline support is not verified" },
  { pattern: /\bfully offline\b/i, reason: "offline support is not verified" },
];

/** Named competitors must never be attacked, only factually contrasted. */
const COMPETITORS = [
  "Compass",
  "Sentral",
  "School Bytes",
  "ClassDojo",
  "Seesaw",
  "Toddle",
  "Better Us",
];

const DISPARAGING = /\b(evil|creepy|predatory|spyware|scam|harvests?|exploits?)\b/i;

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".md"]);

async function scannedFiles(): Promise<string[]> {
  const groups = await Promise.all(
    SCANNED_PATHS.map(async (relative) => {
      const absolute = path.join(REPO_ROOT, relative);
      const entries = await readdir(absolute, {
        recursive: true,
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.join(entry.parentPath ?? absolute, entry.name))
        .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
        .filter((file) => !/\.test\.tsx?$/.test(file));
    }),
  );
  return groups.flat();
}

describe("claims discipline", () => {
  it("scans every school-facing source and document", async () => {
    const files = await scannedFiles();
    expect(files.length).toBeGreaterThan(40);
  });

  it("makes no unsupported efficacy, compliance or leadership claim", async () => {
    const files = await scannedFiles();
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const claim of BANNED_CLAIMS) {
        if (claim.pattern.test(source)) {
          offenders.push(
            `${path.relative(REPO_ROOT, file)} → ${claim.pattern} (${claim.reason})`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("never disparages a named competitor", async () => {
    const files = await scannedFiles();
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const competitor of COMPETITORS) {
        if (!source.includes(competitor)) continue;
        // Check the sentence the competitor appears in, not the whole file.
        for (const sentence of source.split(/(?<=[.!?])\s+/)) {
          if (sentence.includes(competitor) && DISPARAGING.test(sentence)) {
            offenders.push(
              `${path.relative(REPO_ROOT, file)} → ${competitor}: ${sentence.trim().slice(0, 120)}`,
            );
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("does not present a pilot target as an achieved result", async () => {
    const files = await scannedFiles();
    const offenders: string[] = [];
    // Percentages attached to outcome verbs are the classic form of this.
    const achieved =
      /\b\d{1,3}%\s+(of teachers|of students|improvement|increase|retention|engagement|completion)\b/i;

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (achieved.test(source)) {
        offenders.push(path.relative(REPO_ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});

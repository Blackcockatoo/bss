import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTRIBUTION_INTEGRATION_POINT,
  CONTRIBUTION_OPTIONS,
  CONTRIBUTION_PAYMENTS_ENABLED,
  DEFAULT_CONTRIBUTION_SELECTION,
  FREE_ACCESS,
  FREE_ACCESS_INCLUDES,
  FREE_PROMISE,
  GOVERNING_PRINCIPLE,
  PAID_SERVICES,
  START_TEACHING_ACTION,
} from "./contribution";

const REPO_ROOT = path.resolve(__dirname, "../../..");

describe("contribution model", () => {
  it("keeps A$0 out of the contribution amounts entirely", () => {
    // A$0 is the product, not the cheapest tier. Listing it beside A$250 and
    // A$1,500 turns free access into a pricing column, which is the exact
    // misreading this model exists to prevent.
    for (const option of CONTRIBUTION_OPTIONS) {
      expect(option.amount === 0).toBe(false);
      expect(option.label).not.toBe("A$0");
    }
  });

  it("states free access as an action, not as an option in a list", () => {
    expect(FREE_ACCESS.action).toBe("Use MetaPet School — A$0");
    expect(FREE_ACCESS.assurance).toBe(
      "No explanation required. Nothing is removed. Nothing expires.",
    );
  });

  it("shows the actual zero in the entry action and the promise", () => {
    // "Free" alone is what an expiring trial says too, so the numeral has to
    // be visible in both the button and the promise beneath it.
    expect(START_TEACHING_ACTION).toContain("A$0");
    expect(FREE_PROMISE).toMatch(/not a trial/i);
    expect(FREE_PROMISE).toMatch(/no expiry/i);
    expect(FREE_PROMISE).toMatch(/no reduced version/i);
  });

  it("preselects nothing", () => {
    expect(DEFAULT_CONTRIBUTION_SELECTION).toBeNull();
  });

  it("lets an adult enter their own amount", () => {
    const custom = CONTRIBUTION_OPTIONS.filter(
      (option) => option.amount === null,
    );
    expect(custom).toHaveLength(1);
  });

  it("uses no scarcity, urgency or popularity pressure in any option", () => {
    const forbidden = [
      "most popular",
      "recommended",
      "limited",
      "hurry",
      "only",
      "expires",
      "last chance",
      "don't miss",
      "act now",
    ];

    for (const option of CONTRIBUTION_OPTIONS) {
      const text = `${option.label} ${option.description}`.toLowerCase();
      for (const phrase of forbidden) {
        expect(text, `${option.id}: "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  it("does not describe contributions as tax-deductible donations", () => {
    // That legal status has not been established, so the word must not appear.
    const text = CONTRIBUTION_OPTIONS.map(
      (option) => option.description,
    ).join(" ");
    expect(text.toLowerCase()).not.toContain("tax");
    expect(text.toLowerCase()).not.toContain("deductible");
  });

  it("gives the A$0 school the complete experience", () => {
    expect(FREE_ACCESS_INCLUDES.length).toBeGreaterThanOrEqual(5);
    const joined = FREE_ACCESS_INCLUDES.join(" ").toLowerCase();
    expect(joined).toContain("all seven sessions");
    expect(joined).toContain("field mode");
  });

  it("keeps paid human services separate from classroom access", () => {
    // No paid service may read as a precondition for running the sequence.
    for (const service of PAID_SERVICES) {
      const text = `${service.title} ${service.description}`.toLowerCase();
      expect(text).not.toContain("required");
      expect(text).not.toContain("licence");
      expect(text).not.toContain("license");
      expect(text).not.toContain("unlock");
    }
  });

  it("does not pretend a payment system exists", () => {
    expect(CONTRIBUTION_PAYMENTS_ENABLED).toBe(false);

    const result = CONTRIBUTION_INTEGRATION_POINT({
      optionId: "sustain",
      amount: 250,
    });
    expect(result.status).toBe("no-payment-processor");
    expect(result.message).toMatch(/no payment system connected/i);
    expect(result.intent).toEqual({ optionId: "sustain", amount: 250 });
  });

  it("carries the governing principle as two display lines", () => {
    expect([...GOVERNING_PRINCIPLE]).toEqual([
      "No school is too poor to use it.",
      "No school is too wealthy to help sustain it.",
    ]);
  });

  it("uses no plan, tier or unlock language anywhere in the model", () => {
    const corpus = [
      START_TEACHING_ACTION,
      FREE_PROMISE,
      FREE_ACCESS.action,
      FREE_ACCESS.assurance,
      ...FREE_ACCESS_INCLUDES,
      ...CONTRIBUTION_OPTIONS.map((o) => `${o.label} ${o.description}`),
    ]
      .join(" ")
      .toLowerCase();

    // Word-boundary matched: "No explanation required" is not plan language.
    for (const word of [
      "plan",
      "plans",
      "tier",
      "tiers",
      "unlock",
      "premium",
      "basic",
      "upgrade",
      "choose your",
      "licence",
      "license",
    ]) {
      expect(corpus, word).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });
});

/**
 * The child-facing surface is Field Mode. Payment words must not appear on it
 * at any point, whatever an adult page says elsewhere.
 */
describe("no child-facing monetisation", () => {
  const CHILD_FACING_DIRECTORIES = [
    "src/app/schools/field",
    "src/components/field-mode",
    "src/components/teacher-lessons/activities",
  ];

  /**
   * Solicitation, not vocabulary. A classroom screen telling a teacher "no
   * account or payment required" is the opposite of monetisation, so the bans
   * below target the ask — an amount, a checkout, an upgrade, a request for
   * payment details — rather than the bare noun.
   */
  const MONEY_SOLICITATIONS = [
    /A\$/i,
    /\bsubscribe\b/i,
    /\bsubscription\b/i,
    /\bcheckout\b/i,
    /\bupgrade\b/i,
    /\bpurchase\b/i,
    /\bbuy\b/i,
    /\bcontribute\b/i,
    /\bdonat(e|ion)\b/i,
    /\bpricing\b/i,
    /payment (details|method|information)/i,
    /(make|enter|add) a payment/i,
    // An affirmative demand only. "No account or payment required" must pass;
    // "payment is required to continue" must not.
    /(?<!no account or )(?<!no )payment is required/i,
  ];

  async function classroomSources(): Promise<string[]> {
    const groups = await Promise.all(
      CHILD_FACING_DIRECTORIES.map(async (directory) => {
        const absolute = path.join(REPO_ROOT, directory);
        const entries = await readdir(absolute, {
          recursive: true,
          withFileTypes: true,
        });
        return entries
          .filter((entry) => entry.isFile())
          .map((entry) => path.join(entry.parentPath ?? absolute, entry.name))
          .filter((file) => /\.tsx?$/.test(file))
          .filter((file) => !/\.test\.tsx?$/.test(file));
      }),
    );
    return groups.flat();
  }

  it("asks a child for money nowhere in the classroom experience", async () => {
    const files = await classroomSources();
    expect(files.length).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of MONEY_SOLICITATIONS) {
        if (pattern.test(source)) {
          offenders.push(`${path.relative(REPO_ROOT, file)} → ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("still permits telling a teacher that no payment is required", async () => {
    // The reassurance must survive the ban, or the ban is checking vocabulary
    // instead of behaviour.
    const launchpad = readFileSync(
      path.join(REPO_ROOT, "src/components/field-mode/FieldLessonLaunchpad.tsx"),
      "utf8",
    );
    expect(launchpad).toContain("No account or payment required");
  });
});

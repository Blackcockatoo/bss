import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONTRIBUTION_CLOSING_LINE,
  CONTRIBUTION_INTEGRATION_POINT,
  CONTRIBUTION_OPTIONS,
  CONTRIBUTION_PAYMENTS_ENABLED,
  DEFAULT_CONTRIBUTION_SELECTION,
  FREE_TIER_INCLUDES,
  PAID_SERVICES,
} from "./contribution";

const REPO_ROOT = path.resolve(__dirname, "../../..");

describe("contribution model", () => {
  it("offers A$0 as the first option", () => {
    const first = CONTRIBUTION_OPTIONS[0];
    expect(first.amount).toBe(0);
    expect(first.label).toBe("A$0");
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
    expect(FREE_TIER_INCLUDES.length).toBeGreaterThanOrEqual(5);
    const joined = FREE_TIER_INCLUDES.join(" ").toLowerCase();
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

  it("states the closing line the contribution page must end with", () => {
    expect(CONTRIBUTION_CLOSING_LINE).toBe(
      "No school is too poor to use it. No school is too wealthy to help sustain it.",
    );
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

  const MONEY_WORDS = [
    "A$",
    "subscribe",
    "subscription",
    "checkout",
    "upgrade",
    "purchase",
    "buy now",
    "payment",
    "contribute",
    "donation",
    "pricing",
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

  it("mentions no payment concept on any child-facing classroom screen", async () => {
    const files = await classroomSources();
    expect(files.length).toBeGreaterThan(10);

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8").toLowerCase();
      for (const word of MONEY_WORDS) {
        if (source.includes(word.toLowerCase())) {
          offenders.push(`${path.relative(REPO_ROOT, file)} → ${word}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

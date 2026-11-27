import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import FamilyPrivacyPage, { metadata } from "./page";
import {
  FAMILY_PRIVACY_KIDS_SECTIONS,
  FAMILY_PRIVACY_PARENT_SECTIONS,
} from "./content";
import { ANALYTICS_ALLOWED_PREFIXES } from "@/lib/analyticsBoundary";

const allText = [...FAMILY_PRIVACY_KIDS_SECTIONS, ...FAMILY_PRIVACY_PARENT_SECTIONS]
  .flatMap((section) => [section.heading, ...(section.paragraphs ?? []), ...(section.bullets ?? [])])
  .join("\n");

describe("family privacy notice (draft)", () => {
  it("is clearly marked as a draft and kept out of search results", () => {
    render(<FamilyPrivacyPage />);
    expect(screen.getByTestId("family-privacy-draft-banner").textContent).toMatch(/DRAFT/);
    expect(metadata.robots).toMatchObject({ index: false });
    expect(String(metadata.title)).toMatch(/Draft/);
  });

  it("has a kids section and a parents section", () => {
    render(<FamilyPrivacyPage />);
    expect(screen.getByRole("heading", { level: 2, name: "For kids" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "For parents and carers" })).toBeTruthy();
  });

  it("names exactly the pages that actually load analytics", () => {
    expect([...ANALYTICS_ALLOWED_PREFIXES].sort()).toEqual(["/pricing", "/studio"]);
    for (const prefix of ANALYTICS_ALLOWED_PREFIXES) {
      expect(allText).toContain(prefix);
    }
  });

  it("leaves contact details as placeholders rather than inventing them", () => {
    expect(allText).toContain("[contact email to be confirmed]");
    expect(allText).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });
});

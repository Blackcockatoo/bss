import { describe, expect, it } from "vitest";

import { CANONICAL_SESSIONS } from "@/lib/schools/canonicalSequence";
import {
  FIELD_PRINT_PACK_SLUGS,
  fieldPrintAliasTarget,
} from "@/lib/schools/printAliases";

describe("short /print aliases", () => {
  it("maps the classroom pack shortcuts to their Field print routes", () => {
    expect(fieldPrintAliasTarget("/print/f2")).toBe("/schools/field/print/f2");
    expect(fieldPrintAliasTarget("/print/years-7-8")).toBe(
      "/schools/field/print/years-7-8",
    );
    expect(fieldPrintAliasTarget("/print/relief")).toBe(
      "/schools/field/print/relief",
    );
    expect(fieldPrintAliasTarget("/print/all")).toBe("/schools/field/print/all");
    expect(fieldPrintAliasTarget("/print/curriculum")).toBe(
      "/schools/field/print/curriculum",
    );
    expect(fieldPrintAliasTarget("/print/invisible-trail")).toBe(
      "/schools/field/print/invisible-trail",
    );
    expect(fieldPrintAliasTarget("/print/invisible-trail.html")).toBe(
      "/schools/field/print/invisible-trail.html",
    );
    expect(fieldPrintAliasTarget("/print/f2/")).toBe("/schools/field/print/f2");
  });

  it("maps a lesson planner short link", () => {
    const slug = CANONICAL_SESSIONS[0]?.slug;
    expect(slug).toBeTruthy();
    expect(fieldPrintAliasTarget(`/print/${slug}`)).toBe(
      `/schools/field/print/${slug}`,
    );
  });

  it("leaves unknown short paths unmapped", () => {
    expect(fieldPrintAliasTarget("/print/not-a-pack")).toBeNull();
    expect(fieldPrintAliasTarget("/print")).toBeNull();
    expect(fieldPrintAliasTarget("/schools/field/print/f2")).toBeNull();
  });

  it("only lists real pack slugs", () => {
    expect(FIELD_PRINT_PACK_SLUGS).toContain("f2");
    expect(FIELD_PRINT_PACK_SLUGS).toContain("years-7-8");
    expect(FIELD_PRINT_PACK_SLUGS).toContain("relief");
  });
});

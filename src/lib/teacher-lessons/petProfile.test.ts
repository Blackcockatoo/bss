import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getAliasError,
  isPreferredDnaView,
  normaliseAlias,
  sanitizePetProfile,
  usePetProfileStore,
} from "./petProfile";

beforeEach(() => {
  window.localStorage.clear();
  usePetProfileStore.getState().reset();
});

afterEach(() => {
  window.localStorage.clear();
  usePetProfileStore.getState().reset();
});

describe("pet profile alias validation", () => {
  it("normalises trimmed, length-limited aliases", () => {
    expect(normaliseAlias("  Sparky  ")).toBe("Sparky");
    expect(normaliseAlias("")).toBeNull();
    expect(normaliseAlias("x".repeat(25))).toBeNull();
  });

  it("rejects identifier-like values", () => {
    expect(normaliseAlias("me@example.com")).toBeNull();
    expect(normaliseAlias("http://example.com")).toBeNull();
    expect(getAliasError("me@example.com")).toMatch(/made-up name/i);
    expect(getAliasError("")).toMatch(/add a short alias/i);
    expect(getAliasError("Pip")).toBeNull();
  });

  it("validates preferred DNA views", () => {
    expect(isPreferredDnaView("sigil")).toBe(true);
    expect(isPreferredDnaView("fourD")).toBe(true);
    expect(isPreferredDnaView("rainbow")).toBe(false);
  });
});

describe("pet profile store", () => {
  it("sets alias and preferred view", () => {
    usePetProfileStore.getState().setAlias("Comet");
    usePetProfileStore.getState().setPreferredDnaView("cascade");
    expect(usePetProfileStore.getState().alias).toBe("Comet");
    expect(usePetProfileStore.getState().preferredDnaView).toBe("cascade");
  });

  it("sanitises a corrupted persisted profile", () => {
    const clean = sanitizePetProfile({
      alias: "  Comet  ",
      preferredDnaView: "nonsense",
      updatedAt: "bad",
    });
    expect(clean.alias).toBe("Comet");
    expect(clean.preferredDnaView).toBeNull();
    expect(clean.updatedAt).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { evaluateRoute } from "./routePolicy";

function decide(surface: "school" | "studio", pathname: string) {
  return evaluateRoute({ surface, pathname });
}

describe("school surface route policy", () => {
  it("rewrites clean school URLs to internal implementations", () => {
    expect(decide("school", "/")).toEqual({
      type: "rewrite",
      pathname: "/schools",
    });
    expect(decide("school", "/field")).toEqual({
      type: "rewrite",
      pathname: "/schools/field",
    });
    expect(decide("school", "/lessons")).toEqual({
      type: "rewrite",
      pathname: "/schools/lessons",
    });
    expect(decide("school", "/start")).toEqual({
      type: "rewrite",
      pathname: "/school-game",
    });
    expect(decide("school", "/privacy")).toEqual({
      type: "rewrite",
      pathname: "/legal/privacy",
    });
  });

  it("keeps internally-supported school routes reachable", () => {
    expect(decide("school", "/schools").type).toBe("next");
    expect(decide("school", "/schools/docs/privacy-policy").type).toBe("next");
    expect(decide("school", "/school-game").type).toBe("next");
    expect(decide("school", "/legal/safety").type).toBe("next");
  });

  it("redirects blocked consumer routes to the school home", () => {
    for (const pathname of [
      "/wallet",
      "/body-forge",
      "/breeding",
      "/shop",
      "/pricing",
      "/identity",
      "/dna-hub",
      "/digital-dna",
      "/genome-explorer",
      "/pet",
      "/app",
      "/monkey-invaders",
    ]) {
      expect(decide("school", pathname)).toEqual({
        type: "redirect",
        pathname: "/",
      });
    }
  });

  it("never redirects shared assets", () => {
    expect(decide("school", "/icon.svg").type).toBe("next");
    expect(decide("school", "/manifest.webmanifest").type).toBe("next");
    expect(decide("school", "/_next/static/chunk.js").type).toBe("next");
    expect(decide("school", "/robots.txt").type).toBe("next");
  });

  it("does not create redirect loops from the home target", () => {
    // "/" rewrites (not redirects) and its target "/schools" is allowed, so a
    // blocked route -> "/" -> rewrite chain terminates.
    const blocked = decide("school", "/wallet");
    expect(blocked).toEqual({ type: "redirect", pathname: "/" });
    expect(decide("school", "/").type).toBe("rewrite");
  });
});

describe("studio surface route policy", () => {
  it("serves the full ecosystem", () => {
    for (const pathname of [
      "/",
      "/pet",
      "/body-forge",
      "/wallet",
      "/identity",
      "/school-game",
    ]) {
      expect(decide("studio", pathname).type).toBe("next");
    }
  });

  it("redirects old public school URLs to the school domain", () => {
    expect(decide("studio", "/schools")).toEqual({
      type: "redirect-external",
      url: "https://metapet.school/",
      permanent: true,
    });
    expect(decide("studio", "/schools/field")).toEqual({
      type: "redirect-external",
      url: "https://metapet.school/field",
      permanent: true,
    });
    expect(decide("studio", "/schools/parents")).toEqual({
      type: "redirect-external",
      url: "https://metapet.school/parents",
      permanent: true,
    });
  });

  it("lands unmapped deep school links on the school home", () => {
    expect(decide("studio", "/schools/docs/data-inventory")).toEqual({
      type: "redirect-external",
      url: "https://metapet.school/",
      permanent: true,
    });
  });
});

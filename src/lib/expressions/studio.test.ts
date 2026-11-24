import { describe, expect, it, vi, afterEach } from "vitest";
import { EXPRESSIONS, FORMS, loadPortraits } from "./studio";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";

afterEach(() => vi.unstubAllGlobals());

describe("expression studio contracts", () => {
  it("provides 24 unique templates across three existing forms", () => {
    expect(EXPRESSIONS).toHaveLength(24);
    expect(new Set(EXPRESSIONS.map(e=>e[0])).size).toBe(24);
    expect(FORMS).toEqual(["auralia","evolved","geometry"]);
  });
  it("rejects another pet's portrait and non-PNG data", () => {
    vi.stubGlobal("sessionStorage", {getItem:()=>JSON.stringify({version:1,petId:"pet-a",portraits:{auralia:"data:image/png;base64,YQ==",evolved:"data:image/svg+xml,bad"}})});
    expect(loadPortraits("pet-b")).toEqual({});
    expect(loadPortraits("pet-a")).toEqual({auralia:"data:image/png;base64,YQ=="});
  });
  it("does not unlock the classroom surface", () => {
    expect(isPathnameAllowedByPolicy("/expressions","core")).toBe(true);
    expect(isPathnameAllowedByPolicy("/expressions","field")).toBe(false);
    expect(isPathnameAllowedByPolicy("/expressions","schools")).toBe(false);
  });
});

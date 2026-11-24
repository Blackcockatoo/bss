import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, EXPRESSIONS, FORMS, getExpression, parseRecipe, sampleExpression, seedFor } from "./studio";
import { isPathnameAllowedByPolicy } from "@/lib/childSafeBaseline";
import { isAnalyticsAllowedPathname } from "@/lib/analyticsBoundary";
import { emptyCreativeData, clearCreativeData, loadCreativeData, saveCreativeData } from "@/components/expressions/projects";
import { animatedWebp, readWebpPixels } from "./webp";
import type { PersonalityTraits } from "@/genome/types";

const personality: PersonalityTraits = {
  energy: 55, social: 55, curiosity: 55, discipline: 55, affection: 55, independence: 55,
  playfulness: 55, loyalty: 55, temperament: "calm", quirks: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("expression studio contracts", () => {
  it("provides 24 unique performances with ordered keyframes and three adapters", () => {
    expect(EXPRESSIONS).toHaveLength(24);
    expect(new Set(EXPRESSIONS.map(e => e.id)).size).toBe(24);
    expect(FORMS).toEqual(["auralia", "evolved", "geometry"]);
    for (const item of EXPRESSIONS) {
      expect(Object.keys(item.capabilities)).toEqual([...FORMS]);
      expect(item.staticFrame).toBeGreaterThan(0);
      expect(item.staticFrame).toBeLessThan(1);
      const times = item.keyframes.map(frame => frame[0]);
      expect(times[0]).toBe(0);
      expect(times.at(-1)).toBe(1);
      expect(times.every((time, i) => i === 0 || time > times[i - 1])).toBe(true);
      expect(new Set(times.map(time => {
        const { x, y, angle, squash, lid, gazeX } = sampleExpression(item, time, DEFAULT_SETTINGS, personality, 1);
        return JSON.stringify({ x, y, angle, squash, lid, gazeX });
      })).size).toBeGreaterThanOrEqual(4);
    }
  });

  it("samples deterministic frames, loops to neutral, and respects reduced motion", () => {
    const expression = getExpression("lol")!;
    const seed = seedFor("companion");
    const sample = (time: number, motion = false) => sampleExpression(expression, time, DEFAULT_SETTINGS, personality, seed, motion);
    expect(sample(.57)).toEqual(sample(.57));
    expect(sample(.3)).not.toEqual(sample(.8));
    expect(sample(.57).lid).toBeLessThan(.2);
    expect(sample(0)).toMatchObject({ x: 0, y: 0, aura: 0 });
    expect(sample(1).y).toBeCloseTo(sample(0).y);
    expect(sample(.15, true)).toEqual(sample(.88, true));
    expect(sample(.57).particles).not.toEqual(sampleExpression(expression, .57, DEFAULT_SETTINGS, personality, seed + 1).particles);
  });

  it("scales celebration using the real personality values", () => {
    const e = getExpression("win")!;
    const low = sampleExpression(e, .4, DEFAULT_SETTINGS, { ...personality, energy: 15 }, 1);
    const high = sampleExpression(e, .4, DEFAULT_SETTINGS, { ...personality, energy: 90 }, 1);
    expect(high.y).toBeLessThan(low.y);
    expect(high.mouth).toBe(low.mouth);
  });

  it("validates declarative recipes and does not preserve arbitrary keys", () => {
    const valid = { version: 1, expressionId: "happy", settings: DEFAULT_SETTINGS };
    expect(parseRecipe(JSON.stringify({ ...valid, code: "globalThis.replaced = true;" }))).toEqual(valid);
    for (const invalid of ["garbage", "null", " ".repeat(4097), JSON.stringify({ ...valid, expressionId: "unregistered" }),
      JSON.stringify({ ...valid, settings: { ...DEFAULT_SETTINGS, duration: 10_000 } }),
      JSON.stringify({ ...valid, settings: { ...DEFAULT_SETTINGS, easing: "eval" } })]) {
      expect(() => parseRecipe(invalid)).toThrow();
    }
  });

  it("isolates saves by creature and leaves canonical persistence untouched when clearing", () => {
    localStorage.clear();
    localStorage.setItem("canonical-pet-test", "immutable");
    const data = { ...emptyCreativeData(), favorites: ["hello"] };
    saveCreativeData("pet-a", data);
    saveCreativeData("pet-b", { ...data, favorites: ["win"] });
    expect(loadCreativeData("pet-c")).toEqual(emptyCreativeData());
    expect(loadCreativeData("pet-a")).toEqual(data);
    expect(loadCreativeData("pet-b").favorites).toEqual(["win"]);
    clearCreativeData("pet-a");
    expect(loadCreativeData("pet-a")).toEqual(emptyCreativeData());
    expect(loadCreativeData("pet-b").favorites).toEqual(["win"]);
    expect(localStorage.getItem("canonical-pet-test")).toBe("immutable");
  });

  it("keeps the studio outside the schools, Field Mode and analytics surfaces", () => {
    expect(isPathnameAllowedByPolicy("/expressions", "core")).toBe(true);
    expect(isPathnameAllowedByPolicy("/expressions", "field")).toBe(false);
    expect(isPathnameAllowedByPolicy("/expressions", "schools")).toBe(false);
    expect(isAnalyticsAllowedPathname("/expressions")).toBe(false);
  });

  it("muxes frame pixels without carrying ancillary chunks", async () => {
    const file = Uint8Array.from([
      82, 73, 70, 70, 24, 0, 0, 0, 87, 69, 66, 80, // RIFF / WEBP
      73, 67, 67, 80, 0, 0, 0, 0, // ancillary chunk
      86, 80, 56, 76, 4, 0, 0, 0, 47, 0, 0, 0, // synthetic VP8L bytes
    ]);
    const frame = readWebpPixels(file);
    expect(frame.chunks).toHaveLength(1);
    const blob = animatedWebp(256, 256, [frame, frame], 70, false);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const container = new TextDecoder().decode(bytes);
    expect(container.slice(0, 4)).toBe("RIFF");
    expect(container.match(/ANMF/g)).toHaveLength(2);
    expect(container).not.toContain("ICCP");
    expect(() => readWebpPixels(file.subarray(0, file.length - 2))).toThrow();
  });
});

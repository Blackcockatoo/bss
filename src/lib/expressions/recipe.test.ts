import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS, EXPRESSIONS, QUICK_STYLES, SETTINGS_LIMITS, getExpression, parseRecipe, sampleExpression, variedSeed,
} from "./studio";
import { emptyCreativeData, loadCreativeData, saveCreativeData } from "@/components/expressions/projects";
import type { PersonalityTraits } from "@/genome/types";

const personality: PersonalityTraits = {
  energy: 60, social: 40, curiosity: 70, discipline: 50, affection: 55, independence: 45,
  playfulness: 65, loyalty: 50, temperament: "Curious", quirks: [],
};
const valid = { version: 1, expressionId: "fireworks", settings: { ...DEFAULT_SETTINGS, variation: 12 } };
const recipe = (patch: Record<string, unknown> = {}, settings: Record<string, unknown> = {}) =>
  JSON.stringify({ ...valid, ...patch, settings: { ...valid.settings, ...settings } });

afterEach(() => {
  delete (Object.prototype as Record<string, unknown>).polluted;
  localStorage.clear();
});

describe("animation recipes", () => {
  it("round-trips every control, including variation and keyframe timing", () => {
    const e = getExpression("fireworks")!;
    const timings = e.keyframes.map(k => k[0]);
    timings[1] = Number((timings[1] + .02).toFixed(3));
    const parsed = parseRecipe(recipe({}, { timings, easing: "spring", loop: false, speed: 1.7 }));
    expect(parsed.settings).toEqual({ ...valid.settings, timings, easing: "spring", loop: false, speed: 1.7 });
    expect(parseRecipe(JSON.stringify(parsed))).toEqual(parsed);
  });

  it("opens recipes saved before variation existed", () => {
    const { variation: _ignored, ...older } = valid.settings;
    expect(parseRecipe(JSON.stringify({ ...valid, settings: older })).settings.variation).toBe(0);
  });

  it("accepts every quick style as a valid recipe", () => {
    for (const style of Object.values(QUICK_STYLES)) {
      expect(() => parseRecipe(JSON.stringify({ ...valid, settings: { ...DEFAULT_SETTINGS, ...style } }))).not.toThrow();
    }
  });

  it("rejects corrupt, oversized and out-of-range recipes", () => {
    const hostile = [
      "", "{", "[]", "true", "1", '"recipe"', "{}", "\uFEFF{}",
      recipe({ version: 2 }), recipe({ version: "1" }), recipe({ expressionId: "constructor" }),
      recipe({ expressionId: "__proto__" }), recipe({ expressionId: ["happy"] }), JSON.stringify({ ...valid, settings: null }),
      JSON.stringify({ ...valid, settings: [] }),
      recipe({}, { speed: "1" }), recipe({}, { speed: null }), recipe({}, { speed: 1e999 }), recipe({}, { speed: -1 }),
      recipe({}, { energy: 99 }), recipe({}, { variation: 1.5 }), recipe({}, { variation: 1000 }), recipe({}, { variation: -1 }),
      recipe({}, { easing: "bounce" }), recipe({}, { easing: { toString: "spring" } }), recipe({}, { loop: "yes" }),
      recipe({}, { timings: [0, 1] }), recipe({}, { timings: "0,0.5,1" }),
      recipe({}, { timings: getExpression("fireworks")!.keyframes.map(() => 0) }),
      recipe({}, { timings: getExpression("fireworks")!.keyframes.map((k, i, all) => i === all.length - 1 ? 2 : k[0]) }),
      JSON.stringify({ ...valid, pad: "x".repeat(5000) }),
    ];
    for (const [index, text] of hostile.entries()) expect(() => parseRecipe(text), `#${index} ${text.slice(-120)}`).toThrow();
  });

  it("is declarative only: code-shaped values are never executed or kept", () => {
    const text = JSON.stringify({
      ...valid, code: "globalThis.hacked = true", onload: "alert(1)", markup: "<script>alert(1)</script>",
      settings: { ...valid.settings, script: "fetch('https://example.com')", style: "url(https://example.com/x.png)" },
    }).replace('"version"', '"__proto__":{"polluted":true},"version"');
    const parsed = parseRecipe(text);
    expect(Object.keys(parsed).sort()).toEqual(["expressionId", "settings", "version"]);
    expect(Object.keys(parsed.settings).sort()).toEqual(Object.keys({ ...DEFAULT_SETTINGS }).sort());
    expect(JSON.stringify(parsed)).not.toMatch(/script|fetch|alert|https?:/);
    expect((globalThis as Record<string, unknown>).hacked).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    for (const key of Object.keys(SETTINGS_LIMITS) as (keyof typeof SETTINGS_LIMITS)[]) {
      expect(typeof parsed.settings[key]).toBe("number");
    }
  });

  it("drops a corrupt saved recipe without losing the rest of the workspace", () => {
    saveCreativeData("pet-a", { ...emptyCreativeData(), favorites: ["wink"], recipe: parseRecipe(recipe()) });
    const raw = JSON.parse(localStorage.getItem("metapet:expressions:projects:v2:pet-a")!);
    raw.recipe.settings.speed = 50;
    localStorage.setItem("metapet:expressions:projects:v2:pet-a", JSON.stringify(raw));
    const loaded = loadCreativeData("pet-a");
    expect(loaded.recipe).toBeNull();
    expect(loaded.favorites).toEqual(["wink"]);
  });

  it("keeps every favourite when a whole catalogue is starred", () => {
    const favorites = EXPRESSIONS.map(e => e.id);
    saveCreativeData("pet-b", { ...emptyCreativeData(), favorites });
    expect(loadCreativeData("pet-b").favorites).toEqual(favorites);
  });
});

describe("seeded playback", () => {
  it("replays identically for the same variation and differs between variations", () => {
    const e = getExpression("fireworks")!;
    const frames = (variation: number) => Array.from({ length: 12 }, (_, i) =>
      sampleExpression(e, i / 12, { ...DEFAULT_SETTINGS, variation }, personality, variedSeed(1234, variation)));
    expect(frames(7)).toEqual(frames(7));
    expect(frames(7)).not.toEqual(frames(8));
    expect(variedSeed(1234, 0)).toBe(1234);
    expect(new Set(Array.from({ length: 1000 }, (_, i) => variedSeed(1234, i))).size).toBe(1000);
    for (const seed of [0, 1, 2 ** 32 - 1]) {
      const value = variedSeed(seed, 999);
      expect(Number.isInteger(value) && value >= 0 && value < 2 ** 32).toBe(true);
    }
  });
});

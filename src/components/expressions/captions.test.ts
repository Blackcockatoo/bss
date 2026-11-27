import { describe, expect, it } from "vitest";
import { ASPECTS, DEFAULT_CAPTION, captionLayout, fitText, textEm, type Caption } from "./ExpressionArt";
import { comicColumns, MAX_CAPTION } from "./projects";

const LONG = "When the class pet finally learns the dance and everyone in the room starts cheering really loudly together";

describe("caption fitting", () => {
  it("keeps short captions at the chosen size", () => {
    const fit = fitText("Me when…", 472, 32, 18, 3);
    expect(fit).toEqual({ lines: ["Me when…"], size: 32, truncated: false });
  });

  it("shrinks the font before dropping any words", () => {
    const fit = fitText(LONG, 472, 42, 18, 3);
    expect(fit.truncated).toBe(false);
    expect(fit.size).toBeLessThan(42);
    expect(fit.lines.join(" ")).toBe(LONG);
  });

  it("marks text that cannot fit even at the minimum size, with an ellipsis", () => {
    const fit = fitText("word ".repeat(MAX_CAPTION / 5).trim() + " end", 200, 42, 18, 2);
    expect(fit.truncated).toBe(true);
    expect(fit.lines).toHaveLength(2);
    expect(fit.lines[1].endsWith("…")).toBe(true);
    expect(fit.size).toBe(18);
  });

  it("measures glyph widths, so runs of wide letters still wrap inside the line", () => {
    const wide = "WWWWWWWW MMMMMMMM WWWWWWWW MMMMMMMM WWWWWWWW MMMMMMMM WWWWWWWW";
    const fit = fitText(wide, 280, 42, 18, 3);
    for (const line of fit.lines) expect(textEm(line) * fit.size).toBeLessThanOrEqual(280);
    expect(textEm("WWWW")).toBeGreaterThan(textEm("iiii") * 2);
  });

  it("never lets the top caption, bubble and bottom caption overlap", () => {
    for (const [width, height] of Object.values(ASPECTS)) {
      for (const size of [18, 32, 42]) {
        const caption: Caption = { ...DEFAULT_CAPTION, size, top: LONG, bottom: LONG, bubble: LONG };
        const layout = captionLayout(caption, width, height);
        const topBottom = layout.top.y + (layout.top.lines.length - 1) * layout.top.spacing + layout.top.size * .3;
        expect(layout.bubble.y).toBeGreaterThan(topBottom);
        const bubbleBottom = layout.bubble.y + layout.bubble.height + 25;
        expect(layout.bottom.y - layout.bottom.size).toBeGreaterThan(bubbleBottom);
      }
    }
  });
});

describe("comic layout", () => {
  it("reads 2 and 3 panels as one strip, 4 as 2×2 and 6 as 3×2", () => {
    expect([2, 3, 4, 6].map(comicColumns)).toEqual([2, 3, 2, 3]);
  });
});

describe("director props", () => {
  it("keep the moon in the sky band and the crystal beside the creature at every position", async () => {
    const { propPlacement } = await import("./ExpressionArt");
    for (let p = -55; p <= 55; p += 5) {
      const moon = propPlacement("moon", p);
      expect(moon.y + 32).toBeLessThan(90);
      expect(moon.x - 31).toBeGreaterThan(0);
      expect(moon.x + 31).toBeLessThan(512);
      const crystal = propPlacement("crystal", p);
      expect(Math.abs(crystal.x - 256)).toBeGreaterThanOrEqual(144);
      expect(crystal.x - 25).toBeGreaterThan(0);
      expect(crystal.x + 25).toBeLessThan(512);
    }
  });
});

// Frame-by-frame framing sweep at extreme Animation Lab settings: every expression on every form,
// imported as a declarative recipe, exported as a GIF, and every frame checked for content touching
// the border (a clipped creature, prop or particle). Opt-in and slow (~15 min).
// Usage: EXPRESSIONS_TEST_URL=http://127.0.0.1:3210 node scripts/sweep-expressions-extremes.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.EXPRESSIONS_TEST_URL ?? "http://127.0.0.1:3210";
const max = {
  speed: 2, energy: 1.5, amplitude: 1.45, squash: 1.5, rotation: 1.5, aura: 1.5, frequency: 2,
  ridiculousness: 1.7, scale: 1.1, translation: 1.45, density: 1.5, velocity: 1.5, phase: 0,
  duration: 1.5, capture: 1, variation: 999, easing: "spring", loop: true,
};
const COMBOS = {
  "all-max": max,
  "all-max-phase-half-smooth": { ...max, phase: .5, capture: -1, variation: 7, easing: "smooth" },
};
const only = process.env.SWEEP_COMBOS?.split(",");
const onlyIds = process.env.SWEEP_IDS?.split(",");
const saveDir = process.env.SWEEP_SAVE_DIR;
const forms = (process.env.SWEEP_FORMS ?? "Auralia,Evolved,Geometry").split(",");
const browser = await chromium.launch({ executablePath: process.env.EXPRESSIONS_CHROMIUM || undefined });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })).newPage();
page.setDefaultTimeout(60_000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.goto(origin + "/pet");
await page.getByRole("link", { name: "Open Expressions" }).waitFor();
await page.goto(origin + "/expressions");
await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
const ids = await page.locator("[data-expression-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id")));
assert.equal(ids.length, 120);
await page.getByRole("button", { name: "Animation Lab", exact: true }).click();
const clipped = [];
let exports = 0, frames = 0;
const started = Date.now();
for (const [name, settings] of Object.entries(COMBOS)) {
  if (only && !only.includes(name)) continue;
  for (const form of forms) {
    await page.getByRole("button", { name: form, exact: true }).click();
    for (const id of ids) {
      if (onlyIds && !onlyIds.includes(id)) continue;
      const recipe = JSON.stringify({ version: 1, expressionId: id, settings });
      await page.getByLabel("Import recipe").setInputFiles({ name: "extreme.json", mimeType: "application/json", buffer: Buffer.from(recipe) });
      const picker = page.getByRole("combobox", { name: "Expression", exact: true });
      for (let wait = 0; (await picker.inputValue()) !== id; wait++) {
        assert.ok(wait < 100, `recipe for ${id} was not applied`);
        await page.waitForTimeout(20);
      }
      const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download GIF", exact: true }).click()]);
      const data = (await readFile(await download.path())).toString("base64");
      const result = await page.evaluate(async data => {
        const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const decoder = new ImageDecoder({ data: bytes, type: "image/gif" });
        await decoder.tracks.ready;
        const count = decoder.tracks.selectedTrack.frameCount;
        const touching = [];
        for (let index = 0; index < count; index++) {
          const { image } = await decoder.decode({ frameIndex: index });
          const width = image.displayWidth, height = image.displayHeight;
          const context = new OffscreenCanvas(width, height).getContext("2d");
          context.drawImage(image, 0, 0);
          image.close();
          const pixels = context.getImageData(0, 0, width, height).data;
          const solid = (x, y) => pixels[(y * width + x) * 4 + 3] > 24;
          let edge = false;
          for (let x = 0; x < width && !edge; x++) edge = solid(x, 0) || solid(x, 1) || solid(x, height - 1) || solid(x, height - 2);
          for (let y = 0; y < height && !edge; y++) edge = solid(0, y) || solid(1, y) || solid(width - 1, y) || solid(width - 2, y);
          if (edge) touching.push(index);
        }
        decoder.close();
        return { count, touching };
      }, data);
      exports++;
      frames += result.count;
      if (result.touching.length && saveDir) await import("node:fs/promises").then(async fs => fs.copyFile(await download.path(), `${saveDir}/clipped-${form}-${id}.gif`));
      if (result.touching.length) clipped.push(`${name} ${form}/${id}: frames ${result.touching.join(",")} of ${result.count}`);
    }
  }
}
console.log(JSON.stringify({ exports, frames, minutes: +((Date.now() - started) / 60000).toFixed(1), clipped, errors }, null, 1));
await browser.close();
assert.deepEqual(clipped, []);
assert.deepEqual(errors, []);

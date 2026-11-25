// Pixel baselines for MetaPet Expressions.
//
// Rasterises the committed SVG baselines (src/components/expressions/__baselines__/*.svg,
// produced by visualBaseline.test.tsx from fixed genomes) in headless Chromium and
// compares them with the committed PNGs next to them. Run with --update after an
// intended visual change. No network access: the SVGs are local, self-contained files.
import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const dir = path.resolve("src/components/expressions/__baselines__");
const pngDir = path.join(dir, "png");
const update = process.argv.includes("--update");
const SIZE = 256;
// Mean absolute channel difference (0-255) and share of strongly changed pixels.
const MAX_MEAN = Number(process.env.BASELINE_MAX_MEAN ?? 1.5);
const MAX_CHANGED = Number(process.env.BASELINE_MAX_CHANGED ?? .01);

function compare(a, b) {
  assert.equal(a.width, b.width);
  assert.equal(a.height, b.height);
  let total = 0;
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let pixel = 0;
    for (let c = 0; c < 4; c++) {
      const d = Math.abs(a.data[i + c] - b.data[i + c]);
      total += d;
      pixel = Math.max(pixel, d);
    }
    if (pixel > 48) changed++;
  }
  return { mean: total / a.data.length, changed: changed / (a.width * a.height) };
}

const files = (await readdir(dir)).filter(name => name.endsWith(".svg")).sort();
assert.ok(files.length > 0, "No SVG baselines. Run the visualBaseline vitest first.");
await mkdir(pngDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
await page.route("**/*", route => route.abort()); // Baselines must not load anything.
const failures = [];
const report = [];
try {
  for (const name of files) {
    const svg = (await readFile(path.join(dir, name), "utf8")).replace("<svg ", `<svg width="${SIZE}" height="${SIZE}" `);
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:#000}svg{display:block}
      [data-expression-lattice]>svg>rect{display:none}</style>${svg}`);
    const shot = await page.locator("svg").first().screenshot({ animations: "disabled" });
    const target = path.join(pngDir, name.replace(/\.svg$/, ".png"));
    if (update || !existsSync(target)) {
      if (!update) failures.push(`${name}: missing PNG baseline`);
      else await writeFile(target, shot);
      continue;
    }
    const result = compare(PNG.sync.read(shot), PNG.sync.read(await readFile(target)));
    report.push({ name, mean: Number(result.mean.toFixed(3)), changed: Number(result.changed.toFixed(4)) });
    if (result.mean > MAX_MEAN || result.changed > MAX_CHANGED) {
      failures.push(`${name}: mean ${result.mean.toFixed(3)}, changed ${(result.changed * 100).toFixed(2)}%`);
      await writeFile(target.replace(/\.png$/, ".actual.png"), shot);
    }
  }
} finally {
  await browser.close();
}
if (update) console.log(`Wrote ${files.length} PNG baselines to ${pngDir}`);
else {
  const worst = report.reduce((max, item) => Math.max(max, item.mean), 0);
  console.log(`Compared ${report.length} baselines; worst mean difference ${worst.toFixed(3)}.`);
  assert.deepEqual(failures, [], "Visual baselines changed:\n" + failures.join("\n"));
  console.log("Expressions visual baselines match.");
}

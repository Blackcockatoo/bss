// Android-class performance profile for /expressions: 360x780 @3x, touch, CPU throttled 4x via CDP.
// Reports load-to-interactive, long tasks, preview frame rate, thumbnail fill, Lab control latency
// and export times. Usage: EXPRESSIONS_TEST_URL=http://127.0.0.1:3210 node scripts/profile-expressions-mobile.mjs
import { chromium } from "playwright";

const origin = process.env.EXPRESSIONS_TEST_URL ?? "http://127.0.0.1:3210";
const rate = Number(process.env.CPU_SLOWDOWN ?? 4);
const browser = await chromium.launch({ executablePath: process.env.EXPRESSIONS_CHROMIUM || undefined });
const context = await browser.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(120_000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.goto(origin + "/pet");
await page.getByRole("link", { name: "Open Expressions" }).waitFor();
// Calibration: the same fixed loop before and after throttling shows the slowdown actually applied.
const loop = () => page.evaluate(() => { const begin = performance.now(); let x = 0; for (let i = 0; i < 3e7; i++) x += Math.sqrt(i); return Math.round(performance.now() - begin + x * 0); });
const calibration = { unthrottledMs: await loop() };
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate });
calibration.throttledMs = await loop();
await page.addInitScript(() => {
  window.__longTasks = [];
  new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__longTasks.push(entry.duration); })
    .observe({ type: "longtask", buffered: true });
});

const result = { cpuSlowdown: rate, viewport: "360x780@3x", calibration };
let start = Date.now();
await page.goto(origin + "/expressions");
await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
result.studioReadyMs = Date.now() - start;
result.navigation = await page.evaluate(() => {
  const nav = performance.getEntriesByType("navigation")[0];
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  return { domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd), loadMs: Math.round(nav.loadEventEnd), fcpMs: fcp ? Math.round(fcp.startTime) : null };
});

// Preview frame rate while the default expression loops.
result.previewFps = await page.evaluate(() => new Promise(resolve => {
  let frames = 0;
  const begin = performance.now();
  const tick = now => { frames++; if (now - begin < 3000) requestAnimationFrame(tick); else resolve(Math.round(frames / ((now - begin) / 1000))); };
  requestAnimationFrame(tick);
}));

// Thumbnails: scroll the catalogue into view and time how many are drawn.
await page.locator("[data-expression-id]").first().scrollIntoViewIfNeeded();
start = Date.now();
await page.locator('[data-thumbnail="ready"]').nth(5).waitFor();
result.firstSixThumbnailsMs = Date.now() - start;
await page.waitForTimeout(5000);
result.thumbnailsReadyAfter5s = await page.locator('[data-thumbnail="ready"]').count();

// Lab: slider input to the next painted preview frame.
await page.getByRole("button", { name: "Animation Lab", exact: true }).click();
const slider = page.getByRole("slider", { name: /Speed/ }).first();
await slider.scrollIntoViewIfNeeded();
const latencies = [];
for (let index = 0; index < 5; index++) {
  latencies.push(await slider.evaluate((node, value) => new Promise(resolve => {
    const begin = performance.now();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(node, String(value));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(Math.round(performance.now() - begin))));
  }), index % 2 ? 0.7 : 1.6));
}
result.labInputToPaintMs = { median: latencies.sort((a, b) => a - b)[2], max: latencies.at(-1) };

// Exports from the Sticker view.
await page.getByRole("button", { name: "Stickers", exact: true }).click();
async function timedDownload(label, prepare) {
  await prepare?.();
  const begin = Date.now();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: label, exact: true }).click()]);
  await download.path();
  return Date.now() - begin;
}
result.pngExportMs = await timedDownload("Download PNG", () => page.getByRole("button", { name: "PNG pose", exact: true }).click());
result.gifExportMs = await timedDownload("Download GIF");
result.longTasks = await page.evaluate(() => ({ count: window.__longTasks.length, totalMs: Math.round(window.__longTasks.reduce((a, b) => a + b, 0)), maxMs: Math.round(Math.max(0, ...window.__longTasks)) }));
result.memoryMB = await page.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null);
result.errors = errors;
console.log(JSON.stringify(result, null, 1));
await browser.close();

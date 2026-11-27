import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { unzipSync } from "fflate";

const origin = process.env.EXPRESSIONS_TEST_URL ?? "http://127.0.0.1:3210";
const executablePath = process.env.EXPRESSIONS_CHROMIUM || undefined;
const args = process.env.EXPRESSIONS_CHROMIUM_ARGS?.split(" ").filter(Boolean);
const browser = await chromium.launch({ executablePath, args, headless: true });
const problems = [];
const results = [];

async function canonicalRecord(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("MetaPetRegistryDB", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      return await new Promise((resolve, reject) => {
        const req = db.transaction("petRecords").objectStore("petRecords").getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } finally { db.close(); }
  });
}

async function download(page, name) {
  const started = performance.now();
  const [file] = await Promise.all([
    page.waitForEvent("download", { timeout: 45_000 }),
    page.getByRole("button", { name, exact: true }).click(),
  ]).catch(async error => {
    const alerts = await page.locator("[role=alert]").allTextContents();
    throw new Error(`${name}: ${alerts.join(" ")} ${error.message}`);
  });
  assert.equal(await file.failure(), null);
  return { bytes: await readFile(await file.path()), time: Math.round(performance.now() - started) };
}

async function imageMetrics(page, bytes, mime) {
  return page.evaluate(async ({ base64, mime }) => {
    const raw = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const blob = new Blob([raw], { type: mime });
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const rgba = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let nonempty = 0;
    let border = 0;
    for (let y = 0; y < bitmap.height; y++) {
      for (let x = 0; x < bitmap.width; x++) {
        if (rgba[(y * bitmap.width + x) * 4 + 3] > 24) {
          nonempty++;
          if (x < 2 || y < 2 || x >= bitmap.width - 2 || y >= bitmap.height - 2) border++;
        }
      }
    }
    let frames;
    let distinctFrames;
    if (mime !== "image/png" && typeof ImageDecoder === "function" && await ImageDecoder.isTypeSupported(mime)) {
      const decoder = new ImageDecoder({ data: raw, type: mime });
      await decoder.tracks.ready;
      frames = decoder.tracks.selectedTrack.frameCount;
      const bitmapAt = async frameIndex => {
        const { image } = await decoder.decode({ frameIndex });
        const temp = new OffscreenCanvas(bitmap.width, bitmap.height);
        const c = temp.getContext("2d");
        c.drawImage(image, 0, 0);
        image.close();
        return c.getImageData(0, 0, bitmap.width, bitmap.height).data;
      };
      const first = await bitmapAt(0);
      const middle = await bitmapAt(Math.floor(frames / 2));
      distinctFrames = first.some((value, index) => value !== middle[index]);
      decoder.close();
    }
    return { width: bitmap.width, height: bitmap.height, nonempty, border, frames, distinctFrames };
  }, { base64: bytes.toString("base64"), mime });
}

/** Lists PNG chunk types so exports can be checked for metadata (tEXt, iTXt, zTXt, eXIf, tIME...). */
function pngChunks(bytes) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const chunks = [];
  for (let at = 8; at < bytes.length;) {
    const length = bytes.readUInt32BE(at);
    chunks.push(bytes.subarray(at + 4, at + 8).toString("latin1"));
    at += 12 + length;
  }
  return chunks;
}

function assertPixelsOnly(bytes) {
  const allowed = new Set(["IHDR", "IDAT", "IEND", "sRGB", "gAMA", "cHRM", "pHYs"]);
  const chunks = pngChunks(bytes);
  assert.deepEqual(chunks.filter(type => !allowed.has(type)), [], `unexpected PNG chunks ${chunks}`);
}

/** Decodes every frame of an animation and counts frames with opaque pixels on the 2px border. */
async function animatedFraming(page, bytes) {
  return page.evaluate(async base64 => {
    const raw = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const decoder = new ImageDecoder({ data: raw, type: "image/gif" });
    await decoder.tracks.ready;
    const frames = decoder.tracks.selectedTrack.frameCount;
    let border = 0;
    for (let index = 0; index < frames; index++) {
      const { image } = await decoder.decode({ frameIndex: index });
      const width = image.displayWidth;
      const height = image.displayHeight;
      const ctx = new OffscreenCanvas(width, height).getContext("2d");
      ctx.drawImage(image, 0, 0);
      image.close();
      const rgba = ctx.getImageData(0, 0, width, height).data;
      let hit = false;
      for (let y = 0; y < height && !hit; y++) {
        for (let x = 0; x < width; x++) {
          if ((x < 2 || y < 2 || x >= width - 2 || y >= height - 2) && rgba[(y * width + x) * 4 + 3] > 24) { hit = true; break; }
        }
      }
      if (hit) border++;
    }
    decoder.close();
    return { frames, border };
  }, bytes.toString("base64"));
}

async function verifyPreviewFidelity(page, png) {
  // Render both the deterministic PNG pose and downloaded pixels against the
  // same CSS backdrop. A screenshot regression catches selector/clip bugs.
  const stage = page.getByRole("img", { name: /performing/ });
  const livePng = await stage.screenshot({ animations: "disabled" });
  const backdrop = await page.evaluate(async base64 => {
    const img = new Image();
    img.src = "data:image/png;base64," + base64;
    await img.decode();
    const stage = document.querySelector("svg[aria-label*='performing']");
    const width = Math.round(stage.getBoundingClientRect().width);
    const height = Math.round(stage.getBoundingClientRect().height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b1424";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png").split(",")[1];
  }, png.toString("base64"));
  const meanError = await page.evaluate(async inputs => {
    const load = async base64 => {
      const img = new Image();
      img.src = "data:image/png;base64," + base64;
      await img.decode();
      return img;
    };
    const [a, b] = await Promise.all(inputs.map(load));
    const size = Math.min(a.width, b.width, a.height, b.height);
    const group = [a, b].map(img => {
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      return ctx.getImageData(0, 0, size, size).data;
    });
    return group[0].reduce((sum, value, i) => sum + Math.abs(value - group[1][i]), 0) / group[0].length;
  }, [livePng.toString("base64"), backdrop]);
  assert.ok(meanError < 8, `preview-to-export mean colour difference ${meanError}`);
  return Number(meanError.toFixed(2));
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  page.on("pageerror", error => problems.push(error.message));
  await page.goto(origin + "/expressions");
  await page.getByText("Open My Pet to set up your companion first.").waitFor();
  assert.deepEqual(await canonicalRecord(page), []);
  await page.getByRole("link", { name: "Open My Pet" }).click();
  const studioLink = page.getByRole("link", { name: "Open Expressions" });
  const tutorial = page.getByRole("dialog", { name: "Meta-Pet tutorial" });
  await studioLink.waitFor();
  if (await tutorial.isVisible()) await tutorial.getByRole("button", { name: "Skip tutorial", exact: true }).click();
  await studioLink.click();
  await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
  // The My Pet route may still flush normal care state as it unmounts.
  // Verify the studio in a fresh load with no live pet runtime on the page.
  await page.reload();
  await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
  console.log("Opened live registered creature.");
  const before = await canonicalRecord(page);
  assert.equal(before.length, 1);
  const formPreference = await page.evaluate(() => localStorage.getItem("bss:meta-pet:pet-form:v1"));
  await page.getByRole("button", { name: "PNG pose", exact: true }).click();
  const forms = ["Auralia", "Evolved", "Geometry"];
  for (const [index, form] of forms.entries()) {
    if (index) {
      await page.getByRole("button", { name: form, exact: true }).click();
      await page.getByRole("button", { name: "PNG pose", exact: true }).click();
    }
    await page.getByRole("img", { name: `${form} performing Happy` }).waitFor();
    const png = await download(page, "Download PNG");
    assertPixelsOnly(png.bytes);
    const metrics = await imageMetrics(page, png.bytes, "image/png");
    assert.equal(metrics.width, 512);
    assert.equal(metrics.height, 512);
    assert.ok(metrics.nonempty > 1200 && metrics.nonempty < 200_000, JSON.stringify(metrics));
    assert.equal(metrics.border, 0);
    results.push({ form, pngMs: png.time, previewError: await verifyPreviewFidelity(page, png.bytes), pixels: metrics.nonempty });
    console.log("Verified", results.at(-1));
  }
  // Transparent PNG at every size on every form.
  for (const form of forms) {
    await page.getByRole("button", { name: form, exact: true }).click();
    await page.getByRole("button", { name: "PNG pose", exact: true }).click();
    for (const size of [256, 512, 1024]) {
      await page.getByLabel("PNG size").selectOption(String(size));
      const file = await download(page, "Download PNG");
      assertPixelsOnly(file.bytes);
      const metrics = await imageMetrics(page, file.bytes, "image/png");
      assert.equal(metrics.width, size);
      assert.equal(metrics.height, size);
      assert.equal(metrics.border, 0, `${form} ${size} touches the border`);
      assert.ok(metrics.nonempty < size * size * .8, `${form} ${size} is not transparent`);
      results.push({ form, size, transparentPixels: size * size - metrics.nonempty });
    }
  }
  console.log("Verified transparent PNG at 256/512/1024 on all three forms.");
  await page.getByLabel("PNG size").selectOption("512");

  // Every catalogued expression on every form exports a framed PNG pose.
  if (process.env.EXPRESSIONS_FULL_SWEEP === "1") {
    const ids = await page.locator("[data-expression-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id")));
    assert.equal(ids.length, 120);
    let swept = 0;
    const framing = [];
    for (const form of forms) {
      await page.getByRole("button", { name: form, exact: true }).click();
      for (const id of ids) {
        await page.locator(`[data-expression-id="${id}"]`).click();
        await page.getByRole("button", { name: "PNG pose", exact: true }).click();
        const metrics = await imageMetrics(page, (await download(page, "Download PNG")).bytes, "image/png");
        if (metrics.border !== 0) framing.push(`${form}/${id} touches the border (${metrics.border}px)`);
        if (metrics.nonempty <= 1200) framing.push(`${form}/${id} rendered nearly empty`);
        swept++;
      }
    }
    // Mid-animation framing: every frame of every looping GIF stays clear of the border.
    if (process.env.EXPRESSIONS_ANIMATION_SWEEP !== "0") {
      for (const form of forms) {
        await page.getByRole("button", { name: form, exact: true }).click();
        for (const id of ids) {
          await page.locator(`[data-expression-id="${id}"]`).click();
          const gifFile = await download(page, "Download GIF");
          const metrics = await animatedFraming(page, gifFile.bytes);
          if (metrics.frames < 10) framing.push(`${form}/${id} GIF has ${metrics.frames} frames`);
          if (metrics.border) framing.push(`${form}/${id} touches the border in ${metrics.border} frame(s)`);
          swept++;
        }
      }
    }
    assert.deepEqual(framing, []);
    results.push({ sweptExports: swept });
    console.log(`Swept ${swept} expression/form exports (PNG poses and every GIF frame).`);
    await page.getByRole("button", { name: "Auralia", exact: true }).click();
    await page.locator('[data-expression-id="happy"]').click();
    await page.getByRole("button", { name: "PNG pose", exact: true }).click();
  }

  // Thumbnails are cached per form and can be cleared and redrawn.
  await page.locator('[data-thumbnail="ready"]').first().waitFor();
  assert.ok(await page.evaluate(async () => (await caches.keys()).some(name => name.startsWith("metapet-expression-thumbs-"))));
  await page.getByRole("button", { name: "Clear thumbnail cache", exact: true }).click();
  await page.getByText("Thumbnail cache cleared.").waitFor();
  await page.locator('[data-thumbnail="ready"]').first().waitFor();
  console.log("Verified thumbnail cache clear and redraw.");

  // Search, packs, favourites and recents.
  const tiles = page.locator("[data-expression-id]");
  const search = page.getByRole("searchbox", { name: "Search expressions" });
  await search.fill("cake");
  assert.deepEqual(await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id"))), ["birthday"]);
  await search.fill("zzzz-no-such-expression");
  await page.getByText("No matching expressions.").waitFor();
  assert.equal(await tiles.count(), 0);
  await search.fill("");
  assert.equal(await tiles.count(), 120);
  await page.getByLabel("Browse pack").selectOption("Chaos");
  assert.equal(await tiles.count(), 10);
  await search.fill("whirl");
  assert.deepEqual(await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id"))), ["spin-out"]);
  await search.fill("");
  await page.getByLabel("Browse pack").selectOption("All");
  for (const id of ["oops", "high-five", "portal"]) await page.locator(`[data-expression-id="${id}"]`).click();
  await page.getByRole("button", { name: "Favourite this expression", exact: true }).click();
  await page.getByRole("button", { name: "Remove favourite", exact: true }).waitFor();
  await page.locator('[data-expression-id="wink"]').click();
  await page.getByRole("button", { name: "Favourite this expression", exact: true }).click();
  await page.getByLabel("Browse pack").selectOption("Recent");
  assert.deepEqual((await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id")))).slice(0, 4),
    ["wink", "portal", "high-five", "oops"]);
  await page.getByLabel("Browse pack").selectOption("Favourites");
  assert.deepEqual(await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id"))), ["wink", "portal"]);
  // Favourites and recents survive a reload (local creative storage only).
  await page.reload();
  await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
  await page.getByLabel("Browse pack").selectOption("Favourites");
  assert.deepEqual(await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id"))), ["wink", "portal"]);
  await page.locator('[data-expression-id="portal"]').click();
  await page.getByRole("button", { name: "Remove favourite", exact: true }).click();
  assert.deepEqual(await tiles.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-expression-id"))), ["wink"]);
  await page.getByLabel("Browse pack").selectOption("All");
  await page.locator('[data-expression-id="happy"]').click();
  assert.equal(JSON.stringify(await canonicalRecord(page)) === JSON.stringify(before), true, "Browsing edited the canonical record.");
  console.log("Verified search, packs, favourites and recents.");
  // Export progress and cancellation, then recovery.
  // Start a GIF and cancel it from inside the page as soon as the Cancel control
  // renders, so the export is reliably still running when it is pressed.
  const sawProgress = await page.evaluate(async () => {
    const find = name => [...document.querySelectorAll("button")].find(item => item.textContent === name);
    find("Download GIF").click();
    for (let i = 0; i < 100; i++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      const cancel = find("Cancel export");
      if (cancel) {
        const progress = !!document.querySelector('progress[aria-label="Export progress"]');
        cancel.click();
        return progress;
      }
    }
    throw new Error("Cancel export never appeared");
  });
  await page.getByText("Export cancelled.").waitFor();
  assert.equal(sawProgress, true, "no progress bar while exporting");
  assert.equal(await page.getByRole("button", { name: "Download GIF", exact: true }).isEnabled(), true);
  console.log("Verified export progress, cancel and recovery.");
  const gif = await download(page, "Download GIF");
  const gifMetrics = await imageMetrics(page, gif.bytes, "image/gif");
  assert.ok(gifMetrics.frames > 5 && gifMetrics.distinctFrames);
  assert.equal(gifMetrics.border, 0);
  results.push({ gifMs: gif.time, gifFrames: gifMetrics.frames });
  console.log("Verified", results.at(-1));

  await page.getByRole("button", { name: "Export Vault" }).click();
  const webp = await download(page, "Download WebP");
  const webpMetrics = await imageMetrics(page, webp.bytes, "image/webp");
  assert.ok(webpMetrics.frames > 5 && webpMetrics.distinctFrames);
  assert.equal(webpMetrics.border, 0);
  results.push({ webpMs: webp.time, webpFrames: webpMetrics.frames });
  console.log("Verified", results.at(-1));

  const zip = await download(page, "Download ZIP");
  // Every pack has ten stickers.
  const packFiles = Object.keys(unzipSync(zip.bytes));
  assert.equal(packFiles.length, 10, packFiles.join());
  await page.getByRole("button", { name: "Prepare sticker sheet" }).click();
  await page.getByRole("button", { name: "Print prepared page" }).waitFor();
  await page.emulateMedia({ media: "print" });
  await page.locator("#expressions-print").waitFor({ state: "visible" });
  await page.emulateMedia({ media: "screen" });

  await page.getByRole("button", { name: "Meme Machine" }).click();
  await page.getByLabel("Template").selectOption("3");
  await page.getByLabel("Aspect ratio").selectOption("landscape");
  await page.getByLabel("Bubble text").fill("Local caption");
  const meme = await download(page, "Download PNG");
  assert.equal((await imageMetrics(page, meme.bytes, "image/png")).width, 640);

  await page.getByRole("button", { name: "Comics", exact: true }).click();
  await page.getByLabel("Number of panels").selectOption("3");
  await page.getByRole("button", { name: "Panel 2", exact: true }).click();
  await page.getByLabel("Panel form").selectOption("evolved");
  await page.getByRole("textbox", { name: "Panel text", exact: true }).fill("Keep exploring");
  await page.getByRole("button", { name: "Move earlier" }).click();
  await page.getByRole("button", { name: "Save comic" }).click();
  const comic = await download(page, "Download comic");
  assert.equal((await imageMetrics(page, comic.bytes, "image/png")).width, 1576); // three panels read as one 3×1 strip
  await page.reload();
  await page.getByRole("button", { name: "Comics", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "Panel text", exact: true }).inputValue(), "Keep exploring");

  await page.getByRole("button", { name: "Animation Lab" }).click();
  // Real-time feedback: the readout follows the playhead.
  await page.getByLabel("Expression", { exact: true }).selectOption("fireworks");
  const readoutTime = page.locator('[data-readout="time"]');
  await readoutTime.waitFor();
  const firstTime = await readoutTime.textContent();
  await page.waitForTimeout(400);
  assert.notEqual(await readoutTime.textContent(), firstTime, "readout did not follow playback");
  // Beginner quick styles.
  await page.getByRole("button", { name: "Wild", exact: true }).click();
  await page.getByText("Wild style applied.").waitFor();
  // Scrubbing holds a deterministic frame.
  await page.getByLabel("Scrub timeline").check();
  const playhead = page.getByRole("slider", { name: /Playhead/ });
  await playhead.fill("0.25");
  const stageShot = () => page.getByRole("img", { name: /performing/ }).screenshot({ animations: "disabled" });
  const scrubA = await stageShot();
  await page.waitForTimeout(250);
  assert.ok(scrubA.equals(await stageShot()), "scrubbed frame is not stable");
  const heldTime = await readoutTime.textContent();
  await playhead.fill("0.75");
  assert.ok(!scrubA.equals(await stageShot()), "scrubbing did not move the performance");
  assert.notEqual(await readoutTime.textContent(), heldTime);
  // Seeded variation changes particles but replays exactly.
  await playhead.fill("0.5");
  const variation0 = await stageShot();
  await page.getByRole("button", { name: "Next variation", exact: true }).click();
  assert.equal(await page.getByRole("spinbutton", { name: "Variation" }).inputValue(), "1");
  const variation1 = await stageShot();
  assert.ok(!variation0.equals(variation1), "variation did not change the seeded performance");
  await page.getByRole("button", { name: "Previous variation", exact: true }).click();
  assert.ok(variation0.equals(await stageShot()), "variation 0 did not replay identically");
  await page.getByRole("button", { name: "Next variation", exact: true }).click();
  // Recipes: save, reopen after reload, export and re-import.
  await page.getByRole("button", { name: "Save recipe" }).click();
  const exported = await download(page, "Export recipe");
  const exportedRecipe = JSON.parse(exported.bytes.toString("utf8"));
  assert.equal(exportedRecipe.expressionId, "fireworks");
  assert.equal(exportedRecipe.settings.variation, 1);
  assert.deepEqual(Object.keys(exportedRecipe).sort(), ["expressionId", "settings", "version"]);
  await page.reload();
  await page.getByRole("button", { name: "Animation Lab" }).click();
  await page.getByRole("button", { name: "Open saved recipe" }).click();
  await page.getByText("Recipe opened.").waitFor();
  assert.equal(await page.getByLabel("Expression", { exact: true }).inputValue(), "fireworks");
  assert.equal(await page.getByRole("spinbutton", { name: "Variation" }).inputValue(), "1");
  await page.getByRole("button", { name: "Reset controls", exact: true }).click();
  assert.equal(await page.getByRole("spinbutton", { name: "Variation" }).inputValue(), "0");
  await page.getByLabel("Import recipe").setInputFiles({ name: "recipe.json", mimeType: "application/json", buffer: exported.bytes });
  await page.getByText("Recipe opened.").waitFor();
  assert.equal(await page.getByRole("spinbutton", { name: "Variation" }).inputValue(), "1");
  for (const [name, text] of [
    ["out-of-range.json", JSON.stringify({ ...exportedRecipe, settings: { ...exportedRecipe.settings, speed: 99 } })],
    ["unknown.json", JSON.stringify({ ...exportedRecipe, expressionId: "<img src=x onerror=alert(1)>" })],
    ["huge.json", JSON.stringify({ ...exportedRecipe, pad: "x".repeat(6000) })],
  ]) {
    await page.getByLabel("Import recipe").setInputFiles({ name, mimeType: "application/json", buffer: Buffer.from(text) });
    await page.locator("main").getByRole("alert").waitFor();
    assert.equal(await page.getByRole("spinbutton", { name: "Variation" }).inputValue(), "1", `${name} changed the controls`);
  }
  console.log("Verified Animation Lab feedback, scrubbing, quick styles, variation and recipes.");
  await page.getByRole("button", { name: "Advanced controls" }).click();
  await page.getByRole("button", { name: "Save recipe" }).click();
  await page.getByRole("button", { name: "Open saved recipe" }).click();

  await page.getByLabel("Import recipe").setInputFiles({ name: "corrupt.json", mimeType: "application/json", buffer: Buffer.from("bad") });
  await page.locator("main").getByRole("alert").waitFor();
  assert.equal(JSON.stringify(await canonicalRecord(page)) === JSON.stringify(before), true, "Studio edited the canonical record.");
  assert.equal(await page.evaluate(() => localStorage.getItem("bss:meta-pet:pet-form:v1")), formPreference);

  await page.evaluate(() => {
    // Seed a known catalogue item as acquired in the test browser only.
    const id = "studio-scarf-test";
    localStorage.setItem("auralia-addon-storage", JSON.stringify({ version: 2, state: {
      addons: { [id]: {
        id, name: "Quantum Entanglement Scarf", category: "accessory",
        attachment: { anchorPoint: "back", offset: { x: -10, y: 0 }, scale: 1, rotation: 0, followAnimation: false },
        visual: { previewAsset: "/addons/epic/1008-quantum-entanglement-scarf.svg", colors: { primary: "#7c3aed" } },
      } },
      equipped: { accessory: id },
    } }));
  });
  await page.reload();
  await page.getByRole("button", { name: "Auralia", exact: true }).click();
  await page.locator("[data-addon-id='studio-scarf-test'] image").waitFor();
  await page.getByRole("button", { name: "PNG pose", exact: true }).click();
  const equipped = await download(page, "Download PNG");
  assert.ok((await imageMetrics(page, equipped.bytes, "image/png")).nonempty > 1000);
  assert.ok(await verifyPreviewFidelity(page, equipped.bytes) < 8);
  console.log("Verified an equipped SVG wardrobe asset in the PNG.");

  const mobile = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, reducedMotion: "reduce", storageState: await context.storageState({ indexedDB: true }) });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(origin + "/expressions");
  await mobilePage.getByRole("button", { name: "Geometry", exact: true }).tap();
  await mobilePage.getByRole("img", { name: "Geometry performing Happy" }).waitFor();
  assert.equal(await mobilePage.getByRole("button", { name: "Pause", exact: true }).count(), 0);
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  const box = await mobilePage.getByRole("button", { name: "Geometry", exact: true }).boundingBox();
  assert.ok(box.height >= 44);
  await mobilePage.getByRole("button", { name: "Animation Lab" }).tap();
  await mobilePage.keyboard.press("Tab");
  assert.equal(await mobilePage.evaluate(() => ["INPUT", "SELECT", "BUTTON", "A"].includes(document.activeElement.tagName)), true);
  await mobilePage.setViewportSize({ width: 640, height: 320 });
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  await mobile.close();

  if (process.env.EXPRESSIONS_TEST_LOCAL_HOSTS === "1") {
    // Chromium's Host override is restricted. Use the same proxy headers as Vercel.
    for (const headers of [
      ["x-forwarded-host: metapet.school"],
      ["cookie: metapet-field-mode=active"],
    ]) {
      const status = execFileSync("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "-H", headers[0], origin + "/expressions"], { encoding: "utf8" });
      assert.ok(["302", "307", "308"].includes(status), status);
    }
  }
  assert.deepEqual(problems, []);
  console.log(JSON.stringify(results, null, 2));
  console.log("Expressions browser workflow passed.");
} catch (error) {
  if (problems.length) console.error("Page errors:", problems);
  throw error;
} finally {
  await browser.close();
}

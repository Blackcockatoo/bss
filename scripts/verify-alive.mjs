import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const origin = process.env.ALIVE_TEST_URL ?? "http://127.0.0.1:3211";
const browser = await chromium.launch({
  executablePath: process.env.EXPRESSIONS_CHROMIUM || undefined,
  args: process.env.EXPRESSIONS_CHROMIUM_ARGS?.split(" ").filter(Boolean),
});
const problems = [];
const settings = "bss:meta-pet:pet-form:v1";
const toolkit = page => page.locator('details').filter({ hasText: "Creature performance" });
async function openPanel(page) {
  const panel = toolkit(page);
  if ((await panel.getAttribute("open")) === null) await panel.getByText("Creature performance", { exact: true }).click();
  return panel;
}
async function identity(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open("MetaPetRegistryDB", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    try {
      const pet = await new Promise((resolve, reject) => {
        const req = db.transaction("petRecords").objectStore("petRecords").getAll();
        req.onsuccess = () => resolve(req.result[0]);
        req.onerror = () => reject(req.error);
      });
      return { id: pet.petId, genome: pet.genome, proof: pet.registrationProof, stage: pet.evolution.state };
    } finally { db.close(); }
  });
}
async function dismissTutorial(page) {
  const skip = page.getByRole("button", { name: "Skip tutorial", exact: true });
  if (await skip.isVisible()) await skip.click();
}
const touch = (page, form) => page.locator(`[data-alive-touch="${form}"]`);
const cue = (page, id) => page.locator(`[data-alive-cue="${id}"]`).first();
async function activeReaction(page, exclude = "hello") {
  await page.locator(`[data-alive-cue]:not([data-alive-cue="${exclude}"])`).first().waitFor();
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();
  page.setDefaultTimeout(20_000);
  page.on("pageerror", error => problems.push(error.message));
  await page.goto(origin + "/pet");
  await touch(page, "auralia").waitFor();
  await dismissTutorial(page);
  const before = await identity(page);
  const panel = await openPanel(page);
  await panel.getByRole("button", { name: "Record performance", exact: true }).click();
  await touch(page, "auralia").click();
  await page.waitForTimeout(160);
  await touch(page, "auralia").click();
  await activeReaction(page);
  await panel.getByRole("combobox").selectOption("win");
  await panel.getByRole("button", { name: "Perform", exact: true }).click();
  await cue(page, "win").waitFor();
  await panel.getByRole("button", { name: "Stop and save recording", exact: true }).click();
  assert.deepEqual(await identity(page), before);
  await panel.getByRole("link", { name: "Open recorded performance", exact: true }).click();
  await page.getByRole("heading", { name: "Recorded performance", exact: true }).waitFor();
  const editor = page.getByRole("region", { name: "Recording", exact: true });
  assert.ok(await editor.getByRole("combobox").count() >= 2);
  await editor.getByRole("combobox").first().selectOption("stretching");
  await editor.getByRole("button", { name: "Save performance edits", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download GIF", exact: true }).click();
  const gif = await download;
  assert.match(gif.suggestedFilename(), /performance\.gif$/);
  const bytes = await readFile(await gif.path());
  assert.equal(bytes.subarray(0, 6).toString(), "GIF89a");
  assert.ok(bytes.length > 4000);
  assert.deepEqual(await identity(page), before);
  console.log("Recorded touch reactions, edited the same local take, and downloaded its GIF.");

  await page.getByRole("link", { name: "My Pet", exact: true }).first().click();
  await touch(page, "auralia").waitFor();
  await dismissTutorial(page);
  await page.getByRole("button", { name: /Advanced.*Mechanics Lab/ }).click();
  for (const [form, label] of [["evolved", "Evolved / Body Forge"], ["geometry", "Geometry / Sri Yantra"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await touch(page, form).waitFor();
    const controls = await openPanel(page);
    await controls.getByRole("combobox").selectOption("dance");
    await controls.getByRole("button", { name: "Perform", exact: true }).click();
    await cue(page, "dance").waitFor();
    await controls.getByRole("button", { name: "Pause motion", exact: true }).click();
    await cue(page, "dance").waitFor({ state: "detached" });
    assert.equal(await controls.getByRole("button", { name: "Perform", exact: true }).isDisabled(), true);
  }
  const geometryControls = toolkit(page);
  await geometryControls.getByRole("button", { name: "Resume motion", exact: true }).click();
  await geometryControls.getByRole("checkbox", { name: "Music interaction", exact: true }).check();
  await geometryControls.getByRole("button", { name: "Play genome rhythm", exact: true }).click();
  await cue(page, "dance").waitFor();
  await geometryControls.getByRole("button", { name: "Stop genome rhythm", exact: true }).click();
  assert.deepEqual(await identity(page), before);
  console.log("Verified native Evolved and Geometry performances, pause, and opt-in genome audio.");

  await geometryControls.getByText("Living interactions", { exact: true }).click();
  await geometryControls.getByRole("button", { name: "Mirror figure eight", exact: true }).click();
  await cue(page, "mirror-eight").waitFor();
  await geometryControls.getByRole("button", { name: "Moonlit garden", exact: true }).click();
  await touch(page, "geometry").scrollIntoViewIfNeeded();
  await page.locator('[data-alive-scene="moonlit-garden"]').waitFor();
  await page.locator("[data-alive-moth]").waitFor();
  await page.getByRole("button", { name: "Open Wardrobe", exact: true }).click();
  const wardrobe = page.getByRole("dialog", { name: "Living Wardrobe", exact: true });
  await wardrobe.getByRole("button", { name: /Old Vic State Mantle/ }).click();
  const mantle = page.locator('[data-alive-wardrobe="old-vic-state-mantle"]');
  await mantle.waitFor();
  await cue(page, "mantle-bow").waitFor();
  await wardrobe.getByRole("button", { name: "Close", exact: true }).click();
  await mantle.waitFor({ state: "detached" });
  assert.deepEqual(await identity(page), before);
  console.log("Verified native mirror cue, garden encounter and reversible Geometry mantle preview.");

  const mobile = await browser.newContext({
    viewport: { width: 360, height: 720 }, isMobile: true, hasTouch: true, reducedMotion: "reduce",
    storageState: await desktop.storageState({ indexedDB: true }),
  });
  const phone = await mobile.newPage();
  phone.setDefaultTimeout(20_000);
  phone.on("pageerror", error => problems.push(error.message));
  await phone.goto(origin + "/pet");
  await touch(phone, "geometry").waitFor();
  assert.equal(await phone.evaluate(key => localStorage.getItem(key), settings), "geometry");
  assert.equal(await touch(phone, "geometry").evaluate(node => getComputedStyle(node).touchAction), "pan-y");
  await touch(phone, "geometry").evaluate(node => {
    let released = 0;
    node.addEventListener("pointerup", () => { released = performance.now(); }, { once: true });
    const observer = new MutationObserver(() => {
      if (!released || !node.querySelector("[data-alive-cue]")) return;
      node.setAttribute("data-tested-response-ms", String(Math.round(performance.now() - released)));
      observer.disconnect();
    });
    observer.observe(node, { subtree: true, attributes: true, attributeFilter: ["data-alive-cue"] });
  });
  await touch(phone, "geometry").tap();
  await phone.locator("[data-alive-cue]").first().waitFor();
  console.log(`Touch to observed pose: ${await touch(phone, "geometry").getAttribute("data-tested-response-ms")} ms in Chromium mobile emulation.`);
  await phone.locator("[data-alive-cue]").first().waitFor({ state: "detached" });
  assert.equal(await phone.locator("[data-alive-touch]").count(), 1);
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  const mobPanel = await openPanel(phone);
  const target = await mobPanel.getByRole("button", { name: "Perform", exact: true }).boundingBox();
  assert.ok(target.height >= 44);
  await mobPanel.getByText("Living interactions", { exact: true }).click();
  await mobPanel.getByRole("button", { name: "Play three beats", exact: true }).tap();
  await mobPanel.getByText(/^Reply: three beats/).waitFor();
  await mobPanel.getByRole("checkbox", { name: "Remember greeting side" }).check();
  const habitKey = `metapet:alive:greeting:v1:${before.id}`;
  assert.equal(await phone.evaluate(key => localStorage.getItem(key), habitKey), "0");
  await mobPanel.getByRole("button", { name: "Reset greeting habit", exact: true }).click();
  await mobPanel.getByText("Greeting habit reset.", { exact: true }).waitFor();
  await mobPanel.getByRole("checkbox", { name: "Remember greeting side" }).uncheck();
  assert.equal(await phone.evaluate(key => localStorage.getItem(key), habitKey), null);
  console.log("Verified mobile reduced-motion beat reply and local greeting controls.");
  assert.deepEqual(await identity(phone), before);
  assert.deepEqual(problems, []);
  console.log("Verified 360px touch, vertical scrolling policy, reduced-motion recovery and identity preservation.");
} finally {
  await browser.close();
}

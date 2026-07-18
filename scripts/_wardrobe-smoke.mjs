/**
 * Wardrobe end-to-end smoke test (DOM-level, headless).
 *
 * Walks the manual-test list from the wardrobe brief against the real app:
 * fresh profile → default ownership → below-threshold lock → threshold
 * cross → single unlock event → equip → live render → refresh persistence
 * → unequip → refresh persistence.
 */
import { chromium } from "playwright";

// Override with CHROME_PATH when the environment provides its own build
// (e.g. sandboxes with a pre-installed browser); BASE_URL to target a
// non-default dev server.
const CHROME = process.env.CHROME_PATH;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];
console.log("smoke: starting");
// Internal deadline: report whatever completed instead of hanging silently.
const deadline = setTimeout(() => {
  console.log("smoke: DEADLINE HIT — partial results:");
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
  process.exit(2);
}, 150_000);
deadline.unref?.();
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error" && !msg.text().includes("va.vercel-scripts.com")) {
    consoleErrors.push(msg.text());
  }
});

// 1-2. Fresh profile: Sparkle Trail owned by default.
await page.goto(`${BASE}/pet`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
let persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
check(
  "fresh profile owns Sparkle Trail by default",
  persisted?.state?.inventory?.ownedItemIds?.includes("effect-sparkle") === true,
  JSON.stringify(persisted?.state?.inventory?.ownedItemIds),
);
check(
  "no unlock ceremony replays for default items",
  (persisted?.state?.inventory?.newlyUnlockedItemIds ?? []).length === 0,
);

// 3-4. Below threshold: 49 wins leaves Sacred Halo locked.
await page.evaluate(() => {
  const store = window.__bssMetaPetStore;
  for (let i = 0; i < 49; i++) store.getState().recordBattle("win", "smoke-test");
});
await page.waitForTimeout(800);
persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
check(
  "below threshold (49 wins): halo still locked, progress recorded",
  !persisted.state.inventory.ownedItemIds.includes("halo-sacred") &&
    persisted.state.progress.battle.wins === 49,
  `wins=${persisted.state.progress.battle.wins}`,
);

// 5-6. Cross the threshold: exactly one unlock event appears.
await page.evaluate(() => {
  window.__bssMetaPetStore.getState().recordBattle("win", "smoke-test");
});
await page.waitForTimeout(800);
persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
check(
  "crossing threshold grants Sacred Halo exactly once",
  persisted.state.inventory.ownedItemIds.filter((id) => id === "halo-sacred").length === 1,
);
check(
  "unlock history records the halo once",
  persisted.state.inventory.unlockHistory.filter((e) => e.itemId === "halo-sacred").length === 1,
);
const ceremonyVisible = await page
  .getByRole("dialog", { name: /new wardrobe item unlocked/i })
  .isVisible()
  .catch(() => false);
check("unlock ceremony dialog appears", ceremonyVisible);

// 7-8. Equip Now from the ceremony → renders on the live pet.
if (ceremonyVisible) {
  await page.getByRole("button", { name: /equip now/i }).click();
  await page.waitForTimeout(700);
}
let onPet = await page.evaluate(
  () => document.querySelector('[data-cosmetic-id="halo-sacred"]') !== null,
);
check("equipped halo renders on the live pet", onPet);

// 9-10. Refresh: ownership + equipment persist; ceremony does not replay.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
check(
  "after refresh: ownership and equipped slot persist",
  persisted.state.inventory.ownedItemIds.includes("halo-sacred") &&
    persisted.state.inventory.equippedBySlot.head === "halo-sacred",
);
const replay = await page
  .getByRole("dialog", { name: /new wardrobe item unlocked/i })
  .isVisible()
  .catch(() => false);
check("ceremony does not replay after refresh", !replay);
onPet = await page.evaluate(
  () => document.querySelector('[data-cosmetic-id="halo-sacred"]') !== null,
);
check("equipped halo still renders after refresh", onPet);

// 11-12. Unequip via the wardrobe panel → disappears immediately.
await page.goto(`${BASE}/app/activities?tab=cosmetics`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const unequipButton = page.getByRole("button", { name: /^unequip$/i }).first();
if (await unequipButton.isVisible().catch(() => false)) {
  await unequipButton.click();
  await page.waitForTimeout(500);
}
persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
check(
  "unequip clears the slot but keeps ownership",
  persisted.state.inventory.equippedBySlot.head === undefined &&
    persisted.state.inventory.ownedItemIds.includes("halo-sacred"),
);

// 13-14. Refresh again: still unequipped, still owned.
await page.goto(`${BASE}/pet`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);
persisted = await page.evaluate(() =>
  JSON.parse(window.localStorage.getItem("metapet-wardrobe-progression") ?? "null"),
);
onPet = await page.evaluate(
  () => document.querySelector('[data-cosmetic-id="halo-sacred"]') !== null,
);
check(
  "after second refresh: remains unequipped and owned; not rendered",
  persisted.state.inventory.equippedBySlot.head === undefined &&
    persisted.state.inventory.ownedItemIds.includes("halo-sacred") &&
    !onPet,
);

// Wardrobe panel shows real progress text (e.g. Vimana samples counter).
await page.goto(`${BASE}/app/activities?tab=cosmetics`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const panelText = await page.evaluate(() => document.body.innerText);
check(
  "wardrobe panel shows generated progress counters",
  /\d+\s*\/\s*100 Vimana samples/.test(panelText),
  (panelText.match(/\d+\s*\/\s*100 Vimana samples/) ?? ["not found"])[0],
);

check("no console/page errors during the whole flow", consoleErrors.length === 0,
  consoleErrors.slice(0, 3).join(" | "));

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} smoke checks passed`);
process.exit(failed === 0 ? 0 : 1);

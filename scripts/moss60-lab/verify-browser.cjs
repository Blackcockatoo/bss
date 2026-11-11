/* Optional browser smoke runner; Playwright is supplied by the caller, not
 * added to the app's dependency graph. Start the production server first. */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.MOSS60_PLAYWRIGHT_MODULE || "playwright");

const origin = process.env.MOSS60_TEST_ORIGIN || "http://127.0.0.1:3086";
const output = process.env.MOSS60_BROWSER_OUTPUT || "/tmp/moss60-browser";

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    ...(process.env.MOSS60_CHROMIUM_PATH ? { executablePath: process.env.MOSS60_CHROMIUM_PATH } : {}),
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"], headless: true,
  });
  const checks = [];
  let lastPage;
  try {
    for (const width of [1280, 360]) {
      const context = await browser.newContext({ viewport: { width, height: 950 }, acceptDownloads: true });
      const page = await context.newPage();
      lastPage = page;
      const setWidth = value => page.getByLabel("Window width", { exact: false }).evaluate((input, next) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(next));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(`${origin}/app/moss60-lab`, { waitUntil: "networkidle" });
      const run = page.getByRole("button", { name: "Run 600 steps", exact: true });
      await run.waitFor();
      await page.waitForFunction(() => document.querySelector('[data-testid="dna-fingerprint"]')?.textContent?.length === 64);
      const fingerprint = await page.getByTestId("dna-fingerprint").textContent();
      assert.equal(await page.getByRole("heading", { name: "DNA, in motion." }).count(), 1);
      assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
      await setWidth(5);
      assert.equal(await page.getByTestId("window-digits").textContent(), "13031");
      await run.click();
      assert.equal(await page.getByTestId("tick-count").textContent(), "600");
      await page.getByRole("combobox", { name: /^Environment/ }).selectOption("spark");
      await run.click();
      const expression = await page.getByTestId("expression-reading").textContent();
      assert.equal(await page.getByTestId("tick-count").textContent(), "1,200");
      await page.getByRole("button", { name: "Replay from start", exact: true }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("Replayed")));
      assert.equal(await page.getByTestId("expression-reading").textContent(), expression);
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export experiment", exact: true }).click();
      const download = await downloadPromise;
      const exportPath = path.join(output, `experiment-${width}.json`);
      await download.saveAs(exportPath);
      const exported = JSON.parse(await fs.readFile(exportPath, "utf8"));
      assert.equal(exported.events.reduce((total, event) => total + event.steps, 0), 1200);
      assert.equal(exported.dnaHash, fingerprint);
      await page.getByRole("button", { name: "Reset expression", exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-testid="tick-count"]')?.textContent === "0");
      assert.equal(await page.getByTestId("expression-reading").textContent(), "Expression 50.0%");
      await page.getByLabel("Import experiment file", { exact: true }).setInputFiles(exportPath);
      await page.waitForFunction(() => document.querySelector('[data-testid="tick-count"]')?.textContent === "1,200");
      assert.equal(await page.getByTestId("expression-reading").textContent(), expression);
      for (const shape of ["icosa", "dodeca", "ring"]) await page.getByRole("combobox", { name: /^Spatial view/ }).selectOption(shape);
      await page.getByRole("combobox", { name: /^Atlas source/ }).selectOption("lukus");
      await setWidth(12);
      assert.equal((await page.getByTestId("window-digits").textContent()).length, 12);
      await page.getByRole("combobox", { name: /^Atlas source/ }).selectOption("specimen");
      await setWidth(60);
      assert.equal((await page.getByTestId("window-digits").textContent()).length, 60);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Long window overflows");
      assert.equal(await page.getByTestId("dna-fingerprint").textContent(), fingerprint);
      await page.getByLabel("Import experiment file", { exact: true }).setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("{}") });
      await page.getByRole("alert").filter({ hasText: "Unsupported experiment file" }).waitFor();
      assert.equal(await page.getByTestId("tick-count").textContent(), "1,200");
      await run.click();
      assert.equal(await page.getByTestId("tick-count").textContent(), "1,800");
      await setWidth(7);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(output, `observatory-${width}.png`), fullPage: true });
      assert.deepEqual(errors, [], "Browser script errors");
      checks.push({ width, passed: true, finalTick: 1800, scriptErrors: errors.length, overflow: false });
      await context.close();
    }
    // Load a real registered companion in an isolated browser, return using
    // client navigation, then prove lab actions preserve its persisted record.
    const petContext = await browser.newContext();
    const petPage = await petContext.newPage();
    lastPage = petPage;
    await petPage.goto(`${origin}/app/moss60-lab`, { waitUntil: "networkidle" });
    await petPage.locator('a[href="/pet"]').first().click();
    await petPage.waitForURL("**/pet");
    const readRecords = async () => {
      if (!(await indexedDB.databases()).some(db => db.name === "MetaPetRegistryDB")) return null;
      return new Promise((resolve, reject) => {
        const opening = indexedDB.open("MetaPetRegistryDB");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const request = db.transaction("petRecords", "readonly").objectStore("petRecords").getAll();
          request.onsuccess = () => { db.close(); resolve(JSON.stringify(request.result)); };
          request.onerror = () => { db.close(); reject(request.error); };
        };
      });
    };
    let registered = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const records = await petPage.evaluate(readRecords);
      if (records && JSON.parse(records).length > 0) { registered = true; break; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(registered, "The existing pet route did not create a registered companion");
    await petPage.goBack({ waitUntil: "networkidle" });
    const copyButton = petPage.getByRole("button", { name: "Copy active pet DNA", exact: true });
    await copyButton.click();
    await petPage.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("Copied active pet DNA")));
    const before = await petPage.evaluate(readRecords);
    await petPage.getByRole("button", { name: "Run 600 steps", exact: true }).click();
    await petPage.getByRole("button", { name: "Replay from start", exact: true }).click();
    await petPage.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(node => node.textContent.includes("Replayed")));
    assert.equal(await petPage.evaluate(readRecords), before, "Saved registered pet changed");
    assert.equal(JSON.parse(before).length, 1);
    await petContext.close();

    // Request-level checks use the production proxy and preserve its policy.
    const request = await browser.newContext();
    const school = await request.request.get(`${origin}/app/moss60-lab`, { headers: { "x-forwarded-host": "metapet.school" }, maxRedirects: 0 });
    assert.equal(school.status(), 307);
    assert.equal(new URL(school.headers().location).pathname, "/schools/field");
    await request.close();
    await fs.writeFile(path.join(output, "verification.json"), JSON.stringify({ checks, schoolHostRedirect: true, registeredPetUnchanged: true }, null, 2));
    console.log(JSON.stringify({ checks, schoolHostRedirect: true, registeredPetUnchanged: true }, null, 2));
  } catch (error) {
    if (lastPage && !lastPage.isClosed()) {
      await lastPage.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
      await fs.writeFile(path.join(output, "failure.txt"), await lastPage.locator("body").innerText());
    }
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

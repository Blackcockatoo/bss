import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { chromium } = await import(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/playwright-core/index.mjs");
const browser = await chromium.launch({ executablePath: process.env.METAPET_CHROMIUM, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const base = process.env.METAPET_BASE_URL || "http://localhost:3000";
const results = [];
const errors = [];
const output = "/tmp/metapet-surface-checks";
await fs.mkdir(output, { recursive: true });
async function open(page, route) {
  const response = await page.goto(base + route);
  assert.equal(response.status(), 200, route);
  await page.waitForLoadState("domcontentloaded");
  const tutorial = page.getByRole("dialog", { name: "Meta-Pet tutorial" });
  await tutorial.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
  if (await tutorial.isVisible()) await tutorial.getByRole("button", { name: "Skip tutorial", exact: true }).click();
  const privacy = page.getByRole("button", { name: "Privacy & local saves" });
  await privacy.click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some(button => button.textContent.includes("Privacy & local saves") && button.getAttribute("aria-expanded") === "true"));
  await privacy.click();
  assert.equal(await page.locator("[data-nextjs-dialog]").count(), 0);
  assert.ok((await page.locator("body").innerText()).length > 100);
  const width = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert.ok(width.actual <= width.viewport + 1, route + " has horizontal overflow");
}
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", error => errors.push({ route: page.url(), error: error.message }));
    for (const route of ["/pet", "/app/passport", "/teach", "/teach/lab", "/teachers"]) {
      await open(page, route);
      if (route.startsWith("/teach")) {
        await page.getByRole("navigation", { name: "Teacher workspace" }).waitFor();
        assert.equal(await page.getByRole("navigation", { name: "Meta-Pet navigation" }).count(), 0);
      } else {
        const links = await page.locator("a").evaluateAll(nodes => nodes.map(n => n.getAttribute("href") || ""));
        assert.ok(!links.some(href => /^\/(teach|teachers|schools|school-game)(\/|$)/.test(href)), route + " exposes teacher links");
        if (route === "/app/passport") assert.ok(!(await page.locator("body").innerText()).includes("For teachers:"));
      }
      await page.screenshot({ path: output + "/" + route.replaceAll("/", "-") + "-" + viewport.width + ".png" });
      results.push({ route, viewport: viewport.width, passed: true });
    }
    await context.close();
    const school = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const student = await school.newPage();
    student.on("pageerror", error => errors.push({ route: student.url(), error: error.message }));
    await open(student, "/schools/field");
    await student.getByRole("link", { name: "Open student activities" }).click();
    await student.getByRole("heading", { name: "Discover with MetaPet" }).waitFor();
    const activity = student.locator('a[href^="/schools/field/play/"]').filter({ has: student.locator("h2") }).first();
    await activity.click();
    await student.getByRole("navigation", { name: "Classroom activities" }).waitFor();
    await student.waitForLoadState("domcontentloaded");
    for (const name of [/teacher prompt/i, /expected outcome/i, /reset lesson/i, /finish early/i]) {
      assert.equal(await student.getByRole("button", { name }).count(), 0, String(name));
    }
    assert.equal(await student.getByRole("group", { name: "View mode" }).count(), 0);
    const studentLinks = await student.locator("a").evaluateAll(nodes => nodes.map(n => n.getAttribute("href") || ""));
    assert.ok(studentLinks.every(href => href.startsWith("/schools/field/play")), "student activity exposes admin destinations");
    assert.equal(await student.getByRole("navigation", { name: "Teacher workspace" }).count(), 0);
    const more = student.getByRole("button", { name: /more/i });
    if (await more.isVisible()) {
      await more.click();
      assert.equal(await student.getByRole("button", { name: /teacher prompt/i }).count(), 0);
      await more.click();
    }
    await student.screenshot({ path: output + "/student-" + viewport.width + ".png" });
    await student.getByRole("link", { name: "My passport" }).click();
    await student.waitForLoadState("domcontentloaded");
    assert.ok(!(await student.locator("body").innerText()).includes("For teachers:"));
    results.push({ route: "school → student activity → passport", viewport: viewport.width, passed: true });
    await school.close();
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(output + "/results.json", JSON.stringify({ results, errors }, null, 2));
  console.log(JSON.stringify({ checks: results.length, errors }));
} finally { await browser.close(); }

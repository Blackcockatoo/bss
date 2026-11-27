// Accessibility pass for /expressions: axe-core (WCAG 2.1 A/AA) on every studio mode at desktop
// and 360px, plus keyboard checks (reachability, visible focus, no trap, Enter/Space activation).
// Usage: EXPRESSIONS_TEST_URL=http://127.0.0.1:3210 node scripts/audit-expressions-a11y.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.EXPRESSIONS_TEST_URL ?? "http://127.0.0.1:3210";
const axeSource = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const MODES = ["Stickers", "Animation Lab", "Meme Machine", "Comics", "Director", "Export Vault"];
const browser = await chromium.launch({ executablePath: process.env.EXPRESSIONS_CHROMIUM || undefined });
const findings = [];
const shots = process.env.EXPRESSIONS_SHOTS;

async function open(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  await page.goto(origin + "/pet");
  await page.getByRole("link", { name: "Open Expressions" }).waitFor();
  await page.goto(origin + "/expressions");
  await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
  return page;
}

async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    // Fixed bars overlap scrolled content and leave axe unable to resolve backgrounds ("incomplete"),
    // so audit them once in place, then hide them while checking the studio underneath.
    const fixed = [...document.querySelectorAll("body *")].filter(node => getComputedStyle(node).position === "fixed");
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
    const chrome = await window.axe.run(document, { runOnly: { type: "tag", values: tags } });
    const shown = fixed.map(node => [node, node.style.visibility]);
    for (const [node] of shown) node.style.visibility = "hidden";
    // Scroll regions clip their off-screen items, which axe also reports as obscured; unclip them.
    const clipped = [...document.querySelectorAll("main *")].filter(node => /auto|scroll|hidden/.test(getComputedStyle(node).overflowY))
      .map(node => [node, node.style.cssText]);
    for (const [node] of clipped) { node.style.maxHeight = "none"; node.style.overflow = "visible"; }
    const studio = await window.axe.run(document.querySelector("main") ?? document.body, { runOnly: { type: "tag", values: tags } });
    for (const [node, css] of clipped) node.style.cssText = css;
    for (const [node, visibility] of shown) node.style.visibility = visibility;
    const pack = v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => n.target.join(" ")), count: v.nodes.length });
    const seen = new Set();
    const violations = [...chrome.violations, ...studio.violations].map(pack).filter(v => {
      const key = v.id + v.nodes.join();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const pending = studio.incomplete.filter(v => v.id === "color-contrast").flatMap(v => v.nodes);
    const unresolved = pending.length;
    const unresolvedNodes = pending.slice(0, 4).map(n => `${n.target.join(" ")} — ${(n.any[0]?.message ?? "").slice(0, 90)}`);
    return { violations, unresolved, unresolvedNodes, passed: studio.passes.length + chrome.passes.length };
  });
  if (result.unresolved) findings.push({ where: label, id: "contrast-unresolved", impact: "review", help: "Text whose contrast axe could not resolve (gradients, images or overlap)", nodes: result.unresolvedNodes, count: result.unresolved });
  stats.axeRuns++; stats.rulesPassed += result.passed;
  result.violations.forEach(violation => findings.push({ where: label, ...violation }));
  return result.violations;
}

const stats = { axeRuns: 0, rulesPassed: 0, tabStops: 0, distinctTabTargets: 0 };
try {
  for (const view of [{ name: "desktop", viewport: { width: 1280, height: 900 } },
    { name: "360px", viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true }]) {
    const context = await browser.newContext({ viewport: view.viewport, isMobile: view.isMobile, hasTouch: view.hasTouch });
    const page = await open(context);
    for (const mode of MODES) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      await page.waitForTimeout(300);
      await axe(page, `${view.name}/${mode}`);
    }
    // Content hidden behind the fixed bottom navigation on phones is unreachable for touch users.
    if (view.isMobile) {
      const covered = await page.evaluate(() => {
        const nav = [...document.querySelectorAll("nav")].find(node => getComputedStyle(node).position === "fixed" && node.getBoundingClientRect().bottom >= innerHeight - 2);
        if (!nav) return null;
        window.scrollTo(0, document.documentElement.scrollHeight);
        const navTop = nav.getBoundingClientRect().top;
        const last = [...document.querySelectorAll("main button, main a, main input, main select")].filter(node => node.offsetParent).at(-1);
        return last ? { navTop, lastBottom: last.getBoundingClientRect().bottom, label: last.textContent?.trim().slice(0, 40) } : null;
      });
      if (covered && covered.lastBottom > covered.navTop) findings.push({ where: `${view.name}/layout`, id: "covered-by-bottom-nav", impact: "serious", help: `Last control "${covered.label}" sits under the fixed bottom navigation at full scroll`, nodes: [], count: 1 });
    }
    await context.close();
  }

  // Keyboard: every mode reachable by Tab with a visible focus indicator, activatable with Enter and Space.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await open(context);
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  const seen = new Map();
  let invisible = [];
  for (let step = 0; step < 220; step++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node === document.body) return null;
      const style = getComputedStyle(node);
      const visible = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0 || style.boxShadow !== "none";
      return { name: (node.getAttribute("aria-label") || node.textContent || node.getAttribute("name") || node.tagName).trim().slice(0, 40), tag: node.tagName, visible };
    });
    if (!info) continue;
    stats.tabStops++;
    seen.set(info.name, (seen.get(info.name) ?? 0) + 1);
    if (!info.visible) invisible.push(`${info.tag}:${info.name}`);
  }
  for (const mode of MODES) if (!seen.has(mode)) findings.push({ where: "keyboard", id: "mode-unreachable", impact: "serious", help: `${mode} not reachable with Tab`, nodes: [], count: 1 });
  stats.distinctTabTargets = seen.size;
  invisible = [...new Set(invisible)];
  if (invisible.length) findings.push({ where: "keyboard", id: "focus-not-visible", impact: "serious", help: "Focused controls without a visible focus indicator", nodes: invisible.slice(0, 12), count: invisible.length });
  const comics = page.getByRole("button", { name: "Comics", exact: true });
  await comics.focus();
  await page.keyboard.press("Enter");
  assert.equal(await comics.getAttribute("aria-pressed"), "true");
  const director = page.getByRole("button", { name: "Director", exact: true });
  await director.focus();
  await page.keyboard.press("Space");
  assert.equal(await director.getAttribute("aria-pressed"), "true");
  if (shots) await page.screenshot({ path: `${shots}/a11y-keyboard-focus.png` });
  await context.close();
} finally {
  await browser.close();
}

const summary = findings.reduce((all, f) => ({ ...all, [f.id]: (all[f.id] ?? 0) + f.count }), {});
console.log(JSON.stringify({ stats, summary, findings }, null, 1));
if (process.env.A11Y_STRICT === "1") assert.deepEqual(findings, [], "accessibility findings remain");

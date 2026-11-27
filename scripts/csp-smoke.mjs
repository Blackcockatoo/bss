#!/usr/bin/env node
/**
 * Browser check for the Content Security Policy.
 *
 * Loads key routes against a running production server (`npm run build &&
 * npm run start -- -p 3001`), and fails if:
 *  - a response lacks the expected CSP (nonce on app routes, no cdnjs);
 *  - the browser reports any CSP violation (console or
 *    `securitypolicyviolation` event, in any frame);
 *  - a page throws an uncaught error.
 *
 * Usage: node scripts/csp-smoke.mjs [baseUrl]
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const base = (process.argv[2] || process.env.CSP_SMOKE_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

const ROUTES = [
  { path: "/", nonce: true },
  { path: "/pet", nonce: true },
  { path: "/expressions", nonce: true },
  { path: "/teach", nonce: true },
  { path: "/schools/field", nonce: true },
  { path: "/app/moss60", nonce: true },
  { path: "/legal/privacy", nonce: true },
  { path: "/arcade", nonce: true },
  { path: "/geometry-sound", nonce: true, frame: "/geometry-sound.html", expectFrameGlobals: ["THREE", "Tone"] },
  { path: "/geometry-sound.html", nonce: false, expectGlobals: ["THREE", "Tone"] },
  { path: "/moss60-ultimate.html", nonce: false },
  { path: "/alchemest", nonce: true },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

const failures = [];
const report = [];

const browser = await chromium.launch();
try {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      // Fresh context per route: opening /schools/field sets the Field Mode
      // cookie, which would redirect every later route.
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      await context.addInitScript(() => {
        window.__cspViolations = [];
        document.addEventListener("securitypolicyviolation", (event) => {
          const entry = `${event.violatedDirective} blocked ${event.blockedURI || "inline"} (${event.sourceFile || "?"}:${event.lineNumber || 0})`;
          window.__cspViolations.push(entry);
          try {
            window.top.__cspViolations?.push(`[frame] ${entry}`);
          } catch {
            /* cross-origin frame */
          }
        });
      });
      const page = await context.newPage();
      const consoleCsp = [];
      const pageErrors = [];
      page.on("console", (msg) => {
        const text = msg.text();
        if (/content security policy|Content-Security-Policy|violates the following/i.test(text)) {
          consoleCsp.push(text);
        }
      });
      page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));

      const label = `${viewport.name} ${route.path}`;
      const response = await page.goto(`${base}${route.path}`, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(2500);

      const csp = (await response?.allHeaders())?.["content-security-policy"] || "";
      const nonce = /'nonce-([^']+)'/.exec(csp)?.[1] || null;
      if (!csp) failures.push(`${label}: no Content-Security-Policy header`);
      if (csp.includes("cdnjs")) failures.push(`${label}: CSP still allows cdnjs`);
      if (route.nonce) {
        if (!nonce) failures.push(`${label}: expected a nonce in script-src`);
        if (/script-src[^;]*'unsafe-inline'/.test(csp)) failures.push(`${label}: script-src allows 'unsafe-inline'`);
        const unnoncedInline = await page.evaluate(() =>
          Array.from(document.querySelectorAll("script:not([src])"))
            .filter((s) => !s.type || s.type === "text/javascript" || s.type === "module")
            .filter((s) => !s.nonce).length,
        );
        if (unnoncedInline > 0) failures.push(`${label}: ${unnoncedInline} inline script(s) without a nonce`);
      }
      for (const name of route.expectGlobals || []) {
        const present = await page.evaluate((n) => typeof window[n] !== "undefined", name);
        if (!present) failures.push(`${label}: expected global ${name} (vendored script did not load)`);
      }

      if (route.frame) {
        const frame = page.frames().find((f) => f.url().includes(route.frame));
        if (!frame) {
          failures.push(`${label}: iframe ${route.frame} not found`);
        } else {
          for (const name of route.expectFrameGlobals || []) {
            const present = await frame.evaluate((n) => typeof window[n] !== "undefined", name);
            if (!present) failures.push(`${label}: expected global ${name} in ${route.frame}`);
          }
        }
      }

      const violations = await page.evaluate(() => window.__cspViolations || []);
      for (const v of [...violations, ...consoleCsp]) failures.push(`${label}: CSP violation: ${v}`);
      for (const e of pageErrors) failures.push(`${label}: page error: ${e}`);

      report.push({
        route: label,
        status: response?.status(),
        finalUrl: page.url().replace(base, ""),
        nonce: Boolean(nonce),
        violations: violations.length + consoleCsp.length,
        pageErrors: pageErrors.length,
      });
      await page.close();
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.table(report);
if (failures.length) {
  console.error(`\nCSP smoke FAILED (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nCSP smoke passed: no CSP violations or page errors on any route.");

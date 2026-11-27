// Browser sweeps for the Meme Machine, Comic Creator and Director's Studio.
// Meme: every aspect × bubble style × alignment × font extreme with long and wide text; the real
//   rendered text must stay inside the artwork, inside its bubble, and never overlap other text.
// Comics: 2/3/4/6 panels, reorder, save, reload, reopen, PNG layout and the print preparation.
// Director: every background × prop × prop position × light on every form keeps the creature
//   central and unobstructed, and the creature stays distinguishable from the background.
// Usage: EXPRESSIONS_TEST_URL=http://127.0.0.1:3210 node scripts/sweep-expressions-phase6.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { PNG } from "pngjs";

const origin = process.env.EXPRESSIONS_TEST_URL ?? "http://127.0.0.1:3210";
const shots = process.env.EXPRESSIONS_SHOTS;
const only = process.env.PHASE6_ONLY?.split(",");
const browser = await chromium.launch({ executablePath: process.env.EXPRESSIONS_CHROMIUM || undefined });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(30_000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const problems = [];
const report = {};

async function openStudio() {
  await page.goto(origin + "/expressions");
  await page.getByRole("heading", { name: "Sticker Factory" }).waitFor();
}
const mode = name => page.getByRole("button", { name, exact: true }).click();
const select = (label, value) => page.getByRole("combobox", { name: label, exact: true }).selectOption(String(value));
const preview = () => page.locator('svg[role="img"][aria-label*="performing"]').first();
async function download(label) {
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: label, exact: true }).click()]);
  return PNG.sync.read(await readFile(await file.path()));
}

await page.goto(origin + "/pet");
await page.getByRole("link", { name: "Open Expressions" }).waitFor();
await openStudio();

if (!only || only.includes("meme")) {
  await mode("Meme Machine");
  const LONG = "When the class pet finally learns the dance and everyone in the room starts cheering really loudly together";
  const WIDE = "WWWWWWWW MMMMMMMM WWWWWWWW MMMMMMMM WWWWWWWW MMMMMMMM WWWWWWWW";
  const fill = async (label, value) => page.getByRole("textbox", { name: label, exact: true }).fill(value);
  let checked = 0, shortened = 0;
  for (const aspect of ["square", "portrait", "landscape"]) {
    await select("Aspect ratio", aspect);
    for (const style of ["speech", "thought", "narration"]) {
      await select("Bubble style", style);
      for (const align of ["left", "center", "right"]) {
        await select("Alignment", align);
        for (const size of [18, 42]) {
          await page.getByRole("slider", { name: /Font size/ }).fill(String(size));
          for (const text of [LONG, WIDE]) {
            await fill("Top caption", text);
            await fill("Bottom caption", text);
            await fill("Bubble text", text);
            await page.waitForTimeout(30);
            const measure = await preview().evaluate(svg => {
              const [, , width, height] = svg.getAttribute("viewBox").split(" ").map(Number);
              const box = node => { const b = node.getBBox(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }; };
              const part = name => svg.querySelector(`[data-caption="${name}"]`);
              const top = part("top"), bottom = part("bottom"), bubble = part("bubble");
              return {
                width, height,
                top: top && box(top), bottom: bottom && box(bottom),
                bubbleRect: bubble && box(bubble.querySelector("rect")), bubbleText: bubble && box(bubble.querySelector("text")),
              };
            });
            const where = `${aspect}/${style}/${align}/${size}/${text === WIDE ? "wide" : "long"}`;
            const inside = (b, name, slack = 1) => {
              if (!b) return;
              if (b.x < -slack || b.y < -slack || b.r > measure.width + slack || b.b > measure.height + slack) problems.push(`meme ${where}: ${name} leaves the artwork`);
            };
            inside(measure.top, "top caption"); inside(measure.bottom, "bottom caption"); inside(measure.bubbleRect, "bubble");
            const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
            if (measure.bubbleText && (measure.bubbleText.x < measure.bubbleRect.x - 1 || measure.bubbleText.r > measure.bubbleRect.r + 1 ||
              measure.bubbleText.b > measure.bubbleRect.b + 1)) problems.push(`meme ${where}: bubble text spills out of its bubble`);
            if (overlap(measure.top, measure.bubbleRect)) problems.push(`meme ${where}: top caption overlaps the bubble`);
            if (overlap(measure.bottom, measure.bubbleRect)) problems.push(`meme ${where}: bottom caption overlaps the bubble`);
            if (overlap(measure.top, measure.bottom)) problems.push(`meme ${where}: top and bottom captions overlap`);
            if (await page.locator("[data-caption-notice]").count()) shortened++;
            checked++;
          }
        }
      }
    }
    const png = await download("Download PNG");
    const [w, h] = { square: [512, 512], portrait: [512, 640], landscape: [640, 512] }[aspect];
    if (png.width / png.height !== w / h) problems.push(`meme ${aspect}: PNG is ${png.width}×${png.height}`);
    if (shots) await preview().screenshot({ path: `${shots}/phase6-meme-${aspect}.png` });
  }
  // A short template caption fits without a shortening notice.
  await select("Template", "3");
  await fill("Bubble text", "");
  if (await page.locator("[data-caption-notice]").count()) problems.push("meme: a starter template was reported as shortened");
  report.meme = { layoutsChecked: checked, shortenedNotices: shortened };
}

if (!only || only.includes("comic")) {
  await mode("Comics");
  const panelIds = ["hello", "lol", "facepalm", "victory-lap", "sleepy", "birthday"];
  const results = [];
  for (const count of [2, 3, 4, 6]) {
    await select("Number of panels", count);
    for (let index = 0; index < count; index++) {
      await page.getByRole("button", { name: `Panel ${index + 1}`, exact: true }).click();
      await select("Panel expression", panelIds[index]);
      await page.getByRole("textbox", { name: "Panel text", exact: true }).fill(`Panel ${index + 1} says hi`);
    }
    // Reorder: move panel 1 to the end.
    await page.getByRole("button", { name: "Panel 1", exact: true }).click();
    for (let step = 0; step < count - 1; step++) await page.getByRole("button", { name: "Move later", exact: true }).click();
    const expected = [...panelIds.slice(1, count), panelIds[0]];
    await page.getByRole("button", { name: "Save comic", exact: true }).click();
    await openStudio();
    await mode("Comics");
    await page.getByRole("button", { name: "Open saved comic", exact: true }).click();
    const order = [];
    for (let index = 0; index < count; index++) {
      await page.getByRole("button", { name: `Panel ${index + 1}`, exact: true }).click();
      order.push(await page.getByRole("combobox", { name: "Panel expression", exact: true }).inputValue());
    }
    if (order.join() !== expected.join()) problems.push(`comic ${count}: reopened order ${order} (expected ${expected})`);
    const png = await download("Download comic");
    const cols = count === 3 || count === 6 ? 3 : 2;
    const rows = Math.ceil(count / cols);
    const want = [512 * cols + 10 * (cols + 1), 512 * rows + 10 * (rows + 1)];
    if (png.width !== want[0] || png.height !== want[1]) problems.push(`comic ${count}: PNG ${png.width}×${png.height}, expected ${want.join("×")}`);
    // Every panel slot holds drawn artwork (not the empty sheet colour).
    for (let index = 0; index < count; index++) {
      const x0 = 10 + (index % cols) * 522, y0 = 10 + Math.floor(index / cols) * 522;
      let drawn = 0;
      for (let y = y0 + 40; y < y0 + 472; y += 16) for (let x = x0 + 40; x < x0 + 472; x += 16) {
        const at = (y * png.width + x) * 4;
        if (Math.abs(png.data[at] - 0x11) + Math.abs(png.data[at + 1] - 0x18) + Math.abs(png.data[at + 2] - 0x2b) > 30) drawn++;
      }
      if (drawn < 20) problems.push(`comic ${count}: panel ${index + 1} looks empty`);
    }
    await page.getByRole("button", { name: "Prepare print layout", exact: true }).click();
    await page.getByRole("button", { name: "Print prepared page", exact: true }).waitFor();
    const printable = await page.locator("#expressions-print").evaluate(img => img.decode().then(() => [img.naturalWidth, img.naturalHeight]));
    if (printable[0] !== want[0]) problems.push(`comic ${count}: print image ${printable}`);
    results.push({ panels: count, layout: `${cols}×${rows}`, png: `${png.width}×${png.height}`, reopened: order.join() === expected.join() });
    if (shots && count === 6) {
      // The print image's blob URL may already be revoked, so copy the decoded pixels instead.
      const dataUrl = await page.locator("#expressions-print").evaluate(img => {
        const canvas = Object.assign(document.createElement("canvas"), { width: img.naturalWidth, height: img.naturalHeight });
        canvas.getContext("2d").drawImage(img, 0, 0);
        return canvas.toDataURL("image/png");
      });
      await import("node:fs/promises").then(fs => fs.writeFile(`${shots}/phase6-comic-6.png`, Buffer.from(dataUrl.split(",")[1], "base64")));
    }
  }
  report.comic = results;
}

if (!only || only.includes("director")) {
  await mode("Director");
  // Hold the PNG pose so measurements and exports describe the same still frame.
  const pose = page.getByRole("button", { name: "PNG pose", exact: true });
  if (await pose.getAttribute("aria-pressed") !== "true") await pose.click();
  const forms = ["Auralia", "Evolved", "Geometry"];
  const backgrounds = ["midnight", "plum", "lagoon", "classroom", "stars", "lattice", "cavern"];
  let layouts = 0;
  const contrast = [];
  for (const form of forms) {
    await page.getByRole("button", { name: form, exact: true }).click();
    await select("Expression", "happy");
    for (const background of ["transparent", ...backgrounds]) {
      await select("Environment", background);
      for (const prop of ["none", "platform", "moon", "crystal"]) {
        await select("Scene prop", prop);
        for (const propX of prop === "none" ? [0] : [-55, 0, 55]) {
          if (prop !== "none") await page.getByRole("slider", { name: /Prop position/ }).fill(String(propX));
          for (const light of [0, 1]) {
            await page.getByRole("slider", { name: /Stage light/ }).fill(String(light));
            const geometry = await preview().evaluate(svg => {
              const rect = svg.getBoundingClientRect();
              const scale = 512 / rect.width;
              const box = node => { const b = node.getBoundingClientRect(); return { x: (b.left - rect.left) * scale, y: (b.top - rect.top) * scale, r: (b.right - rect.left) * scale, b: (b.bottom - rect.top) * scale }; };
              const body = svg.querySelector("[data-creature-body]");
              const prop = svg.querySelector("[data-scene-prop]");
              return { body: box(body), prop: prop && box(prop), kind: prop?.getAttribute("data-scene-prop") };
            });
            const where = `${form}/${background}/${prop}@${propX}/light ${light}`;
            const cx = (geometry.body.x + geometry.body.r) / 2, cy = (geometry.body.y + geometry.body.b) / 2;
            if (Math.abs(cx - 256) > 40 || Math.abs(cy - 250) > 60) problems.push(`director ${where}: creature off-centre (${cx | 0}, ${cy | 0})`);
            if (geometry.prop && geometry.kind !== "platform") {
              // Pixel masks, not boxes: how much of the prop is painted over by the creature drawn on top of it.
              const hidden = await preview().evaluate(async svg => {
                const mask = async keep => {
                  const copy = svg.cloneNode(true);
                  // The page hides the portrait's square backing with a CSS class that a serialised copy loses.
                  copy.querySelectorAll("[data-expression-lattice] > svg > rect").forEach(node => node.remove());
                  copy.querySelectorAll("[data-creature-body], [data-scene-prop]").forEach(node => {
                    if (!node.matches(keep)) node.setAttribute("visibility", "hidden");
                  });
                  // Keep only the chosen layer: hide every other painted element at the top level of the stage.
                  const stage = copy.querySelector("[data-creature-body]").parentNode;
                  [...copy.children, ...stage.children].forEach(node => {
                    if (!node.matches(keep) && !node.contains(copy.querySelector(keep)) && !node.matches("defs")) node.setAttribute("visibility", "hidden");
                  });
                  copy.querySelector(keep).setAttribute("visibility", "visible");
                  copy.setAttribute("width", "256"); copy.setAttribute("height", "256");
                  const img = new Image();
                  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(copy));
                  await img.decode();
                  const canvas = Object.assign(document.createElement("canvas"), { width: 256, height: 256 });
                  const context = canvas.getContext("2d");
                  context.drawImage(img, 0, 0, 256, 256);
                  return context.getImageData(0, 0, 256, 256).data;
                };
                const prop = await mask("[data-scene-prop]"), body = await mask("[data-creature-body]");
                let painted = 0, covered = 0;
                for (let i = 3; i < prop.length; i += 4) if (prop[i] > 60) { painted++; if (body[i] > 200) covered++; }
                return painted ? covered / painted : 0;
              });
              if (hidden > .35) problems.push(`director ${where}: ${geometry.kind} is ${Math.round(hidden * 100)}% hidden behind the creature`);
            }
            layouts++;
          }
        }
      }
      await select("Scene prop", "none");
      // Readability: compare the creature's pixels against the background it is drawn on.
      if (background !== "transparent") {
        for (const light of [0, 1]) {
          await page.getByRole("slider", { name: /Stage light/ }).fill(String(light));
          const withBackground = await download("Download PNG");
          await select("Environment", "transparent");
          await page.getByRole("slider", { name: /Stage light/ }).fill("0");
          const mask = await download("Download PNG");
          await select("Environment", background);
          await page.getByRole("slider", { name: /Stage light/ }).fill(String(light));
          const lum = (r, g, b) => [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
            .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const bg = withBackground.data;
          const corner = lum(bg[0], bg[1], bg[2]);
          const ratios = [];
          for (let i = 0; i < mask.data.length; i += 4 * 7) if (mask.data[i + 3] > 230) {
            const l = lum(bg[i], bg[i + 1], bg[i + 2]);
            ratios.push((Math.max(l, corner) + .05) / (Math.min(l, corner) + .05));
          }
          ratios.sort((a, b) => a - b);
          // The brightest tenth of the creature (eyes, outline, highlights) carries its silhouette; the
          // 75th percentile is reported too, but Geometry's locked portrait is half translucent disc,
          // which keeps that figure low on every background without hiding the creature.
          const p75 = ratios[Math.floor(ratios.length * .75)], p90 = ratios[Math.floor(ratios.length * .9)];
          contrast.push({ form, background, light, p75: +p75.toFixed(2), p90: +p90.toFixed(2) });
          if (p90 < 3) problems.push(`director ${form}/${background}/light ${light}: creature hard to see (90th-percentile contrast ${p90.toFixed(2)}:1)`);
        }
      }
    }
    if (shots) {
      await preview().screenshot({ path: `${shots}/phase6-director-${form}.png` });
      await select("Environment", "stars");
      for (const [prop, propX] of [["moon", -55], ["crystal", 55]]) {
        await select("Scene prop", prop);
        await page.getByRole("slider", { name: /Prop position/ }).fill(String(propX));
        await preview().screenshot({ path: `${shots}/phase6-director-${form}-${prop}.png` });
      }
      await select("Scene prop", "none");
    }
  }
  report.director = { layoutsChecked: layouts, lowestContrast: contrast.sort((a, b) => a.p90 - b.p90).slice(0, 6), lowestP75: contrast.toSorted((a, b) => a.p75 - b.p75).slice(0, 4) };
}

report.errors = errors;
report.problems = problems;
console.log(JSON.stringify(report, null, 1));
await browser.close();
assert.deepEqual(problems, []);
assert.deepEqual(errors, []);

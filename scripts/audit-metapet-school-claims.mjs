import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "src",
  "docs/schools-au",
  "public/docs/schools-au",
];
const EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mjs"]);

const forbiddenPhrases = [
  /\bno data collection\b/i,
  /\bnothing is stored\b/i,
  /\bno admin\b/i,
  /\bcompletely anonymous\b/i,
  /\bgovernment approved\b/i,
  /\bcertified compliant\b/i,
  /\bguaranteed outcomes?\b/i,
  /\bAI friend\b/i,
  /\breplacement teacher\b/i,
  /\bengagement hack\b/i,
  /\brefundable deposit\b/i,
  /\bfounding licen[cs]e\b/i,
  /A\$\s*(?:990|1,?490|1,?990)\b/i,
];

const contextTerms = /\b(therapy|diagnosis|surveillance|addictive)\b/i;
const negativeContext = /\b(no|not|never|without|does not|must not|refuses?|excluded?|outside|prohibit(?:s|ed|ing)?|avoid(?:s|ed|ing)?)\b/i;

function files(path) {
  const absolute = join(ROOT, path);
  if (!statSync(absolute).isDirectory()) return [absolute];
  return readdirSync(absolute).flatMap((entry) => {
    const child = join(absolute, entry);
    return statSync(child).isDirectory() ? files(relative(ROOT, child)) : [child];
  });
}

const findings = [];
for (const file of TARGETS.flatMap(files)) {
  if (!EXTENSIONS.has(extname(file))) continue;
  const relativePath = relative(ROOT, file);
  if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath)) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of forbiddenPhrases) {
      if (pattern.test(line)) findings.push(`${relativePath}:${index + 1}: ${line.trim()}`);
    }
    const nearbyContext = lines.slice(Math.max(0, index - 1), index + 2).join(" ");
    if (
      contextTerms.test(line) &&
      !negativeContext.test(nearbyContext) &&
      !relativePath.endsWith("src/lib/fieldMode/product.ts")
    ) {
      findings.push(`${relativePath}:${index + 1}: risky term lacks an explicit negative boundary: ${line.trim()}`);
    }
  });
}

if (findings.length) {
  console.error("MetaPet School claims audit failed:\n" + findings.join("\n"));
  process.exit(1);
}

console.log("MetaPet School claims audit passed.");

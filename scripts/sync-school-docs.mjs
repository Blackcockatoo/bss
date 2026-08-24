import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "docs", "schools-au");
const PUBLIC_DIR = path.join(ROOT, "public", "docs", "schools-au");
const CHECK_ONLY = process.argv.includes("--check");

function markdownFiles(root, current = root) {
  if (!existsSync(current)) return [];

  return readdirSync(current, { withFileTypes: true })
    .flatMap((entry) => {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) return markdownFiles(root, absolute);
      if (!entry.isFile() || path.extname(entry.name) !== ".md") return [];
      return [path.relative(root, absolute)];
    })
    .sort();
}

function sameContents(left, right) {
  if (!existsSync(right)) return false;
  return readFileSync(left).equals(readFileSync(right));
}

const sourceFiles = markdownFiles(SOURCE_DIR);
const publicFiles = markdownFiles(PUBLIC_DIR);
const sourceSet = new Set(sourceFiles);
const extraPublicFiles = publicFiles.filter((file) => !sourceSet.has(file));

if (extraPublicFiles.length > 0) {
  console.error(
    `Public school docs contain Markdown with no canonical source:\n${extraPublicFiles
      .map((file) => `- ${file}`)
      .join("\n")}`,
  );
  process.exit(1);
}

const changedFiles = sourceFiles.filter((file) => {
  const source = path.join(SOURCE_DIR, file);
  const destination = path.join(PUBLIC_DIR, file);
  return !sameContents(source, destination);
});

if (CHECK_ONLY) {
  if (changedFiles.length > 0) {
    console.error(
      `Public school docs are not synced from docs/schools-au:\n${changedFiles
        .map((file) => `- ${file}`)
        .join("\n")}`,
    );
    process.exit(1);
  }

  console.log(`School docs are synced (${sourceFiles.length} Markdown files).`);
  process.exit(0);
}

for (const file of changedFiles) {
  const source = path.join(SOURCE_DIR, file);
  const destination = path.join(PUBLIC_DIR, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  console.log(`Synced ${file}`);
}

console.log(
  changedFiles.length > 0
    ? `Synced ${changedFiles.length} of ${sourceFiles.length} school Markdown files.`
    : `School docs already synced (${sourceFiles.length} Markdown files).`,
);

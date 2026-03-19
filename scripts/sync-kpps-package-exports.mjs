import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const workspaceRoot = resolve(process.cwd());

const docs = [
  {
    id: "01_KPPS_Teacher_Hub_Welcome",
    filename: "01_KPPS_Teacher_Hub_Welcome.md",
    title: "Meta-Pet & The Veil - Teacher Hub",
  },
  {
    id: "02_KPPS_Implementation_Guide",
    filename: "02_KPPS_Implementation_Guide.md",
    title: "7-Session Implementation Guide",
  },
  {
    id: "03_KPPS_Facilitation_Scripts",
    filename: "03_KPPS_Facilitation_Scripts.md",
    title: "Teacher Facilitation Scripts",
  },
  {
    id: "04_KPPS_Reflection_Prompts",
    filename: "04_KPPS_Reflection_Prompts.md",
    title: "Student Reflection Prompts",
  },
  {
    id: "05_KPPS_Values_Integration_Map",
    filename: "05_KPPS_Values_Integration_Map.md",
    title: "KPPS Values Integration Map",
  },
  {
    id: "06_KPPS_Parent_Communication_Kit",
    filename: "06_KPPS_Parent_Communication_Kit.md",
    title: "Parent Communication Kit",
  },
  {
    id: "07_KPPS_Privacy_Safety_Brief",
    filename: "07_KPPS_Privacy_Safety_Brief.md",
    title: "Privacy & Safety Technical Brief",
  },
  {
    id: "00_Package_Index",
    filename: "00_Package_Index.md",
    title: "Meta-Pet & The Veil",
  },
];

const packageMarkdownDir = resolve(
  workspaceRoot,
  "05-Teacher-Veil-App",
  "Veil-Website",
  "client",
  "public",
  "package",
);

const docsJsTargets = [
  resolve(
    workspaceRoot,
    "05-Teacher-Veil-App",
    "KPPS-Packages",
    "KPPS_HTML5_Package",
    "school",
    "teacher-hub",
    "docs.js",
  ),
  resolve(
    workspaceRoot,
    "05-Teacher-Veil-App",
    "KPPS-Packages",
    "KPPS_HTML5_Package_with_IP_Notice",
    "school",
    "teacher-hub",
    "docs.js",
  ),
];

function normalize(text) {
  return text.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

const packagedDocs = docs.map((doc) => {
  const sourcePath = resolve(workspaceRoot, doc.filename);
  const markdown = normalize(readFileSync(sourcePath, "utf8"));
  const packagePath = resolve(packageMarkdownDir, doc.filename);

  mkdirSync(dirname(packagePath), { recursive: true });
  writeFileSync(packagePath, markdown, "utf8");

  return {
    ...doc,
    markdown: markdown.trimEnd(),
  };
});

const docsJs = `window.KPPS_DOCS = ${JSON.stringify(packagedDocs, null, 2)};\n`;

for (const target of docsJsTargets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, docsJs, "utf8");
}

console.log(
  `Synced ${packagedDocs.length} KPPS documents into package markdown and docs.js exports.`,
);

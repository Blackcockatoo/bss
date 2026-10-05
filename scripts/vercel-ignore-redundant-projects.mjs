// bss-l8cw owns bluesnakestudios.com and must build alongside the school project.
const ACTIVE_PROJECT_ID = "prj_PYkxJ2bBl7CvAd94KnOaGU9y82BU";
const REDUNDANT_PROJECT_IDS = new Set([
  "prj_E2ZDtSnOxTcqnJMYESLeTGUppDtB", // bluesnakestudios
]);

const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (projectId && REDUNDANT_PROJECT_IDS.has(projectId)) {
  console.log(
    `[vercel-ignore] Skipping redundant project ${projectId}; this project has no active product domain; classroom publishing remains on ${ACTIVE_PROJECT_ID}.`,
  );
  process.exit(0);
}

console.log(
  `[vercel-ignore] Continuing build for ${projectId || "unknown project"}.`,
);
process.exit(1);

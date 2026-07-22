const ACTIVE_PROJECT_ID = "prj_PYkxJ2bBl7CvAd94KnOaGU9y82BU";
const REDUNDANT_PROJECT_IDS = new Set([
  "prj_E2ZDtSnOxTcqnJMYESLeTGUppDtB", // bluesnakestudios
  "prj_EIf6IGORldp3UKIBW9ChvY4Vduos", // bss-l8cw
]);

const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (projectId && REDUNDANT_PROJECT_IDS.has(projectId)) {
  console.log(
    `[vercel-ignore] Skipping redundant project ${projectId}; custom domains are served by ${ACTIVE_PROJECT_ID}.`,
  );
  process.exit(0);
}

console.log(
  `[vercel-ignore] Continuing build for ${projectId || "unknown project"}.`,
);
process.exit(1);

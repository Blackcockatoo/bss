// Only allow checked-in artwork used by the existing epic add-on catalogue.
const LOCAL_EPIC_ART = /^\/addons\/epic\/(?:10(?:0[89]|1[0-9]|2[0-4])-[a-z0-9-]+|wizard-staff-001-soul-engine)\.svg$/;

export function isStudioWardrobeAsset(path: string): boolean {
  return LOCAL_EPIC_ART.test(path);
}

/** One MetaPet codebase; separate public, player and teaching entrances. */
export const STUDIO_PORTAL_URL = "https://blkck2.com";
export const METAPET_ORIGIN = "https://www.bluesnakestudios.com";
export const SCHOOL_ORIGIN = "https://www.metapet.school";
export const TEACH_HOME = "/teach";
export const FIELD_PLAY_HOME = "/schools/field/play";

export function isTeacherWorkspace(pathname: string): boolean {
  return ["/teach", "/teachers"].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export function isFieldStudentPath(pathname: string): boolean {
  return pathname === FIELD_PLAY_HOME || pathname.startsWith(`${FIELD_PLAY_HOME}/`);
}

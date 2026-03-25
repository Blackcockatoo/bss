export const SCHOOLS_PROFILE = "schools" as const;
export const CORE_PROFILE = "core" as const;
export type AppProfile = typeof SCHOOLS_PROFILE | typeof CORE_PROFILE;

export const SCHOOLS_LOCAL_DATA_RETENTION_DAYS = 35;
export const SCHOOLS_LOCAL_DATA_RETENTION_MS =
  SCHOOLS_LOCAL_DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const SCHOOLS_LOCAL_STATE_META_STORAGE_KEY =
  "metapet-schools-local-state-meta";
export const SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY =
  "metapet-schools-classroom-roster";
export const SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY =
  "metapet-schools-classroom-assignments";
export const SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY =
  "metapet-schools-classroom-progress";
export const SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY =
  "metapet-schools-classroom-analytics";
export const SCHOOLS_EDUCATION_QUEUE_STORAGE_KEY =
  "metapet-schools-education-queue";
export const SCHOOLS_RUNTIME_STATE_STORAGE_KEY =
  "metapet-schools-runtime-state";
export const SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY =
  "metapet-schools-teacher-onboarding";

const LEGACY_SCHOOL_STORAGE_KEYS = [
  "metapet-classroom-roster",
  "metapet-classroom-assignments",
  "metapet-classroom-progress",
  "metapet-classroom-analytics",
  "metapet-education-queue",
  "metapet-teacher-onboarding",
  "teacher-hub-pairing-state",
];

export const SCHOOLS_STORAGE_KEYS = [
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY,
  SCHOOLS_EDUCATION_QUEUE_STORAGE_KEY,
  SCHOOLS_RUNTIME_STATE_STORAGE_KEY,
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
  ...LEGACY_SCHOOL_STORAGE_KEYS,
] as const;

type TimestampedMeta = {
  updatedAt: number;
};

function readMeta(
  storage: Pick<Storage, "getItem">,
): TimestampedMeta | null {
  try {
    const raw = storage.getItem(SCHOOLS_LOCAL_STATE_META_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<TimestampedMeta>;
    return typeof parsed.updatedAt === "number"
      ? { updatedAt: parsed.updatedAt }
      : null;
  } catch {
    return null;
  }
}

export function touchSchoolsLocalState(
  storage: Pick<Storage, "setItem">,
  now = Date.now(),
): void {
  storage.setItem(
    SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
    JSON.stringify({ updatedAt: now }),
  );
}

export function clearSchoolsLocalState(
  storage: Pick<Storage, "removeItem">,
): void {
  for (const key of SCHOOLS_STORAGE_KEYS) {
    storage.removeItem(key);
  }
}

export function purgeExpiredSchoolsLocalState(
  storage: Pick<Storage, "getItem" | "removeItem">,
  now = Date.now(),
): boolean {
  const meta = readMeta(storage);
  if (!meta) {
    return false;
  }

  if (now - meta.updatedAt <= SCHOOLS_LOCAL_DATA_RETENTION_MS) {
    return false;
  }

  clearSchoolsLocalState(storage);
  return true;
}

/**
 * Returns the expiry date for school data based on the last-updated timestamp,
 * or `null` if no school data has been written yet.
 */
export function getSchoolsDataExpiryDate(
  storage: Pick<Storage, "getItem">,
): Date | null {
  const meta = readMeta(storage);
  if (!meta) {
    return null;
  }

  return new Date(meta.updatedAt + SCHOOLS_LOCAL_DATA_RETENTION_MS);
}

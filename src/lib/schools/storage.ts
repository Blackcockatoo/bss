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
export const SCHOOLS_FIELD_SESSION_STORAGE_KEY =
  "metapet-schools-field-session";
export const SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY =
  "metapet-teacher-lesson-progress";
export const SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY =
  "metapet-teacher-pet-profile";
export const SCHOOLS_TEACHER_PET_UPDATE_STORAGE_KEY =
  "metapet-teacher-pet-update";
export const SCHOOLS_TEACHER_PILOT_STORAGE_KEY = "metapet-teacher-pilot";

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
  SCHOOLS_FIELD_SESSION_STORAGE_KEY,
  SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
  SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY,
  SCHOOLS_TEACHER_PET_UPDATE_STORAGE_KEY,
  SCHOOLS_TEACHER_PILOT_STORAGE_KEY,
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

// ==================== ADULT-FACING LOCAL DATA INVENTORY ====================

/**
 * The categories a teacher sees on the local-data controls.
 *
 * Deliberately described in classroom language with the raw storage keys kept
 * off-screen. A teacher needs to know what kind of thing is held and why, not
 * which localStorage key holds it — and a child must never be shown either.
 */
export interface SchoolsDataCategory {
  id: string;
  label: string;
  /** Why this category exists at all. */
  purpose: string;
  /** Storage keys backing it. Never rendered to a user. */
  keys: readonly string[];
}

export const SCHOOLS_LOCAL_DATA_CATEGORIES: readonly SchoolsDataCategory[] = [
  {
    id: "class-session",
    label: "Class session setup",
    purpose:
      "Year band, lesson length, grouping and presentation choices, so a session opens the way you left it.",
    keys: [
      SCHOOLS_FIELD_SESSION_STORAGE_KEY,
      SCHOOLS_RUNTIME_STATE_STORAGE_KEY,
    ],
  },
  {
    id: "aliases",
    label: "Classroom aliases",
    purpose:
      "Teacher-chosen aliases used in place of student names. Real names and emails are not required and should not be entered.",
    keys: [SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY, "metapet-classroom-roster"],
  },
  {
    id: "lesson-progress",
    label: "Session progress",
    purpose:
      "Which sessions have been started or completed on this device, so a class can pause and resume.",
    keys: [
      SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
      SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
      "metapet-classroom-progress",
    ],
  },
  {
    id: "evidence",
    label: "Light classroom evidence",
    purpose:
      "The short notes a teacher chooses to record during a session. Nothing is recorded automatically.",
    keys: [
      SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
      SCHOOLS_CLASSROOM_ANALYTICS_STORAGE_KEY,
      "metapet-classroom-assignments",
      "metapet-classroom-analytics",
    ],
  },
  {
    id: "teacher-setup",
    label: "Teacher setup",
    purpose:
      "Lesson queue, onboarding state and pilot checklist entries for the adult running the sequence.",
    keys: [
      SCHOOLS_EDUCATION_QUEUE_STORAGE_KEY,
      SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
      SCHOOLS_TEACHER_PILOT_STORAGE_KEY,
      SCHOOLS_TEACHER_PET_PROFILE_STORAGE_KEY,
      SCHOOLS_TEACHER_PET_UPDATE_STORAGE_KEY,
      "metapet-education-queue",
      "metapet-teacher-onboarding",
      "teacher-hub-pairing-state",
    ],
  },
] as const;

export interface SchoolsDataCategoryStatus {
  id: string;
  label: string;
  purpose: string;
  /** Whether anything is currently held in this category on this device. */
  present: boolean;
}

export interface SchoolsLocalDataReport {
  /** True when nothing at all has been written on this device. */
  empty: boolean;
  categories: SchoolsDataCategoryStatus[];
  /** Last time any classroom record was written, or null. */
  lastActivity: Date | null;
  /** Date after which the next school-route load will purge records. */
  expiresAt: Date | null;
  /** Whole days until the retention threshold. 0 once it has passed. */
  daysRemaining: number | null;
}

/**
 * Describe what is held on this device, without revealing its contents.
 *
 * The report answers "what kind of thing, when did it last change, when does it
 * go" — enough for a teacher to make a deletion decision, and not enough to
 * reconstruct anything about a particular child.
 */
export function describeSchoolsLocalData(
  storage: Pick<Storage, "getItem">,
  now = Date.now(),
): SchoolsLocalDataReport {
  const categories = SCHOOLS_LOCAL_DATA_CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    purpose: category.purpose,
    present: category.keys.some((key) => storage.getItem(key) !== null),
  }));

  const meta = readMeta(storage);
  const expiresAt = meta
    ? new Date(meta.updatedAt + SCHOOLS_LOCAL_DATA_RETENTION_MS)
    : null;

  return {
    empty: !meta && categories.every((category) => !category.present),
    categories,
    lastActivity: meta ? new Date(meta.updatedAt) : null,
    expiresAt,
    daysRemaining: expiresAt
      ? Math.max(
          0,
          Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000)),
        )
      : null,
  };
}

/**
 * Delete only the current class session, leaving teacher setup in place.
 *
 * The common case at the end of a lesson is "clear this class, keep my
 * settings". Offering it separately means a teacher does not have to choose
 * between deleting nothing and deleting everything.
 */
export function clearSchoolsClassSession(
  storage: Pick<Storage, "removeItem">,
): void {
  const sessionCategories = new Set(["class-session", "aliases", "lesson-progress", "evidence"]);
  for (const category of SCHOOLS_LOCAL_DATA_CATEGORIES) {
    if (!sessionCategories.has(category.id)) continue;
    for (const key of category.keys) {
      storage.removeItem(key);
    }
  }
}

/**
 * A deliberately minimal aggregate summary for pilot evidence.
 *
 * Counts only. No aliases, no per-student rows, no free text, no identifiers —
 * exporting this cannot build a profile of any child, which is the whole point
 * of it existing instead of a class dashboard.
 */
export interface SchoolsAggregateSummary {
  generatedOn: string;
  categoriesHeld: number;
  categoriesTotal: number;
  lastActivityOn: string | null;
  retentionThresholdOn: string | null;
  retentionDays: number;
}

export function buildSchoolsAggregateSummary(
  storage: Pick<Storage, "getItem">,
  now = Date.now(),
): SchoolsAggregateSummary {
  const report = describeSchoolsLocalData(storage, now);
  const isoDate = (value: Date | null) =>
    value ? value.toISOString().slice(0, 10) : null;

  return {
    generatedOn: new Date(now).toISOString().slice(0, 10),
    categoriesHeld: report.categories.filter((c) => c.present).length,
    categoriesTotal: report.categories.length,
    lastActivityOn: isoDate(report.lastActivity),
    retentionThresholdOn: isoDate(report.expiresAt),
    retentionDays: SCHOOLS_LOCAL_DATA_RETENTION_DAYS,
  };
}

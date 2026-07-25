import { sanitizeFieldSession } from "@/lib/fieldMode/session";
import {
  SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_EDUCATION_QUEUE_STORAGE_KEY,
  SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY,
  SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY,
  SCHOOLS_FIELD_SESSION_STORAGE_KEY,
  SCHOOLS_LOCAL_DATA_RETENTION_MS,
  SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  SCHOOLS_RUNTIME_STATE_STORAGE_KEY,
  SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
} from "@/lib/schools/storage";
import { sanitizeClassConsequenceState } from "@/lib/teacher-lessons/classConsequences";
import { sanitizeFieldMissionProgressState } from "@/lib/teacher-lessons/fieldMissionProgressStore";
import { sanitizeState } from "@/lib/teacher-lessons/lessonProgressStore";

export const FIELD_BACKUP_SCHEMA_VERSION = 1;
export const FIELD_BACKUP_KIND = "metapet-field-backup" as const;
export const FIELD_BACKUP_MAX_BYTES = 5 * 1024 * 1024;

export const FIELD_BACKUP_STORAGE_KEYS = [
  SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY,
  SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY,
  SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY,
  SCHOOLS_EDUCATION_QUEUE_STORAGE_KEY,
  SCHOOLS_RUNTIME_STATE_STORAGE_KEY,
  SCHOOLS_TEACHER_ONBOARDING_STORAGE_KEY,
  SCHOOLS_FIELD_SESSION_STORAGE_KEY,
  SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY,
  SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY,
  SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY,
] as const;

type FieldBackupStorageKey = (typeof FIELD_BACKUP_STORAGE_KEYS)[number];

export interface FieldBackupFile {
  kind: typeof FIELD_BACKUP_KIND;
  schemaVersion: typeof FIELD_BACKUP_SCHEMA_VERSION;
  product: "MetaPet Field Mode — Australian Schools";
  createdAt: string;
  expiresAt: string;
  entries: Partial<Record<FieldBackupStorageKey, string>>;
}

interface ReadableStorage {
  getItem(key: string): string | null;
}

interface WritableStorage extends ReadableStorage {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function safeString(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function safeTimestamp(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function sanitizeRoster(value: unknown): string {
  if (!Array.isArray(value)) return "[]";
  const now = Date.now();
  const roster = value.slice(0, 200).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const id = safeString(record.id, 128);
    const alias = safeString(record.alias, 32);
    if (!id || !alias) return [];
    return [{ id, alias, addedAt: safeTimestamp(record.addedAt, now) }];
  });
  return JSON.stringify(roster);
}

function sanitizeAssignments(value: unknown): string {
  if (!Array.isArray(value)) return "[]";
  const now = Date.now();
  const assignments = value.slice(0, 100).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const id = safeString(record.id, 128);
    const title = safeString(record.title, 60);
    if (!id || !title) return [];
    return [
      {
        id,
        title,
        engagementCategory: safeString(record.engagementCategory, 48),
        focus: safeString(record.focus, 40) || "Reflection",
        targetMinutes: Math.min(
          180,
          Math.max(1, Number(record.targetMinutes) || 1),
        ),
        createdAt: safeTimestamp(record.createdAt, now),
        dnaMode: safeString(record.dnaMode, 32) || null,
        standardsRef: safeString(record.standardsRef, 120) || undefined,
      },
    ];
  });
  return JSON.stringify(assignments);
}

function sanitizeProgress(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "{}";
  const result: Record<string, Record<string, string>> = {};
  const allowed = new Set(["not-started", "in-progress", "complete"]);
  for (const [assignmentId, rawStudents] of Object.entries(value).slice(0, 100)) {
    const safeAssignmentId = assignmentId.slice(0, 128);
    if (!safeAssignmentId || !rawStudents || typeof rawStudents !== "object") {
      continue;
    }
    const students: Record<string, string> = {};
    for (const [studentId, rawStatus] of Object.entries(rawStudents).slice(0, 200)) {
      if (allowed.has(String(rawStatus))) {
        students[studentId.slice(0, 128)] = String(rawStatus);
      }
    }
    result[safeAssignmentId] = students;
  }
  return JSON.stringify(result);
}

function containsUnsafeKey(value: unknown, depth = 0): boolean {
  if (depth > 20) return true;
  if (!value || typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key)) return true;
    if (containsUnsafeKey(child, depth + 1)) return true;
  }
  return false;
}

function sanitizeGenericJson(value: unknown, label: string): string {
  if (containsUnsafeKey(value)) {
    throw new Error(`${label} contains unsafe object keys.`);
  }
  return JSON.stringify(value ?? {});
}

function sanitizeLessonProgress(value: unknown): string {
  if (!value || typeof value !== "object") {
    return JSON.stringify({ state: sanitizeState(null), version: 2 });
  }
  const persisted = value as Record<string, unknown>;
  return JSON.stringify({
    state: sanitizeState(persisted.state),
    version: 2,
  });
}

function sanitizeClassConsequences(value: unknown): string {
  const persisted =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return JSON.stringify({
    state: sanitizeClassConsequenceState(persisted.state),
    version: 1,
  });
}

function sanitizeFieldMissionProgress(value: unknown): string {
  const persisted =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return JSON.stringify({
    state: sanitizeFieldMissionProgressState(persisted.state),
    version: 1,
  });
}

function sanitizeStoredValue(
  key: FieldBackupStorageKey,
  raw: string,
): string {
  if (raw.length > FIELD_BACKUP_MAX_BYTES) {
    throw new Error(`${key} is too large to restore safely.`);
  }
  const parsed = parseJson(raw, key);
  switch (key) {
    case SCHOOLS_CLASSROOM_ROSTER_STORAGE_KEY:
      return sanitizeRoster(parsed);
    case SCHOOLS_CLASSROOM_ASSIGNMENTS_STORAGE_KEY:
      return sanitizeAssignments(parsed);
    case SCHOOLS_CLASSROOM_PROGRESS_STORAGE_KEY:
      return sanitizeProgress(parsed);
    case SCHOOLS_FIELD_SESSION_STORAGE_KEY:
      return JSON.stringify(
        sanitizeFieldSession(parsed as Record<string, unknown>),
      );
    case SCHOOLS_TEACHER_LESSON_PROGRESS_STORAGE_KEY:
      return sanitizeLessonProgress(parsed);
    case SCHOOLS_FIELD_CLASS_CONSEQUENCE_STORAGE_KEY:
      return sanitizeClassConsequences(parsed);
    case SCHOOLS_FIELD_MISSION_PROGRESS_STORAGE_KEY:
      return sanitizeFieldMissionProgress(parsed);
    default:
      return sanitizeGenericJson(parsed, key);
  }
}

export function createFieldBackup(
  storage: ReadableStorage,
  now = new Date(),
): FieldBackupFile {
  const entries: FieldBackupFile["entries"] = {};
  for (const key of FIELD_BACKUP_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) entries[key] = sanitizeStoredValue(key, value);
  }

  return {
    kind: FIELD_BACKUP_KIND,
    schemaVersion: FIELD_BACKUP_SCHEMA_VERSION,
    product: "MetaPet Field Mode — Australian Schools",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SCHOOLS_LOCAL_DATA_RETENTION_MS).toISOString(),
    entries,
  };
}

export function serializeFieldBackup(backup: FieldBackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export function parseFieldBackup(source: string): FieldBackupFile {
  if (new TextEncoder().encode(source).byteLength > FIELD_BACKUP_MAX_BYTES) {
    throw new Error("This backup is larger than the 5 MB safety limit.");
  }

  const parsed = parseJson(source, "Backup file") as Partial<FieldBackupFile>;
  if (
    parsed.kind !== FIELD_BACKUP_KIND ||
    parsed.schemaVersion !== FIELD_BACKUP_SCHEMA_VERSION ||
    parsed.product !== "MetaPet Field Mode — Australian Schools" ||
    typeof parsed.createdAt !== "string" ||
    !parsed.entries ||
    typeof parsed.entries !== "object" ||
    Array.isArray(parsed.entries)
  ) {
    throw new Error("This is not a supported MetaPet Field Mode backup.");
  }

  const allowed = new Set<string>(FIELD_BACKUP_STORAGE_KEYS);
  const entries: FieldBackupFile["entries"] = {};
  for (const [key, value] of Object.entries(parsed.entries)) {
    if (!allowed.has(key)) {
      throw new Error(`Backup contains an unapproved storage key: ${key}.`);
    }
    if (typeof value !== "string") {
      throw new Error(`Backup entry ${key} is not valid.`);
    }
    entries[key as FieldBackupStorageKey] = sanitizeStoredValue(
      key as FieldBackupStorageKey,
      value,
    );
  }

  const createdAt = new Date(parsed.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("Backup creation date is not valid.");
  }

  return {
    kind: FIELD_BACKUP_KIND,
    schemaVersion: FIELD_BACKUP_SCHEMA_VERSION,
    product: "MetaPet Field Mode — Australian Schools",
    createdAt: createdAt.toISOString(),
    expiresAt:
      typeof parsed.expiresAt === "string" &&
      !Number.isNaN(new Date(parsed.expiresAt).getTime())
        ? new Date(parsed.expiresAt).toISOString()
        : new Date(createdAt.getTime() + SCHOOLS_LOCAL_DATA_RETENTION_MS).toISOString(),
    entries,
  };
}

export function applyFieldBackup(
  storage: WritableStorage,
  backup: FieldBackupFile,
  now = Date.now(),
): void {
  const snapshot = new Map<string, string | null>();
  const managedKeys = [
    ...FIELD_BACKUP_STORAGE_KEYS,
    SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
  ];
  for (const key of managedKeys) snapshot.set(key, storage.getItem(key));

  try {
    for (const key of FIELD_BACKUP_STORAGE_KEYS) {
      const value = backup.entries[key];
      if (typeof value === "string") storage.setItem(key, value);
      else storage.removeItem(key);
    }
    storage.setItem(
      SCHOOLS_LOCAL_STATE_META_STORAGE_KEY,
      JSON.stringify({ updatedAt: now }),
    );
  } catch (error) {
    for (const [key, value] of snapshot) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
    throw error;
  }
}

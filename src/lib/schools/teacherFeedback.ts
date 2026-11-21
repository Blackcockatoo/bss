import {
  SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY,
  touchSchoolsLocalState,
} from "@/lib/schools/storage";
import {
  ALL_LESSON_DEFINITIONS,
  isLessonId as isKnownLessonId,
} from "@/lib/teacher-lessons/lessonDefinitions";
import type { LessonId } from "@/lib/teacher-lessons/types";

export const TEACHER_FEEDBACK_RATINGS = [
  "worked-well",
  "mixed",
  "did-not-work",
] as const;

export type TeacherFeedbackRating = (typeof TEACHER_FEEDBACK_RATINGS)[number];

export const TEACHER_FEEDBACK_RATING_LABELS: Record<
  TeacherFeedbackRating,
  string
> = {
  "worked-well": "Worked well",
  mixed: "Mixed",
  "did-not-work": "Didn’t work",
};

export const TEACHER_FEEDBACK_CAVEAT =
  "This is a private teacher note about how a lesson went. It stays in this browser unless you copy or export it. Do not include student names, aliases, or other identifying information. Nothing is sent to a server.";

export const TEACHER_FEEDBACK_NOTE_MAX = 400;
export const TEACHER_FEEDBACK_MAX_ENTRIES = 40;

export interface TeacherLessonFeedback {
  id: string;
  lessonId: LessonId | "";
  rating: TeacherFeedbackRating;
  note: string;
  recordedAt: number;
}

function isRating(value: unknown): value is TeacherFeedbackRating {
  return (
    typeof value === "string" &&
    TEACHER_FEEDBACK_RATINGS.includes(value as TeacherFeedbackRating)
  );
}

function isLessonId(value: unknown): value is LessonId {
  return typeof value === "string" && isKnownLessonId(value);
}

export function sanitizeTeacherFeedback(
  value: unknown,
): TeacherLessonFeedback | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  if (!isRating(record.rating)) return null;
  const recordedAt =
    typeof record.recordedAt === "number" && Number.isFinite(record.recordedAt)
      ? record.recordedAt
      : Date.now();
  return {
    id: record.id.trim().slice(0, 128),
    lessonId: isLessonId(record.lessonId) ? record.lessonId : "",
    rating: record.rating,
    note:
      typeof record.note === "string"
        ? record.note.trim().slice(0, TEACHER_FEEDBACK_NOTE_MAX)
        : "",
    recordedAt,
  };
}

export function parseTeacherFeedbackList(
  raw: string | null,
): TeacherLessonFeedback[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, TEACHER_FEEDBACK_MAX_ENTRIES)
      .flatMap((entry) => {
        const item = sanitizeTeacherFeedback(entry);
        return item ? [item] : [];
      });
  } catch {
    return [];
  }
}

export function formatTeacherFeedbackExport(
  entries: readonly TeacherLessonFeedback[],
): string {
  if (entries.length === 0) {
    return "No private teacher feedback is stored on this device.";
  }
  const lines = [
    "MetaPet School — private teacher feedback (this device only)",
    TEACHER_FEEDBACK_CAVEAT,
    "",
  ];
  for (const entry of [...entries].sort((a, b) => b.recordedAt - a.recordedAt)) {
    const lesson = ALL_LESSON_DEFINITIONS.find((item) => item.id === entry.lessonId);
    const lessonLabel = lesson
      ? `Lesson ${lesson.number}: ${lesson.title}`
      : "Lesson not specified";
    const when = new Date(entry.recordedAt).toLocaleString("en-AU", {
      timeZone: "Australia/Melbourne",
      dateStyle: "medium",
      timeStyle: "short",
    });
    lines.push(
      `${when} — ${lessonLabel} — ${TEACHER_FEEDBACK_RATING_LABELS[entry.rating]}`,
    );
    if (entry.note) lines.push(entry.note);
    lines.push("");
  }
  return lines.join("\n").trim();
}


const feedbackListeners = new Set<() => void>();

function notifyFeedbackListeners() {
  for (const listener of feedbackListeners) listener();
}

export function subscribeTeacherFeedback(onChange: () => void): () => void {
  feedbackListeners.add(onChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onChange);
  }
  return () => {
    feedbackListeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange);
    }
  };
}

export function readTeacherFeedbackRaw(
  storage?: Pick<Storage, "getItem"> | null,
): string {
  if (!storage) return "";
  return storage.getItem(SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY) ?? "";
}

export function saveTeacherFeedbackList(
  entries: readonly TeacherLessonFeedback[],
  storage: Storage,
): void {
  storage.setItem(
    SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY,
    JSON.stringify(entries.slice(0, TEACHER_FEEDBACK_MAX_ENTRIES)),
  );
  touchSchoolsLocalState(storage);
  notifyFeedbackListeners();
}

export function clearTeacherFeedback(storage: Storage): void {
  storage.removeItem(SCHOOLS_TEACHER_FEEDBACK_STORAGE_KEY);
  touchSchoolsLocalState(storage);
  notifyFeedbackListeners();
}

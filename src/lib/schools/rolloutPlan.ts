import type { CanonicalSessionId } from "@/lib/schools/canonicalSequence";
import {
  SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY,
  touchSchoolsLocalState,
} from "@/lib/schools/storage";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

export const ROLLOUT_PLAN_CAVEAT =
  "This is a planning template for staff. Edits stay in this browser on this device. Do not enter student names, contact details or other identifying information. Print or copy the plan if you need it off this device.";

export interface RolloutLessonRow {
  lessonId: CanonicalSessionId;
  when: string;
  classes: string;
  lead: string;
}

export interface RolloutPlan {
  schoolName: string;
  yearLevels: string;
  classes: string;
  term: string;
  leader: string;
  deviceCheck: string;
  projectorCheck: string;
  paperFallback: string;
  parentLetterWhen: string;
  notes: string;
  lessons: RolloutLessonRow[];
}

const MAX_FIELD = 200;
const MAX_NOTES = 800;

function clip(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function emptyRolloutPlan(): RolloutPlan {
  return {
    schoolName: "",
    yearLevels: "",
    classes: "",
    term: "",
    leader: "",
    deviceCheck: "",
    projectorCheck: "",
    paperFallback: "",
    parentLetterWhen: "",
    notes: "",
    lessons: LESSON_DEFINITIONS.map((lesson) => ({
      lessonId: lesson.id,
      when: "",
      classes: "",
      lead: "",
    })),
  };
}

export function sanitizeRolloutPlan(value: unknown): RolloutPlan {
  const fallback = emptyRolloutPlan();
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  const rows = Array.isArray(record.lessons) ? record.lessons : [];
  return {
    schoolName: clip(record.schoolName, MAX_FIELD),
    yearLevels: clip(record.yearLevels, MAX_FIELD),
    classes: clip(record.classes, MAX_FIELD),
    term: clip(record.term, MAX_FIELD),
    leader: clip(record.leader, MAX_FIELD),
    deviceCheck: clip(record.deviceCheck, MAX_FIELD),
    projectorCheck: clip(record.projectorCheck, MAX_FIELD),
    paperFallback: clip(record.paperFallback, MAX_FIELD),
    parentLetterWhen: clip(record.parentLetterWhen, MAX_FIELD),
    notes: clip(record.notes, MAX_NOTES),
    lessons: fallback.lessons.map((row) => {
      const match = rows.find(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          (entry as RolloutLessonRow).lessonId === row.lessonId,
      ) as Partial<RolloutLessonRow> | undefined;
      return {
        lessonId: row.lessonId,
        when: clip(match?.when, MAX_FIELD),
        classes: clip(match?.classes, MAX_FIELD),
        lead: clip(match?.lead, MAX_FIELD),
      };
    }),
  };
}

export function parseRolloutPlan(raw: string | null): RolloutPlan {
  if (!raw) return emptyRolloutPlan();
  try {
    return sanitizeRolloutPlan(JSON.parse(raw) as unknown);
  } catch {
    return emptyRolloutPlan();
  }
}


const rolloutListeners = new Set<() => void>();

function notifyRolloutListeners() {
  for (const listener of rolloutListeners) listener();
}

export function subscribeRolloutPlan(onChange: () => void): () => void {
  rolloutListeners.add(onChange);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onChange);
  }
  return () => {
    rolloutListeners.delete(onChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onChange);
    }
  };
}

export function readRolloutPlanRaw(
  storage?: Pick<Storage, "getItem"> | null,
): string {
  if (!storage) return "";
  return storage.getItem(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY) ?? "";
}

export function saveRolloutPlan(plan: RolloutPlan, storage: Storage): void {
  storage.setItem(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY, JSON.stringify(plan));
  touchSchoolsLocalState(storage);
  notifyRolloutListeners();
}

export function clearRolloutPlan(storage: Storage): void {
  storage.removeItem(SCHOOLS_ROLLOUT_PLAN_STORAGE_KEY);
  touchSchoolsLocalState(storage);
  notifyRolloutListeners();
}

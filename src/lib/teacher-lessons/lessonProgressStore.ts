"use client";

/**
 * Meta-Pet Teacher Lesson System — lesson progress store (Pass 1).
 *
 * A lightweight, local-first Zustand store (with localStorage persistence)
 * that tracks where a teacher/student is across the seven lessons. It follows
 * the same persistence pattern as src/lib/education/store.ts.
 *
 * Robustness contract: corrupted or partial persisted data must never break
 * the app. All reads go through {@link sanitizeState}, and every action
 * defends against unknown lesson ids and out-of-range step indices.
 */

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  LESSON_IDS,
  TOTAL_LESSONS,
  getLessonById,
  isLessonId,
} from "./lessonDefinitions";
import type {
  LessonId,
  LessonProgressRecord,
  LessonProgressState,
  LessonProgressSummary,
  LessonViewMode,
} from "./types";

export const LESSON_PROGRESS_STORAGE_KEY = "metapet-teacher-lesson-progress";
const LESSON_PROGRESS_VERSION = 1;

function now(): number {
  return Date.now();
}

function createEmptyRecord(lessonId: LessonId): LessonProgressRecord {
  return {
    lessonId,
    currentStep: 0,
    completedSteps: [],
    completed: false,
    paused: false,
    startedAt: null,
    lastActiveAt: null,
    completedAt: null,
    evidence: {},
  };
}

function createDefaultState(): LessonProgressState {
  return {
    version: LESSON_PROGRESS_VERSION,
    currentLessonId: null,
    records: {},
    viewMode: "teacher",
    focusMode: false,
  };
}

/** Number of steps a lesson has, or a safe default if the lesson is unknown. */
function stepCount(lessonId: LessonId): number {
  return getLessonById(lessonId)?.steps.length ?? 0;
}

/** Clamp a step index into the valid range for a lesson. */
function clampStep(lessonId: LessonId, index: number): number {
  const total = stepCount(lessonId);
  if (total <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  if (index > total - 1) return total - 1;
  return Math.floor(index);
}

/**
 * Validate and repair a single persisted record. Returns null if the record is
 * unusable so the caller can drop it.
 */
function sanitizeRecord(
  lessonId: LessonId,
  raw: unknown,
): LessonProgressRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const total = stepCount(lessonId);
  if (total <= 0) {
    return null;
  }

  const record = raw as Partial<LessonProgressRecord>;

  const completedSteps = Array.isArray(record.completedSteps)
    ? Array.from(
        new Set(
          record.completedSteps.filter(
            (n): n is number =>
              typeof n === "number" && n >= 0 && n < total,
          ),
        ),
      ).sort((a, b) => a - b)
    : [];

  const evidence: Record<string, string> =
    record.evidence && typeof record.evidence === "object"
      ? Object.fromEntries(
          Object.entries(record.evidence).filter(
            ([, v]) => typeof v === "string",
          ),
        )
      : {};

  const completed = record.completed === true;

  return {
    lessonId,
    currentStep: clampStep(
      lessonId,
      typeof record.currentStep === "number" ? record.currentStep : 0,
    ),
    completedSteps,
    completed,
    paused: record.paused === true && !completed,
    startedAt:
      typeof record.startedAt === "number" ? record.startedAt : null,
    lastActiveAt:
      typeof record.lastActiveAt === "number" ? record.lastActiveAt : null,
    completedAt:
      completed && typeof record.completedAt === "number"
        ? record.completedAt
        : completed
          ? now()
          : null,
    evidence,
  };
}

/**
 * Validate and repair a whole persisted state object. Always returns a usable
 * state, even from garbage input — this is the app's safety net against
 * corrupted local storage.
 */
export function sanitizeState(raw: unknown): LessonProgressState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const state = raw as Partial<LessonProgressState>;

  const records: LessonProgressState["records"] = {};
  if (state.records && typeof state.records === "object") {
    for (const [key, value] of Object.entries(state.records)) {
      if (!isLessonId(key)) continue;
      const repaired = sanitizeRecord(key, value);
      if (repaired) {
        records[key] = repaired;
      }
    }
  }

  const currentLessonId =
    isLessonId(state.currentLessonId) && records[state.currentLessonId]
      ? state.currentLessonId
      : isLessonId(state.currentLessonId)
        ? state.currentLessonId
        : null;

  const viewMode: LessonViewMode =
    state.viewMode === "student" ? "student" : "teacher";

  return {
    version: LESSON_PROGRESS_VERSION,
    currentLessonId,
    records,
    viewMode,
    focusMode: state.focusMode === true,
  };
}

/** Ensure a record exists for a lesson, returning the updated records map. */
function withRecord(
  records: LessonProgressState["records"],
  lessonId: LessonId,
  updater: (record: LessonProgressRecord) => LessonProgressRecord,
): LessonProgressState["records"] {
  const existing = records[lessonId] ?? createEmptyRecord(lessonId);
  return { ...records, [lessonId]: updater(existing) };
}

interface LessonProgressActions {
  /** Start (or resume) a lesson and make it the current lesson. */
  startLesson: (lessonId: LessonId, options?: { fromStep?: number }) => void;
  /** Move to a specific zero-based step in the current lesson. */
  goToStep: (index: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  /** Mark the current (or given) step complete. */
  completeStep: (index?: number) => void;
  /** Reset just the current (or given) step: clears its completion + evidence. */
  resetStep: (index?: number) => void;
  /** Reset an entire lesson back to its empty record. */
  resetLesson: (lessonId: LessonId) => void;
  /** Reset all lesson progress across the whole system. */
  resetAllProgress: () => void;
  pauseLesson: () => void;
  resumeLesson: () => void;
  /** Mark a lesson fully completed. Defaults to the current lesson. */
  completeLesson: (lessonId?: LessonId) => void;
  /** Leave the Runner and return focus to the Hub (keeps progress). */
  exitLesson: () => void;
  setViewMode: (mode: LessonViewMode) => void;
  toggleViewMode: () => void;
  setFocusMode: (active: boolean) => void;
  /** Persist a placeholder piece of student evidence for a step. */
  saveEvidence: (stepId: string, value: string) => void;
  /** Update the last-active timestamp for the current lesson. */
  touch: () => void;
}

export type LessonProgressStore = LessonProgressState & LessonProgressActions;

export const useLessonProgressStore = create<LessonProgressStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),

      startLesson: (lessonId, options) =>
        set((state) => {
          if (!isLessonId(lessonId) || stepCount(lessonId) <= 0) {
            return state;
          }
          const timestamp = now();
          const records = withRecord(state.records, lessonId, (record) => {
            const targetStep =
              typeof options?.fromStep === "number"
                ? clampStep(lessonId, options.fromStep)
                : record.currentStep;
            return {
              ...record,
              currentStep: targetStep,
              paused: false,
              startedAt: record.startedAt ?? timestamp,
              lastActiveAt: timestamp,
            };
          });
          return { records, currentLessonId: lessonId };
        }),

      goToStep: (index) =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            currentStep: clampStep(lessonId, index),
            lastActiveAt: now(),
          }));
          return { records };
        }),

      nextStep: () =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            currentStep: clampStep(lessonId, record.currentStep + 1),
            lastActiveAt: now(),
          }));
          return { records };
        }),

      previousStep: () =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            currentStep: clampStep(lessonId, record.currentStep - 1),
            lastActiveAt: now(),
          }));
          return { records };
        }),

      completeStep: (index) =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => {
            const target = clampStep(
              lessonId,
              typeof index === "number" ? index : record.currentStep,
            );
            const completedSteps = record.completedSteps.includes(target)
              ? record.completedSteps
              : [...record.completedSteps, target].sort((a, b) => a - b);
            return { ...record, completedSteps, lastActiveAt: now() };
          });
          return { records };
        }),

      resetStep: (index) =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const lesson = getLessonById(lessonId);
          const records = withRecord(state.records, lessonId, (record) => {
            const target = clampStep(
              lessonId,
              typeof index === "number" ? index : record.currentStep,
            );
            const stepId = lesson?.steps[target]?.id;
            const evidence = { ...record.evidence };
            if (stepId) {
              delete evidence[stepId];
            }
            return {
              ...record,
              completedSteps: record.completedSteps.filter(
                (s) => s !== target,
              ),
              evidence,
              lastActiveAt: now(),
            };
          });
          return { records };
        }),

      resetLesson: (lessonId) =>
        set((state) => {
          if (!isLessonId(lessonId)) return state;
          return {
            records: {
              ...state.records,
              [lessonId]: createEmptyRecord(lessonId),
            },
          };
        }),

      resetAllProgress: () =>
        set(() => ({
          ...createDefaultState(),
        })),

      pauseLesson: () =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) =>
            record.completed
              ? record
              : { ...record, paused: true, lastActiveAt: now() },
          );
          return { records };
        }),

      resumeLesson: () =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            paused: false,
            lastActiveAt: now(),
          }));
          return { records };
        }),

      completeLesson: (lessonId) =>
        set((state) => {
          const target = lessonId ?? state.currentLessonId;
          if (!target || !isLessonId(target)) return state;
          const timestamp = now();
          const total = stepCount(target);
          const allSteps = Array.from({ length: total }, (_, i) => i);
          const records = withRecord(state.records, target, (record) => ({
            ...record,
            completed: true,
            paused: false,
            completedSteps: allSteps,
            currentStep: clampStep(target, total - 1),
            startedAt: record.startedAt ?? timestamp,
            completedAt: timestamp,
            lastActiveAt: timestamp,
          }));
          return { records };
        }),

      exitLesson: () => set(() => ({ currentLessonId: null, focusMode: false })),

      setViewMode: (mode) =>
        set(() => ({ viewMode: mode === "student" ? "student" : "teacher" })),

      toggleViewMode: () =>
        set((state) => ({
          viewMode: state.viewMode === "teacher" ? "student" : "teacher",
        })),

      setFocusMode: (active) => set(() => ({ focusMode: active === true })),

      saveEvidence: (stepId, value) =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId || typeof stepId !== "string") return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            evidence: { ...record.evidence, [stepId]: value },
            lastActiveAt: now(),
          }));
          return { records };
        }),

      touch: () =>
        set((state) => {
          const lessonId = state.currentLessonId;
          if (!lessonId) return state;
          const records = withRecord(state.records, lessonId, (record) => ({
            ...record,
            lastActiveAt: now(),
          }));
          return { records };
        }),
    }),
    {
      name: LESSON_PROGRESS_STORAGE_KEY,
      version: LESSON_PROGRESS_VERSION,
      // Sanitise persisted data on merge so corrupted local storage can never
      // crash the app or trap a teacher on a broken screen.
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeState(persisted),
      }),
    },
  ),
);

// ==================== SELECTORS / DERIVED HELPERS ====================

/** Read a lesson's record, or a fresh empty record if none exists yet. */
export function selectRecord(
  state: LessonProgressState,
  lessonId: LessonId,
): LessonProgressRecord {
  return state.records[lessonId] ?? createEmptyRecord(lessonId);
}

/** Compute the card status for a lesson from its record. */
export function selectLessonStatus(
  state: LessonProgressState,
  lessonId: LessonId,
): "not-started" | "in-progress" | "paused" | "completed" {
  const record = state.records[lessonId];
  if (!record) return "not-started";
  if (record.completed) return "completed";
  if (record.paused) return "paused";
  if (record.startedAt || record.completedSteps.length > 0) {
    return "in-progress";
  }
  return "not-started";
}

/** Compute an overall progress summary across all lessons. */
export function selectProgressSummary(
  state: LessonProgressState,
): LessonProgressSummary {
  let completedLessons = 0;
  let inProgressLessons = 0;
  let mostRecentActive = -1;
  let resumeLessonId: LessonId | null = null;

  for (const lessonId of LESSON_IDS) {
    const status = selectLessonStatus(state, lessonId);
    if (status === "completed") {
      completedLessons += 1;
    } else if (status === "in-progress" || status === "paused") {
      inProgressLessons += 1;
      const record = state.records[lessonId];
      const activity = record?.lastActiveAt ?? 0;
      if (activity >= mostRecentActive) {
        mostRecentActive = activity;
        resumeLessonId = lessonId;
      }
    }
  }

  // Prefer the explicitly current lesson if it is not yet complete.
  if (
    state.currentLessonId &&
    selectLessonStatus(state, state.currentLessonId) !== "completed"
  ) {
    resumeLessonId = state.currentLessonId;
  }

  return {
    totalLessons: TOTAL_LESSONS,
    completedLessons,
    inProgressLessons,
    completionRatio:
      TOTAL_LESSONS > 0 ? completedLessons / TOTAL_LESSONS : 0,
    resumeLessonId,
  };
}

function subscribeHydration(onChange: () => void): () => void {
  return useLessonProgressStore.persist.onFinishHydration(onChange);
}

function getHydrationSnapshot(): boolean {
  return useLessonProgressStore.persist.hasHydrated();
}

function getHydrationServerSnapshot(): boolean {
  return false;
}

/**
 * SSR-safe hydration hook. Zustand's persist middleware only has real data on
 * the client, so components should treat the store as "not ready" until this
 * returns true to avoid hydration mismatches and flashes of stale state.
 *
 * Implemented with useSyncExternalStore so React drives the subscription and
 * we never call setState inside an effect.
 */
export function useLessonProgressHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
}

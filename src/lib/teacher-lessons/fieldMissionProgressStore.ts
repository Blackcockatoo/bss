"use client";

/**
 * Meta-Pet Teacher Lesson System — Field Mission progress store.
 *
 * Local-first, namespaced, versioned localStorage state (Zustand + persist).
 * Tracks only whether a mission has been run on this device and an optional
 * short class note (never a student name). Deliberately minimal: Field
 * Missions are teacher-optional and do not need the full lesson progress
 * model (no steps, no evidence types).
 *
 * Storage key: "metapet-field-mission-progress" (v1).
 */

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { isFieldMissionId, type FieldMissionId } from "./fieldMissions";

export const FIELD_MISSION_PROGRESS_STORAGE_KEY =
  "metapet-field-mission-progress";
const STORE_VERSION = 1;

export interface FieldMissionRecord {
  completed: boolean;
  completedAt: number | null;
  /** Optional short class-level note (no student names). */
  note: string;
}

export interface FieldMissionProgressState {
  version: number;
  records: Partial<Record<FieldMissionId, FieldMissionRecord>>;
}

function createEmptyRecord(): FieldMissionRecord {
  return { completed: false, completedAt: null, note: "" };
}

function createDefaultState(): FieldMissionProgressState {
  return { version: STORE_VERSION, records: {} };
}

export function sanitizeFieldMissionProgressState(
  raw: unknown,
): FieldMissionProgressState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<FieldMissionProgressState>;
  const records: FieldMissionProgressState["records"] = {};
  if (value.records && typeof value.records === "object") {
    for (const [key, entry] of Object.entries(value.records)) {
      if (!isFieldMissionId(key) || !entry || typeof entry !== "object") continue;
      const record = entry as Partial<FieldMissionRecord>;
      records[key] = {
        completed: record.completed === true,
        completedAt:
          typeof record.completedAt === "number" ? record.completedAt : null,
        note: typeof record.note === "string" ? record.note.slice(0, 280) : "",
      };
    }
  }
  return { version: STORE_VERSION, records };
}

interface FieldMissionProgressActions {
  completeMission: (id: FieldMissionId) => void;
  setMissionNote: (id: FieldMissionId, note: string) => void;
  resetMission: (id: FieldMissionId) => void;
  resetAll: () => void;
}

export type FieldMissionProgressStore = FieldMissionProgressState &
  FieldMissionProgressActions;

export const useFieldMissionProgressStore = create<FieldMissionProgressStore>()(
  persist(
    (set) => ({
      ...createDefaultState(),
      completeMission: (id) =>
        set((state) => ({
          records: {
            ...state.records,
            [id]: {
              ...(state.records[id] ?? createEmptyRecord()),
              completed: true,
              completedAt: Date.now(),
            },
          },
        })),
      setMissionNote: (id, note) =>
        set((state) => ({
          records: {
            ...state.records,
            [id]: {
              ...(state.records[id] ?? createEmptyRecord()),
              note: note.slice(0, 280),
            },
          },
        })),
      resetMission: (id) =>
        set((state) => {
          const records = { ...state.records };
          delete records[id];
          return { records };
        }),
      resetAll: () => set(() => ({ ...createDefaultState() })),
    }),
    {
      name: FIELD_MISSION_PROGRESS_STORAGE_KEY,
      version: STORE_VERSION,
      migrate: (persisted) =>
        sanitizeFieldMissionProgressState(persisted) as FieldMissionProgressStore,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeFieldMissionProgressState(persisted),
      }),
    },
  ),
);

export function selectFieldMissionRecord(
  state: FieldMissionProgressState,
  id: FieldMissionId,
): FieldMissionRecord {
  return state.records[id] ?? createEmptyRecord();
}

/** SSR-safe hydration flag for the Field Mission progress store. */
export function useFieldMissionProgressHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) =>
      useFieldMissionProgressStore.persist.onFinishHydration(onChange),
    () => useFieldMissionProgressStore.persist.hasHydrated(),
    () => false,
  );
}

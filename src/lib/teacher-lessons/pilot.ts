"use client";

/**
 * Meta-Pet Teacher Lesson System — pilot readiness + feedback (Pass 4).
 *
 * A lightweight, local-first pilot layer — NOT an analytics platform. It stores
 * a teacher-facing readiness checklist and optional post-lesson feedback on the
 * device only. No student names, no third-party tracking, nothing leaves the
 * browser.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PILOT_STORAGE_KEY = "metapet-teacher-pilot";
const PILOT_VERSION = 1;

export interface PilotChecklistItem {
  id: string;
  label: string;
}

export const PILOT_CHECKLIST: PilotChecklistItem[] = [
  { id: "devices", label: "Devices ready" },
  { id: "projector", label: "Projector ready" },
  { id: "previewed", label: "Lesson previewed" },
  { id: "demo-pet", label: "Demonstration pet available" },
  { id: "data-mode", label: "Student data mode understood" },
  { id: "print-fallback", label: "Print fallback available" },
  { id: "reset-controls", label: "Reset controls understood" },
];

export interface PilotFeedbackQuestion {
  id: string;
  label: string;
  type: "yesno" | "text";
}

export const PILOT_FEEDBACK_QUESTIONS: PilotFeedbackQuestion[] = [
  { id: "begin-without-help", label: "Could you begin the lesson without help?", type: "yesno" },
  { id: "reached-activity", label: "Did students reach the activity quickly?", type: "yesno" },
  { id: "confusion", label: "Where did the class become confused?", type: "text" },
  { id: "fit-duration", label: "Did the lesson fit the stated duration?", type: "yesno" },
  { id: "understood-idea", label: "Did students understand the learning idea?", type: "yesno" },
  { id: "recovery-worked", label: "Did reset and recovery controls work?", type: "yesno" },
  { id: "use-another", label: "Would you use another lesson?", type: "yesno" },
  { id: "top-improvement", label: "What is the single most important improvement?", type: "text" },
];

export interface PilotFeedbackEntry {
  id: string;
  lessonId: string | null;
  answers: Record<string, string>;
  createdAt: number;
}

interface PilotState {
  version: number;
  checklist: Record<string, boolean>;
  feedback: PilotFeedbackEntry[];
}

interface PilotActions {
  toggleChecklistItem: (id: string) => void;
  resetChecklist: () => void;
  addFeedback: (entry: {
    lessonId?: string | null;
    answers: Record<string, string>;
  }) => void;
  clearFeedback: () => void;
  reset: () => void;
}

const MAX_FEEDBACK = 100;

function createDefaultPilotState(): PilotState {
  return { version: PILOT_VERSION, checklist: {}, feedback: [] };
}

export function sanitizePilotState(raw: unknown): PilotState {
  const base = createDefaultPilotState();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<PilotState>;
  const checklist: Record<string, boolean> = {};
  if (value.checklist && typeof value.checklist === "object") {
    for (const item of PILOT_CHECKLIST) {
      checklist[item.id] =
        (value.checklist as Record<string, unknown>)[item.id] === true;
    }
  }
  const feedback = Array.isArray(value.feedback)
    ? value.feedback
        .filter(
          (f): f is PilotFeedbackEntry =>
            !!f &&
            typeof f === "object" &&
            typeof (f as PilotFeedbackEntry).createdAt === "number",
        )
        .slice(0, MAX_FEEDBACK)
    : [];
  return { version: PILOT_VERSION, checklist, feedback };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type PilotStore = PilotState & PilotActions;

export const usePilotStore = create<PilotStore>()(
  persist(
    (set) => ({
      ...createDefaultPilotState(),
      toggleChecklistItem: (id) =>
        set((state) => ({
          checklist: { ...state.checklist, [id]: !state.checklist[id] },
        })),
      resetChecklist: () => set(() => ({ checklist: {} })),
      addFeedback: (entry) =>
        set((state) => ({
          feedback: [
            {
              id: generateId(),
              lessonId: entry.lessonId ?? null,
              answers: entry.answers,
              createdAt: Date.now(),
            },
            ...state.feedback,
          ].slice(0, MAX_FEEDBACK),
        })),
      clearFeedback: () => set(() => ({ feedback: [] })),
      reset: () => set(() => ({ ...createDefaultPilotState() })),
    }),
    {
      name: PILOT_STORAGE_KEY,
      version: PILOT_VERSION,
      migrate: (persisted) => sanitizePilotState(persisted) as PilotStore,
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePilotState(persisted),
      }),
    },
  ),
);

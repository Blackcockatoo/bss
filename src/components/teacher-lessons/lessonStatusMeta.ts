/**
 * Shared, colour-independent metadata for lesson statuses.
 *
 * Accessibility: status is always communicated with a label and an icon name,
 * never colour alone. Colour classes are supplementary.
 */

import type { LessonCardStatus } from "@/lib/teacher-lessons";

export interface LessonStatusMeta {
  /** Human-readable label. */
  label: string;
  /** lucide-react icon name to pair with the label. */
  icon: "Circle" | "PlayCircle" | "PauseCircle" | "CheckCircle2";
  /** Supplementary tailwind classes (never the sole signal). */
  className: string;
}

export const LESSON_STATUS_META: Record<LessonCardStatus, LessonStatusMeta> = {
  "not-started": {
    label: "Not started",
    icon: "Circle",
    className: "border-slate-600/40 bg-slate-700/20 text-slate-300",
  },
  "in-progress": {
    label: "In progress",
    icon: "PlayCircle",
    className: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  },
  paused: {
    label: "Paused",
    icon: "PauseCircle",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  completed: {
    label: "Completed",
    icon: "CheckCircle2",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  },
};

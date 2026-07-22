/**
 * Meta-Pet Teacher Lesson System — lesson timing modes (Pass 2).
 *
 * A simple lesson-level option (not a scheduler). Timing modes let a teacher
 * pick a 10-minute demo, a 20-minute standard lesson or a 40-minute extended
 * lesson. Modes only affect optional presentation (whether extension prompts
 * and optional depth show); the five core steps always remain navigable.
 */

export type LessonTimingMode = "demo" | "standard" | "extended";

export interface LessonTimingModeMeta {
  id: LessonTimingMode;
  label: string;
  minutes: number;
  description: string;
  /** Show optional extension tasks / deeper prompts. */
  showExtension: boolean;
  /** Encourage shorter discussion. */
  shortDiscussion: boolean;
}

export const LESSON_TIMING_MODES: LessonTimingModeMeta[] = [
  {
    id: "demo",
    label: "10-min demo",
    minutes: 10,
    description: "A quick teacher-led demonstration. Optional steps are hidden.",
    showExtension: false,
    shortDiscussion: true,
  },
  {
    id: "standard",
    label: "20-min lesson",
    minutes: 20,
    description: "The standard classroom lesson with full discussion.",
    showExtension: false,
    shortDiscussion: false,
  },
  {
    id: "extended",
    label: "40-min extended",
    minutes: 40,
    description: "A longer lesson with extension tasks and deeper exploration.",
    showExtension: true,
    shortDiscussion: false,
  },
];

export const DEFAULT_TIMING_MODE: LessonTimingMode = "standard";

export function getTimingModeMeta(
  mode: LessonTimingMode,
): LessonTimingModeMeta {
  return (
    LESSON_TIMING_MODES.find((m) => m.id === mode) ?? LESSON_TIMING_MODES[1]
  );
}

export function isTimingMode(value: unknown): value is LessonTimingMode {
  return value === "demo" || value === "standard" || value === "extended";
}

/**
 * Meta-Pet Teacher Lesson System — lesson duration depths (Pass 2, relabelled
 * for the Field Mode Lesson Upgrade).
 *
 * A simple lesson-level option (not a scheduler). Every lesson supports three
 * usable depths without forking into three separate lesson plans — all three
 * reuse the same seven-stage Notice → Reflect rhythm:
 *
 *   Quick Spark (~10 min)  — a short hook, prediction and observation.
 *   Core Lesson (~20 min)  — the main activity, explanation and reflection.
 *   Deep Dive (~40 min)    — adds the physical/creative/collaborative
 *                            extension ({@link LessonDefinition.deepDiveActivity}).
 *
 * A teacher can stop after any depth and still have a complete experience:
 * the Runner never blocks Complete Lesson on optional extension content.
 * Ids are kept stable ("demo" / "standard" / "extended") so persisted
 * classroom state from earlier releases keeps working unchanged.
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
    label: "Quick Spark (10 min)",
    minutes: 10,
    description:
      "A short hook: Notice, Predict and Observe only. Optional steps are hidden.",
    showExtension: false,
    shortDiscussion: true,
  },
  {
    id: "standard",
    label: "Core Lesson (20 min)",
    minutes: 20,
    description:
      "The main activity: Act, Explain, Create and Reflect with full discussion.",
    showExtension: false,
    shortDiscussion: false,
  },
  {
    id: "extended",
    label: "Deep Dive (40 min)",
    minutes: 40,
    description:
      "Adds the physical, creative or collaborative extension for deeper exploration.",
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

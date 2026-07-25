/**
 * Meta-Pet Teacher Lesson System — class-level visible consequences.
 *
 * A small, transparent, fully deterministic rules engine (never decorative
 * randomness) that lets safe lesson and Field Mission choices nudge a shared,
 * class-level Meta-Pet state. Every change is explainable (a plain-language
 * reason is always attached), subtle (small deltas), and reversible by the
 * teacher.
 *
 * Contract:
 * - class-level only — there is no per-student record anywhere in this file
 * - no punitive language, no permanent failure state (values just clamp 0-100)
 * - no addictive streaks and no random rewards — the "repeated action"
 *   penalty below is a deterministic pattern check, not a chance outcome
 * - no purchasing, marketplace or consumer-account dependency of any kind
 * - fully resettable by a teacher via {@link resetClassConsequenceState}
 */

/** The seven class-level dimensions a lesson or mission can nudge. */
export type ClassConsequenceDimension =
  | "trust"
  | "curiosity"
  | "stability"
  | "energy"
  | "habitatQuality"
  | "confidence"
  | "understanding";

export const CLASS_CONSEQUENCE_DIMENSIONS: {
  id: ClassConsequenceDimension;
  label: string;
}[] = [
  { id: "trust", label: "Trust" },
  { id: "curiosity", label: "Curiosity" },
  { id: "stability", label: "Stability" },
  { id: "energy", label: "Energy" },
  { id: "habitatQuality", label: "Habitat quality" },
  { id: "confidence", label: "Confidence" },
  { id: "understanding", label: "Understanding" },
];

/** Stable identifiers for the deterministic actions this engine recognises. */
export type ClassConsequenceActionId =
  | "careful-observation"
  | "balanced-choice"
  | "creative-experiment"
  | "responsible-privacy-choice"
  | "lesson-completed"
  | "reflection-completed"
  | "physical-activity-completed"
  | "habitat-plan-created"
  | "energy-recharge"
  | "repeated-random-action";

export interface ClassConsequenceActionMeta {
  id: ClassConsequenceActionId;
  label: string;
  dimension: ClassConsequenceDimension;
  /** Always small and subtle by design — never a dramatic swing. */
  delta: number;
  /** Plain-language reason shown to teachers and students (explainability). */
  explanation: string;
}

/** The complete, fixed action table. Deltas are intentionally small (3-6). */
export const CLASS_CONSEQUENCE_ACTIONS: ClassConsequenceActionMeta[] = [
  {
    id: "careful-observation",
    label: "Careful observation",
    dimension: "trust",
    delta: 4,
    explanation: "Careful observation increases trust.",
  },
  {
    id: "balanced-choice",
    label: "Balanced choice",
    dimension: "stability",
    delta: 4,
    explanation: "Balanced choices increase stability.",
  },
  {
    id: "creative-experiment",
    label: "Creative experimentation",
    dimension: "curiosity",
    delta: 4,
    explanation: "Creative experimentation increases curiosity.",
  },
  {
    id: "responsible-privacy-choice",
    label: "Responsible privacy choice",
    dimension: "trust",
    delta: 5,
    explanation:
      "Responsible privacy choices increase trust and unlock a trusted-system indicator.",
  },
  {
    id: "lesson-completed",
    label: "Lesson completed",
    dimension: "understanding",
    delta: 5,
    explanation: "Finishing a lesson deepens class understanding.",
  },
  {
    id: "reflection-completed",
    label: "Reflection completed",
    dimension: "understanding",
    delta: 2,
    explanation: "A shared reflection deepens class understanding.",
  },
  {
    id: "physical-activity-completed",
    label: "Off-screen activity completed",
    dimension: "confidence",
    delta: 3,
    explanation: "Completing a hands-on activity builds class confidence.",
  },
  {
    id: "habitat-plan-created",
    label: "Habitat plan created",
    dimension: "habitatQuality",
    delta: 5,
    explanation: "A thoughtful habitat plan improves habitat quality.",
  },
  {
    id: "energy-recharge",
    label: "Energy recharge",
    dimension: "energy",
    delta: 4,
    explanation: "A short break restores class energy.",
  },
  {
    id: "repeated-random-action",
    label: "Repeated random actions",
    dimension: "stability",
    delta: -3,
    explanation:
      "Random repeated actions increase uncertainty. Try a considered choice instead.",
  },
];

const ACTION_BY_ID: Map<ClassConsequenceActionId, ClassConsequenceActionMeta> =
  new Map(CLASS_CONSEQUENCE_ACTIONS.map((action) => [action.id, action]));

export function getClassConsequenceAction(
  id: ClassConsequenceActionId,
): ClassConsequenceActionMeta {
  return ACTION_BY_ID.get(id) ?? CLASS_CONSEQUENCE_ACTIONS[0];
}

export function isClassConsequenceActionId(
  value: unknown,
): value is ClassConsequenceActionId {
  return typeof value === "string" && ACTION_BY_ID.has(value as ClassConsequenceActionId);
}

/** Trust threshold at which the trusted-system indicator unlocks. */
export const TRUSTED_SYSTEM_TRUST_THRESHOLD = 80;

/** How many identical actions in a row trigger the uncertainty penalty. */
const REPEAT_PENALTY_THRESHOLD = 3;

/** How many recent action ids are kept for the deterministic repeat check. */
const RECENT_ACTION_WINDOW = 3;

export interface ClassConsequenceChange {
  actionId: ClassConsequenceActionId;
  label: string;
  dimension: ClassConsequenceDimension;
  delta: number;
  explanation: string;
  at: number;
}

export interface ClassConsequenceState {
  version: number;
  values: Record<ClassConsequenceDimension, number>;
  trustedSystemUnlocked: boolean;
  /** Most-recent-last window of action ids, used only for the repeat check. */
  recentActionIds: ClassConsequenceActionId[];
  lastChange: ClassConsequenceChange | null;
}

export const CLASS_CONSEQUENCE_STATE_VERSION = 1;

export function createDefaultClassConsequenceState(): ClassConsequenceState {
  const values = {} as Record<ClassConsequenceDimension, number>;
  for (const dimension of CLASS_CONSEQUENCE_DIMENSIONS) {
    values[dimension.id] = 50;
  }
  return {
    version: CLASS_CONSEQUENCE_STATE_VERSION,
    values,
    trustedSystemUnlocked: false,
    recentActionIds: [],
    lastChange: null,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyDelta(
  state: ClassConsequenceState,
  action: ClassConsequenceActionMeta,
  at: number,
): ClassConsequenceState {
  const values = {
    ...state.values,
    [action.dimension]: clamp(state.values[action.dimension] + action.delta),
  };
  const trustedSystemUnlocked =
    state.trustedSystemUnlocked ||
    values.trust >= TRUSTED_SYSTEM_TRUST_THRESHOLD;
  return {
    ...state,
    values,
    trustedSystemUnlocked,
    lastChange: {
      actionId: action.id,
      label: action.label,
      dimension: action.dimension,
      delta: action.delta,
      explanation: action.explanation,
      at,
    },
  };
}

/**
 * Record one deterministic action against the class state. Pure function —
 * callers own persistence. A run of {@link REPEAT_PENALTY_THRESHOLD} identical
 * actions in a row (with no other action between them) also applies the
 * transparent "repeated-random-action" stability penalty once, then the
 * repeat window resets — this is a deterministic pattern check, never a
 * chance-based outcome.
 */
export function recordClassConsequenceAction(
  state: ClassConsequenceState,
  actionId: ClassConsequenceActionId,
  at: number = Date.now(),
): ClassConsequenceState {
  const action = getClassConsequenceAction(actionId);
  let next = applyDelta(state, action, at);

  const recentActionIds = [...state.recentActionIds, actionId].slice(
    -RECENT_ACTION_WINDOW,
  );

  const isRepeatRun =
    actionId !== "repeated-random-action" &&
    recentActionIds.length === RECENT_ACTION_WINDOW &&
    recentActionIds.every((id) => id === actionId);

  if (isRepeatRun) {
    const penalty = getClassConsequenceAction("repeated-random-action");
    next = applyDelta(next, penalty, at);
    next = { ...next, recentActionIds: [] };
  } else {
    next = { ...next, recentActionIds };
  }

  return next;
}

/** Teacher-triggered reset. Always returns a fresh, neutral, explainable state. */
export function resetClassConsequenceState(): ClassConsequenceState {
  return createDefaultClassConsequenceState();
}

/**
 * Validate and repair a persisted state object. Always returns a usable
 * state, even from garbage input.
 */
export function sanitizeClassConsequenceState(
  raw: unknown,
): ClassConsequenceState {
  const base = createDefaultClassConsequenceState();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<ClassConsequenceState> & Record<string, unknown>;

  const values = { ...base.values };
  if (value.values && typeof value.values === "object") {
    for (const dimension of CLASS_CONSEQUENCE_DIMENSIONS) {
      const raw = (value.values as Record<string, unknown>)[dimension.id];
      if (typeof raw === "number" && Number.isFinite(raw)) {
        values[dimension.id] = clamp(raw);
      }
    }
  }

  const recentActionIds = Array.isArray(value.recentActionIds)
    ? value.recentActionIds.filter(isClassConsequenceActionId).slice(-RECENT_ACTION_WINDOW)
    : [];

  const lastChangeRaw = value.lastChange as Partial<ClassConsequenceChange> | null | undefined;
  const lastChange: ClassConsequenceChange | null =
    lastChangeRaw &&
    typeof lastChangeRaw === "object" &&
    isClassConsequenceActionId(lastChangeRaw.actionId) &&
    typeof lastChangeRaw.explanation === "string"
      ? {
          actionId: lastChangeRaw.actionId,
          label:
            typeof lastChangeRaw.label === "string"
              ? lastChangeRaw.label
              : getClassConsequenceAction(lastChangeRaw.actionId).label,
          dimension: getClassConsequenceAction(lastChangeRaw.actionId).dimension,
          delta:
            typeof lastChangeRaw.delta === "number"
              ? lastChangeRaw.delta
              : getClassConsequenceAction(lastChangeRaw.actionId).delta,
          explanation: lastChangeRaw.explanation,
          at: typeof lastChangeRaw.at === "number" ? lastChangeRaw.at : Date.now(),
        }
      : null;

  return {
    version: CLASS_CONSEQUENCE_STATE_VERSION,
    values,
    trustedSystemUnlocked: value.trustedSystemUnlocked === true,
    recentActionIds,
    lastChange,
  };
}

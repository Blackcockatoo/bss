import { describe, expect, it } from "vitest";

import {
  CLASS_CONSEQUENCE_ACTIONS,
  CLASS_CONSEQUENCE_DIMENSIONS,
  TRUSTED_SYSTEM_TRUST_THRESHOLD,
  createDefaultClassConsequenceState,
  getClassConsequenceAction,
  isClassConsequenceActionId,
  recordClassConsequenceAction,
  resetClassConsequenceState,
  sanitizeClassConsequenceState,
} from "./classConsequences";

describe("class-level consequences engine", () => {
  it("starts neutral, class-level, and with no last change", () => {
    const state = createDefaultClassConsequenceState();
    for (const dimension of CLASS_CONSEQUENCE_DIMENSIONS) {
      expect(state.values[dimension.id]).toBe(50);
    }
    expect(state.trustedSystemUnlocked).toBe(false);
    expect(state.lastChange).toBeNull();
    // Class-level only: no per-student keys anywhere in the state shape.
    expect(Object.keys(state)).not.toContain("students");
    expect(Object.keys(state)).not.toContain("studentId");
  });

  it("is fully deterministic — same input always produces the same output", () => {
    const base = createDefaultClassConsequenceState();
    const a = recordClassConsequenceAction(base, "careful-observation", 1000);
    const b = recordClassConsequenceAction(base, "careful-observation", 1000);
    expect(a).toEqual(b);
  });

  it("applies a small, explainable, subtle delta", () => {
    const base = createDefaultClassConsequenceState();
    const next = recordClassConsequenceAction(base, "careful-observation", 1);
    expect(next.values.trust).toBe(54);
    expect(next.lastChange).toEqual({
      actionId: "careful-observation",
      label: "Careful observation",
      dimension: "trust",
      delta: 4,
      explanation: "Careful observation increases trust.",
      at: 1,
    });
    // Every other dimension is untouched.
    expect(next.values.curiosity).toBe(50);
  });

  it("clamps values to 0-100 and never creates a permanent failure state", () => {
    let state = createDefaultClassConsequenceState();
    for (let i = 0; i < 30; i += 1) {
      // Alternate two different actions so the repeat-penalty never fires.
      state = recordClassConsequenceAction(
        state,
        i % 2 === 0 ? "careful-observation" : "responsible-privacy-choice",
        i,
      );
    }
    expect(state.values.trust).toBeLessThanOrEqual(100);
    expect(state.values.trust).toBeGreaterThanOrEqual(0);
  });

  it("unlocks the trusted-system indicator once trust reaches the threshold", () => {
    let state = createDefaultClassConsequenceState();
    expect(state.trustedSystemUnlocked).toBe(false);
    for (let i = 0; i < 10; i += 1) {
      state = recordClassConsequenceAction(
        state,
        i % 2 === 0 ? "careful-observation" : "responsible-privacy-choice",
        i,
      );
      if (state.values.trust >= TRUSTED_SYSTEM_TRUST_THRESHOLD) break;
    }
    expect(state.trustedSystemUnlocked).toBe(true);
    // Once unlocked, it stays unlocked even if trust later dips.
    state = recordClassConsequenceAction(state, "repeated-random-action", 999);
    expect(state.trustedSystemUnlocked).toBe(true);
  });

  it("applies a deterministic (never random) penalty for three identical actions in a row", () => {
    let state = createDefaultClassConsequenceState();
    state = recordClassConsequenceAction(state, "creative-experiment", 1);
    state = recordClassConsequenceAction(state, "creative-experiment", 2);
    const beforeThird = state.values.stability;
    state = recordClassConsequenceAction(state, "creative-experiment", 3);
    // Three in a row: the curiosity delta applies AND the stability penalty.
    expect(state.values.stability).toBe(beforeThird - 3);
    expect(state.lastChange?.actionId).toBe("repeated-random-action");

    // The window resets: a fourth identical action does not immediately repeat the penalty.
    const stableAfterReset = state.values.stability;
    state = recordClassConsequenceAction(state, "creative-experiment", 4);
    expect(state.values.stability).toBe(stableAfterReset);
  });

  it("never fires the repeat penalty when actions vary", () => {
    let state = createDefaultClassConsequenceState();
    state = recordClassConsequenceAction(state, "careful-observation", 1);
    state = recordClassConsequenceAction(state, "creative-experiment", 2);
    state = recordClassConsequenceAction(state, "balanced-choice", 3);
    expect(state.lastChange?.actionId).toBe("balanced-choice");
  });

  it("resets to a fresh, neutral, explainable state", () => {
    let state = createDefaultClassConsequenceState();
    state = recordClassConsequenceAction(state, "careful-observation", 1);
    const reset = resetClassConsequenceState();
    expect(reset).toEqual(createDefaultClassConsequenceState());
    expect(reset.values.trust).toBe(50);
  });

  it("looks up known actions and guards unknown ids", () => {
    expect(getClassConsequenceAction("careful-observation").dimension).toBe(
      "trust",
    );
    expect(isClassConsequenceActionId("careful-observation")).toBe(true);
    expect(isClassConsequenceActionId("not-a-real-action")).toBe(false);
    expect(isClassConsequenceActionId(5)).toBe(false);
  });

  it("keeps every action delta small and subtle", () => {
    for (const action of CLASS_CONSEQUENCE_ACTIONS) {
      expect(Math.abs(action.delta)).toBeLessThanOrEqual(6);
      expect(action.explanation.length).toBeGreaterThan(0);
    }
  });

  it("repairs corrupted persisted state without throwing", () => {
    expect(sanitizeClassConsequenceState(null)).toEqual(
      createDefaultClassConsequenceState(),
    );
    const repaired = sanitizeClassConsequenceState({
      values: { trust: 999, curiosity: -50, stability: "nope" },
      trustedSystemUnlocked: "yes",
      recentActionIds: ["careful-observation", "not-real", 5],
      lastChange: { actionId: "nope" },
    });
    expect(repaired.values.trust).toBe(100);
    expect(repaired.values.curiosity).toBe(0);
    expect(repaired.values.stability).toBe(50);
    expect(repaired.trustedSystemUnlocked).toBe(false);
    expect(repaired.recentActionIds).toEqual(["careful-observation"]);
    expect(repaired.lastChange).toBeNull();
  });
});

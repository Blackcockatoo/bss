import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CLASS_CONSEQUENCE_STORAGE_KEY,
  useClassConsequencesStore,
} from "./classConsequencesStore";
import { createDefaultClassConsequenceState } from "./classConsequences";

function resetStore() {
  useClassConsequencesStore.setState(createDefaultClassConsequenceState());
}

describe("class consequences store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("uses a namespaced, versioned storage key", () => {
    expect(CLASS_CONSEQUENCE_STORAGE_KEY).toBe("metapet-field-class-state");
  });

  it("records an action and nudges the right dimension", () => {
    useClassConsequencesStore.getState().recordAction("balanced-choice");
    expect(useClassConsequencesStore.getState().values.stability).toBe(54);
    expect(useClassConsequencesStore.getState().lastChange?.actionId).toBe(
      "balanced-choice",
    );
  });

  it("is class-level only: resetAll clears everything back to neutral", () => {
    useClassConsequencesStore.getState().recordAction("creative-experiment");
    useClassConsequencesStore.getState().resetAll();
    const state = useClassConsequencesStore.getState();
    expect(state.values.curiosity).toBe(50);
    expect(state.lastChange).toBeNull();
    expect(state.trustedSystemUnlocked).toBe(false);
  });

  it("survives a simulated refresh with corrupted persisted data", () => {
    window.localStorage.setItem(
      CLASS_CONSEQUENCE_STORAGE_KEY,
      JSON.stringify({
        state: { values: { trust: "garbage" }, trustedSystemUnlocked: 1 },
        version: 1,
      }),
    );
    useClassConsequencesStore.persist.rehydrate();
    const state = useClassConsequencesStore.getState();
    expect(state.values.trust).toBe(50);
    expect(state.trustedSystemUnlocked).toBe(false);
  });
});

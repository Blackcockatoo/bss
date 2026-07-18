"use client";

/**
 * The event bridge between live gameplay state and the persistent
 * wardrobe-progression store.
 *
 * Mounted once (in ClientBody, so progress accrues on every route). It:
 *
 * 1. Runs one reconciliation observation on mount — existing players whose
 *    live state already satisfies conditions receive their items on the
 *    spot, exactly once (grantItems dedupes against owned).
 * 2. Subscribes to the core store and re-observes only when a relevant
 *    progression slice changes — never per animation frame.
 * 3. Feeds vitals ticks into the sustained-energy timer.
 * 4. Counts care actions via lastActionAt transitions.
 * 5. Listens for the offspring CustomEvent from recordBreeding.
 */

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { deriveObservedProgress } from "./progress";
import { useWardrobeProgressionStore } from "./store";
import { BREEDING_EVENT_NAME } from "./types";

export function WardrobeProgressBridge() {
  useEffect(() => {
    const wardrobe = useWardrobeProgressionStore.getState();

    // Initial reconciliation pass over whatever the session already holds.
    const initial = useStore.getState();
    wardrobe.recordObservation(deriveObservedProgress(initial), "hydration-reconciliation");
    wardrobe.observeEnergyLevel(initial.vitals.energy);

    const unsubscribe = useStore.subscribe((state, previous) => {
      const store = useWardrobeProgressionStore.getState();

      // Sustained-energy timer advances with the vitals tick.
      if (state.vitals.energy !== previous.vitals.energy) {
        store.observeEnergyLevel(state.vitals.energy);
      }

      // Care actions: each new lastActionAt is exactly one action.
      if (
        state.lastAction &&
        state.lastActionAt !== previous.lastActionAt &&
        state.lastActionAt > 0
      ) {
        store.recordCareAction(state.lastAction);
      }

      // Progression slices that feed unlock conditions.
      const progressionChanged =
        state.battle !== previous.battle ||
        state.vimana !== previous.vimana ||
        state.miniGames !== previous.miniGames ||
        state.achievements !== previous.achievements ||
        state.evolution.state !== previous.evolution.state;
      if (progressionChanged) {
        store.recordObservation(deriveObservedProgress(state));
      }
    });

    const onOffspring = () => {
      useWardrobeProgressionStore.getState().recordOffspring();
    };
    window.addEventListener(BREEDING_EVENT_NAME, onOffspring);

    return () => {
      unsubscribe();
      window.removeEventListener(BREEDING_EVENT_NAME, onOffspring);
    };
  }, []);

  return null;
}

/**
 * WardrobeSystemBridge — the event wiring of the wardrobe gameplay loop.
 *
 * Player action → live store update → (this bridge) persistent progress
 * update → unlock evaluation → permanent inventory grant → ceremony queue.
 *
 * Mounted once in ClientBody. It:
 *  - runs one reconciliation pass on mount so existing players receive items
 *    they had already earned before this system existed;
 *  - subscribes to the live game store and folds relevant changes into the
 *    persistent progress store (debounced — never per animation frame);
 *  - counts care actions (feed/clean/play/sleep);
 *  - heartbeats the sustained high-energy tracker;
 *  - reads offspring/trust from the Auralia guardian save.
 */

'use client';

import { useStore } from '@/lib/store';
import {
  ENERGY_HEARTBEAT_MS,
  UNLOCK_SOURCES,
  buildLiveProgressSnapshot,
  useWardrobeProgressStore,
  useWardrobeStore,
} from '@/lib/wardrobe';
import { STORAGE_KEY as GUARDIAN_STORAGE_KEY } from '@metapet/core/auralia/persistence';
import type { GuardianSaveData } from '@metapet/core/auralia/persistence';
import { useEffect } from 'react';

/** Collapse bursts of store updates into one evaluation pass. */
const SYNC_DEBOUNCE_MS = 250;

function readGuardianSave(): GuardianSaveData | null {
  try {
    const raw = window.localStorage.getItem(GUARDIAN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuardianSaveData) : null;
  } catch {
    return null;
  }
}

function syncGuardianDerivedProgress(): void {
  const guardian = readGuardianSave();
  if (!guardian) return;
  const progressStore = useWardrobeProgressStore.getState();
  if (Array.isArray(guardian.offspring)) {
    progressStore.setOffspringCount(guardian.offspring.length);
  }
  if (typeof guardian.bond === 'number') {
    progressStore.recordTrustLevel(guardian.bond);
  }
}

/** Fold the live game state into persistent progress, then grant unlocks. */
function syncAndReconcile(source: string): void {
  const live = useStore.getState();
  const progressStore = useWardrobeProgressStore.getState();

  progressStore.applyLiveSnapshot(buildLiveProgressSnapshot(live));
  syncGuardianDerivedProgress();

  const progress = useWardrobeProgressStore.getState().progress;
  useWardrobeStore.getState().reconcileWithProgress(progress, source);
}

export function WardrobeSystemBridge() {
  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | undefined;

    const scheduleSync = () => {
      if (debounceId !== undefined) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        debounceId = undefined;
        syncAndReconcile(UNLOCK_SOURCES.progress);
      }, SYNC_DEBOUNCE_MS);
    };

    // Hydration reconciliation: normalize old data and grant anything the
    // player had already earned, exactly once per item (grants are
    // idempotent, so re-running on later mounts is safe).
    useWardrobeProgressStore
      .getState()
      .observeEnergy(useStore.getState().vitals.energy);
    syncAndReconcile(UNLOCK_SOURCES.reconciliation);

    const unsubscribe = useStore.subscribe((state, previous) => {
      // Care actions increment persistent care counters exactly once each.
      if (
        state.lastActionAt !== previous.lastActionAt &&
        state.lastAction !== null
      ) {
        useWardrobeProgressStore
          .getState()
          .recordCareAction(state.lastAction);
      }

      // Sustained-energy tracking reacts immediately to threshold crossings;
      // steady-state sampling is left to the heartbeat below.
      if (state.vitals.energy !== previous.vitals.energy) {
        useWardrobeProgressStore.getState().observeEnergy(state.vitals.energy);
      }

      const progressionChanged =
        state.battle !== previous.battle ||
        state.vimana !== previous.vimana ||
        state.miniGames !== previous.miniGames ||
        state.evolution.state !== previous.evolution.state ||
        state.achievements !== previous.achievements ||
        state.lastActionAt !== previous.lastActionAt;

      if (progressionChanged) scheduleSync();
    });

    // Heartbeat: keeps the sustained-energy timer honest while the app is
    // open and completes the Flame Aura run without needing a stat change.
    const heartbeatId = setInterval(() => {
      useWardrobeProgressStore
        .getState()
        .observeEnergy(useStore.getState().vitals.energy);
      scheduleSync();
    }, ENERGY_HEARTBEAT_MS);

    // Guardian saves (offspring, bond) can change from other tabs/pages.
    const onStorage = (event: StorageEvent) => {
      if (event.key === GUARDIAN_STORAGE_KEY) scheduleSync();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      unsubscribe();
      clearInterval(heartbeatId);
      window.removeEventListener('storage', onStorage);
      if (debounceId !== undefined) clearTimeout(debounceId);
    };
  }, []);

  return null;
}

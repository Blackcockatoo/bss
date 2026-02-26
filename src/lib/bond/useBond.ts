'use client';

/**
 * useBond Hook
 *
 * Provides easy access to the bond system with automatic
 * persistence and initialization.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useBondStore, type BondStoreState } from './store';
import {
  loadBondState,
  loadMemoryState,
  saveBondState,
  saveMemoryState,
  setupBondAutoSave,
} from '../persistence/bonddb';
import type { UserMood, InteractionType } from './types';

interface UseBondOptions {
  petId: string;
  autoSaveInterval?: number; // ms, default 60000
  onBondLevelUp?: (newLevel: string) => void;
}

interface UseBondReturn {
  // State
  isLoading: boolean;
  bond: BondStoreState['bond'];
  memory: BondStoreState['memory'];
  insights: BondStoreState['insights'];
  resonance: BondStoreState['resonance'];

  // Actions
  checkInMood: (mood: UserMood, note?: string) => void;
  recordActivity: (type: InteractionType) => void;
  createHabit: (name: string, frequency: 'daily' | 'weekly', description?: string) => void;
  completeHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
  addReflection: (note: string, title?: string) => void;
  captureMilestone: (templateKey: string) => void;

  // Persistence
  save: () => Promise<void>;
}

export function useBond({
  petId,
  autoSaveInterval = 60000,
  onBondLevelUp,
}: UseBondOptions): UseBondReturn {
  const store = useBondStore();
  const {
    bond,
    memory,
    insights,
    resonance,
    initialize,
    checkInMood: storeCheckInMood,
    recordVisit,
    recordActivity: storeRecordActivity,
    createHabit: storeCreateHabit,
    markHabitComplete,
    deleteHabit: storeDeleteHabit,
    createReflection,
    captureMilestone: storeCaptureMilestone,
    refreshInsights,
    refreshResonance,
    getSnapshot,
  } = store;

  const isLoadingRef = useRef(true);
  const previousBondLevelRef = useRef(bond.bondLevel);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Load and initialize on mount
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [loadedBond, loadedMemory] = await Promise.all([
          loadBondState(petId),
          loadMemoryState(petId),
        ]);

        if (mounted) {
          initialize(petId, loadedBond, loadedMemory);
          recordVisit();
          refreshInsights();
          refreshResonance();
          isLoadingRef.current = false;
        }
      } catch (error) {
        console.error('[useBond] Failed to load state:', error);
        if (mounted) {
          initialize(petId);
          isLoadingRef.current = false;
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [petId, initialize, recordVisit, refreshInsights, refreshResonance]);

  // Setup auto-save
  useEffect(() => {
    if (!petId) return;

    cleanupRef.current = setupBondAutoSave(
      petId,
      () => getSnapshot().bond,
      () => getSnapshot().memory,
      autoSaveInterval
    );

    return () => {
      cleanupRef.current?.();
    };
  }, [petId, autoSaveInterval, getSnapshot]);

  // Watch for bond level changes
  useEffect(() => {
    if (bond.bondLevel !== previousBondLevelRef.current) {
      onBondLevelUp?.(bond.bondLevel);
      previousBondLevelRef.current = bond.bondLevel;
    }
  }, [bond.bondLevel, onBondLevelUp]);

  // Refresh insights periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshInsights();
      refreshResonance();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshInsights, refreshResonance]);

  // Action wrappers
  const checkInMood = useCallback(
    (mood: UserMood, note?: string) => {
      storeCheckInMood(mood, note);
    },
    [storeCheckInMood]
  );

  const recordActivity = useCallback(
    (type: InteractionType) => {
      storeRecordActivity(type);
    },
    [storeRecordActivity]
  );

  const createHabit = useCallback(
    (name: string, frequency: 'daily' | 'weekly', description?: string) => {
      storeCreateHabit(name, frequency, description);
    },
    [storeCreateHabit]
  );

  const completeHabit = useCallback(
    (habitId: string) => {
      markHabitComplete(habitId);
    },
    [markHabitComplete]
  );

  const deleteHabit = useCallback(
    (habitId: string) => {
      storeDeleteHabit(habitId);
    },
    [storeDeleteHabit]
  );

  const addReflection = useCallback(
    (note: string, title?: string) => {
      createReflection(note, title);
    },
    [createReflection]
  );

  const captureMilestone = useCallback(
    (templateKey: string) => {
      storeCaptureMilestone(templateKey);
    },
    [storeCaptureMilestone]
  );

  // Manual save function
  const save = useCallback(async () => {
    const { bond, memory } = getSnapshot();
    await Promise.all([
      saveBondState(petId, bond),
      saveMemoryState(petId, memory),
    ]);
  }, [petId, getSnapshot]);

  return {
    isLoading: isLoadingRef.current,
    bond,
    memory,
    insights,
    resonance,
    checkInMood,
    recordActivity,
    createHabit,
    completeHabit,
    deleteHabit,
    addReflection,
    captureMilestone,
    save,
  };
}

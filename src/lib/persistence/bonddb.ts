/**
 * Bond & Memory Persistence Layer
 *
 * Stores user bond state and memory/journey data offline.
 * Uses a separate database to avoid migration issues with pet data.
 */

import type { UserBondState } from '@/lib/bond';
import type { MemoryState } from '@/lib/memory';
import { createDefaultUserBondState } from '@/lib/bond';
import { createDefaultMemoryState } from '@/lib/memory';

const DB_NAME = 'MetaPetBondDB';
const DB_VERSION = 1;
const BOND_STORE = 'bond';
const MEMORY_STORE = 'memory';

export interface BondSaveData {
  petId: string; // Links to pet
  bondState: UserBondState;
  lastSaved: number;
}

export interface MemorySaveData {
  petId: string; // Links to pet
  memoryState: MemoryState;
  lastSaved: number;
}

/**
 * Initialize Bond/Memory IndexedDB
 */
export async function initBondDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create bond store
      if (!db.objectStoreNames.contains(BOND_STORE)) {
        const bondStore = db.createObjectStore(BOND_STORE, { keyPath: 'petId' });
        bondStore.createIndex('lastSaved', 'lastSaved', { unique: false });
      }

      // Create memory store
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        const memoryStore = db.createObjectStore(MEMORY_STORE, { keyPath: 'petId' });
        memoryStore.createIndex('lastSaved', 'lastSaved', { unique: false });
      }
    };
  });
}

/**
 * Save bond state
 */
export async function saveBondState(petId: string, bondState: UserBondState): Promise<void> {
  const db = await initBondDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOND_STORE], 'readwrite');
    const store = transaction.objectStore(BOND_STORE);

    const saveData: BondSaveData = {
      petId,
      bondState: cloneBondState(bondState),
      lastSaved: Date.now(),
    };

    const request = store.put(saveData);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Load bond state
 */
export async function loadBondState(petId: string): Promise<UserBondState> {
  const db = await initBondDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOND_STORE], 'readonly');
    const store = transaction.objectStore(BOND_STORE);
    const request = store.get(petId);

    request.onsuccess = () => {
      db.close();
      const data = request.result as BondSaveData | undefined;
      if (data?.bondState) {
        resolve(normalizeBondState(data.bondState));
      } else {
        resolve(createDefaultUserBondState());
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Save memory state
 */
export async function saveMemoryState(petId: string, memoryState: MemoryState): Promise<void> {
  const db = await initBondDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEMORY_STORE], 'readwrite');
    const store = transaction.objectStore(MEMORY_STORE);

    const saveData: MemorySaveData = {
      petId,
      memoryState: cloneMemoryState(memoryState),
      lastSaved: Date.now(),
    };

    const request = store.put(saveData);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Load memory state
 */
export async function loadMemoryState(petId: string): Promise<MemoryState> {
  const db = await initBondDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEMORY_STORE], 'readonly');
    const store = transaction.objectStore(MEMORY_STORE);
    const request = store.get(petId);

    request.onsuccess = () => {
      db.close();
      const data = request.result as MemorySaveData | undefined;
      if (data?.memoryState) {
        resolve(normalizeMemoryState(data.memoryState));
      } else {
        resolve(createDefaultMemoryState());
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete bond and memory data for a pet
 */
export async function deleteBondAndMemory(petId: string): Promise<void> {
  const db = await initBondDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOND_STORE, MEMORY_STORE], 'readwrite');

    const bondStore = transaction.objectStore(BOND_STORE);
    const memoryStore = transaction.objectStore(MEMORY_STORE);

    bondStore.delete(petId);
    memoryStore.delete(petId);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Auto-save helper for bond and memory
 */
export function setupBondAutoSave(
  petId: string,
  getBondState: () => UserBondState,
  getMemoryState: () => MemoryState,
  intervalMs = 60000
): () => void {
  const intervalId = setInterval(async () => {
    try {
      await Promise.all([
        saveBondState(petId, getBondState()),
        saveMemoryState(petId, getMemoryState()),
      ]);
      console.log('[BondAutoSave] Data saved', new Date().toISOString());
    } catch (error) {
      console.error('[BondAutoSave] Failed to save:', error);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

/**
 * Clone bond state for safe storage
 */
function cloneBondState(state: UserBondState): UserBondState {
  return {
    ...state,
    moodHistory: state.moodHistory.map(m => ({ ...m })),
    interactionHistory: state.interactionHistory.map(i => ({ ...i })),
    patterns: {
      ...state.patterns,
      hourlyDistribution: [...state.patterns.hourlyDistribution],
      dailyDistribution: [...state.patterns.dailyDistribution],
      activityCounts: { ...state.patterns.activityCounts },
    },
    habits: state.habits.map(h => ({
      ...h,
      completions: h.completions.map(c => ({ ...c })),
    })),
  };
}

/**
 * Clone memory state for safe storage
 */
function cloneMemoryState(state: MemoryState): MemoryState {
  return {
    ...state,
    moments: state.moments.map(m => ({
      ...m,
      metadata: m.metadata ? { ...m.metadata } : undefined,
    })),
    pinnedMomentIds: [...state.pinnedMomentIds],
  };
}

/**
 * Normalize bond state from storage (handle missing fields)
 */
function normalizeBondState(raw: Partial<UserBondState>): UserBondState {
  const defaults = createDefaultUserBondState();

  return {
    moodHistory: Array.isArray(raw.moodHistory) ? raw.moodHistory : defaults.moodHistory,
    currentMood: raw.currentMood ?? defaults.currentMood,
    lastMoodCheckIn: raw.lastMoodCheckIn ?? defaults.lastMoodCheckIn,
    interactionHistory: Array.isArray(raw.interactionHistory) ? raw.interactionHistory : defaults.interactionHistory,
    patterns: raw.patterns ? {
      ...defaults.patterns,
      ...raw.patterns,
      hourlyDistribution: Array.isArray(raw.patterns.hourlyDistribution)
        ? raw.patterns.hourlyDistribution
        : defaults.patterns.hourlyDistribution,
      dailyDistribution: Array.isArray(raw.patterns.dailyDistribution)
        ? raw.patterns.dailyDistribution
        : defaults.patterns.dailyDistribution,
      activityCounts: raw.patterns.activityCounts
        ? { ...defaults.patterns.activityCounts, ...raw.patterns.activityCounts }
        : defaults.patterns.activityCounts,
    } : defaults.patterns,
    habits: Array.isArray(raw.habits) ? raw.habits.map(h => ({
      ...h,
      completions: Array.isArray(h.completions) ? h.completions : [],
    })) : defaults.habits,
    bondPoints: typeof raw.bondPoints === 'number' ? raw.bondPoints : defaults.bondPoints,
    bondLevel: raw.bondLevel ?? defaults.bondLevel,
    resonanceState: raw.resonanceState ?? defaults.resonanceState,
    resonanceUpdatedAt: raw.resonanceUpdatedAt ?? defaults.resonanceUpdatedAt,
    bondStartedAt: raw.bondStartedAt ?? defaults.bondStartedAt,
    lastInteractionAt: raw.lastInteractionAt ?? defaults.lastInteractionAt,
  };
}

/**
 * Normalize memory state from storage
 */
function normalizeMemoryState(raw: Partial<MemoryState>): MemoryState {
  const defaults = createDefaultMemoryState();

  return {
    moments: Array.isArray(raw.moments) ? raw.moments : defaults.moments,
    pinnedMomentIds: Array.isArray(raw.pinnedMomentIds) ? raw.pinnedMomentIds : defaults.pinnedMomentIds,
    firstMomentAt: raw.firstMomentAt ?? defaults.firstMomentAt,
    lastMomentAt: raw.lastMomentAt ?? defaults.lastMomentAt,
    totalMoments: typeof raw.totalMoments === 'number' ? raw.totalMoments : defaults.totalMoments,
  };
}

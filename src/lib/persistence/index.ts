/**
 * IndexedDB Persistence Layer
 *
 * Saves pet state, vitals, genome, and evolution offline
 */

// Re-export bond/memory persistence
export * from './bonddb';

import type { Vitals } from '@/lib/store';
import type { Genome, DerivedTraits } from '@/lib/genome';
import type { EvolutionData } from '@/lib/evolution';

const DB_NAME = 'MetaPetDB';
const DB_VERSION = 1;
const STORE_NAME = 'pets';

export interface PetState {
  id: string;
  name: string;
  vitals: Vitals;
  genome: Genome;
  traits: DerivedTraits;
  evolution: EvolutionData;
  createdAt: number;
  lastSaved: number;
}

/**
 * Initialize IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
      }
    };
  });
}

/**
 * Save pet state to IndexedDB
 */
export async function savePetState(petState: PetState): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    petState.lastSaved = Date.now();
    const request = store.put(petState);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load pet state from IndexedDB
 */
export async function loadPetState(id: string): Promise<PetState | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all saved pets
 */
export async function getAllPets(): Promise<PetState[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a pet from storage
 */
export async function deletePetState(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Auto-save helper - saves state every N seconds
 */
export function createAutoSave(
  getPetState: () => PetState,
  intervalMs = 30000 // 30 seconds
): () => void {
  const interval = setInterval(async () => {
    try {
      const state = getPetState();
      await savePetState(state);
      console.log('Auto-saved pet state');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Export pet state as JSON (for backup/sharing)
 */
export function exportPetToJSON(petState: PetState): string {
  return JSON.stringify(petState, null, 2);
}

/**
 * Import pet state from JSON
 */
export function importPetFromJSON(json: string): PetState {
  const petState = JSON.parse(json) as PetState;

  // Validate structure
  if (!petState.id || !petState.vitals || !petState.genome || !petState.evolution) {
    throw new Error('Invalid pet state JSON');
  }

  return petState;
}

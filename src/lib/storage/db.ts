/**
 * IndexedDB Persistence
 *
 * Saves pet state, vitals, genome, and evolution data offline.
 */

import type { Vitals } from '@/lib/store';
import type { Genome, DerivedTraits } from '@/lib/genome';
import type { EvolutionData } from '@/lib/evolution';

const DB_NAME = 'meta-pet-db';
const DB_VERSION = 1;
const STORE_NAME = 'pet-data';

export interface PetSaveData {
  id: string;
  name?: string;
  vitals: Vitals;
  genome: Genome;
  traits: DerivedTraits;
  evolution: EvolutionData;
  lastSaved: number;
  createdAt: number;
}

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('lastSaved', 'lastSaved', { unique: false });
      }
    };
  });
}

/**
 * Save pet data to IndexedDB
 */
export async function savePet(data: PetSaveData): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);

    const saveData = {
      ...data,
      lastSaved: Date.now(),
    };

    const request = objectStore.put(saveData);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load pet data from IndexedDB
 */
export async function loadPet(id: string): Promise<PetSaveData | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);

    const request = objectStore.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all saved pets
 */
export async function getAllPets(): Promise<PetSaveData[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);

    const request = objectStore.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete pet data
 */
export async function deletePet(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);

    const request = objectStore.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Auto-save helper (call periodically)
 */
export async function autoSave(
  id: string,
  vitals: Vitals,
  genome: Genome | null,
  traits: DerivedTraits | null,
  evolution: EvolutionData
): Promise<void> {
  if (!genome || !traits) return;

  const existing = await loadPet(id);

  const saveData: PetSaveData = {
    id,
    name: existing?.name,
    vitals,
    genome,
    traits,
    evolution,
    lastSaved: Date.now(),
    createdAt: existing?.createdAt || Date.now(),
  };

  await savePet(saveData);
}

/**
 * Export pet data as JSON
 */
export function exportPetJSON(data: PetSaveData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Import pet data from JSON
 */
export function importPetJSON(json: string): PetSaveData {
  return JSON.parse(json) as PetSaveData;
}

/**
 * Clear all pet data (use with caution!)
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);

    const request = objectStore.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

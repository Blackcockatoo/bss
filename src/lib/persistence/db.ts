/**
 * IndexedDB Persistence Layer
 *
 * Stores pet state, vitals, genome, and evolution data offline.
 */

import type { Vitals } from '@/lib/store';
import type { Genome, DerivedTraits } from '@/lib/genome';
import type { EvolutionData } from '@/lib/evolution';

const STORE_NAME = 'pets';

export interface PetData {
  id: string;
  name: string;
  vitals: Vitals;
  genome: Genome;
  traits: DerivedTraits;
  evolution: EvolutionData;
  lastSaved: number;
  primeDNA: string;
  tailDNA: string;
}

export { initDB } from "./indexeddb";
import { initDB } from "./indexeddb";

/**
 * Save pet data to IndexedDB
 */
export async function savePet(pet: PetData): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put({ ...pet, lastSaved: Date.now() });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Load pet data from IndexedDB
 */
export async function loadPet(id: string): Promise<PetData | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all pets
 */
export async function getAllPets(): Promise<PetData[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Delete pet from IndexedDB
 */
export async function deletePet(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Auto-save helper - debounced save
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function autoSavePet(pet: PetData, delay = 5000): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    savePet(pet).catch(console.error);
  }, delay);
}

/**
 * Export pet data as JSON string
 */
export function exportPet(pet: PetData): string {
  return JSON.stringify(pet, null, 2);
}

/**
 * Import pet data from JSON string
 */
export function importPet(json: string): PetData {
  return JSON.parse(json) as PetData;
}

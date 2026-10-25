/**
 * Isolated IndexedDB store until the repository's legacy v1 and v2 MetaPetDB
 * openers can be reconciled safely. Never modifies existing pet saves.
 * All records are indexed by the registered local pet ID.
 */
import { emptyForgeMemory, normaliseForgeMemory, type ForgeMemory } from "./learningMemory";

const DB_NAME = "MetaPetProjectForge";
const STORE_NAME = "learningMemory";

function openForgeDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not offer local IndexedDB storage."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "petId" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Cannot open local storage."));
    request.onblocked = () => reject(new Error("Local storage upgrade is blocked by another tab."));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function loadForgeMemory(petId: string): Promise<ForgeMemory> {
  if (!petId) return emptyForgeMemory(petId);
  const db = await openForgeDb();
  try {
    return await new Promise<ForgeMemory>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(petId);
      transaction.onerror = () => reject(transaction.error ?? new Error("Cannot read Forge memory."));
      request.onsuccess = () => resolve(normaliseForgeMemory(request.result, petId));
    });
  } finally {
    db.close();
  }
}

export async function saveForgeMemory(memory: ForgeMemory): Promise<void> {
  const safe = normaliseForgeMemory(memory, memory.petId);
  if (!safe.petId) throw new Error("A registered local pet is required to save.");
  const db = await openForgeDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(safe);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Cannot save Forge memory."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Save was cancelled."));
    });
  } finally {
    db.close();
  }
}

export async function deleteForgeMemory(petId: string): Promise<void> {
  if (!petId) return;
  const db = await openForgeDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(petId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Cannot delete Forge memory."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Deletion was cancelled."));
    });
  } finally {
    db.close();
  }
}

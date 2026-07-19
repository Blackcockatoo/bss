/**
 * PetRepository — the one persistence facade for canonical pet records
 * (Phase 1 of the MetaPet pipeline plan).
 *
 * Records live in their own IndexedDB database, written only through this
 * module. The older persistence modules (lib/persistence/*, lib/storage/db)
 * remain readable as legacy archives — the repository migrates the newest
 * legacy save into a PetRecordV2 exactly once, preserving its genome, ID,
 * crest, and HeptaCode; no existing genome is ever silently regenerated.
 */

import type { PetSaveData } from '@/lib/persistence/indexeddb';
import { getAllPets } from '@/lib/persistence/indexeddb';

import { buildPetRecord } from './registration';
import {
  detectGenomeRadix,
  HEPTA_CODE_VERSION_V1,
  isGenomeOfRadix,
  isPetRecordV2,
  type PetRecordV2,
} from './record';

const DB_NAME = 'MetaPetRegistryDB';
const DB_VERSION = 1;
const RECORD_STORE = 'petRecords';
const META_STORE = 'registryMeta';
const ACTIVE_PET_KEY = 'activePetId';

export interface PetRecordStorage {
  get(petId: string): Promise<PetRecordV2 | null>;
  put(record: PetRecordV2): Promise<void>;
  list(): Promise<PetRecordV2[]>;
  getActivePetId(): Promise<string | null>;
  setActivePetId(petId: string): Promise<void>;
}

export function createMemoryStorage(): PetRecordStorage {
  const records = new Map<string, PetRecordV2>();
  let activePetId: string | null = null;
  return {
    async get(petId) {
      return records.get(petId) ?? null;
    },
    async put(record) {
      records.set(record.petId, structuredClone(record));
    },
    async list() {
      return [...records.values()];
    },
    async getActivePetId() {
      return activePetId;
    },
    async setActivePetId(petId) {
      activePetId = petId;
    },
  };
}

function openRegistryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORD_STORE)) {
        db.createObjectStore(RECORD_STORE, { keyPath: 'petId' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
  });
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDbStorage(): PetRecordStorage {
  return {
    async get(petId) {
      const db = await openRegistryDb();
      try {
        const result = await requestAsPromise(
          db.transaction(RECORD_STORE).objectStore(RECORD_STORE).get(petId),
        );
        return isPetRecordV2(result) ? result : null;
      } finally {
        db.close();
      }
    },
    async put(record) {
      const db = await openRegistryDb();
      try {
        await requestAsPromise(
          db
            .transaction(RECORD_STORE, 'readwrite')
            .objectStore(RECORD_STORE)
            .put(record),
        );
      } finally {
        db.close();
      }
    },
    async list() {
      const db = await openRegistryDb();
      try {
        const result = await requestAsPromise(
          db.transaction(RECORD_STORE).objectStore(RECORD_STORE).getAll(),
        );
        return (Array.isArray(result) ? result : []).filter(isPetRecordV2);
      } finally {
        db.close();
      }
    },
    async getActivePetId() {
      const db = await openRegistryDb();
      try {
        const result = await requestAsPromise(
          db.transaction(META_STORE).objectStore(META_STORE).get(ACTIVE_PET_KEY),
        );
        return typeof result === 'string' && result.length > 0 ? result : null;
      } finally {
        db.close();
      }
    },
    async setActivePetId(petId) {
      const db = await openRegistryDb();
      try {
        await requestAsPromise(
          db
            .transaction(META_STORE, 'readwrite')
            .objectStore(META_STORE)
            .put(petId, ACTIVE_PET_KEY),
        );
      } finally {
        db.close();
      }
    },
  };
}

function defaultStorage(): PetRecordStorage {
  return typeof indexedDB === 'undefined'
    ? createMemoryStorage()
    : createIndexedDbStorage();
}

export interface EnsureRegisteredPetOptions {
  /** Injectable legacy-archive loader; defaults to the MetaPetDB archive. */
  loadLegacyPets?: () => Promise<PetSaveData[]>;
  /** Injectable HMAC key for tests. */
  hmacKey?: CryptoKey;
}

export interface PetRepository {
  loadActiveRecord(): Promise<PetRecordV2 | null>;
  getRecord(petId: string): Promise<PetRecordV2 | null>;
  listRecords(): Promise<PetRecordV2[]>;
  saveRecord(record: PetRecordV2, options?: { activate?: boolean }): Promise<void>;
  /**
   * The idempotent boot transaction: return the active record if one exists;
   * otherwise migrate the newest legacy archive save (same genome, ID, crest,
   * HeptaCode — nothing rerolled); otherwise register a fresh genesis pet.
   */
  ensureRegisteredPet(options?: EnsureRegisteredPetOptions): Promise<PetRecordV2>;
}

async function loadLegacyPetsSafely(
  loader: () => Promise<PetSaveData[]>,
): Promise<PetSaveData[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

function newestLegacyPet(pets: PetSaveData[]): PetSaveData | null {
  let newest: PetSaveData | null = null;
  for (const pet of pets) {
    if (!isGenomeOfRadix(pet.genome, 10)) continue;
    if (!newest || (pet.lastSaved ?? 0) > (newest.lastSaved ?? 0)) {
      newest = pet;
    }
  }
  return newest;
}

export function createPetRepository(
  storage: PetRecordStorage = defaultStorage(),
): PetRepository {
  return {
    async loadActiveRecord() {
      const activePetId = await storage.getActivePetId();
      if (!activePetId) return null;
      return storage.get(activePetId);
    },

    getRecord: (petId) => storage.get(petId),
    listRecords: () => storage.list(),

    async saveRecord(record, options) {
      if (!isPetRecordV2(record)) {
        throw new Error('Refusing to save a malformed pet record');
      }
      const existing = await storage.get(record.petId);
      if (
        existing &&
        (existing.genomeHash.redHash !== record.genomeHash.redHash ||
          existing.genomeHash.blueHash !== record.genomeHash.blueHash ||
          existing.genomeHash.blackHash !== record.genomeHash.blackHash)
      ) {
        throw new Error(
          `Refusing to overwrite pet ${record.petId}: genome hash differs from the registered record. A registered genome is identity and is never regenerated.`,
        );
      }
      await storage.put(record);
      if (options?.activate ?? true) {
        await storage.setActivePetId(record.petId);
      }
    },

    async ensureRegisteredPet(options = {}) {
      const active = await this.loadActiveRecord();
      if (active) return active;

      const legacyLoader = options.loadLegacyPets ?? getAllPets;
      const legacy = newestLegacyPet(await loadLegacyPetsSafely(legacyLoader));

      const record = legacy
        ? await buildPetRecord({
            name: legacy.name,
            genome: legacy.genome,
            genomeRadix: detectGenomeRadix(legacy.genome),
            petId: legacy.id,
            createdAt: legacy.createdAt,
            vitals: legacy.vitals,
            hmacKey: options.hmacKey,
          })
        : await buildPetRecord({ hmacKey: options.hmacKey });

      // Migration preserves legacy identity artifacts rather than reminting.
      if (legacy) {
        if (legacy.crest) {
          record.crest = legacy.crest;
          record.registrationSignature = legacy.crest.signature;
        }
        if (legacy.heptaDigits) {
          record.heptaCode = {
            version: HEPTA_CODE_VERSION_V1,
            digits: legacy.heptaDigits,
          };
        }
        record.evolution = legacy.evolution ?? record.evolution;
        record.traits = legacy.traits ?? record.traits;
      }

      await this.saveRecord(record);
      return record;
    },
  };
}

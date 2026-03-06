/**
 * IndexedDB Persistence Layer
 *
 * Stores pet state, vitals, genome, and evolution data offline.
 */

import type { PetType, Vitals, MirrorModeState } from '@/lib/store';
import type { Genome, DerivedTraits, GenomeHash } from '@/lib/genome';
import type { EvolutionData } from '@/lib/evolution';
import type { HeptaDigits, PrimeTailID, PrivacyPreset, Rotation, Vault } from '@/lib/identity/types';
import { createDefaultRitualProgress, type RitualProgress } from '@/lib/ritual/types';
import {
  createWitnessRecord,
  createTraceFromWitness,
  isDerivedWitnessMark,
  isValidWitnessRecord,
  type PetOntologyState,
  type WitnessRecord,
} from '@/lib/witness';
import {
  type InvariantIssue,
  type SystemState,
  shouldSealSystem,
} from '@/lib/system/invariants';
import {
  type Achievement,
  type BattleStats,
  type MiniGameProgress,
  type VimanaState,
  createDefaultBattleStats,
  createDefaultMiniGameProgress,
  createDefaultVimanaState,
} from '@/lib/progression/types';

const DB_NAME = 'MetaPetDB';
const DB_VERSION = 2;
const STORE_NAME = 'pets';
const HISTORY_STORE = 'petHistory';
const VIMANA_FIELDS = ['calm', 'neuro', 'quantum', 'earth'] as const;
const VIMANA_REWARDS = ['mood', 'energy', 'hygiene', 'mystery'] as const;

export interface PetSaveData {
  id: string; // pet ID from crest
  name?: string;
  vitals: Vitals;
  petType: PetType;
  mirrorMode: MirrorModeState;
  witness: WitnessRecord;
  petOntology: PetOntologyState;
  systemState: SystemState;
  sealedAt: number | null;
  invariantIssues: InvariantIssue[];
  genome: Genome;
  genomeHash: GenomeHash;
  traits: DerivedTraits;
  evolution: EvolutionData;
  ritualProgress: RitualProgress;
  essence: number;
  lastRewardSource: string | null;
  lastRewardAmount: number;
  achievements: Achievement[];
  battle: BattleStats;
  miniGames: MiniGameProgress;
  vimana: VimanaState;
  crest: PrimeTailID;
  heptaDigits: HeptaDigits;
  /** Current privacy preset - tracked separately for easy updates */
  privacyPreset?: PrivacyPreset;
  lastSaved: number;
  createdAt: number;
}

type PetHistoryRecord =
  | {
      recordId: string;
      petId: string;
      recordedAt: number;
      kind: 'snapshot';
      data: PetSaveData;
    }
  | {
      recordId: string;
      petId: string;
      recordedAt: number;
      kind: 'tombstone';
      reason?: string;
    };

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
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
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'recordId' });
        historyStore.createIndex('byPetId', 'petId', { unique: false });
        historyStore.createIndex('byPetIdRecordedAt', ['petId', 'recordedAt'], { unique: false });
        historyStore.createIndex('byRecordedAt', 'recordedAt', { unique: false });
      }

      if (event.oldVersion < 2 && db.objectStoreNames.contains(STORE_NAME)) {
        const transaction = request.transaction;
        if (!transaction) return;
        const legacyStore = transaction.objectStore(STORE_NAME);
        const historyStore = transaction.objectStore(HISTORY_STORE);
        const requestAll = legacyStore.getAll();
        requestAll.onsuccess = () => {
          const items = Array.isArray(requestAll.result) ? requestAll.result : [];
          items.forEach(item => {
            const data = normalizePetData(item);
            const recordedAt = data.lastSaved ?? Date.now();
            const record: PetHistoryRecord = {
              recordId: createRecordId(data.id, recordedAt),
              petId: data.id,
              recordedAt,
              kind: 'snapshot',
              data,
            };
            historyStore.add(record);
          });
        };
      }
    };
  });
}

/**
 * Save pet data
 */
export async function savePet(data: PetSaveData): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);

    const recordedAt = Date.now();
    const record: PetHistoryRecord = {
      recordId: createRecordId(data.id, recordedAt),
      petId: data.id,
      recordedAt,
      kind: 'snapshot',
      data: {
        ...data,
        genome: {
          red60: [...data.genome.red60],
          blue60: [...data.genome.blue60],
          black60: [...data.genome.black60],
        },
        witness: JSON.parse(JSON.stringify(data.witness)) as WitnessRecord,
        invariantIssues: data.invariantIssues.map(issue => ({ ...issue })),
        achievements: data.achievements.map(entry => ({ ...entry })),
        battle: { ...data.battle },
        miniGames: { ...data.miniGames },
        vimana: cloneVimana(data.vimana),
        mirrorMode: { ...data.mirrorMode },
        heptaDigits: Array.from(data.heptaDigits) as HeptaDigits,
        lastSaved: recordedAt,
      },
    };

    const request = store.add(record);

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
 * Load pet data by ID
 */
export async function loadPet(id: string): Promise<PetSaveData | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const index = store.index('byPetIdRecordedAt');
    const range = IDBKeyRange.bound([id, 0], [id, Number.MAX_SAFE_INTEGER]);
    const request = index.openCursor(range, 'prev');

    request.onsuccess = () => {
      db.close();
      const cursor = request.result;
      if (!cursor) {
        resolve(null);
        return;
      }
      const record = cursor.value as PetHistoryRecord;
      if (record.kind === 'tombstone') {
        resolve(null);
        return;
      }
      resolve(normalizePetData(record.data));
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Get all pets
 */
export async function getAllPets(): Promise<PetSaveData[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const index = store.index('byPetIdRecordedAt');
    const request = index.openCursor(null, 'prev');
    const latestById = new Map<string, PetSaveData>();
    const tombstoned = new Set<string>();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        db.close();
        resolve([...latestById.values()]);
        return;
      }

      const record = cursor.value as PetHistoryRecord;
      if (!latestById.has(record.petId) && !tombstoned.has(record.petId)) {
        if (record.kind === 'snapshot') {
          latestById.set(record.petId, normalizePetData(record.data));
        } else {
          tombstoned.add(record.petId);
        }
      }

      cursor.continue();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Archive pet data (append-only tombstone)
 */
export async function deletePet(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);
    const recordedAt = Date.now();
    const record: PetHistoryRecord = {
      recordId: createRecordId(id, recordedAt),
      petId: id,
      recordedAt,
      kind: 'tombstone',
      reason: 'archived-by-user',
    };
    const request = store.add(record);

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
 * Auto-save interval helper
 */
export function setupAutoSave(
  getPetData: () => PetSaveData,
  intervalMs = 60000, // 1 minute
  persist: (data: PetSaveData) => Promise<void> | void = savePet
): () => void {
  const intervalId = setInterval(async () => {
    try {
      const data = getPetData();
      await persist(data);
      console.log('[AutoSave] Pet data saved', new Date().toISOString());
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

export function exportPetToJSON(data: PetSaveData): string {
  const safeData: PetSaveData = {
    ...data,
    name: data.name?.trim() || undefined,
    genome: {
      red60: [...data.genome.red60],
      blue60: [...data.genome.blue60],
      black60: [...data.genome.black60],
    },
    achievements: data.achievements.map(entry => ({ ...entry })),
    battle: { ...data.battle },
    miniGames: { ...data.miniGames },
    vimana: cloneVimana(data.vimana),
    mirrorMode: { ...data.mirrorMode },
    witness: JSON.parse(JSON.stringify(data.witness)) as WitnessRecord,
    petOntology: data.petOntology,
    systemState: data.systemState,
    sealedAt: data.sealedAt,
    invariantIssues: data.invariantIssues.map(issue => ({ ...issue })),
    ritualProgress: {
      ...data.ritualProgress,
      history: data.ritualProgress.history.map(entry => ({ ...entry })),
    },
    traits: JSON.parse(JSON.stringify(data.traits)),
    crest: { ...data.crest, tail: [...data.crest.tail] as [number, number, number, number] },
    heptaDigits: Array.from(data.heptaDigits) as HeptaDigits,
  };

  return JSON.stringify(safeData, null, 2);
}

export function importPetFromJSON(json: string, options?: { skipGenomeValidation?: boolean }): PetSaveData {
  const parsed = JSON.parse(json) as Partial<PetSaveData> | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid pet file: expected JSON object');
  }

  if (typeof parsed.id !== 'string' || parsed.id.trim() === '') {
    throw new Error('Invalid pet file: missing id');
  }

  if (!isValidVitals(parsed.vitals)) {
    throw new Error('Invalid pet file: vitals are malformed');
  }

  if (!isValidGenome(parsed.genome)) {
    throw new Error('Invalid pet file: genome is malformed');
  }

  // If genome validation was skipped, provide a default empty genome
  const genome: Genome = options?.skipGenomeValidation && !isValidGenome(parsed.genome)
    ? { red60: Array(60).fill(0), blue60: Array(60).fill(0), black60: Array(60).fill(0) }
    : parsed.genome!;

  // PetType validation and default
  const petType: PetType = (() => {
    if (parsed.petType && ['organic', 'geometric', 'hybrid'].includes(parsed.petType)) {
      return parsed.petType as PetType;
    }
    return 'geometric'; // Default to geometric if not specified
  })();

  if (!parsed.genomeHash || !isValidGenomeHash(parsed.genomeHash)) {
    throw new Error('Invalid pet file: genome hashes are malformed');
  }

  if (!parsed.traits || typeof parsed.traits !== 'object') {
    throw new Error('Invalid pet file: traits missing');
  }

  if (!isValidEvolution(parsed.evolution)) {
    throw new Error('Invalid pet file: evolution data is malformed');
  }

  if (!isValidCrest(parsed.crest)) {
    throw new Error('Invalid pet file: crest data is malformed');
  }

  if (!isValidHeptaDigits(parsed.heptaDigits)) {
    throw new Error('Invalid pet file: HeptaCode digits malformed');
  }

  const achievements = (() => {
    if (parsed.achievements === undefined) return [] as Achievement[];
    if (isValidAchievements(parsed.achievements)) {
      return parsed.achievements.map(entry => ({ ...entry }));
    }
    throw new Error('Invalid pet file: achievements malformed');
  })();

  const battle = (() => {
    if (parsed.battle === undefined) return createDefaultBattleStats();
    if (isValidBattleStats(parsed.battle)) {
      return { ...parsed.battle };
    }
    throw new Error('Invalid pet file: battle stats malformed');
  })();

  const miniGames = (() => {
    if (parsed.miniGames === undefined) return createDefaultMiniGameProgress();
    if (isValidMiniGameProgress(parsed.miniGames)) {
      return { ...parsed.miniGames };
    }
    throw new Error('Invalid pet file: mini-game progress malformed');
  })();

  const vimana = (() => {
    if (parsed.vimana === undefined) return createDefaultVimanaState();
    if (isValidVimanaState(parsed.vimana)) {
      return cloneVimana(parsed.vimana);
    }
    throw new Error('Invalid pet file: vimana state malformed');
  })();

  const mirrorMode = (() => {
    if (parsed.mirrorMode === undefined) return createDefaultMirrorMode();
    if (isValidMirrorMode(parsed.mirrorMode)) {
      return { ...parsed.mirrorMode };
    }
    throw new Error('Invalid pet file: mirror mode malformed');
  })();

  const witness = (() => {
    const defaultWitness = createWitnessRecord(parsed.id);
    if (parsed.witness === undefined) return defaultWitness;
    if (isValidWitnessRecord(parsed.witness)) {
      if (!isDerivedWitnessMark(parsed.witness.mark)) {
        throw new Error('Invalid pet file: witness mark does not match seed');
      }
      if (parsed.witness.state.presence === 'disappeared' && !parsed.witness.trace) {
        return {
          ...parsed.witness,
          trace: createTraceFromWitness(parsed.witness),
        };
      }
      return parsed.witness;
    }
    throw new Error('Invalid pet file: witness record malformed');
  })();

  const petOntology: PetOntologyState = (() => {
    if (parsed.petOntology === 'living' || parsed.petOntology === 'unwitnessed' || parsed.petOntology === 'enduring') {
      return parsed.petOntology;
    }
    return 'living';
  })();

  const systemState: SystemState = parsed.systemState === 'sealed' ? 'sealed' : 'active';
  const sealedAt = typeof parsed.sealedAt === 'number' ? parsed.sealedAt : null;
  const invariantIssues = (() => {
    if (!Array.isArray(parsed.invariantIssues)) return [] as InvariantIssue[];
    const issues = parsed.invariantIssues.filter(isValidInvariantIssue).map(issue => ({ ...issue }));
    return issues;
  })();

  const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now();
  const lastSaved = typeof parsed.lastSaved === 'number' ? parsed.lastSaved : Date.now();

  const essence = typeof parsed.essence === 'number' ? parsed.essence : 0;
  const lastRewardSource =
    typeof parsed.lastRewardSource === 'string' ? parsed.lastRewardSource : null;
  const lastRewardAmount = typeof parsed.lastRewardAmount === 'number' ? parsed.lastRewardAmount : 0;

  const resolvedSealed = systemState === 'sealed' || shouldSealSystem(invariantIssues);
  const effectiveSealedAt = resolvedSealed ? sealedAt ?? Date.now() : null;

  return {
    id: parsed.id,
    name: typeof parsed.name === 'string' && parsed.name.trim() !== '' ? parsed.name.trim() : undefined,
    vitals: normalizeVitals(parsed.vitals),
    petType,
    genome,
    genomeHash: parsed.genomeHash,
    traits: parsed.traits as DerivedTraits,
    evolution: parsed.evolution,
    ritualProgress: isValidRitualProgress(parsed.ritualProgress)
      ? normalizeRitualProgress(parsed.ritualProgress)
      : createDefaultRitualProgress(),
    essence,
    lastRewardSource,
    lastRewardAmount,
    achievements,
    battle,
    miniGames,
    vimana,
    mirrorMode,
    witness,
    petOntology,
    systemState: resolvedSealed ? 'sealed' : systemState,
    sealedAt: effectiveSealedAt,
    invariantIssues,
    crest: parsed.crest,
    heptaDigits: Object.freeze([...parsed.heptaDigits]) as HeptaDigits,
    createdAt,
    lastSaved,
  };
}

function cloneVimana(value: VimanaState): VimanaState {
  return {
    ...value,
    cells: value.cells.map(cell => ({ ...cell })),
  };
}

function normalizePetData(raw: unknown): PetSaveData {
  const base = raw && typeof raw === 'object' ? raw : {};

  const typed = base as Partial<PetSaveData>;

  const achievements = isValidAchievements(typed.achievements)
    ? typed.achievements.map(entry => ({ ...entry }))
    : [];
  const battle = isValidBattleStats(typed.battle)
    ? { ...typed.battle }
    : createDefaultBattleStats();
  const miniGames = isValidMiniGameProgress(typed.miniGames)
    ? { ...typed.miniGames }
    : createDefaultMiniGameProgress();
  const vimana = isValidVimanaState(typed.vimana)
    ? cloneVimana(typed.vimana)
    : createDefaultVimanaState();
  const mirrorMode = isValidMirrorMode(typed.mirrorMode)
    ? { ...typed.mirrorMode }
    : createDefaultMirrorMode();
  const ritualProgress = isValidRitualProgress(typed.ritualProgress)
    ? normalizeRitualProgress(typed.ritualProgress)
    : createDefaultRitualProgress();
  const essence = typeof typed.essence === 'number' ? typed.essence : 0;
  const lastRewardSource =
    typeof typed.lastRewardSource === 'string' ? typed.lastRewardSource : null;
  const lastRewardAmount = typeof typed.lastRewardAmount === 'number' ? typed.lastRewardAmount : 0;
  const witnessSeed = typeof typed.id === 'string' ? typed.id : 'unknown';
  const witness = isValidWitnessRecord(typed.witness)
    ? (isDerivedWitnessMark(typed.witness.mark) ? typed.witness : createWitnessRecord(witnessSeed))
    : createWitnessRecord(witnessSeed);
  const normalizedWitness =
    witness.state.presence === 'disappeared' && !witness.trace
      ? { ...witness, trace: createTraceFromWitness(witness) }
      : witness;
  const petOntology: PetOntologyState =
    typed.petOntology === 'unwitnessed' || typed.petOntology === 'enduring' || typed.petOntology === 'living'
      ? typed.petOntology
      : 'living';
  const invariantIssues = Array.isArray(typed.invariantIssues)
    ? typed.invariantIssues.filter(isValidInvariantIssue).map(issue => ({ ...issue }))
    : [];
  const resolvedSealed =
    typed.systemState === 'sealed' || shouldSealSystem(invariantIssues);
  const systemState: SystemState = resolvedSealed ? 'sealed' : 'active';
  const sealedAt =
    resolvedSealed && typeof typed.sealedAt === 'number' ? typed.sealedAt : null;

  // Normalize vitals to include new sickness properties with defaults
  const vitals = normalizeVitals(typed.vitals);

  return {
    ...(typed as PetSaveData),
    vitals,
    achievements,
    battle,
    miniGames,
    vimana,
    mirrorMode,
    ritualProgress,
    essence,
    lastRewardSource,
    lastRewardAmount,
    petType: isValidPetType(typed.petType) ? typed.petType : 'geometric',
    witness: normalizedWitness,
    petOntology,
    systemState,
    sealedAt: systemState === 'sealed' ? sealedAt ?? Date.now() : null,
    invariantIssues,
  } as PetSaveData;
}

function normalizeVitals(value: unknown): Vitals {
  const defaultVitals: Vitals = {
    hunger: 30,
    hygiene: 70,
    mood: 60,
    energy: 80,
    isSick: false,
    sicknessSeverity: 0,
    sicknessType: 'none',
    deathCount: 0,
  };

  if (!value || typeof value !== 'object') {
    return defaultVitals;
  }

  const v = value as Partial<Vitals>;

  return {
    hunger: typeof v.hunger === 'number' && Number.isFinite(v.hunger) ? v.hunger : defaultVitals.hunger,
    hygiene: typeof v.hygiene === 'number' && Number.isFinite(v.hygiene) ? v.hygiene : defaultVitals.hygiene,
    mood: typeof v.mood === 'number' && Number.isFinite(v.mood) ? v.mood : defaultVitals.mood,
    energy: typeof v.energy === 'number' && Number.isFinite(v.energy) ? v.energy : defaultVitals.energy,
    isSick: typeof v.isSick === 'boolean' ? v.isSick : defaultVitals.isSick,
    sicknessSeverity: typeof v.sicknessSeverity === 'number' && Number.isFinite(v.sicknessSeverity) ? v.sicknessSeverity : defaultVitals.sicknessSeverity,
    sicknessType: isValidSicknessType(v.sicknessType) ? v.sicknessType : defaultVitals.sicknessType,
    deathCount: typeof v.deathCount === 'number' && Number.isFinite(v.deathCount) ? v.deathCount : defaultVitals.deathCount,
  };
}

function isValidSicknessType(value: unknown): value is Vitals['sicknessType'] {
  return value === 'none' || value === 'hungry' || value === 'dirty' || value === 'exhausted' || value === 'depressed';
}

function isValidVitals(value: unknown): value is Vitals {
  if (!value || typeof value !== 'object') return false;
  const vitals = value as Vitals;
  return ['hunger', 'hygiene', 'mood', 'energy'].every(key => {
    const num = vitals[key as keyof Vitals];
    return typeof num === 'number' && Number.isFinite(num);
  });
}

function isValidGenome(value: unknown): value is Genome {
  if (!value || typeof value !== 'object') return false;
  const genome = value as Genome;
  return (
    isBase7Array(genome.red60, 60) &&
    isBase7Array(genome.blue60, 60) &&
    isBase7Array(genome.black60, 60)
  );
}

function isValidGenomeHash(value: unknown): value is GenomeHash {
  if (!value || typeof value !== 'object') return false;
  const hash = value as GenomeHash;
  return (
    typeof hash.redHash === 'string' &&
    typeof hash.blueHash === 'string' &&
    typeof hash.blackHash === 'string'
  );
}

function isValidPetType(value: unknown): value is PetType {
  return value === 'geometric' || value === 'auralia';
}

function isValidInvariantIssue(value: unknown): value is InvariantIssue {
  if (!value || typeof value !== 'object') return false;
  const issue = value as InvariantIssue;
  const typeOk =
    issue.type === 'inability' ||
    issue.type === 'ambiguity' ||
    issue.type === 'contradiction';
  return typeOk && typeof issue.message === 'string' && typeof issue.detectedAt === 'number';
}

function isBase7Array(value: unknown, expectedLength: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === expectedLength &&
    value.every(v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 7)
  );
}

function isValidEvolution(value: unknown): value is EvolutionData {
  if (!value || typeof value !== 'object') return false;
  const evo = value as EvolutionData;
  return (
    typeof evo.state === 'string' &&
    typeof evo.birthTime === 'number' &&
    typeof evo.lastEvolutionTime === 'number' &&
    typeof evo.experience === 'number' &&
    typeof evo.level === 'number' &&
    typeof evo.currentLevelXp === 'number' &&
    typeof evo.totalXp === 'number' &&
    typeof evo.totalInteractions === 'number' &&
    typeof evo.canEvolve === 'boolean'
  );
}

function isValidAchievements(value: unknown): value is Achievement[] {
  return (
    Array.isArray(value) &&
    value.every(entry => {
      if (!entry || typeof entry !== 'object') return false;
      const achievement = entry as Achievement;
      const earnedAt = achievement.earnedAt;
      return (
        typeof achievement.id === 'string' &&
        typeof achievement.title === 'string' &&
        typeof achievement.description === 'string' &&
        (earnedAt === undefined || typeof earnedAt === 'number')
      );
    })
  );
}

function isValidBattleStats(value: unknown): value is BattleStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as BattleStats;
  const lastResultValid = stats.lastResult === null || stats.lastResult === 'win' || stats.lastResult === 'loss';
  const lastOpponentValid = stats.lastOpponent === null || typeof stats.lastOpponent === 'string';
  return (
    typeof stats.wins === 'number' &&
    typeof stats.losses === 'number' &&
    typeof stats.streak === 'number' &&
    lastResultValid &&
    lastOpponentValid &&
    typeof stats.energyShield === 'number'
  );
}

function isValidMiniGameProgress(value: unknown): value is MiniGameProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as MiniGameProgress;
  const lastPlayedValid = progress.lastPlayedAt === null || typeof progress.lastPlayedAt === 'number';
  const numericFields = [
    progress.memoryHighScore,
    progress.rhythmHighScore,
    progress.focusStreak,
    progress.vimanaHighScore,
    progress.vimanaMaxLines,
    progress.vimanaMaxLevel,
    progress.vimanaLastScore,
    progress.vimanaLastLines,
    progress.vimanaLastLevel,
  ];
  const statsValid = numericFields.every(
    field => typeof field === 'number' && Number.isFinite(field)
  );

  return statsValid && lastPlayedValid;
}

function isValidVimanaState(value: unknown): value is VimanaState {
  if (!value || typeof value !== 'object') return false;
  const state = value as VimanaState;
  const lastScanValid = state.lastScanAt === null || typeof state.lastScanAt === 'number';
  return (
    Array.isArray(state.cells) &&
    state.cells.every(isValidVimanaCell) &&
    typeof state.activeCellId === 'string' &&
    typeof state.anomaliesFound === 'number' &&
    typeof state.anomaliesResolved === 'number' &&
    typeof state.scansPerformed === 'number' &&
    lastScanValid
  );
}

function isValidVimanaCell(value: unknown): value is VimanaState['cells'][number] {
  if (!value || typeof value !== 'object') return false;
  const cell = value as VimanaState['cells'][number];
  const fieldValid = VIMANA_FIELDS.includes(cell.field as (typeof VIMANA_FIELDS)[number]);
  const rewardValid = VIMANA_REWARDS.includes(cell.reward as (typeof VIMANA_REWARDS)[number]);
  return (
    typeof cell.id === 'string' &&
    typeof cell.label === 'string' &&
    typeof cell.field === 'string' &&
    fieldValid &&
    typeof cell.discovered === 'boolean' &&
    typeof cell.anomaly === 'boolean' &&
    typeof cell.energy === 'number' &&
    typeof cell.reward === 'string' &&
    rewardValid &&
    (cell.visitedAt === undefined || typeof cell.visitedAt === 'number')
  );
}

function isValidRitualProgress(value: unknown): value is RitualProgress {
  if (!value || typeof value !== 'object') return false;
  const progress = value as RitualProgress;
  const historyValid = Array.isArray(progress.history) && progress.history.every(isValidRitualHistoryEntry);
  return (
    typeof progress.resonance === 'number' &&
    typeof progress.nectar === 'number' &&
    typeof progress.streak === 'number' &&
    typeof progress.totalSessions === 'number' &&
    (progress.lastDayKey === null || typeof progress.lastDayKey === 'number') &&
    historyValid
  );
}

function isValidRitualHistoryEntry(value: unknown): value is RitualProgress['history'][number] {
  if (!value || typeof value !== 'object') return false;
  const entry = value as RitualProgress['history'][number];
  const validInputType = entry.inputType === 'mood' || entry.inputType === 'intention' || entry.inputType === 'element';
  const validRitual =
    entry.ritual === 'tap' ||
    entry.ritual === 'hold' ||
    entry.ritual === 'breath' ||
    entry.ritual === 'yantra';
  return (
    validInputType &&
    validRitual &&
    typeof entry.inputValue === 'string' &&
    typeof entry.timestamp === 'number'
  );
}

function normalizeRitualProgress(value: RitualProgress): RitualProgress {
  return {
    resonance: Number.isFinite(value.resonance) ? value.resonance : 0,
    nectar: Number.isFinite(value.nectar) ? value.nectar : 0,
    streak: Number.isFinite(value.streak) ? value.streak : 0,
    totalSessions: Number.isFinite(value.totalSessions) ? value.totalSessions : 0,
    lastDayKey: value.lastDayKey ?? null,
    history: Array.isArray(value.history) ? value.history.map(entry => ({ ...entry })) : [],
  };
}

function isValidCrest(value: unknown): value is PrimeTailID {
  if (!value || typeof value !== 'object') return false;
  const crest = value as PrimeTailID & { tail: number[] };
  const vaults: Vault[] = ['red', 'blue', 'black'];
  const rotations: Rotation[] = ['CW', 'CCW'];

  return (
    typeof crest.vault === 'string' &&
    vaults.includes(crest.vault as Vault) &&
    typeof crest.rotation === 'string' &&
    rotations.includes(crest.rotation as Rotation) &&
    Array.isArray(crest.tail) &&
    crest.tail.length === 4 &&
    crest.tail.every(v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 60) &&
    typeof crest.coronatedAt === 'number' &&
    typeof crest.dnaHash === 'string' &&
    typeof crest.mirrorHash === 'string' &&
    typeof crest.signature === 'string'
  );
}

function isValidHeptaDigits(value: unknown): value is HeptaDigits {
  return (
    Array.isArray(value) &&
    value.length === 42 &&
    value.every(v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 7)
  );
}

function isValidMirrorMode(value: unknown): value is MirrorModeState {
  if (!value || typeof value !== 'object') return false;
  const mirror = value as MirrorModeState;
  const phaseOk =
    mirror.phase === 'idle' ||
    mirror.phase === 'entering' ||
    mirror.phase === 'crossed' ||
    mirror.phase === 'returning';
  const presetOk =
    mirror.preset === null ||
    mirror.preset === 'stealth' ||
    mirror.preset === 'standard' ||
    mirror.preset === 'radiant';

  const reflectionOk =
    mirror.lastReflection === null ||
    (typeof mirror.lastReflection === 'object' &&
      mirror.lastReflection !== null &&
      typeof mirror.lastReflection.id === 'string' &&
      (mirror.lastReflection.outcome === 'anchor' || mirror.lastReflection.outcome === 'drift') &&
      typeof mirror.lastReflection.moodDelta === 'number' &&
      typeof mirror.lastReflection.energyDelta === 'number' &&
      typeof mirror.lastReflection.timestamp === 'number' &&
      (mirror.lastReflection.note === undefined || typeof mirror.lastReflection.note === 'string') &&
      (mirror.lastReflection.preset === 'stealth' ||
        mirror.lastReflection.preset === 'standard' ||
        mirror.lastReflection.preset === 'radiant'));

  return (
    phaseOk &&
    presetOk &&
    (mirror.startedAt === null || typeof mirror.startedAt === 'number') &&
    (mirror.consentExpiresAt === null || typeof mirror.consentExpiresAt === 'number') &&
    (mirror.presenceToken === null || typeof mirror.presenceToken === 'string') &&
    reflectionOk
  );
}

function createDefaultMirrorMode(): MirrorModeState {
  return {
    phase: 'idle',
    startedAt: null,
    consentExpiresAt: null,
    preset: null,
    presenceToken: null,
    lastReflection: null,
  };
}

function createRecordId(petId: string, recordedAt: number): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2, 10);
  return `${petId}-${recordedAt}-${suffix}`;
}

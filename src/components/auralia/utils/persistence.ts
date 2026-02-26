export type { GuardianSaveData, Offspring } from '@metapet/core/auralia/persistence';
export {
  STORAGE_KEY,
  saveGuardianState,
  loadGuardianState,
  clearGuardianState,
  exportGuardianState,
  importGuardianState,
  createSnapshot,
  isLocalStorageAvailable,
} from '@metapet/core/auralia/persistence';

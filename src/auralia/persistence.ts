export interface Offspring {
  name: string;
  genome: {
    red60: number;
    blue60: number;
    black60: number;
  };
  parents: string[];
  birthDate: number;
}

export interface DreamInsightEntry {
  timestamp: number;
  insight: string;
  energy: number;
  curiosity: number;
  bond: number;
  focusedSigils: number[];
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  audioOffByDefault: boolean;
}

export interface AudioSettings {
  masterVolume: number;
  muted: boolean;
}

export interface AIConfigOverrides {
  idleMin?: number;
  idleMax?: number;
  observingMin?: number;
  observingMax?: number;
  focusingMin?: number;
  focusingMax?: number;
  playingMin?: number;
  playingMax?: number;
  dreamingMin?: number;
  dreamingMax?: number;
  idleToDreamProb?: number;
  idleToObserveProb?: number;
  idleToFocusProb?: number;
}

export interface GuardianSaveData {
  seedName: string;
  energy: number;
  curiosity: number;
  bond: number;
  health: number;
  bondHistory: { timestamp: number; bond: number; event: string }[];
  activatedPoints: number[];
  createdAt: number;
  lastSaved: number;
  totalInteractions: number;
  dreamCount: number;
  gamesWon: number;
  highContrast: boolean;
  offspring: Offspring[];
  breedingPartner?: string;
  dreamJournal?: DreamInsightEntry[];
  unlockedLore?: string[];
  accessibility?: AccessibilitySettings;
  audioSettings?: AudioSettings;
  aiConfigOverrides?: AIConfigOverrides;
  sigilAffinities?: Record<number, number>;
  focusHistory?: number[];
}

export const STORAGE_KEY = 'auralia_guardian_state';

export function saveGuardianState(data: GuardianSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save Guardian state:', error);
  }
}

export function loadGuardianState(): GuardianSaveData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as GuardianSaveData) : null;
  } catch (error) {
    console.error('Failed to load Guardian state:', error);
    return null;
  }
}

export function clearGuardianState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear Guardian state:', error);
  }
}

export function exportGuardianState(data: GuardianSaveData): string {
  return JSON.stringify(data, null, 2);
}

export function importGuardianState(json: string): GuardianSaveData | null {
  try {
    const data = JSON.parse(json) as GuardianSaveData;

    if (!isValidGuardianSaveData(data)) {
      throw new Error('Invalid Guardian state data');
    }

    return data;
  } catch (error) {
    console.error('Failed to import Guardian state:', error);
    return null;
  }
}

export function createSnapshot(data: GuardianSaveData): GuardianSaveData {
  return {
    ...data,
    lastSaved: Date.now(),
  };
}

export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function isValidGuardianSaveData(data: GuardianSaveData): boolean {
  return (
    Boolean(data.seedName) &&
    typeof data.energy === 'number' &&
    typeof data.curiosity === 'number' &&
    typeof data.bond === 'number' &&
    typeof data.health === 'number'
  );
}

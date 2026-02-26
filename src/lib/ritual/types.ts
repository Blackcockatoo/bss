export type RitualInputType = 'mood' | 'intention' | 'element';
export type RitualType = 'tap' | 'hold' | 'breath' | 'yantra';

export interface RitualHistoryEntry {
  inputType: RitualInputType;
  inputValue: string;
  ritual: RitualType;
  timestamp: number;
}

export interface RitualProgress {
  resonance: number;
  nectar: number;
  streak: number;
  totalSessions: number;
  lastDayKey: number | null;
  history: RitualHistoryEntry[];
}

export function createDefaultRitualProgress(): RitualProgress {
  return {
    resonance: 0,
    nectar: 0,
    streak: 0,
    totalSessions: 0,
    lastDayKey: null,
    history: [],
  };
}

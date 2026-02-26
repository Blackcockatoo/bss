/**
 * Vimana Integration - Field Scanning & Anomaly Detection
 * Privacy-first exploration system for discovering mood boosts and resources
 */

export interface VimanaCell {
  id: string;
  x: number;
  y: number;
  fieldType: 'calm' | 'neuro' | 'quantum' | 'earth';
  intensity: number; // 0-100
  explored: boolean;
  hasAnomaly: boolean;
  anomalyType?: 'energy' | 'mood' | 'rare';
  discoveredAt?: number;
  samples: number;
}

export interface VimanaState {
  cells: VimanaCell[];
  activeCellId: string | null;
  totalSamples: number;
  anomaliesResolved: number;
  lastScanTime: number;
}

export interface ScanResult {
  cellId: string;
  fieldType: string;
  intensity: number;
  anomalyDetected: boolean;
  samples: number;
}

export const VIMANA_ESSENCE_REWARDS = {
  discovery: 4,
  anomalyResolved: 6,
} as const;

export type ExplorationRewardPayload = {
  essenceDelta: number;
  source: 'exploration';
};

export function createExplorationRewardPayload(
  essenceDelta: number
): ExplorationRewardPayload {
  return { essenceDelta, source: 'exploration' };
}

/**
 * Generate initial Vimana grid based on genome
 */
export function generateVimanaGrid(
  genomeSeed: number,
  gridSize: number = 4
): VimanaCell[] {
  const cells: VimanaCell[] = [];
  const fieldTypes: VimanaCell['fieldType'][] = ['calm', 'neuro', 'quantum', 'earth'];
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cellSeed = genomeSeed + (y * gridSize + x) * 997;
      const intensity = 20 + ((cellSeed % 80));
      const fieldType = fieldTypes[cellSeed % 4];
      const hasAnomaly = (cellSeed % 100) < 15; // 15% chance
      
      cells.push({
        id: `cell-${x}-${y}`,
        x,
        y,
        fieldType,
        intensity,
        explored: false,
        hasAnomaly,
        anomalyType: hasAnomaly ? (['energy', 'mood', 'rare'] as const)[cellSeed % 3] : undefined,
        samples: 0,
      });
    }
  }
  
  return cells;
}

/**
 * Scan a cell to detect anomalies and collect samples
 */
export function scanCell(cell: VimanaCell): ScanResult {
  const samples = Math.floor(cell.intensity / 20) + 1;
  
  return {
    cellId: cell.id,
    fieldType: cell.fieldType,
    intensity: cell.intensity,
    anomalyDetected: cell.hasAnomaly,
    samples,
  };
}

/**
 * Resolve an anomaly and get rewards
 */
export interface AnomalyReward {
  type: 'energy' | 'mood' | 'rare';
  value: number;
  message: string;
  essenceDelta: number;
  source: 'exploration';
}

export function resolveAnomaly(cell: VimanaCell): AnomalyReward | null {
  if (!cell.hasAnomaly || !cell.explored) {
    return null;
  }
  
  const essenceDelta = VIMANA_ESSENCE_REWARDS.anomalyResolved;
  const rewards: Record<string, AnomalyReward> = {
    energy: {
      type: 'energy',
      value: 15,
      message: 'Energy surge detected! +15 Energy',
      essenceDelta,
      source: 'exploration',
    },
    mood: {
      type: 'mood',
      value: 12,
      message: 'Harmonic resonance found! +12 Mood',
      essenceDelta,
      source: 'exploration',
    },
    rare: {
      type: 'rare',
      value: 20,
      message: 'Rare quantum echo discovered! +20 Mood & Energy',
      essenceDelta,
      source: 'exploration',
    },
  };
  
  return cell.anomalyType ? rewards[cell.anomalyType] : null;
}

/**
 * Calculate field influence on pet vitals
 */
export function calculateFieldInfluence(
  fieldType: VimanaCell['fieldType'],
  intensity: number
): { mood: number; energy: number } {
  const factor = intensity / 100;
  
  const influences = {
    calm: { mood: 8 * factor, energy: 5 * factor },
    neuro: { mood: 6 * factor, energy: 8 * factor },
    quantum: { mood: 10 * factor, energy: 10 * factor },
    earth: { mood: 7 * factor, energy: 6 * factor },
  };
  
  return influences[fieldType];
}

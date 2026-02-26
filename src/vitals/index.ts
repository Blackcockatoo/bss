import type { EvolutionData } from '../evolution/index';
import { checkEvolutionEligibility } from '../evolution/index';

export interface Vitals {
  hunger: number;
  hygiene: number;
  mood: number;
  energy: number;
  isSick: boolean;
  sicknessSeverity: number; // 0-100, higher = worse
  sicknessType: 'none' | 'hungry' | 'dirty' | 'exhausted' | 'depressed';
  deathCount: number; // Track how many times pet has "died" (resets)
}

export const DEFAULT_VITALS: Vitals = {
  hunger: 30,
  hygiene: 70,
  mood: 60,
  energy: 80,
  isSick: false,
  sicknessSeverity: 0,
  sicknessType: 'none',
  deathCount: 0,
};

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function getVitalsAverage(vitals: Vitals): number {
  return (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4;
}

export function getVitalsStatus(vitals: Vitals): 'critical' | 'low' | 'good' | 'excellent' {
  const avg = getVitalsAverage(vitals);
  if (avg < 25) return 'critical';
  if (avg < 50) return 'low';
  if (avg < 75) return 'good';
  return 'excellent';
}

export function getVitalStatus(value: number): 'critical' | 'low' | 'good' | 'excellent' {
  if (value < 25) return 'critical';
  if (value < 50) return 'low';
  if (value < 75) return 'good';
  return 'excellent';
}

export const DECAY_RATES = {
  hunger: 0.25,
  hygiene: -0.15,
  energy: -0.2,
  mood: 0.05,
} as const;

// Check if pet should become sick based on vitals
export function checkSickness(vitals: Vitals): { isSick: boolean; sicknessType: Vitals['sicknessType']; severity: number } {
  // Check each vital for critical levels
  if (vitals.hunger >= 90) {
    return { isSick: true, sicknessType: 'hungry', severity: Math.min(100, (vitals.hunger - 80) * 5) };
  }
  if (vitals.hygiene <= 10) {
    return { isSick: true, sicknessType: 'dirty', severity: Math.min(100, (10 - vitals.hygiene) * 10) };
  }
  if (vitals.energy <= 5) {
    return { isSick: true, sicknessType: 'exhausted', severity: Math.min(100, (5 - vitals.energy) * 20) };
  }
  if (vitals.mood <= 10) {
    return { isSick: true, sicknessType: 'depressed', severity: Math.min(100, (10 - vitals.mood) * 10) };
  }

  return { isSick: false, sicknessType: 'none', severity: 0 };
}

// Check if pet "dies" (sickness too severe) and needs reset
export function checkDeath(vitals: Vitals): boolean {
  return vitals.isSick && vitals.sicknessSeverity >= 100;
}

// Apply medicine/treatment to sick pet
export function treatSickness(vitals: Vitals): Vitals {
  if (!vitals.isSick) return vitals;

  return {
    ...vitals,
    sicknessSeverity: Math.max(0, vitals.sicknessSeverity - 30),
    isSick: vitals.sicknessSeverity > 30,
    sicknessType: vitals.sicknessSeverity > 30 ? vitals.sicknessType : 'none',
    // Also give a small boost to the affected vital
    hunger: vitals.sicknessType === 'hungry' ? clamp(vitals.hunger - 20) : vitals.hunger,
    hygiene: vitals.sicknessType === 'dirty' ? clamp(vitals.hygiene + 20) : vitals.hygiene,
    energy: vitals.sicknessType === 'exhausted' ? clamp(vitals.energy + 20) : vitals.energy,
    mood: vitals.sicknessType === 'depressed' ? clamp(vitals.mood + 20) : vitals.mood,
  };
}

// Reset pet after death (like reincarnation)
export function resetAfterDeath(vitals: Vitals): Vitals {
  return {
    ...DEFAULT_VITALS,
    deathCount: vitals.deathCount + 1,
  };
}

export function applyDecay(vitals: Vitals): Vitals {
  // Decay rates are worse when sick
  const sickMultiplier = vitals.isSick ? 1.5 : 1;

  const newVitals = {
    ...vitals,
    hunger: clamp(vitals.hunger + DECAY_RATES.hunger * sickMultiplier),
    hygiene: clamp(vitals.hygiene + DECAY_RATES.hygiene * sickMultiplier),
    energy: clamp(vitals.energy + DECAY_RATES.energy * sickMultiplier),
    mood: clamp(vitals.mood + (vitals.energy > 50 ? DECAY_RATES.mood : -DECAY_RATES.mood * sickMultiplier)),
  };

  // Check for sickness
  const sicknessCheck = checkSickness(newVitals);

  // If already sick, severity increases over time
  let newSeverity = vitals.sicknessSeverity;
  if (sicknessCheck.isSick) {
    if (vitals.isSick) {
      newSeverity = Math.min(100, vitals.sicknessSeverity + 2); // Gets worse over time
    } else {
      newSeverity = sicknessCheck.severity;
    }
  } else if (vitals.isSick) {
    // Recovering
    newSeverity = Math.max(0, vitals.sicknessSeverity - 1);
  }

  return {
    ...newVitals,
    isSick: sicknessCheck.isSick || (vitals.isSick && newSeverity > 0),
    sicknessSeverity: newSeverity,
    sicknessType: sicknessCheck.isSick ? sicknessCheck.sicknessType : (newSeverity > 0 ? vitals.sicknessType : 'none'),
    deathCount: vitals.deathCount,
  };
}

export const INTERACTION_EFFECTS = {
  feed: {
    hunger: 20,
    energy: 5,
    mood: 3,
  },
  clean: {
    hygiene: 25,
    mood: 5,
  },
  play: {
    mood: 15,
    energy: -10,
    hygiene: -5,
  },
  sleep: {
    energy: 30,
    mood: 5,
  },
} as const;

export type Interaction = keyof typeof INTERACTION_EFFECTS;

export function applyInteraction(vitals: Vitals, interaction: Interaction): Vitals {
  const effects = INTERACTION_EFFECTS[interaction];
  const result: Vitals = { ...vitals };

  for (const [key, value] of Object.entries(effects)) {
    const field = key as keyof Vitals;
    if (field === 'hunger' || field === 'hygiene' || field === 'mood' || field === 'energy') {
      result[field] = clamp((result[field] as number) + value);
    }
  }

  // Interactions can help recovery from sickness
  if (vitals.isSick) {
    const relevantAction =
      (vitals.sicknessType === 'hungry' && interaction === 'feed') ||
      (vitals.sicknessType === 'dirty' && interaction === 'clean') ||
      (vitals.sicknessType === 'exhausted' && interaction === 'sleep') ||
      (vitals.sicknessType === 'depressed' && interaction === 'play');

    if (relevantAction) {
      result.sicknessSeverity = Math.max(0, vitals.sicknessSeverity - 15);
      if (result.sicknessSeverity === 0) {
        result.isSick = false;
        result.sicknessType = 'none';
      }
    }
  }

  return result;
}

export interface TickResult {
  vitals: Vitals;
  evolution: EvolutionData;
}

export function tick(vitals: Vitals, evolution: EvolutionData): TickResult {
  const nextVitals = applyDecay(vitals);
  const vitalsAvg = getVitalsAverage(nextVitals);
  const canEvolve = checkEvolutionEligibility(evolution, vitalsAvg);

  return {
    vitals: nextVitals,
    evolution: {
      ...evolution,
      canEvolve,
    },
  };
}

export function multiTick(vitals: Vitals, evolution: EvolutionData, tickCount: number): TickResult {
  let currentVitals = vitals;
  let currentEvolution = evolution;

  for (let i = 0; i < tickCount; i++) {
    const result = tick(currentVitals, currentEvolution);
    currentVitals = result.vitals;
    currentEvolution = result.evolution;
  }

  return {
    vitals: currentVitals,
    evolution: currentEvolution,
  };
}

export function calculateElapsedTicks(lastUpdateTime: number, tickMs: number): number {
  const now = Date.now();
  const elapsed = now - lastUpdateTime;
  return Math.floor(elapsed / tickMs);
}

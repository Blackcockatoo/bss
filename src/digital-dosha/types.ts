import type { EvolutionData } from '../evolution/types';
import type { DerivedTraits } from '../genome/types';
import type { Vitals } from '../vitals';

export type DigitalDoshaKey = 'vata' | 'pitta' | 'kapha';
export type DigitalDoshaAlias = 'flux' | 'forge' | 'anchor';
export type DigitalDoshaPhase =
  | 'native'
  | 'flux-surge'
  | 'forge-surge'
  | 'anchor-surge'
  | 'fragmented'
  | 'saturated';

export type DigitalRegulationCue = 'observe' | 'settle' | 'cool' | 'stir' | 'integrate';
export type DigitalCareAction = 'feed' | 'clean' | 'play' | 'sleep';

export interface DigitalDoshaVector {
  vata: number;
  pitta: number;
  kapha: number;
}

export interface DigitalDoshaInput {
  traits: DerivedTraits;
  vitals: Vitals;
  evolution: EvolutionData;
  lastAction?: DigitalCareAction | null;
  lastActionAt?: number;
  now?: number;
}

export interface DigitalDoshaConstitution {
  baseline: DigitalDoshaVector;
  dominant: DigitalDoshaKey;
  secondary: DigitalDoshaKey;
  signature: string;
  aliases: Record<DigitalDoshaKey, DigitalDoshaAlias>;
}

export interface DigitalDoshaState {
  current: DigitalDoshaVector;
  drift: DigitalDoshaVector;
  dominant: DigitalDoshaKey;
  phase: DigitalDoshaPhase;
  coherence: number;
  volatility: number;
  throughput: number;
  cohesion: number;
  residue: number;
}

export interface DigitalDoshaGuidance {
  cue: DigitalRegulationCue;
  target: DigitalDoshaAlias | 'whole-system';
  label: string;
}

export interface DigitalDoshaPhenotype {
  version: 1;
  constitution: DigitalDoshaConstitution;
  state: DigitalDoshaState;
  guidance: DigitalDoshaGuidance;
}

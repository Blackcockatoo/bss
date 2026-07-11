import type { EvolutionData, EvolutionState } from '../evolution/types';
import type { DerivedTraits } from '../genome/types';
import type { Vitals } from '../vitals';

export type CareAction = 'feed' | 'clean' | 'play' | 'sleep';

export type AuraTopology = 'halo' | 'neural-lattice' | 'phase-torus' | 'speciation-crown';

export type VisualBehaviorState =
  | 'forming'
  | 'idle'
  | 'alert'
  | 'joyful'
  | 'sad'
  | 'hungry'
  | 'starving'
  | 'tired'
  | 'exhausted'
  | 'dirty'
  | 'sick'
  | 'feeding'
  | 'cleaning'
  | 'playing'
  | 'sleeping';

export type ParticleMode =
  | 'none'
  | 'orbit'
  | 'inward'
  | 'rise'
  | 'fall'
  | 'spark'
  | 'dust'
  | 'static';

export interface VisualDNAInput {
  traits: DerivedTraits;
  vitals: Vitals;
  evolution: EvolutionData;
  lastAction?: CareAction | null;
  lastActionAt?: number;
  now?: number;
  reducedMotion?: boolean;
}

export interface EvolutionVisualProfile {
  state: EvolutionState;
  topology: AuraTopology;
  complexity: number;
  rings: number;
  nodeCount: number;
  stageColors: readonly [string, string, string];
  signature: string;
}

export interface VisualIdentity {
  seed: number;
  bodyType: string;
  pattern: string;
  texture: string;
  features: string[];
  baseColor: string;
  accentColor: string;
  stageColor: string;
  highlightColor: string;
  bodyScale: number;
  headRatio: number;
  limbRatio: number;
  tailRatio: number;
  asymmetry: number;
  waveAngle: number;
  waveMagnitude: number;
}

export interface AuraPhenotype {
  topology: AuraTopology;
  rings: number;
  nodes: number;
  radius: number;
  thickness: number;
  opacity: number;
  blur: number;
  pulseSeconds: number;
  rotationSeconds: number;
  turbulence: number;
  asymmetry: number;
  inwardPull: number;
  phaseOffset: number;
  colors: readonly [string, string, string, string];
}

export interface BodyPhenotype {
  scale: number;
  squashX: number;
  squashY: number;
  tiltDegrees: number;
  bobPixels: number;
  bobSeconds: number;
  saturation: number;
  brightness: number;
  opacity: number;
  shiver: number;
}

export interface FacePhenotype {
  expression: 'neutral' | 'smile' | 'frown' | 'sleepy' | 'strained' | 'focused';
  eyeOpen: number;
  pupilScale: number;
  gazeX: number;
  gazeY: number;
}

export interface ParticlePhenotype {
  mode: ParticleMode;
  count: number;
  speed: number;
  opacity: number;
  size: number;
}

export interface BehaviorPhenotype {
  state: VisualBehaviorState;
  urgency: number;
  attention: 'resting' | 'food' | 'user' | 'self' | 'environment';
  actionActive: boolean;
  actionProgress: number;
  label: string;
}

export interface VisualPhenotype {
  version: 1;
  identity: VisualIdentity;
  evolution: EvolutionVisualProfile;
  aura: AuraPhenotype;
  body: BodyPhenotype;
  face: FacePhenotype;
  particles: ParticlePhenotype;
  behavior: BehaviorPhenotype;
  needs: {
    hunger: number;
    energy: number;
    hygiene: number;
    mood: number;
    sickness: number;
  };
}

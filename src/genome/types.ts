export interface ElementInfo {
  atomicNumber: number;
  symbol: string;
  name: string;
}

export interface ResidueMeta {
  residue: number;
  elements: ElementInfo[];
  hasBridge60: boolean;
  hasFrontier: boolean;
  isVoid: boolean;
}

export type SequenceColor = 'red' | 'blue' | 'black';

export interface Genome {
  red60: number[];
  blue60: number[];
  black60: number[];
}

export interface ElementResidue {
  residue: number;
  elements2d: number[];
  elements3d: number[];
  hasPair60: boolean;
  isFrontierResidue: boolean;
  isVoid: boolean;
}

export interface ElementWebSummary {
  usedResidues: number[];
  pairSlots: number[];
  frontierSlots: number[];
  voidSlotsHit: number[];
  coverage: number;
  frontierAffinity: number;
  bridgeCount: number;
  voidDrift: number;
}

export interface GenomeHash {
  redHash: string;
  blueHash: string;
  blackHash: string;
}

export interface ElementTraits {
  bridgeScore: number;
  frontierWeight: number;
  chargeVector: {
    c2: number;
    c3: number;
    c5: number;
  };
  heptaSignature: {
    total: readonly [number, number, number];
    mod7: readonly [number, number, number];
  };
  elementWave: {
    real: number;
    imag: number;
    magnitude: number;
    angle: number;
  };
}

export interface PhysicalTraits {
  bodyType: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  texture: string;
  size: number;
  proportions: {
    headRatio: number;
    limbRatio: number;
    tailRatio: number;
  };
  features: string[];
}

export interface PersonalityTraits {
  temperament: string;
  energy: number;
  social: number;
  curiosity: number;
  discipline: number;
  affection: number;
  independence: number;
  playfulness: number;
  loyalty: number;
  quirks: string[];
}

export interface LatentTraits {
  evolutionPath: string;
  rareAbilities: string[];
  potential: {
    physical: number;
    mental: number;
    social: number;
  };
  hiddenGenes: number[];
}

export interface DerivedTraits {
  physical: PhysicalTraits;
  personality: PersonalityTraits;
  latent: LatentTraits;
  elementWeb: ElementWebSummary;
}

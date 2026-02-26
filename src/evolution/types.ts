export type EvolutionState = 'GENETICS' | 'NEURO' | 'QUANTUM' | 'SPECIATION';

export interface EvolutionRequirement {
  minAge: number;
  minInteractions: number;
  minVitalsAverage: number;
  specialCondition?: () => boolean;
  specialDescription?: string;
  minLevel: number;
}

export interface EvolutionData {
  state: EvolutionState;
  birthTime: number;
  lastEvolutionTime: number;
  experience: number; // Existing field, will be kept for now
  level: number;
  currentLevelXp: number;
  totalXp: number;
  totalInteractions: number;
  canEvolve: boolean;
}

export interface StageInfo {
  title: string;
  tagline: string;
  focus: string[];
  celebration: string;
}

export interface StageVisuals {
  colors: string[];
  glowIntensity?: number;
}

export const EVOLUTION_ORDER: EvolutionState[] = ['GENETICS', 'NEURO', 'QUANTUM', 'SPECIATION'];

export const EVOLUTION_REQUIREMENTS: Record<EvolutionState, EvolutionRequirement> = {
  GENETICS: {
    minAge: 0,
    minInteractions: 0,
    minVitalsAverage: 0,
    minLevel: 1,
  },
  NEURO: {
    minAge: 1000 * 60 * 60,
    minInteractions: 12,
    minVitalsAverage: 55,
    minLevel: 5,
    specialDescription: 'Stabilize the neural lattice and complete bonding rituals.',
  },
  QUANTUM: {
    minAge: 1000 * 60 * 60 * 24,
    minInteractions: 40,
    minVitalsAverage: 65,
    minLevel: 10,
    specialDescription: 'Achieve quantum coherence and entanglement.',
  },
  SPECIATION: {
    minAge: 1000 * 60 * 60 * 48,
    minInteractions: 80,
    minVitalsAverage: 75,
    minLevel: 15,
    specialDescription: 'PrimeTail crest refinement and consciousness alignment.',
  },
};

export const EVOLUTION_STAGE_INFO: Record<EvolutionState, StageInfo> = {
  GENETICS: {
    title: 'Genetic Formation',
    tagline: 'DNA sequencing and initial trait expression',
    focus: ['Bond with your pet', 'Maintain stable vitals', 'Begin trait discovery'],
    celebration: 'Genetic matrix stabilized! Ready for neural evolution.',
  },
  NEURO: {
    title: 'Neural Development',
    tagline: 'Neural lattice formation and cognitive awakening',
    focus: ['Develop neural pathways', 'Enhance cognitive abilities', 'Build deeper connections'],
    celebration: 'Neural lattice formed! Quantum resonance awaits.',
  },
  QUANTUM: {
    title: 'Quantum Resonance',
    tagline: 'Quantum coherence and dimensional awareness',
    focus: ['Achieve quantum coherence', 'Explore dimensional spaces', 'Master energy manipulation'],
    celebration: 'Quantum state achieved! Ready for speciation.',
  },
  SPECIATION: {
    title: 'Species Maturation',
    tagline: 'Full consciousness and prime-tail manifestation',
    focus: ['Perfect your bond', 'Master all abilities', 'Reach full potential'],
    celebration: 'Full species maturation achieved! Your pet has reached its ultimate form.',
  },
};

export const EVOLUTION_VISUALS: Record<EvolutionState, StageVisuals> = {
  GENETICS: {
    colors: ['#60a5fa', '#3b82f6', '#2563eb'],
  },
  NEURO: {
    colors: ['#a78bfa', '#8b5cf6', '#7c3aed'],
  },
  QUANTUM: {
    colors: ['#f472b6', '#ec4899', '#db2777'],
  },
  SPECIATION: {
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
  },
};

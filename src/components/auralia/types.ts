/**
 * Auralia Guardian Type Definitions
 *
 * Core types for the virtual companion system
 */

import type {
  GuardianSaveData as SharedGuardianSaveData,
  Offspring as SharedOffspring,
} from '@metapet/core/auralia/persistence';

// ===== PRIMITIVE TYPES =====

export type Bigish = bigint | number;

export type FormKey = 'radiant' | 'meditation' | 'sage' | 'vigilant' | 'celestial' | 'wild';

export type ScaleName = 'harmonic' | 'pentatonic' | 'dorian' | 'phrygian';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export type AIMode = 'idle' | 'observing' | 'focusing' | 'playing' | 'dreaming';

export type MiniGameType = 'sigilPattern' | 'fibonacciTrivia' | 'snake' | 'tetris' | null;

// ===== CORE STRUCTURES =====

export interface Form {
  name: string;
  baseColor: string;
  primaryGold: string;
  secondaryGold: string;
  tealAccent: string;
  eyeColor: string;
  glowColor: string;
  description: string;
}

export interface Stats {
  energy: number;
  curiosity: number;
  bond: number;
}

export interface SigilPoint {
  x: number;
  y: number;
  hash: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export interface Crackle {
  id: number;
  x: number;
  y: number;
  life: number;
}

export interface SigilPulse {
  id: number;
  x: number;
  y: number;
  life: number;
  color: string;
}

// ===== AI & BEHAVIOR =====

export interface AIState {
  mode: AIMode;
  target: number | null;
  since: number;
}

export interface BondHistoryEntry {
  timestamp: number;
  bond: number;
  event: string;
}

// ===== MINI-GAMES =====

export interface PatternChallenge {
  sequence: number[];
  userSequence: number[];
  active: boolean;
}

export interface TriviaQuestion {
  question: string;
  answer: number;
  options: number[];
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export interface SnakeState {
  segments: SnakeSegment[];
  food: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  score: number;
  gameOver: boolean;
}

export interface TetrisPiece {
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export interface TetrisState {
  board: number[][];
  currentPiece: TetrisPiece | null;
  score: number;
  gameOver: boolean;
}

// ===== BREEDING & GENETICS =====

export type Offspring = SharedOffspring;

// ===== PERSISTENCE =====

export type GuardianSaveData = SharedGuardianSaveData;

// ===== MOSSPRIMESEED =====

export interface Field {
  seed: string;
  red: string;
  black: string;
  blue: string;
  ring: number[];
  pulse: number[];
  hash: (msg: string) => bigint;
  prng: () => number;
  fib: (n: number) => bigint;
  lucas: (n: number) => bigint;
}

// ===== AUDIO =====

export interface AudioOscillator {
  gain: GainNode;
}

export interface AudioContextRef {
  ctx: AudioContext;
  noteOscs: AudioOscillator[];
  droneOscs: AudioOscillator[];
}

export interface AudioScale {
  name: string;
  ratios: number[];
  description: string;
}

// ===== THEMES =====

export interface TimeTheme {
  bg: string;
  accent: string;
  glow: string;
}

// ===== GENOME =====

export interface GenomeData {
  red60: number;
  blue60: number;
  black60: number;
}

// ===== COMPONENT PROPS =====

export interface AuraliaMetaPetProps {
  initialSeed?: string;
  onFormChange?: (form: FormKey) => void;
  onBondChange?: (bond: number) => void;
  onDreamComplete?: (insight: string) => void;
}

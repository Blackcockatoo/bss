export type VimanaField = 'calm' | 'neuro' | 'quantum' | 'earth';

export interface VimanaCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface VimanaCell {
  id: string;
  label?: string;
  field?: VimanaField;
  coordinates?: VimanaCoordinates;
  discovered: boolean;
  anomaly: boolean;
  energy?: number;
  reward: 'mood' | 'energy' | 'hygiene' | 'mystery';
  visitedAt?: number;
}

export interface VimanaState {
  cells: VimanaCell[];
  activeCellId?: string;
  anomaliesFound: number;
  anomaliesResolved?: number;
  scansPerformed: number;
  lastScanAt?: number | null;
}

export interface BattleStats {
  wins: number;
  losses: number;
  streak: number;
  energyShield: number;
  lastResult: 'win' | 'loss' | null;
  lastOpponent: string | null;
}

export interface MiniGameProgress {
  memoryHighScore: number;
  rhythmHighScore: number;
  focusStreak: number;
  vimanaHighScore: number;
  vimanaMaxLines: number;
  vimanaMaxLevel: number;
  vimanaLastScore: number;
  vimanaLastLines: number;
  vimanaLastLevel: number;
  // Space Jewbles fields
  spaceJewblesHighScore: number;
  spaceJewblesMaxWave: number;
  spaceJewblesLastScore: number;
  spaceJewblesLastWave: number;
  spaceJewblesMythicDrops: number;
  spaceJewblesBossesDefeated: number;
  spaceJewblesRunsPlayed: number;
  spaceJewblesTotalScore: number;
  spaceJewblesTotalWaves: number;
  lastPlayedAt: number | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt?: number;
  category?: 'vitals' | 'evolution' | 'battle' | 'exploration' | 'social' | 'minigame' | 'breeding';
}

export const ACHIEVEMENT_CATALOG: Achievement[] = [
  {
    id: 'explorer-first-step',
    title: 'First Step',
    description: 'Discover your first Vimana field cell.',
    category: 'exploration',
  },
  {
    id: 'explorer-anomaly-hunter',
    title: 'Anomaly Hunter',
    description: 'Resolve three anomalies on the Vimana grid.',
    category: 'exploration',
  },
  {
    id: 'battle-first-win',
    title: 'First Victory',
    description: 'Win your first consciousness duel.',
    category: 'battle',
  },
  {
    id: 'battle-streak',
    title: 'Momentum Rising',
    description: 'Achieve a win streak of three battles.',
    category: 'battle',
  },
  {
    id: 'minigame-memory',
    title: 'Pattern Master',
    description: 'Score 10 or more in the memory mini-game.',
    category: 'minigame',
  },
  {
    id: 'minigame-rhythm',
    title: 'Rhythm Weaver',
    description: 'Hit a rhythm score of 12 or higher.',
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-score',
    title: 'Grid Navigator',
    description: 'Score 1,500 or more in the Vimana Tetris field.',
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-lines',
    title: 'Line Harmonizer',
    description: 'Clear 20 lines in a single Vimana Tetris run.',
    category: 'minigame',
  },
  {
    id: 'breeding-first',
    title: 'New Lineage',
    description: 'Breed two pets to create a new companion.',
    category: 'breeding',
  },
  // Additional achievable mini-game milestones
  {
    id: 'minigame-memory-ace',
    title: 'Memory Ace',
    description: 'Score 20 or more in the memory mini-game.',
    category: 'minigame',
  },
  {
    id: 'minigame-rhythm-ace',
    title: 'Rhythm Ace',
    description: 'Hit a rhythm score of 20 or higher.',
    category: 'minigame',
  },
  {
    id: 'minigame-vimana-level',
    title: 'Sky Climber',
    description: 'Reach level 5 in Vimana Tetris.',
    category: 'minigame',
  },
  {
    id: 'minigame-focus-streak',
    title: 'Focused Explorer',
    description: 'Build a focus streak of 5 mini-game runs.',
    category: 'minigame',
  },
  // Space Jewbles achievements
  {
    id: 'jewbles-first-run',
    title: 'Into the Void',
    description: 'Complete your first Space Jewbles run.',
    category: 'minigame',
  },
  {
    id: 'jewbles-wave-5',
    title: 'Wave Rider',
    description: 'Survive to wave 5 in Space Jewbles.',
    category: 'minigame',
  },
  {
    id: 'jewbles-wave-10',
    title: 'Tide Sovereign',
    description: 'Survive to wave 10 in Space Jewbles.',
    category: 'minigame',
  },
  {
    id: 'jewbles-score-10k',
    title: 'Luminous Threshold',
    description: 'Score 10,000 points in a single Space Jewbles run.',
    category: 'minigame',
  },
  {
    id: 'jewbles-first-boss',
    title: 'Apex Convergence',
    description: 'Defeat a boss in Space Jewbles.',
    category: 'minigame',
  },
  {
    id: 'jewbles-boss-5',
    title: 'Spectral Vanquisher',
    description: 'Defeat 5 bosses across all Space Jewbles runs.',
    category: 'minigame',
  },
  {
    id: 'jewbles-veteran',
    title: 'Constellation Keeper',
    description: 'Complete 10 Space Jewbles runs.',
    category: 'minigame',
  },
  {
    id: 'jewbles-mythic',
    title: 'Mythic Resonance',
    description: 'Collect a mythic drop in Space Jewbles.',
    category: 'minigame',
  },
];

export interface CreateBattleStatsOptions {
  energyShield?: number;
  lastResult?: 'win' | 'loss' | null;
  lastOpponent?: string | null;
}

export function createDefaultBattleStats(options: CreateBattleStatsOptions = {}): BattleStats {
  return {
    wins: 0,
    losses: 0,
    streak: 0,
    energyShield: options.energyShield ?? 25,
    lastResult: options.lastResult ?? null,
    lastOpponent: options.lastOpponent ?? null,
  };
}

export function createDefaultMiniGameProgress(overrides: Partial<MiniGameProgress> = {}): MiniGameProgress {
  return {
    memoryHighScore: 0,
    rhythmHighScore: 0,
    focusStreak: 0,
    vimanaHighScore: 0,
    vimanaMaxLines: 0,
    vimanaMaxLevel: 0,
    vimanaLastScore: 0,
    vimanaLastLines: 0,
    vimanaLastLevel: 0,
    // Space Jewbles defaults
    spaceJewblesHighScore: 0,
    spaceJewblesMaxWave: 0,
    spaceJewblesLastScore: 0,
    spaceJewblesLastWave: 0,
    spaceJewblesMythicDrops: 0,
    spaceJewblesBossesDefeated: 0,
    spaceJewblesRunsPlayed: 0,
    spaceJewblesTotalScore: 0,
    spaceJewblesTotalWaves: 0,
    lastPlayedAt: null,
    ...overrides,
  };
}

export interface CreateVimanaStateOptions {
  layout?: 'preset' | 'grid';
  random?: () => number;
}

function createPresetVimanaState(random: () => number): VimanaState {
  const baseCells: VimanaCell[] = [
    { id: 'calm-1', label: 'Calm Glade', field: 'calm', discovered: true, anomaly: false, energy: 60, reward: 'mood', visitedAt: Date.now() },
    { id: 'calm-2', label: 'Harmonic Springs', field: 'calm', discovered: false, anomaly: false, energy: 55, reward: 'hygiene' },
    { id: 'neuro-1', label: 'Neuro Bloom', field: 'neuro', discovered: false, anomaly: random() < 0.5, energy: 65, reward: 'mystery' },
    { id: 'neuro-2', label: 'Synapse Ridge', field: 'neuro', discovered: false, anomaly: random() < 0.25, energy: 70, reward: 'energy' },
    { id: 'quantum-1', label: 'Quantum Pool', field: 'quantum', discovered: false, anomaly: random() < 0.4, energy: 80, reward: 'mood' },
    { id: 'quantum-2', label: 'Phase Garden', field: 'quantum', discovered: false, anomaly: random() < 0.3, energy: 75, reward: 'mystery' },
    { id: 'earth-1', label: 'Earth Anchor', field: 'earth', discovered: false, anomaly: random() < 0.2, energy: 50, reward: 'energy' },
    { id: 'earth-2', label: 'Crystal Vale', field: 'earth', discovered: false, anomaly: random() < 0.35, energy: 85, reward: 'hygiene' },
  ];

  const anomaliesFound = baseCells.filter(cell => cell.anomaly && cell.discovered).length;

  return {
    cells: baseCells,
    activeCellId: baseCells[0]?.id,
    anomaliesFound,
    anomaliesResolved: 0,
    scansPerformed: 0,
    lastScanAt: Date.now(),
  };
}

function createGridVimanaState(random: () => number): VimanaState {
  const cells: VimanaCell[] = [];
  const rewards: Array<VimanaCell['reward']> = ['mood', 'energy', 'hygiene', 'mystery'];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const isCenter = x === 0 && y === 0 && z === 0;
        cells.push({
          id: `${x},${y},${z}`,
          coordinates: { x, y, z },
          discovered: isCenter,
          anomaly: !isCenter && random() < 0.15,
          reward: rewards[Math.floor(random() * rewards.length)],
          visitedAt: isCenter ? Date.now() : undefined,
        });
      }
    }
  }

  const centerId = '0,0,0';
  const anomaliesFound = cells.filter(cell => cell.anomaly && cell.discovered).length;

  return {
    cells,
    activeCellId: centerId,
    anomaliesFound,
    anomaliesResolved: 0,
    scansPerformed: 0,
    lastScanAt: Date.now(),
  };
}

export function createDefaultVimanaState(options: CreateVimanaStateOptions = {}): VimanaState {
  const random = options.random ?? Math.random;
  const layout = options.layout ?? 'preset';
  return layout === 'grid' ? createGridVimanaState(random) : createPresetVimanaState(random);
}

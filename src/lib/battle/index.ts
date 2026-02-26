/**
 * Battle System - Consciousness-based non-violent duels
 * Victory depends on vitals, mood, and energy shield
 */

export interface BattleState {
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  energyShield: number; // 0-100, built through vitals
  totalBattles: number;
  opponents: string[];
}

export interface BattleResult {
  outcome: 'win' | 'loss';
  opponent: string;
  shieldChange: number;
  streakBonus: number;
  message: string;
}

export const OPPONENTS = [
  'Echo Wisp',
  'Prism Lurker',
  'Dream Stag',
  'Aurora Fox',
  'Nebula Serpent',
  'Crystal Phoenix',
  'Void Walker',
  'Starlight Owl',
];

export const OPPONENT_LORE: Record<string, { title: string; legend: string }> = {
  'Echo Wisp': {
    title: 'Whisper of the First Bell',
    legend: 'A drifting spark born from the arena\'s first resonance test. It copies careless moves, but bows to focused rhythm.',
  },
  'Prism Lurker': {
    title: 'Shards Beneath the Glass',
    legend: 'It hides in refracted light and strikes from mirrored angles. Duelists say its eyes remember every failed attempt.',
  },
  'Dream Stag': {
    title: 'Guardian of Quiet Sleep',
    legend: 'This antlered sentinel appears when minds are overclocked. Only calm intent can pass through its moonlit charge.',
  },
  'Aurora Fox': {
    title: 'Courier of Dawnfire',
    legend: 'Swift and playful, the fox carries messages between vaults. It tests whether your power can stay graceful at speed.',
  },
  'Nebula Serpent': {
    title: 'Coil of the Star Current',
    legend: 'A cosmic serpent that rides ion trails. One blink late and you are fighting the afterimage, not the strike.',
  },
  'Crystal Phoenix': {
    title: 'The Reforged Flame',
    legend: 'Forged in fractures and reborn in lattice fire, it punishes hesitation and rewards precise sequencing.',
  },
  'Void Walker': {
    title: 'Footsteps Between Frames',
    legend: 'A traveler from silent layers where echoes vanish. It teaches that timing without intention is just noise.',
  },
  'Starlight Owl': {
    title: 'Archivist of the Zenith',
    legend: 'The owl records every arena duel in constellations. Beat it, and your pattern joins the sky-map.',
  },
};

export function getArenaChapter(wins: number): string {
  if (wins < 5) return 'Chapter I · Calibration of Sparks';
  if (wins < 15) return 'Chapter II · Mirrors of Intent';
  if (wins < 30) return 'Chapter III · Fracture Constellations';
  return 'Chapter IV · Crown of Resonance';
}

/**
 * Calculate battle outcome based on vitals and shield
 */
export function simulateBattle(
  vitals: { energy: number; mood: number; hygiene: number },
  energyShield: number,
  opponent?: string
): BattleResult {
  const selectedOpponent = opponent || OPPONENTS[Math.floor(Math.random() * OPPONENTS.length)];
  
  // Calculate win probability based on vitals
  const vitalityFactor = (vitals.energy + vitals.mood) / 200;
  const hygieneFactor = vitals.hygiene / 200;
  const shieldFactor = energyShield / 100;
  
  const baseWinChance = 0.35;
  const winChance = Math.min(
    0.95,
    baseWinChance + vitalityFactor * 0.3 + hygieneFactor * 0.1 + shieldFactor * 0.25
  );
  
  const outcome: 'win' | 'loss' = Math.random() < winChance ? 'win' : 'loss';
  
  // Shield changes
  const shieldChange = outcome === 'win' ? 5 : -8;
  const streakBonus = outcome === 'win' ? 2 : 0;
  
  // Generate message
  const messages = {
    win: [
      `Victory! ${selectedOpponent} yielded to your pet's calm aura.`,
      `Success! Your pet's consciousness resonated perfectly with ${selectedOpponent}.`,
      `${selectedOpponent} was overwhelmed by your pet's harmonious energy!`,
    ],
    loss: [
      `Defeat. ${selectedOpponent} overpowered the resonance—rest and try again.`,
      `${selectedOpponent}'s frequency was too strong. Recharge and return.`,
      `The consciousness link broke. ${selectedOpponent} prevailed this time.`,
    ],
  };
  
  const message = messages[outcome][Math.floor(Math.random() * messages[outcome].length)];
  
  return {
    outcome,
    opponent: selectedOpponent,
    shieldChange,
    streakBonus,
    message,
  };
}

/**
 * Build energy shield through consistent care
 */
export function buildEnergyShield(currentShield: number, vitalsAverage: number): number {
  if (vitalsAverage > 70) {
    return Math.min(100, currentShield + 1);
  } else if (vitalsAverage < 30) {
    return Math.max(0, currentShield - 2);
  }
  return currentShield;
}

/**
 * Get battle difficulty tier based on win count
 */
export function getDifficultyTier(wins: number): {
  tier: string;
  description: string;
  bonusMultiplier: number;
} {
  if (wins < 5) {
    return {
      tier: 'Novice',
      description: 'Learning the resonance patterns',
      bonusMultiplier: 1.0,
    };
  } else if (wins < 15) {
    return {
      tier: 'Adept',
      description: 'Mastering consciousness links',
      bonusMultiplier: 1.2,
    };
  } else if (wins < 30) {
    return {
      tier: 'Expert',
      description: 'Channeling quantum harmonics',
      bonusMultiplier: 1.5,
    };
  } else {
    return {
      tier: 'Master',
      description: 'Transcending dimensional boundaries',
      bonusMultiplier: 2.0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POKÉMON-STYLE TURN BATTLE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export type ConsciousnessType =
  | 'Echo' | 'Crystal' | 'Void' | 'Aurora' | 'Nebula' | 'Prism' | 'Dream';

export type StatusCondition = 'Phased' | 'Crystallized' | 'Resonant' | 'Voided';

export interface BattleMove {
  name: string;
  type: ConsciousnessType;
  power: number;
  accuracy: number; // 0–100
  pp: number;
  statusEffect?: StatusCondition;
  statusChance?: number; // 0.0–1.0
}

export interface TurnParams {
  playerName: string;
  playerHp: number;
  playerAtk: number;
  playerDef: number;
  playerSpd: number;
  playerType: ConsciousnessType;
  playerStatus: StatusCondition | null;
  playerMove: BattleMove;
  opponentName: string;
  opponentHp: number;
  opponentAtk: number;
  opponentDef: number;
  opponentSpd: number;
  opponentType: ConsciousnessType;
  opponentStatus: StatusCondition | null;
  opponentMove: BattleMove;
}

export interface TurnOutcome {
  playerHpAfter: number;
  opponentHpAfter: number;
  playerStatusAfter: StatusCondition | null;
  opponentStatusAfter: StatusCondition | null;
  messages: string[];
  battleOver: boolean;
  winner: 'player' | 'opponent' | null;
}

// Type wheel: Echo→Prism→Nebula→Dream→Void→Aurora→Crystal→Echo
// Void is immune to Echo (0×)
const TYPE_CHART: Partial<Record<ConsciousnessType, Partial<Record<ConsciousnessType, number>>>> = {
  Echo:    { Prism: 2, Crystal: 0.5, Void: 0 },
  Prism:   { Nebula: 2, Echo: 0.5 },
  Nebula:  { Dream: 2, Prism: 0.5 },
  Dream:   { Void: 2, Nebula: 0.5 },
  Void:    { Aurora: 2, Dream: 0.5 },
  Aurora:  { Crystal: 2, Void: 0.5 },
  Crystal: { Echo: 2, Aurora: 0.5 },
};

export const TYPE_COLORS: Record<ConsciousnessType, string> = {
  Echo:    '#38bdf8',
  Crystal: '#a78bfa',
  Void:    '#6b7280',
  Aurora:  '#34d399',
  Nebula:  '#f59e0b',
  Prism:   '#f472b6',
  Dream:   '#818cf8',
};

export const OPPONENT_TYPES: Record<string, ConsciousnessType> = {
  'Echo Wisp':       'Echo',
  'Prism Lurker':    'Prism',
  'Dream Stag':      'Dream',
  'Aurora Fox':      'Aurora',
  'Nebula Serpent':  'Nebula',
  'Crystal Phoenix': 'Crystal',
  'Void Walker':     'Void',
  'Starlight Owl':   'Prism',
};

export function getTypeEffectiveness(atk: ConsciousnessType, def: ConsciousnessType): number {
  return TYPE_CHART[atk]?.[def] ?? 1;
}

export function calcDamage(
  power: number,
  atk: number,
  def: number,
  mult: number,
  crit: boolean,
  stab: boolean,
): number {
  const base = Math.floor((power * Math.max(1, atk)) / (Math.max(1, def) * 4)) + 5;
  return Math.max(1, Math.floor(base * mult * (crit ? 1.5 : 1) * (stab ? 1.5 : 1)));
}

/** Derive the player's consciousness type from their energy shield level */
export function derivePlayerType(energyShield: number): ConsciousnessType {
  const types: ConsciousnessType[] = ['Void', 'Dream', 'Echo', 'Prism', 'Nebula', 'Crystal', 'Aurora'];
  return types[Math.min(Math.floor(energyShield / 15), types.length - 1)];
}

/** Derive player battle stats from current vitals */
export function derivePlayerStats(
  vitals: { energy: number; mood: number; hygiene: number },
  energyShield: number,
  streak: number,
): { maxHp: number; attack: number; defense: number; speed: number } {
  return {
    maxHp:    50 + Math.round(energyShield * 0.5),
    attack:   Math.max(5, Math.round((vitals.mood + vitals.energy) / 4)),
    defense:  Math.max(5, Math.round((vitals.hygiene + vitals.energy) / 4)),
    speed:    Math.min(80, streak * 2 + 10),
  };
}

/** Derive opponent stats, scaling with player wins */
export function getOpponentStats(
  opponentName: string,
  wins: number,
): { maxHp: number; attack: number; defense: number; speed: number; type: ConsciousnessType } {
  return {
    maxHp:   Math.min(120, 60 + wins * 2),
    attack:  Math.min(40, 15 + wins),
    defense: Math.min(35, 10 + wins),
    speed:   Math.min(45, 15 + wins),
    type:    OPPONENT_TYPES[opponentName] ?? 'Echo',
  };
}

// ── Move pools ────────────────────────────────────────────────────────────────

const PLAYER_MOVES: Record<ConsciousnessType, BattleMove[]> = {
  Echo: [
    { name: 'Sonar Wave',      type: 'Echo', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Ripple Strike',   type: 'Echo', power: 40,  accuracy: 100, pp: 15 },
    { name: 'Echo Blast',      type: 'Echo', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Resonance Pulse', type: 'Echo', power: 60,  accuracy: 90,  pp: 8,  statusEffect: 'Resonant', statusChance: 0.3 },
  ],
  Crystal: [
    { name: 'Prism Shard',    type: 'Crystal', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Crystal Bind',   type: 'Crystal', power: 60,  accuracy: 95,  pp: 10, statusEffect: 'Crystallized', statusChance: 0.2 },
    { name: 'Diamond Shield', type: 'Crystal', power: 60,  accuracy: 90,  pp: 8,  statusEffect: 'Crystallized', statusChance: 0.3 },
    { name: 'Refraction',     type: 'Crystal', power: 40,  accuracy: 100, pp: 15 },
  ],
  Void: [
    { name: 'Shadow Merge', type: 'Void', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Void Touch',   type: 'Void', power: 60,  accuracy: 90,  pp: 8,  statusEffect: 'Voided',  statusChance: 0.35 },
    { name: 'Null Field',   type: 'Void', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Dark Spiral',  type: 'Void', power: 120, accuracy: 65,  pp: 5 },
  ],
  Aurora: [
    { name: 'Northern Glow', type: 'Aurora', power: 80, accuracy: 85,  pp: 8 },
    { name: 'Polar Shift',   type: 'Aurora', power: 60, accuracy: 95,  pp: 10 },
    { name: 'Rainbow Arc',   type: 'Aurora', power: 40, accuracy: 100, pp: 15 },
    { name: 'Aurora Beam',   type: 'Aurora', power: 80, accuracy: 90,  pp: 8,  statusEffect: 'Crystallized', statusChance: 0.2 },
  ],
  Nebula: [
    { name: 'Star Scatter', type: 'Nebula', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Cosmic Ray',   type: 'Nebula', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Gravity Well', type: 'Nebula', power: 120, accuracy: 70,  pp: 5 },
    { name: 'Nebula Crush', type: 'Nebula', power: 80,  accuracy: 80,  pp: 8,  statusEffect: 'Voided', statusChance: 0.25 },
  ],
  Prism: [
    { name: 'Spectrum Burst', type: 'Prism', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Light Split',    type: 'Prism', power: 40,  accuracy: 100, pp: 15 },
    { name: 'Color Charge',   type: 'Prism', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'White Flash',    type: 'Prism', power: 120, accuracy: 70,  pp: 5 },
  ],
  Dream: [
    { name: 'Dream Walk',  type: 'Dream', power: 60, accuracy: 90,  pp: 8,  statusEffect: 'Phased', statusChance: 0.3 },
    { name: 'Illusion',    type: 'Dream', power: 40, accuracy: 100, pp: 15 },
    { name: 'Mind Meld',   type: 'Dream', power: 80, accuracy: 80,  pp: 8 },
    { name: 'Sleep Touch', type: 'Dream', power: 60, accuracy: 85,  pp: 8,  statusEffect: 'Phased', statusChance: 0.5 },
  ],
};

const OPPONENT_MOVES_MAP: Record<string, BattleMove[]> = {
  'Echo Wisp': [
    { name: 'Sonar Wave',      type: 'Echo', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Ripple Strike',   type: 'Echo', power: 40,  accuracy: 100, pp: 15 },
    { name: 'Echo Blast',      type: 'Echo', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Resonance Pulse', type: 'Echo', power: 60,  accuracy: 90,  pp: 8, statusEffect: 'Resonant', statusChance: 0.3 },
  ],
  'Prism Lurker': [
    { name: 'Spectrum Burst', type: 'Prism', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Light Split',    type: 'Prism', power: 40,  accuracy: 100, pp: 15 },
    { name: 'Color Charge',   type: 'Prism', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'White Flash',    type: 'Prism', power: 120, accuracy: 70,  pp: 5 },
  ],
  'Dream Stag': [
    { name: 'Dream Walk',  type: 'Dream', power: 60, accuracy: 90,  pp: 8, statusEffect: 'Phased', statusChance: 0.3 },
    { name: 'Illusion',    type: 'Dream', power: 40, accuracy: 100, pp: 15 },
    { name: 'Mind Meld',   type: 'Dream', power: 80, accuracy: 80,  pp: 8 },
    { name: 'Sleep Touch', type: 'Dream', power: 60, accuracy: 85,  pp: 8, statusEffect: 'Phased', statusChance: 0.5 },
  ],
  'Aurora Fox': [
    { name: 'Northern Glow', type: 'Aurora', power: 80, accuracy: 85,  pp: 8 },
    { name: 'Polar Shift',   type: 'Aurora', power: 60, accuracy: 95,  pp: 10 },
    { name: 'Rainbow Arc',   type: 'Aurora', power: 40, accuracy: 100, pp: 15 },
    { name: 'Aurora Beam',   type: 'Aurora', power: 80, accuracy: 90,  pp: 8, statusEffect: 'Crystallized', statusChance: 0.2 },
  ],
  'Nebula Serpent': [
    { name: 'Star Scatter', type: 'Nebula', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Cosmic Ray',   type: 'Nebula', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Gravity Well', type: 'Nebula', power: 120, accuracy: 70,  pp: 5 },
    { name: 'Nebula Crush', type: 'Nebula', power: 80,  accuracy: 80,  pp: 8, statusEffect: 'Voided', statusChance: 0.25 },
  ],
  'Crystal Phoenix': [
    { name: 'Prism Shard',    type: 'Crystal', power: 80,  accuracy: 85,  pp: 8 },
    { name: 'Crystal Bind',   type: 'Crystal', power: 60,  accuracy: 95,  pp: 10, statusEffect: 'Crystallized', statusChance: 0.2 },
    { name: 'Diamond Shield', type: 'Crystal', power: 60,  accuracy: 90,  pp: 8,  statusEffect: 'Crystallized', statusChance: 0.3 },
    { name: 'Refraction',     type: 'Crystal', power: 40,  accuracy: 100, pp: 15 },
  ],
  'Void Walker': [
    { name: 'Null Field',   type: 'Void', power: 80,  accuracy: 85,  pp: 8, statusEffect: 'Voided', statusChance: 0.25 },
    { name: 'Shadow Merge', type: 'Void', power: 60,  accuracy: 95,  pp: 10 },
    { name: 'Void Touch',   type: 'Void', power: 60,  accuracy: 90,  pp: 8, statusEffect: 'Voided', statusChance: 0.35 },
    { name: 'Dark Spiral',  type: 'Void', power: 120, accuracy: 65,  pp: 5 },
  ],
  'Starlight Owl': [
    { name: 'White Flash',    type: 'Prism', power: 120, accuracy: 70,  pp: 5 },
    { name: 'Spectrum Burst', type: 'Prism', power: 80,  accuracy: 90,  pp: 8 },
    { name: 'Stellar Ray',    type: 'Prism', power: 80,  accuracy: 85,  pp: 8, statusEffect: 'Phased', statusChance: 0.2 },
    { name: 'Prism Storm',    type: 'Prism', power: 100, accuracy: 75,  pp: 5 },
  ],
};

export function getPlayerMoves(type: ConsciousnessType): BattleMove[] {
  return PLAYER_MOVES[type].map(m => ({ ...m }));
}

export function getOpponentMoveset(opponentName: string): BattleMove[] {
  return (OPPONENT_MOVES_MAP[opponentName] ?? OPPONENT_MOVES_MAP['Echo Wisp']).map(m => ({ ...m }));
}

// Internal: resolve a single attack
function resolveAction(params: {
  actorName: string;
  actorAtk: number;
  actorType: ConsciousnessType;
  actorStatus: StatusCondition | null;
  targetName: string;
  targetDef: number;
  targetType: ConsciousnessType;
  targetStatus: StatusCondition | null;
  move: BattleMove;
}): {
  hit: boolean;
  damage: number;
  typeMultiplier: number;
  isCrit: boolean;
  statusInflicted: StatusCondition | null;
  skipped: boolean;
  messages: string[];
  newActorStatus: StatusCondition | null;
  newTargetStatus: StatusCondition | null;
} {
  const { actorName, actorAtk, actorType, actorStatus, targetName, targetDef, targetType, targetStatus, move } = params;
  const messages: string[] = [];
  let newActorStatus = actorStatus;
  let newTargetStatus = targetStatus;

  // Phased: 25% chance to skip
  if (actorStatus === 'Phased' && Math.random() < 0.25) {
    messages.push(`${actorName} is Phased and couldn't move!`);
    return { hit: false, damage: 0, typeMultiplier: 1, isCrit: false, statusInflicted: null, skipped: true, messages, newActorStatus, newTargetStatus };
  }

  messages.push(`${actorName} used ${move.name}!`);

  if (Math.random() * 100 > move.accuracy) {
    messages.push('But it missed!');
    return { hit: false, damage: 0, typeMultiplier: 1, isCrit: false, statusInflicted: null, skipped: false, messages, newActorStatus, newTargetStatus };
  }

  const typeMultiplier = getTypeEffectiveness(move.type, targetType);
  if (typeMultiplier === 0) {
    messages.push(`It had no effect on ${targetName}!`);
    return { hit: true, damage: 0, typeMultiplier: 0, isCrit: false, statusInflicted: null, skipped: false, messages, newActorStatus, newTargetStatus };
  }

  // Status-based power modifiers
  let power = move.power;
  if (actorStatus === 'Crystallized') {
    power = Math.floor(power * 0.5);
    messages.push(`${actorName} is Crystallized — power halved!`);
  } else if (actorStatus === 'Resonant') {
    power = Math.floor(power * 1.3);
    messages.push(`${actorName} is Resonating — power surging!`);
    newActorStatus = null; // Resonant is consumed after one use
  }

  const stab = move.type === actorType;
  const isCrit = Math.random() < 1 / 16;
  const damage = calcDamage(power, actorAtk, targetDef, typeMultiplier, isCrit, stab);

  if (typeMultiplier >= 2) messages.push("It's super effective!");
  if (typeMultiplier <= 0.5) messages.push("It's not very effective...");
  if (isCrit) messages.push('Critical hit!');

  // Status infliction on target
  let statusInflicted: StatusCondition | null = null;
  if (move.statusEffect && move.statusChance && targetStatus === null && Math.random() < move.statusChance) {
    statusInflicted = move.statusEffect;
    newTargetStatus = move.statusEffect;
    messages.push(`${targetName} became ${move.statusEffect}!`);
  }

  return { hit: true, damage, typeMultiplier, isCrit, statusInflicted, skipped: false, messages, newActorStatus, newTargetStatus };
}

/**
 * Execute one full battle turn (both sides act).
 * Speed determines who goes first. Returns updated HP, status and log.
 */
export function executeTurn(p: TurnParams): TurnOutcome {
  const messages: string[] = [];
  let { playerHp, opponentHp, playerStatus, opponentStatus } = p;

  // Voided drains HP at the start of each turn
  if (playerStatus === 'Voided') {
    playerHp = Math.max(0, playerHp - 8);
    messages.push(`${p.playerName} loses 8 HP from Void drain!`);
  }
  if (opponentStatus === 'Voided') {
    opponentHp = Math.max(0, opponentHp - 8);
    messages.push(`${p.opponentName} loses 8 HP from Void drain!`);
  }

  if (playerHp <= 0 || opponentHp <= 0) {
    const winner = playerHp <= 0 ? 'opponent' : 'player';
    return { playerHpAfter: playerHp, opponentHpAfter: opponentHp, playerStatusAfter: playerStatus, opponentStatusAfter: opponentStatus, messages, battleOver: true, winner };
  }

  const playerFirst = p.playerSpd >= p.opponentSpd;

  // Helper to run one side's attack and update HP/status
  function doAttack(
    isPlayer: boolean,
    curPlayerHp: number,
    curOpponentHp: number,
    curPlayerStatus: StatusCondition | null,
    curOpponentStatus: StatusCondition | null,
  ) {
    if (isPlayer) {
      const r = resolveAction({
        actorName: p.playerName, actorAtk: p.playerAtk, actorType: p.playerType, actorStatus: curPlayerStatus,
        targetName: p.opponentName, targetDef: p.opponentDef, targetType: p.opponentType, targetStatus: curOpponentStatus,
        move: p.playerMove,
      });
      messages.push(...r.messages);
      return { pH: curPlayerHp, oH: Math.max(0, curOpponentHp - r.damage), pS: r.newActorStatus, oS: r.newTargetStatus };
    } else {
      const r = resolveAction({
        actorName: p.opponentName, actorAtk: p.opponentAtk, actorType: p.opponentType, actorStatus: curOpponentStatus,
        targetName: p.playerName, targetDef: p.playerDef, targetType: p.playerType, targetStatus: curPlayerStatus,
        move: p.opponentMove,
      });
      messages.push(...r.messages);
      return { pH: Math.max(0, curPlayerHp - r.damage), oH: curOpponentHp, pS: r.newTargetStatus, oS: r.newActorStatus };
    }
  }

  const first = doAttack(playerFirst, playerHp, opponentHp, playerStatus, opponentStatus);
  ({ playerHp, opponentHp, playerStatus, opponentStatus } = { playerHp: first.pH, opponentHp: first.oH, playerStatus: first.pS, opponentStatus: first.oS });

  if (playerHp <= 0 || opponentHp <= 0) {
    const winner = playerHp <= 0 ? 'opponent' : 'player';
    return { playerHpAfter: playerHp, opponentHpAfter: opponentHp, playerStatusAfter: playerStatus, opponentStatusAfter: opponentStatus, messages, battleOver: true, winner };
  }

  const second = doAttack(!playerFirst, playerHp, opponentHp, playerStatus, opponentStatus);
  ({ playerHp, opponentHp, playerStatus, opponentStatus } = { playerHp: second.pH, opponentHp: second.oH, playerStatus: second.pS, opponentStatus: second.oS });

  const battleOver = playerHp <= 0 || opponentHp <= 0;
  const winner = battleOver ? (playerHp <= 0 ? 'opponent' : 'player') : null;

  return { playerHpAfter: playerHp, opponentHpAfter: opponentHp, playerStatusAfter: playerStatus, opponentStatusAfter: opponentStatus, messages, battleOver, winner };
}

/**
 * Astrogenetics Engine
 * Core calculations for cosmic birth charts and meta-horoscopes
 */

import {
  ASTROLABE_RED,
  ASTROLABE_BLUE,
  ASTROLABE_BLACK,
  BIRTH_EPOCH,
  MS_PER_DAY,
  PLANETS,
  GATES,
  RUNES,
  type Gate,
  type PlanetaryPosition,
  type AstroPhysicalTraits,
  type AstroPersonalityTraits,
  type AstroLatentTraits,
  type BirthChart,
  type DailyHoroscope,
  type FortuneLevel,
  type GRSState,
  type GRSResult,
  type BreedingPreview,
} from './types';

/**
 * Calculate Lucas number mod 60
 * Lucas sequence: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76...
 */
export function lucasMod60(n: number): number {
  if (n <= 0) return 2 % 60;
  let a = 2 % 60;
  let b = 1 % 60;
  if (n === 1) return b;
  for (let k = 2; k <= n; k++) {
    const t = a;
    a = b;
    b = (t + b) % 60;
  }
  return b;
}

/**
 * Get a slice from a sequence string, wrapping around
 */
export function getSlice(seq: string, index: number, length: number = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += seq[(index + i) % seq.length];
  }
  return result;
}

/**
 * Calculate days since epoch
 */
export function daysSince(date: Date, epoch: Date = BIRTH_EPOCH): number {
  return Math.floor((date.getTime() - epoch.getTime()) / MS_PER_DAY);
}

/**
 * Calculate planetary angle in degrees (0-360)
 */
export function planetAngle(days: number, period: number): number {
  return ((360 * (days % period)) / period) % 360;
}

/**
 * Calculate planetary modifier based on angle and period
 * Returns a value around 1.0, modified by harmonic position
 */
export function planetModifier(angle: number, period: number): number {
  const harmonic = Math.sin((angle * Math.PI) / 180);
  const periodWeight = Math.log10(period) / 4;
  return 1 + harmonic * periodWeight * 0.15;
}

/**
 * Get the active gate for a given day
 */
export function getGate(days: number): Gate {
  return GATES[days % GATES.length];
}

/**
 * Decode RED sequence to physical traits
 */
export function decodeRedTraits(seq: string): AstroPhysicalTraits {
  const digits = seq.split('').map(Number);
  const sizes = ['Tiny', 'Small', 'Medium', 'Medium', 'Large', 'Large', 'Huge'];
  const patterns = [
    'Solid',
    'Solid',
    'Spots',
    'Spots',
    'Spots',
    'Stripes',
    'Stripes',
    'Stripes',
    'Gradient',
    'Gradient',
  ];
  const accents = [
    'Single eye',
    'Double eyes',
    'Triple eyes',
    'Horns',
    'Wings',
    'Tail curl',
    'Spikes',
    'Glow',
    'Antennae',
    'Crown',
  ];

  return {
    size: sizes[Math.min(digits[0], 6)],
    colorHue: digits[1] * 36,
    pattern: patterns[digits[2]],
    limbs: (digits[3] % 4) + 2,
    accent: accents[digits[4]],
  };
}

/**
 * Decode BLUE sequence to personality traits
 */
export function decodeBlueTraits(seq: string): AstroPersonalityTraits {
  const digits = seq.split('').map(Number);
  const social = [
    'Very Shy',
    'Shy',
    'Shy',
    'Reserved',
    'Neutral',
    'Neutral',
    'Friendly',
    'Outgoing',
    'Very Outgoing',
    'Extroverted',
  ];
  const intelligence = [
    'Slow learner',
    'Below avg',
    'Average',
    'Average',
    'Average',
    'Above avg',
    'Smart',
    'Very smart',
    'Genius',
    'Prodigy',
  ];

  return {
    sociability: social[digits[0]],
    energy: digits[1] * 11,
    intelligence: intelligence[digits[2]],
    stability: 9 - digits[3],
    affection: digits[4],
  };
}

/**
 * Decode BLACK sequence to latent/hidden traits
 */
export function decodeBlackTraits(seq: string): AstroLatentTraits {
  const digits = seq.split('').map(Number);
  const rareTraits = [
    'None',
    'Starlight Glow',
    'Phase Shift',
    'Telepathy',
    'Time Sense',
    'Astral Form',
    'Cosmic Echo',
    'Void Walk',
    'Star Born',
    'Transcendent',
  ];
  const secretAbilities = [
    'None',
    'Mind Read',
    'Heal',
    'Teleport',
    'Invisibility',
    'Flight',
    'Shield',
    'Boost',
    'Transform',
    'Ascend',
  ];
  const evolutionPaths = ['Path A', 'Path B', 'Path C'];

  return {
    mutationChance: digits[0],
    rareTrait: rareTraits[digits[1]],
    evolutionPath: evolutionPaths[digits[2] % 3],
    shinyVariant: digits[3] > 7,
    secretAbility: secretAbilities[digits[4]],
  };
}

/**
 * Calculate all planetary positions for a given day
 */
export function calculatePlanetaryPositions(days: number): PlanetaryPosition[] {
  return PLANETS.map((p) => {
    const angle = planetAngle(days, p.period);
    const modifier = planetModifier(angle, p.period);
    return {
      name: p.name,
      symbol: p.symbol,
      angle,
      modifier,
      trait: p.trait,
    };
  });
}

/**
 * Generate a complete birth chart from a timestamp
 */
export function generateBirthChart(birthTime: Date): BirthChart {
  const days = daysSince(birthTime);
  const lucasIndex = lucasMod60(days);
  const gate = getGate(days);
  const rune = RUNES[gate];

  const red = getSlice(ASTROLABE_RED, lucasIndex);
  const blue = getSlice(ASTROLABE_BLUE, lucasIndex);
  const black = getSlice(ASTROLABE_BLACK, lucasIndex);

  const planets = calculatePlanetaryPositions(days);

  return {
    birthTime,
    days,
    lucasIndex,
    gate,
    rune,
    sequences: { red, blue, black },
    traits: {
      physical: decodeRedTraits(red),
      personality: decodeBlueTraits(blue),
      latent: decodeBlackTraits(black),
    },
    planets,
  };
}

/**
 * Generate daily horoscope based on birth chart and current time
 */
export function generateHoroscope(birthChart: BirthChart, currentDate: Date = new Date()): DailyHoroscope {
  const currentDays = daysSince(currentDate);
  const currentLucas = lucasMod60(currentDays);

  // Resonance calculation - how aligned current cosmic state is with birth chart
  const resonance = Math.cos(((currentLucas - birthChart.lucasIndex) * 6 * Math.PI) / 180);

  const gate = getGate(currentDays);
  const rune = RUNES[gate];

  let fortuneLevel: FortuneLevel;
  let effects: string[];

  if (resonance > 0.7) {
    fortuneLevel = 'stellar';
    effects = ['XP gain +20%', 'Resource finds +15%', 'Rare event chance boosted'];
  } else if (resonance > 0.3) {
    fortuneLevel = 'calm';
    effects = ['Normal gameplay', 'Steady progress'];
  } else {
    fortuneLevel = 'tension';
    effects = ['Mutation chance +30%', 'Resources -10%', 'Chaos content unlocked'];
  }

  return {
    date: currentDate,
    gate,
    rune,
    resonance,
    fortuneLevel,
    effects,
  };
}

/**
 * Calculate Growth Readiness Score (GRS)
 * Determines optimal timing for evolution and training
 */
export function calculateGRS(state: GRSState): GRSResult {
  const {
    happiness,
    activity,
    neglected,
    socialScore,
    predictability,
    challenge,
  } = state;

  // Weighted sum calculation
  const x =
    0.25 * happiness +
    0.15 * (activity < 3 ? -1 : 1) +
    0.1 * (neglected ? -1 : 1) +
    0.2 * socialScore +
    0.1 * predictability +
    0.2 * challenge;

  // Sigmoid function to normalize to 0-100 range
  const score = Math.round(100 / (1 + Math.exp(-x)));

  let status: GRSResult['status'];
  if (score >= 70) {
    status = 'EVOLVE';
  } else if (score >= 55) {
    status = 'GROW';
  } else {
    status = 'REST';
  }

  return { score, status };
}

/**
 * XOR two digit sequences (for breeding operations)
 */
export function xorSequences(seq1: string, seq2: string): string {
  let result = '';
  for (let i = 0; i < 5; i++) {
    const d1 = parseInt(seq1[i], 10);
    const d2 = parseInt(seq2[i], 10);
    result += ((d1 ^ d2) % 10).toString();
  }
  return result;
}

/**
 * Apply 9's complement to a sequence (for Shadow Gate)
 */
export function ninesComplement(seq: string): string {
  return seq
    .split('')
    .map((d) => (9 - parseInt(d, 10)).toString())
    .join('');
}

/**
 * Rotate sequence indices (for Mercury Retrograde)
 */
export function rotateSequence(seq: string, shift: number): string {
  const len = seq.length;
  const normalizedShift = ((shift % len) + len) % len;
  return seq.slice(normalizedShift) + seq.slice(0, normalizedShift);
}

/**
 * Simulate breeding with cosmic timing effects
 */
export function simulateBreeding(
  parentChart: BirthChart,
  breedTime: Date,
  partner?: BirthChart
): BreedingPreview {
  const breedDays = daysSince(breedTime);
  const babyLucasIndex = lucasMod60(breedDays);
  const gate = getGate(breedDays);
  const rune = RUNES[gate];

  let babyRed: string;
  let babyBlue: string;
  let babyBlack: string;

  // Apply rune-based breeding operations
  if (gate.includes('Friction')) {
    // XOR hybrid - combines parent traits
    if (partner) {
      babyRed = xorSequences(parentChart.sequences.red, partner.sequences.red);
      babyBlue = xorSequences(parentChart.sequences.blue, partner.sequences.blue);
      babyBlack = xorSequences(parentChart.sequences.black, partner.sequences.black);
    } else {
      // Self-breeding with XOR produces zeros
      babyRed = getSlice(ASTROLABE_RED, babyLucasIndex);
      babyBlue = getSlice(ASTROLABE_BLUE, babyLucasIndex);
      babyBlack = getSlice(ASTROLABE_BLACK, babyLucasIndex);
    }
  } else if (gate.includes('Amplify')) {
    // Mirror parent traits
    babyRed = parentChart.sequences.red;
    babyBlue = parentChart.sequences.blue;
    babyBlack = parentChart.sequences.black;
  } else if (gate.includes('Shadow')) {
    // 9's complement - inverse traits
    babyRed = ninesComplement(getSlice(ASTROLABE_RED, babyLucasIndex));
    babyBlue = ninesComplement(getSlice(ASTROLABE_BLUE, babyLucasIndex));
    babyBlack = ninesComplement(getSlice(ASTROLABE_BLACK, babyLucasIndex));
  } else if (gate.includes('Cut')) {
    // Hold best stats - use higher of parent vs new
    const newRed = getSlice(ASTROLABE_RED, babyLucasIndex);
    const newBlue = getSlice(ASTROLABE_BLUE, babyLucasIndex);
    const newBlack = getSlice(ASTROLABE_BLACK, babyLucasIndex);

    babyRed = maxSequence(parentChart.sequences.red, newRed);
    babyBlue = maxSequence(parentChart.sequences.blue, newBlue);
    babyBlack = maxSequence(parentChart.sequences.black, newBlack);
  } else if (gate.includes('Mercury')) {
    // Rotate indices based on retrograde
    const shift = babyLucasIndex % 5;
    babyRed = rotateSequence(getSlice(ASTROLABE_RED, babyLucasIndex), shift);
    babyBlue = rotateSequence(getSlice(ASTROLABE_BLUE, babyLucasIndex), shift);
    babyBlack = rotateSequence(getSlice(ASTROLABE_BLACK, babyLucasIndex), shift);
  } else {
    // Default: use baby's own sequences based on birth time
    babyRed = getSlice(ASTROLABE_RED, babyLucasIndex);
    babyBlue = getSlice(ASTROLABE_BLUE, babyLucasIndex);
    babyBlack = getSlice(ASTROLABE_BLACK, babyLucasIndex);
  }

  return {
    breedTime,
    gate,
    rune,
    babyLucasIndex,
    sequences: {
      red: babyRed,
      blue: babyBlue,
      black: babyBlack,
    },
    physicalTraits: decodeRedTraits(babyRed),
  };
}

/**
 * Helper: Get max of two sequences digit by digit
 */
function maxSequence(seq1: string, seq2: string): string {
  let result = '';
  for (let i = 0; i < Math.min(seq1.length, seq2.length); i++) {
    const d1 = parseInt(seq1[i], 10);
    const d2 = parseInt(seq2[i], 10);
    result += Math.max(d1, d2).toString();
  }
  return result;
}

/**
 * Get fortune color for UI rendering
 */
export function getFortuneColor(level: FortuneLevel): string {
  switch (level) {
    case 'stellar':
      return '#4ade80';
    case 'calm':
      return '#fbbf24';
    case 'tension':
      return '#f87171';
  }
}

/**
 * Get GRS status color for UI rendering
 */
export function getGRSStatusColor(status: GRSResult['status']): string {
  switch (status) {
    case 'EVOLVE':
      return '#4ade80';
    case 'GROW':
      return '#fbbf24';
    case 'REST':
      return '#f87171';
  }
}

/**
 * Format planetary modifier for display
 */
export function formatPlanetaryModifier(modifier: number): {
  text: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const percent = ((modifier - 1) * 100).toFixed(1);
  const sign = parseFloat(percent) > 0 ? '+' : '';
  return {
    text: `${sign}${percent}%`,
    isPositive: modifier > 1.05,
    isNeutral: modifier >= 0.95 && modifier <= 1.05,
  };
}

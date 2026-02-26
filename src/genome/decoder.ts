import type { Genome, DerivedTraits, PhysicalTraits, PersonalityTraits, LatentTraits } from './types';
import { summarizeElementWeb } from './elementResidue';

const bodyTypes = [
  'Spherical',
  'Cubic',
  'Pyramidal',
  'Cylindrical',
  'Toroidal',
  'Crystalline',
  'Amorphous',
];

const primaryColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE',
];

const secondaryColors = [
  '#C44569', '#3B3B98', '#58B19F', '#FD7272',
  '#82589F', '#F8B500', '#63C2C9',
];

const patterns = [
  'Solid', 'Striped', 'Spotted', 'Gradient',
  'Tessellated', 'Fractal', 'Iridescent',
];

const textures = [
  'Smooth', 'Fuzzy', 'Scaly', 'Crystalline',
  'Cloudy', 'Metallic', 'Glowing',
];

const temperaments = [
  'Gentle', 'Energetic', 'Curious', 'Calm',
  'Mischievous', 'Protective', 'Adventurous',
];

const quirkOptions = [
  'Loves to spin',
  'Hums melodies',
  'Collects shiny things',
  'Naps in odd places',
  'Mimics sounds',
  'Dances when happy',
  'Scared of shadows',
  'Obsessed with cleanliness',
];

const evolutionPaths = [
  'Celestial Ascendant',
  'Primal Beast',
  'Mystic Sage',
  'Guardian Sentinel',
  'Chaos Trickster',
  'Harmonic Healer',
  'Void Walker',
];

const abilityCatalog = [
  'Radiant Pulse',
  'Dream Weaver',
  'Chrono Skip',
  'Gravity Well',
  'Harmony Shield',
  'Echo Mimic',
  'Null Singularity',
  'Aurora Veil',
  'Phase Shift',
  'Soul Resonance',
];

function digitSum(digits: number[]): number {
  return digits.reduce((sum, value) => sum + value, 0);
}

function mapRange(digits: number[], min: number, max: number): number {
  const sum = digitSum(digits);
  return min + ((sum % 101) / 100) * (max - min);
}

export function decodeGenome(genome: Genome): DerivedTraits {
  return {
    physical: decodePhysicalTraits(genome.red60),
    personality: decodePersonalityTraits(genome.blue60),
    latent: decodeLatentTraits(genome.black60),
    elementWeb: summarizeElementWeb(genome),
  };
}

function decodePhysicalTraits(red60: number[]): PhysicalTraits {
  const bodyIndex = digitSum(red60.slice(0, 5)) % bodyTypes.length;
  const primaryIndex = digitSum(red60.slice(5, 10)) % primaryColors.length;
  const secondaryIndex = digitSum(red60.slice(10, 15)) % secondaryColors.length;
  const patternIndex = digitSum(red60.slice(15, 20)) % patterns.length;
  const textureIndex = digitSum(red60.slice(20, 25)) % textures.length;

  const sizeValue = digitSum(red60.slice(25, 30)) % 100;
  const size = 0.5 + (sizeValue / 100) * 1.5;

  const headSum = digitSum(red60.slice(30, 35));
  const limbSum = digitSum(red60.slice(35, 40));
  const tailSum = digitSum(red60.slice(40, 45));
  const total = headSum + limbSum + tailSum || 1;

  const features: string[] = [];
  for (let i = 45; i < 60; i += 3) {
    if (red60[i] >= 5) {
      const featureIndex = digitSum(red60.slice(i, i + 3)) % quirkOptions.length;
      features.push(quirkOptions[featureIndex]);
    }
  }

  return {
    bodyType: bodyTypes[bodyIndex],
    primaryColor: primaryColors[primaryIndex],
    secondaryColor: secondaryColors[secondaryIndex],
    pattern: patterns[patternIndex],
    texture: textures[textureIndex],
    size,
    proportions: {
      headRatio: headSum / total,
      limbRatio: limbSum / total,
      tailRatio: tailSum / total,
    },
    features,
  };
}

function decodePersonalityTraits(blue60: number[]): PersonalityTraits {
  const temperamentIndex = digitSum(blue60.slice(0, 5)) % temperaments.length;

  const mapToPercent = (digits: number[]) => {
    const sum = digitSum(digits);
    return Math.min(100, Math.round((sum / (digits.length * 6)) * 100));
  };

  const quirks: string[] = [];
  for (let i = 45; i < 60; i += 5) {
    if (digitSum(blue60.slice(i, i + 5)) > 20) {
      const quirkIndex = digitSum(blue60.slice(i, i + 5)) % quirkOptions.length;
      quirks.push(quirkOptions[quirkIndex]);
    }
  }

  return {
    temperament: temperaments[temperamentIndex],
    energy: mapToPercent(blue60.slice(5, 10)),
    social: mapToPercent(blue60.slice(10, 15)),
    curiosity: mapToPercent(blue60.slice(15, 20)),
    discipline: mapToPercent(blue60.slice(20, 25)),
    affection: mapToPercent(blue60.slice(25, 30)),
    independence: mapToPercent(blue60.slice(30, 35)),
    playfulness: mapToPercent(blue60.slice(35, 40)),
    loyalty: mapToPercent(blue60.slice(40, 45)),
    quirks,
  };
}

function decodeLatentTraits(black60: number[]): LatentTraits {
  const evolutionIndex = digitSum(black60.slice(0, 10)) % evolutionPaths.length;

  const rareAbilities: string[] = [];
  for (let i = 10; i < 30; i += 4) {
    const abilityIndex = digitSum(black60.slice(i, i + 4)) % abilityCatalog.length;
    if (!rareAbilities.includes(abilityCatalog[abilityIndex])) {
      rareAbilities.push(abilityCatalog[abilityIndex]);
    }
  }

  const potential = {
    physical: Math.round(mapRange(black60.slice(30, 40), 60, 100)),
    mental: Math.round(mapRange(black60.slice(40, 50), 60, 100)),
    social: Math.round(mapRange(black60.slice(50, 60), 60, 100)),
  };

  const hiddenGenes = black60.slice(45, 60);

  return {
    evolutionPath: evolutionPaths[evolutionIndex],
    rareAbilities,
    potential,
    hiddenGenes,
  };
}

export function getTraitSummary(traits: DerivedTraits): string {
  const { bridgeCount, frontierAffinity } = traits.elementWeb;
  return `${traits.personality.temperament} ${traits.physical.bodyType} - ${traits.latent.evolutionPath} Path | Bridge ${bridgeCount} / Frontier ${frontierAffinity}`;
}

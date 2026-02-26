/**
 * Breeding System
 *
 * Combines two parent genomes to create offspring with inherited traits
 */

import type { Genome, DerivedTraits } from '@/lib/genome';
import { decodeGenome } from '@/lib/genome';

export interface BreedingResult {
  offspring: Genome;
  traits: DerivedTraits;
  inheritanceMap: {
    red: 'parent1' | 'parent2' | 'mixed';
    blue: 'parent1' | 'parent2' | 'mixed';
    black: 'parent1' | 'parent2' | 'mixed';
  };
  lineageKey: string;
}

/**
 * Breed two pets to create offspring
 *
 * Breeding modes:
 * - DOMINANT: 70% from one parent, 30% from other (random selection)
 * - BALANCED: 50/50 mix from both parents
 * - MUTATION: Random mutations in 5-10% of genes
 */
export function breedPets(
  parent1: Genome,
  parent2: Genome,
  mode: 'DOMINANT' | 'BALANCED' | 'MUTATION' = 'BALANCED'
): BreedingResult {
  const fingerprint = fingerprintParents(parent1, parent2);
  const rng = createSeededRng(`${fingerprint}|${mode}`);

  let offspring: Genome;

  switch (mode) {
    case 'DOMINANT':
      offspring = breedDominant(parent1, parent2, rng);
      break;

    case 'MUTATION':
      offspring = breedWithMutation(parent1, parent2, rng);
      break;

    case 'BALANCED':
    default:
      offspring = breedBalanced(parent1, parent2);
      break;
  }

  const traits = decodeGenome(offspring);
  const inheritanceMap = calculateInheritanceMap(parent1, parent2, offspring);
  const lineageKey = generateLineageKey(fingerprint, mode, offspring);

  return { offspring, traits, inheritanceMap, lineageKey };
}

/**
 * Balanced breeding - 50/50 split of genes
 */
function breedBalanced(parent1: Genome, parent2: Genome): Genome {
  const red60: number[] = [];
  const blue60: number[] = [];
  const black60: number[] = [];

  // Mix genes evenly from both parents
  for (let i = 0; i < 60; i++) {
    // Alternate genes or use random selection
    if (i % 2 === 0) {
      red60.push(parent1.red60[i]);
      blue60.push(parent1.blue60[i]);
      black60.push(parent1.black60[i]);
    } else {
      red60.push(parent2.red60[i]);
      blue60.push(parent2.blue60[i]);
      black60.push(parent2.black60[i]);
    }
  }

  return { red60, blue60, black60 };
}

/**
 * Dominant breeding - one parent contributes more
 */
function breedDominant(
  parent1: Genome,
  parent2: Genome,
  rng: () => number
): Genome {
  const red60: number[] = [];
  const blue60: number[] = [];
  const black60: number[] = [];

  // Randomly select dominant parent
  const dominantIsParent1 = rng() > 0.5;
  const dominant = dominantIsParent1 ? parent1 : parent2;
  const recessive = dominantIsParent1 ? parent2 : parent1;

  for (let i = 0; i < 60; i++) {
    // 70% chance from dominant parent
    const useDominant = rng() < 0.7;

    if (useDominant) {
      red60.push(dominant.red60[i]);
      blue60.push(dominant.blue60[i]);
      black60.push(dominant.black60[i]);
    } else {
      red60.push(recessive.red60[i]);
      blue60.push(recessive.blue60[i]);
      black60.push(recessive.black60[i]);
    }
  }

  return { red60, blue60, black60 };
}

/**
 * Mutation breeding - random mutations in some genes
 */
function breedWithMutation(
  parent1: Genome,
  parent2: Genome,
  rng: () => number
): Genome {
  // Start with balanced breeding
  const offspring = breedBalanced(parent1, parent2);

  // Apply random mutations (5-10% of genes)
  const mutationRate = 0.05 + rng() * 0.05;
  const genesToMutate = Math.floor(60 * mutationRate);

  for (let i = 0; i < genesToMutate; i++) {
    const position = Math.floor(rng() * 60);
    const newValue = Math.floor(rng() * 7); // base-7

    // Randomly mutate one of the three arrays
    const arrayChoice = Math.floor(rng() * 3);
    if (arrayChoice === 0) {
      offspring.red60[position] = newValue;
    } else if (arrayChoice === 1) {
      offspring.blue60[position] = newValue;
    } else {
      offspring.black60[position] = newValue;
    }
  }

  return offspring;
}

function calculateInheritanceMap(
  parent1: Genome,
  parent2: Genome,
  offspring: Genome
): BreedingResult['inheritanceMap'] {
  return {
    red: determineInheritance(parent1.red60, parent2.red60, offspring.red60),
    blue: determineInheritance(parent1.blue60, parent2.blue60, offspring.blue60),
    black: determineInheritance(parent1.black60, parent2.black60, offspring.black60),
  };
}

function determineInheritance(
  parent1Genes: number[],
  parent2Genes: number[],
  offspringGenes: number[]
): 'parent1' | 'parent2' | 'mixed' {
  let parent1Matches = 0;
  let parent2Matches = 0;
  let unmatched = 0;

  for (let i = 0; i < offspringGenes.length; i++) {
    const childGene = offspringGenes[i];
    const p1Gene = parent1Genes[i];
    const p2Gene = parent2Genes[i];

    const matchesParent1 = childGene === p1Gene;
    const matchesParent2 = childGene === p2Gene;

    if (matchesParent1 && matchesParent2) {
      parent1Matches++;
      parent2Matches++;
    } else if (matchesParent1) {
      parent1Matches++;
    } else if (matchesParent2) {
      parent2Matches++;
    } else {
      unmatched++;
    }
  }

  const total = offspringGenes.length;
  const majorityThreshold = Math.floor(total / 2) + 1;

  if (parent1Matches >= majorityThreshold && parent1Matches > parent2Matches) {
    return 'parent1';
  }

  if (parent2Matches >= majorityThreshold && parent2Matches > parent1Matches) {
    return 'parent2';
  }

  if (unmatched === 0 && parent1Matches === parent2Matches && parent1Matches > 0) {
    return 'mixed';
  }

  if (parent1Matches === 0 && parent2Matches === 0) {
    return 'mixed';
  }

  if (parent1Matches === parent2Matches) {
    return 'mixed';
  }

  if (unmatched > 0 && (parent1Matches < majorityThreshold && parent2Matches < majorityThreshold)) {
    return 'mixed';
  }

  return parent1Matches > parent2Matches ? 'parent1' : 'parent2';
}

function fingerprintParents(parent1: Genome, parent2: Genome): string {
  const serialized = [serializeGenome(parent1), serializeGenome(parent2)].sort();
  return serialized.join('|');
}

function serializeGenome(genome: Genome): string {
  return `${genome.red60.join('')}:${genome.blue60.join('')}:${genome.black60.join('')}`;
}

function generateLineageKey(
  fingerprint: string,
  mode: 'DOMINANT' | 'BALANCED' | 'MUTATION',
  offspring: Genome
): string {
  const offspringSignature = serializeGenome(offspring);
  const primary = fnv1a(`${fingerprint}|${mode}|${offspringSignature}`);
  const secondary = fnv1a(`${offspringSignature}|${mode}|${fingerprint}`);
  return `${primary}${secondary}`;
}

function createSeededRng(seed: string): () => number {
  const seedFactory = xmur3(seed);
  const state = mulberry32(seedFactory());
  return () => state();
}

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculate genetic similarity between two genomes (0-100%)
 */
export function calculateSimilarity(genome1: Genome, genome2: Genome): number {
  let matches = 0;
  let total = 0;

  for (let i = 0; i < 60; i++) {
    if (genome1.red60[i] === genome2.red60[i]) matches++;
    if (genome1.blue60[i] === genome2.blue60[i]) matches++;
    if (genome1.black60[i] === genome2.black60[i]) matches++;
    total += 3;
  }

  return (matches / total) * 100;
}

/**
 * Check if two pets can breed
 */
export function canBreed(
  evolution1State: string,
  evolution2State: string
): boolean {
  // Both pets must be at SPECIATION stage to breed
  return evolution1State === 'SPECIATION' && evolution2State === 'SPECIATION';
}

/**
 * Predict offspring traits (preview before breeding)
 */
export function predictOffspring(
  parent1: Genome,
  parent2: Genome
): { possibleTraits: string[]; confidence: number } {
  const fingerprint = fingerprintParents(parent1, parent2);

  // Sample a few potential offspring
  const samples = [
    breedBalanced(parent1, parent2),
    breedDominant(parent1, parent2, createSeededRng(`${fingerprint}|DOMINANT|preview`)),
    breedWithMutation(parent1, parent2, createSeededRng(`${fingerprint}|MUTATION|preview`)),
  ];

  const traits = samples.map(s => decodeGenome(s));

  const possibleTraits = [
    ...new Set([
      ...traits.map(t => t.physical.bodyType),
      ...traits.map(t => t.personality.temperament),
      ...traits.map(t => t.latent.evolutionPath),
    ])
  ];

  // Confidence based on parent similarity
  const similarity = calculateSimilarity(parent1, parent2);
  const confidence = 100 - (similarity / 2); // More similar = more predictable

  return { possibleTraits, confidence };
}

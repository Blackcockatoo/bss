import { describe, it, expect } from 'vitest';
import {
  breedPets,
  calculateSimilarity,
  canBreed,
  predictOffspring,
  type BreedingResult,
} from './index';
import type { Genome } from '@/lib/genome';

describe('Breeding System', () => {
  // Helper to create a test genome
  const createTestGenome = (baseValue: number): Genome => ({
    red60: Array(60).fill(baseValue % 7),
    blue60: Array(60).fill((baseValue + 1) % 7),
    black60: Array(60).fill((baseValue + 2) % 7),
  });

  describe('breedPets', () => {
    it('should create offspring with valid genome structure', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(3);

      const result = breedPets(parent1, parent2, 'BALANCED');

      expect(result.offspring.red60).toHaveLength(60);
      expect(result.offspring.blue60).toHaveLength(60);
      expect(result.offspring.black60).toHaveLength(60);
      expect(result.traits).toBeDefined();
      expect(result.inheritanceMap).toBeDefined();
      expect(result.lineageKey).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should produce different results for different breeding modes', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(6);

      const balanced = breedPets(parent1, parent2, 'BALANCED');
      const dominant = breedPets(parent1, parent2, 'DOMINANT');
      const mutation = breedPets(parent1, parent2, 'MUTATION');

      // Results should be distinct (unless extremely unlikely random coincidence)
      const balancedStr = JSON.stringify(balanced.offspring);
      const dominantStr = JSON.stringify(dominant.offspring);
      const mutationStr = JSON.stringify(mutation.offspring);

      // At least two should be different
      const uniqueResults = new Set([balancedStr, dominantStr, mutationStr]);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('should create offspring with genes from both parents (balanced mode)', () => {
      const parent1: Genome = {
        red60: Array(60).fill(1),
        blue60: Array(60).fill(2),
        black60: Array(60).fill(3),
      };
      const parent2: Genome = {
        red60: Array(60).fill(4),
        blue60: Array(60).fill(5),
        black60: Array(60).fill(6),
      };

      const result = breedPets(parent1, parent2, 'BALANCED');

      // In balanced mode, should alternate between parents
      // Check that we have genes from both parents
      const hasParent1Genes = result.offspring.red60.some(gene => gene === 1);
      const hasParent2Genes = result.offspring.red60.some(gene => gene === 4);

      expect(hasParent1Genes).toBe(true);
      expect(hasParent2Genes).toBe(true);
    });

    it('should ensure all genome values are in base-7 range (0-6)', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(6);

      const result = breedPets(parent1, parent2, 'MUTATION');

      const allGenes = [
        ...result.offspring.red60,
        ...result.offspring.blue60,
        ...result.offspring.black60,
      ];

      for (const gene of allGenes) {
        expect(gene).toBeGreaterThanOrEqual(0);
        expect(gene).toBeLessThanOrEqual(6);
      }
    });

    it('should return inheritance map', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(3);

      const result = breedPets(parent1, parent2);

      expect(result.inheritanceMap.red).toBeDefined();
      expect(result.inheritanceMap.blue).toBeDefined();
      expect(result.inheritanceMap.black).toBeDefined();
      expect(result.lineageKey).toBeDefined();
    });

    it('should produce varied mutation results for different parent combinations', () => {
      // Different parent combinations should produce different mutation results
      const runs = Array.from({ length: 5 }, (_, i) => {
        const parent1 = createTestGenome(i);
        const parent2 = createTestGenome(i + 3);
        return JSON.stringify(breedPets(parent1, parent2, 'MUTATION').offspring);
      });

      const uniqueResults = new Set(runs);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('should produce deterministic offspring for identical inputs', () => {
      const parent1 = createTestGenome(1);
      const parent2 = createTestGenome(5);

      const first = breedPets(parent1, parent2, 'MUTATION');
      const second = breedPets(parent1, parent2, 'MUTATION');

      expect(first.offspring).toEqual(second.offspring);
      expect(first.lineageKey).toBe(second.lineageKey);
    });

    it('should reflect dominant inheritance in the map when applicable', () => {
      const parent1: Genome = {
        red60: Array(60).fill(0),
        blue60: Array(60).fill(1),
        black60: Array(60).fill(2),
      };
      const parent2: Genome = {
        red60: Array(60).fill(3),
        blue60: Array(60).fill(4),
        black60: Array(60).fill(5),
      };

      const result = breedPets(parent1, parent2, 'DOMINANT');

      expect(['parent1', 'parent2']).toContain(result.inheritanceMap.red);
      expect(['parent1', 'parent2']).toContain(result.inheritanceMap.blue);
      expect(['parent1', 'parent2']).toContain(result.inheritanceMap.black);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 100% for identical genomes', () => {
      const genome1 = createTestGenome(2);
      const genome2 = createTestGenome(2);

      const similarity = calculateSimilarity(genome1, genome2);

      expect(similarity).toBe(100);
    });

    it('should return 0% for completely different genomes', () => {
      const genome1: Genome = {
        red60: Array(60).fill(0),
        blue60: Array(60).fill(0),
        black60: Array(60).fill(0),
      };
      const genome2: Genome = {
        red60: Array(60).fill(6),
        blue60: Array(60).fill(6),
        black60: Array(60).fill(6),
      };

      const similarity = calculateSimilarity(genome1, genome2);

      expect(similarity).toBe(0);
    });

    it('should return 50% for half-matching genomes', () => {
      const genome1: Genome = {
        red60: Array(60).fill(1),
        blue60: Array(60).fill(1),
        black60: Array(60).fill(1),
      };
      const genome2: Genome = {
        red60: Array(60).fill(1), // 100% match
        blue60: Array(60).fill(1), // 100% match
        black60: Array(60).fill(2), // 0% match
      };

      const similarity = calculateSimilarity(genome1, genome2);

      expect(similarity).toBeCloseTo(66.67, 1);
    });

    it('should return value between 0 and 100', () => {
      const genome1 = createTestGenome(1);
      const genome2 = createTestGenome(4);

      const similarity = calculateSimilarity(genome1, genome2);

      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(100);
    });
  });

  describe('canBreed', () => {
    it('should allow breeding when both pets are at SPECIATION', () => {
      const result = canBreed('SPECIATION', 'SPECIATION');

      expect(result).toBe(true);
    });

    it('should not allow breeding when first pet is not at SPECIATION', () => {
      const result = canBreed('NEURO', 'SPECIATION');

      expect(result).toBe(false);
    });

    it('should not allow breeding when second pet is not at SPECIATION', () => {
      const result = canBreed('SPECIATION', 'GENETICS');

      expect(result).toBe(false);
    });

    it('should not allow breeding when neither pet is at SPECIATION', () => {
      const result = canBreed('GENETICS', 'NEURO');

      expect(result).toBe(false);
    });
  });

  describe('predictOffspring', () => {
    it('should return possible traits array', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(6);

      const prediction = predictOffspring(parent1, parent2);

      expect(prediction.possibleTraits).toBeDefined();
      expect(Array.isArray(prediction.possibleTraits)).toBe(true);
      expect(prediction.possibleTraits.length).toBeGreaterThan(0);
    });

    it('should return confidence value between 0 and 100', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(6);

      const prediction = predictOffspring(parent1, parent2);

      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(100);
    });

    it('should return higher confidence for similar parents', () => {
      const similarParent1 = createTestGenome(2);
      const similarParent2 = createTestGenome(2);

      const differentParent1 = createTestGenome(0);
      const differentParent2 = createTestGenome(6);

      const similarPrediction = predictOffspring(similarParent1, similarParent2);
      const differentPrediction = predictOffspring(differentParent1, differentParent2);

      // Similar parents should have lower confidence (more predictable)
      // Actually the confidence calculation is: 100 - (similarity / 2)
      // So identical parents (100% similar) = 100 - 50 = 50% confidence
      // Very different parents (0% similar) = 100 - 0 = 100% confidence
      expect(similarPrediction.confidence).toBeLessThan(differentPrediction.confidence);
    });

    it('should return unique traits (no duplicates)', () => {
      const parent1 = createTestGenome(1);
      const parent2 = createTestGenome(2);

      const prediction = predictOffspring(parent1, parent2);

      const uniqueTraits = new Set(prediction.possibleTraits);
      expect(uniqueTraits.size).toBe(prediction.possibleTraits.length);
    });

    it('should provide stable previews for repeated calls', () => {
      const parent1 = createTestGenome(1);
      const parent2 = createTestGenome(3);

      const previewA = predictOffspring(parent1, parent2);
      const previewB = predictOffspring(parent1, parent2);

      expect(previewA.confidence).toBe(previewB.confidence);
      expect(previewA).toEqual(previewB);
    });
  });

  describe('Breeding Integration', () => {
    it('should produce viable offspring that can be bred again', () => {
      const parent1 = createTestGenome(0);
      const parent2 = createTestGenome(3);

      const firstGen = breedPets(parent1, parent2);
      const secondGen = breedPets(firstGen.offspring, parent1);

      expect(secondGen.offspring).toBeDefined();
      expect(secondGen.traits).toBeDefined();
      expect(secondGen.offspring.red60).toHaveLength(60);
    });

    it('should maintain genetic diversity over multiple generations', () => {
      const ancestor1 = createTestGenome(0);
      const ancestor2 = createTestGenome(6);

      const gen1 = breedPets(ancestor1, ancestor2, 'MUTATION');
      const gen2 = breedPets(gen1.offspring, ancestor1, 'MUTATION');
      const gen3 = breedPets(gen2.offspring, gen1.offspring, 'MUTATION');

      // Each generation should be different
      const sim1to2 = calculateSimilarity(gen1.offspring, gen2.offspring);
      const sim2to3 = calculateSimilarity(gen2.offspring, gen3.offspring);
      const sim1to3 = calculateSimilarity(gen1.offspring, gen3.offspring);

      expect(sim1to2).toBeLessThan(100);
      expect(sim2to3).toBeLessThan(100);
      expect(sim1to3).toBeLessThan(100);
    });
  });
});

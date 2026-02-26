import { describe, it, expect } from 'vitest';
import { decodeGenome } from './decoder';
import type { Genome } from './types';

describe('Genome Decoder', () => {
  const createTestGenome = (seed: number): Genome => ({
    red60: Array(60).fill(0).map((_, i) => (seed + i) % 7),
    blue60: Array(60).fill(0).map((_, i) => (seed + i + 1) % 7),
    black60: Array(60).fill(0).map((_, i) => (seed + i + 2) % 7),
  });

  describe('decodeGenome', () => {
    it('should return traits with all required sections', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(traits.physical).toBeDefined();
      expect(traits.personality).toBeDefined();
      expect(traits.latent).toBeDefined();
      expect(traits.elementWeb).toBeDefined();
    });

    it('should be deterministic - same genome produces same traits', () => {
      const genome = createTestGenome(3);

      const traits1 = decodeGenome(genome);
      const traits2 = decodeGenome(genome);

      expect(traits1).toEqual(traits2);
    });

    it('should produce different traits for different genomes', () => {
      const genome1 = createTestGenome(0);
      const genome2 = createTestGenome(6);

      const traits1 = decodeGenome(genome1);
      const traits2 = decodeGenome(genome2);

      // At least one trait should be different
      const same = JSON.stringify(traits1) === JSON.stringify(traits2);
      expect(same).toBe(false);
    });
  });

  describe('Physical Traits', () => {
    it('should decode valid body type', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const validBodyTypes = [
        'Spherical', 'Cubic', 'Pyramidal', 'Cylindrical',
        'Toroidal', 'Crystalline', 'Amorphous'
      ];

      expect(validBodyTypes).toContain(traits.physical.bodyType);
    });

    it('should decode valid colors', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      // Should be valid hex colors
      expect(traits.physical.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(traits.physical.secondaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should decode valid pattern', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const validPatterns = [
        'Solid', 'Striped', 'Spotted', 'Gradient',
        'Tessellated', 'Fractal', 'Iridescent'
      ];

      expect(validPatterns).toContain(traits.physical.pattern);
    });

    it('should decode valid texture', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const validTextures = [
        'Smooth', 'Fuzzy', 'Scaly', 'Crystalline',
        'Cloudy', 'Metallic', 'Glowing'
      ];

      expect(validTextures).toContain(traits.physical.texture);
    });

    it('should decode size in valid range', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(traits.physical.size).toBeGreaterThanOrEqual(0.5);
      expect(traits.physical.size).toBeLessThanOrEqual(2.0);
    });

    it('should decode proportions that sum to 1', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const sum = traits.physical.proportions.headRatio +
                  traits.physical.proportions.limbRatio +
                  traits.physical.proportions.tailRatio;

      expect(sum).toBeCloseTo(1, 2);
    });

    it('should decode features as array of strings', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(Array.isArray(traits.physical.features)).toBe(true);
      for (const feature of traits.physical.features) {
        expect(typeof feature).toBe('string');
      }
    });
  });

  describe('Personality Traits', () => {
    it('should decode valid temperament', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const validTemperaments = [
        'Gentle', 'Energetic', 'Curious', 'Calm',
        'Mischievous', 'Protective', 'Adventurous'
      ];

      expect(validTemperaments).toContain(traits.personality.temperament);
    });

    it('should decode stats in 0-100 range', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(traits.personality.energy).toBeGreaterThanOrEqual(0);
      expect(traits.personality.energy).toBeLessThanOrEqual(100);

      expect(traits.personality.social).toBeGreaterThanOrEqual(0);
      expect(traits.personality.social).toBeLessThanOrEqual(100);

      expect(traits.personality.curiosity).toBeGreaterThanOrEqual(0);
      expect(traits.personality.curiosity).toBeLessThanOrEqual(100);

      expect(traits.personality.discipline).toBeGreaterThanOrEqual(0);
      expect(traits.personality.discipline).toBeLessThanOrEqual(100);

      expect(traits.personality.affection).toBeGreaterThanOrEqual(0);
      expect(traits.personality.affection).toBeLessThanOrEqual(100);

      expect(traits.personality.independence).toBeGreaterThanOrEqual(0);
      expect(traits.personality.independence).toBeLessThanOrEqual(100);

      expect(traits.personality.playfulness).toBeGreaterThanOrEqual(0);
      expect(traits.personality.playfulness).toBeLessThanOrEqual(100);

      expect(traits.personality.loyalty).toBeGreaterThanOrEqual(0);
      expect(traits.personality.loyalty).toBeLessThanOrEqual(100);
    });

    it('should decode valid quirks array', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(Array.isArray(traits.personality.quirks)).toBe(true);
      for (const quirk of traits.personality.quirks) {
        expect(typeof quirk).toBe('string');
      }
    });
  });

  describe('Latent Traits', () => {
    it('should decode valid evolution path', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      const validPaths = [
        'Celestial Ascendant', 'Primal Beast', 'Mystic Sage',
        'Guardian Sentinel', 'Chaos Trickster', 'Harmonic Healer',
        'Void Walker'
      ];

      expect(validPaths).toContain(traits.latent.evolutionPath);
    });

    it('should decode rare abilities as array', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(Array.isArray(traits.latent.rareAbilities)).toBe(true);
      for (const ability of traits.latent.rareAbilities) {
        expect(typeof ability).toBe('string');
      }
    });

    it('should decode potential in 0-100 range', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(traits.latent.potential.physical).toBeGreaterThanOrEqual(0);
      expect(traits.latent.potential.physical).toBeLessThanOrEqual(100);

      expect(traits.latent.potential.mental).toBeGreaterThanOrEqual(0);
      expect(traits.latent.potential.mental).toBeLessThanOrEqual(100);

      expect(traits.latent.potential.social).toBeGreaterThanOrEqual(0);
      expect(traits.latent.potential.social).toBeLessThanOrEqual(100);
    });

    it('should decode hidden genes array', () => {
      const genome = createTestGenome(0);
      const traits = decodeGenome(genome);

      expect(Array.isArray(traits.latent.hiddenGenes)).toBe(true);
      expect(traits.latent.hiddenGenes).toHaveLength(15); // digits 45-59

      // Should be valid base-7 digits
      for (const gene of traits.latent.hiddenGenes) {
        expect(gene).toBeGreaterThanOrEqual(0);
        expect(gene).toBeLessThanOrEqual(6);
      }
    });

    it('should expose element web metrics in expected ranges', () => {
      const genome = createTestGenome(0);
      const { elementWeb } = decodeGenome(genome);

      expect(elementWeb.coverage).toBeGreaterThanOrEqual(0);
      expect(elementWeb.coverage).toBeLessThanOrEqual(1);
      expect(Array.isArray(elementWeb.usedResidues)).toBe(true);
    });
  });

  describe('Determinism Across Multiple Genomes', () => {
    it('should consistently decode same genome across multiple calls', () => {
      const genome = createTestGenome(42);

      const results = Array(10).fill(null).map(() => decodeGenome(genome));

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });

    it('should produce varied traits across different genomes', () => {
      const genomes = Array(20).fill(null).map((_, i) => createTestGenome(i));
      const allTraits = genomes.map(g => decodeGenome(g));

      // Should have diversity in body types
      const bodyTypes = new Set(allTraits.map(t => t.physical.bodyType));
      expect(bodyTypes.size).toBeGreaterThan(1);

      // Should have diversity in temperaments
      const temperaments = new Set(allTraits.map(t => t.personality.temperament));
      expect(temperaments.size).toBeGreaterThan(1);

      // Should have diversity in evolution paths
      const paths = new Set(allTraits.map(t => t.latent.evolutionPath));
      expect(paths.size).toBeGreaterThan(1);
    });
  });
});

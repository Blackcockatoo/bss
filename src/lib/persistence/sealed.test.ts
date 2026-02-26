import { describe, it, expect, beforeAll } from 'vitest';
import { Buffer } from 'node:buffer';
import {
  createSealedExport,
  importSealedExport,
  verifySealedExport,
} from './sealed';
import type { PetSaveData } from './indexeddb';
import { createDefaultBattleStats, createDefaultMiniGameProgress, createDefaultVimanaState } from '@/lib/progression/types';
import { createDefaultRitualProgress } from '@/lib/ritual/types';
import { createWitnessRecord } from '@/lib/witness';

describe('Sealed Export/Import', () => {
  let hmacKey: CryptoKey;
  let mockPetData: PetSaveData;

  beforeAll(async () => {
    // Generate HMAC key for tests
    hmacKey = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    // Create mock pet data
    const witness = createWitnessRecord('test-pet-123');

    mockPetData = {
      id: 'test-pet-123',
      name: 'Test Pet',
      vitals: {
        hunger: 80,
        hygiene: 70,
        mood: 90,
        energy: 60,
        isSick: false,
        sicknessSeverity: 0,
        sicknessType: 'none',
        deathCount: 0,
      },
      petType: 'geometric',
      witness,
      petOntology: 'living',
      systemState: 'active',
      sealedAt: null,
      invariantIssues: [],
      genome: {
        red60: Array(60).fill(0).map((_, i) => i % 7),
        blue60: Array(60).fill(0).map((_, i) => (i * 2) % 7),
        black60: Array(60).fill(0).map((_, i) => (i * 3) % 7),
      },
      genomeHash: {
        redHash: 'abc123',
        blueHash: 'def456',
        blackHash: 'ghi789',
      },
      traits: {
        physical: {
          bodyType: 'Spherical',
          primaryColor: '#FF0000',
          secondaryColor: '#00FF00',
          pattern: 'Stripes',
          texture: 'Smooth',
          size: 50,
          proportions: {
            headRatio: 0.3,
            limbRatio: 0.25,
            tailRatio: 0.2,
          },
          features: ['Horns'],
        },
        personality: {
          temperament: 'Gentle',
          energy: 70,
          social: 80,
          curiosity: 60,
          playfulness: 90,
          discipline: 65,
          affection: 80,
          independence: 50,
          loyalty: 85,
          quirks: ['Loves headpats'],
        },
        latent: {
          evolutionPath: 'Harmony Keeper',
          rareAbilities: ['Telepathy'],
          potential: {
            physical: 85,
            mental: 90,
            social: 80,
          },
          hiddenGenes: [1, 2, 3, 4, 5],
        },
        elementWeb: {
          usedResidues: [1, 2, 3],
          pairSlots: [1, 2],
          frontierSlots: [3],
          voidSlotsHit: [],
          coverage: 0.5,
          frontierAffinity: 0.3,
          bridgeCount: 2,
          voidDrift: 0.1,
        },
      },
      evolution: {
        state: 'GENETICS',
        birthTime: Date.now() - 86400000,
        lastEvolutionTime: Date.now() - 86400000,
        experience: 100,
        level: 1,
        currentLevelXp: 0,
        totalXp: 100,
        totalInteractions: 50,
        canEvolve: false,
      },
      ritualProgress: createDefaultRitualProgress(),
      essence: 0,
      lastRewardSource: null,
      lastRewardAmount: 0,
      achievements: [],
      battle: createDefaultBattleStats(),
      miniGames: createDefaultMiniGameProgress(),
      vimana: createDefaultVimanaState(),
      crest: {
        vault: 'blue',
        rotation: 'CW',
        tail: [12, 34, 56, 23],
        coronatedAt: Date.now(),
        dnaHash: 'dna-hash-123',
        mirrorHash: 'mirror-hash-456',
        signature: 'sig-789',
      },
      heptaDigits: Object.freeze(Array(42).fill(0).map((_, i) => i % 7)) as readonly number[] & { length: 42 },
      mirrorMode: {
        phase: 'idle',
        startedAt: null,
        consentExpiresAt: null,
        preset: null,
        presenceToken: null,
        lastReflection: null,
      },
      createdAt: Date.now() - 86400000,
      lastSaved: Date.now(),
    };
  });

  describe('createSealedExport', () => {
    it('should create a valid sealed export', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);

      expect(sealed).toBeTypeOf('string');

      const parsed = JSON.parse(sealed);
      expect(parsed.version).toBe(1);
      expect(parsed.signature).toBe('METAPET_SEALED_V1');
      expect(parsed.payload).toBeTypeOf('string');
      expect(parsed.hmac).toBeTypeOf('string');
      expect(parsed.petId).toBe('test-pet-123');
      expect(parsed.exportedAt).toBeTypeOf('number');
    });

    it('should include HMAC signature', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      expect(parsed.hmac).toMatch(/^[0-9a-f]{64}$/); // 256-bit hex
    });

    it('should encode payload as base64', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      // Should be valid base64
      expect(() => atob(parsed.payload)).not.toThrow();

      // Decoded payload should be valid JSON
      const decoded = atob(parsed.payload);
      expect(() => JSON.parse(decoded)).not.toThrow();
    });
  });

  describe('importSealedExport', () => {
    it('should import a valid sealed export', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const imported = await importSealedExport(sealed, hmacKey);

      expect(imported.id).toBe(mockPetData.id);
      expect(imported.name).toBe(mockPetData.name);
      expect(imported.vitals).toEqual(mockPetData.vitals);
      expect(imported.genome).toEqual(mockPetData.genome);
    });

    it('should reject tampered data', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      // Tamper with payload
      const tamperedPayload = btoa(JSON.stringify({ ...mockPetData, name: 'Hacked Pet' }));
      parsed.payload = tamperedPayload;

      const tampered = JSON.stringify(parsed);

      await expect(importSealedExport(tampered, hmacKey)).rejects.toThrow(
        'HMAC mismatch'
      );
    });

    it('should reject invalid signature', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      parsed.signature = 'INVALID_SIGNATURE';

      const invalid = JSON.stringify(parsed);

      await expect(importSealedExport(invalid, hmacKey)).rejects.toThrow(
        'Invalid sealed export: incorrect signature'
      );
    });

    it('should reject unsupported version', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      parsed.version = 999;

      const invalid = JSON.stringify(parsed);

      await expect(importSealedExport(invalid, hmacKey)).rejects.toThrow(
        'Unsupported sealed export version'
      );
    });

    it('should reject crest hash mismatches even when signed', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      const payload = JSON.parse(atob(parsed.payload));
      payload.crest.dnaHash = 'tampered-dna-hash';

      parsed.payload = btoa(JSON.stringify(payload));

      const signaturePayload = JSON.stringify({
        version: parsed.version,
        signature: parsed.signature,
        payload: parsed.payload,
        exportedAt: parsed.exportedAt,
        petId: parsed.petId,
        hashes: parsed.hashes,
      });

      const mac = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        new TextEncoder().encode(signaturePayload)
      );
      parsed.hmac = Buffer.from(mac).toString('hex');

      const tampered = JSON.stringify(parsed);

      await expect(importSealedExport(tampered, hmacKey)).rejects.toThrow(
        'crest hash mismatch'
      );
    });

    it('should reject mismatched pet ID', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      // Tamper with pet ID and recalculate HMAC to pass signature check
      parsed.petId = 'different-id';
      
      // Recalculate HMAC with tampered petId
      const enc = new TextEncoder();
      const signaturePayload = JSON.stringify({
        version: parsed.version,
        signature: parsed.signature,
        payload: parsed.payload,
        exportedAt: parsed.exportedAt,
        petId: parsed.petId,
      });
      
      const mac = await crypto.subtle.sign(
        'HMAC',
        hmacKey,
        enc.encode(signaturePayload)
      );
      
      const hmac = [...new Uint8Array(mac)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      parsed.hmac = hmac;

      const invalid = JSON.stringify(parsed);

      await expect(importSealedExport(invalid, hmacKey)).rejects.toThrow(
        'pet ID mismatch'
      );
    });
  });

  describe('verifySealedExport', () => {
    it('should verify valid sealed export', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const result = await verifySealedExport(sealed, hmacKey);

      expect(result.valid).toBe(true);
      expect(result.petId).toBe('test-pet-123');
      expect(result.exportedAt).toBeTypeOf('number');
      expect(result.error).toBeUndefined();
    });

    it('should reject tampered export', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const parsed = JSON.parse(sealed);

      // Tamper with payload
      parsed.payload = btoa('{"id": "fake"}');

      const tampered = JSON.stringify(parsed);

      const result = await verifySealedExport(tampered, hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('HMAC mismatch');
    });

    it('should reject invalid format', async () => {
      const result = await verifySealedExport('invalid json', hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Round-trip', () => {
    it('should preserve all pet data through export/import cycle', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const imported = await importSealedExport(sealed, hmacKey);

      expect(imported).toEqual(mockPetData);
    });

    it('should work with multiple exports from same pet', async () => {
      const sealed1 = await createSealedExport(mockPetData, hmacKey);
      const sealed2 = await createSealedExport(mockPetData, hmacKey);

      // Both should be valid
      const imported1 = await importSealedExport(sealed1, hmacKey);
      const imported2 = await importSealedExport(sealed2, hmacKey);

      expect(imported1).toEqual(mockPetData);
      expect(imported2).toEqual(mockPetData);
    });

    it('should preserve genome arrays', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);
      const imported = await importSealedExport(sealed, hmacKey);

      expect(imported.genome.red60).toHaveLength(60);
      expect(imported.genome.blue60).toHaveLength(60);
      expect(imported.genome.black60).toHaveLength(60);

      expect(imported.genome.red60).toEqual(mockPetData.genome.red60);
      expect(imported.genome.blue60).toEqual(mockPetData.genome.blue60);
      expect(imported.genome.black60).toEqual(mockPetData.genome.black60);
    });
  });

  describe('Security', () => {
    it('should use different HMAC for different data', async () => {
      const pet1 = { ...mockPetData, id: 'pet-1' };
      const pet2 = { ...mockPetData, id: 'pet-2' };

      const sealed1 = await createSealedExport(pet1, hmacKey);
      const sealed2 = await createSealedExport(pet2, hmacKey);

      const parsed1 = JSON.parse(sealed1);
      const parsed2 = JSON.parse(sealed2);

      expect(parsed1.hmac).not.toBe(parsed2.hmac);
    });

    it('should not expose raw DNA in export', async () => {
      const sealed = await createSealedExport(mockPetData, hmacKey);

      // Decode the payload to check its contents
      const parsed = JSON.parse(sealed);
      const payload = atob(parsed.payload);
      const petData = JSON.parse(payload);

      // DNA raw arrays should NOT be exported (genome should be present but for reconstruction)
      // The key point is that raw primeDNA/tailDNA strings should not be in crest
      expect(payload).not.toContain('"primeDNA"');
      expect(payload).not.toContain('"tailDNA"');

      // But genome hashes should be present in crest
      expect(petData.crest.dnaHash).toBeDefined();
      expect(petData.crest.mirrorHash).toBeDefined();
    });
  });
});

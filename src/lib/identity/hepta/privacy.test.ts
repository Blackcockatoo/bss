import { describe, it, expect, beforeAll } from 'vitest';
import { packPayload, unpackPayload } from './codec';
import { heptaEncode42, heptaDecode42, createHeptaPayload, regenerateWithPreset } from './index';
import type { HeptaPayload, PrimeTailID, PrivacyPreset } from '../types';

// Mock HMAC key for testing
let hmacKey: CryptoKey;

beforeAll(async () => {
  hmacKey = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );
});

const mockCrest: PrimeTailID = {
  vault: 'blue',
  rotation: 'CCW',
  tail: [15, 30, 45, 59],
  coronatedAt: Date.now(),
  dnaHash: 'abc123',
  mirrorHash: 'def456',
  signature: 'sig789',
};

describe('Privacy Presets', () => {
  describe('Stealth Mode', () => {
    it('should mask vault, rotation, and tail in encoded data', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'stealth',
        vault: 'blue',
        rotation: 'CCW',
        tail: [15, 30, 45, 59],
        epoch13: 1234,
        nonce14: 5678,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded).not.toBeNull();
      expect(decoded!.preset).toBe('stealth');
      // In stealth mode, vault/rotation/tail should be masked (zeros)
      expect(decoded!.vault).toBe('red'); // 0 = red
      expect(decoded!.rotation).toBe('CW'); // 0 = CW
      expect(decoded!.tail).toEqual([0, 0, 0, 0]);
      // Epoch and nonce should be preserved
      expect(decoded!.epoch13).toBe(1234);
      expect(decoded!.nonce14).toBe(5678);
    });

    it('should indicate masked fields in decoded payload', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'stealth',
        vault: 'black',
        rotation: 'CCW',
        tail: [1, 2, 3, 4],
        epoch13: 100,
        nonce14: 200,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded!._masked).toBeDefined();
      expect(decoded!._masked!.vault).toBe(true);
      expect(decoded!._masked!.rotation).toBe(true);
      expect(decoded!._masked!.tail).toBe(true);
    });
  });

  describe('Standard Mode', () => {
    it('should keep vault but mask rotation and tail', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'standard',
        vault: 'black',
        rotation: 'CCW',
        tail: [10, 20, 30, 40],
        epoch13: 4000,
        nonce14: 8000,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded).not.toBeNull();
      expect(decoded!.preset).toBe('standard');
      // In standard mode, vault is preserved
      expect(decoded!.vault).toBe('black');
      // Rotation and tail should be masked
      expect(decoded!.rotation).toBe('CW'); // 0 = CW
      expect(decoded!.tail).toEqual([0, 0, 0, 0]);
    });

    it('should indicate partially masked fields', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'standard',
        vault: 'blue',
        rotation: 'CCW',
        tail: [1, 2, 3, 4],
        epoch13: 100,
        nonce14: 200,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded!._masked!.vault).toBe(false);
      expect(decoded!._masked!.rotation).toBe(true);
      expect(decoded!._masked!.tail).toBe(true);
    });
  });

  describe('Radiant Mode', () => {
    it('should preserve all data', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'radiant',
        vault: 'blue',
        rotation: 'CCW',
        tail: [15, 30, 45, 59],
        epoch13: 7777,
        nonce14: 12345,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded).not.toBeNull();
      expect(decoded!.preset).toBe('radiant');
      // All data should be preserved
      expect(decoded!.vault).toBe('blue');
      expect(decoded!.rotation).toBe('CCW');
      expect(decoded!.tail).toEqual([15, 30, 45, 59]);
      expect(decoded!.epoch13).toBe(7777);
      expect(decoded!.nonce14).toBe(12345);
    });

    it('should indicate no fields are masked', async () => {
      const payload: HeptaPayload = {
        version: 1,
        preset: 'radiant',
        vault: 'red',
        rotation: 'CW',
        tail: [0, 0, 0, 0],
        epoch13: 0,
        nonce14: 0,
      };

      const digits = await packPayload(payload, hmacKey);
      const decoded = await unpackPayload(digits, hmacKey);

      expect(decoded!._masked!.vault).toBe(false);
      expect(decoded!._masked!.rotation).toBe(false);
      expect(decoded!._masked!.tail).toBe(false);
    });
  });

  describe('createHeptaPayload', () => {
    it('should create payload from crest with specified preset', () => {
      const payload = createHeptaPayload(mockCrest, 'stealth');

      expect(payload.version).toBe(1);
      expect(payload.preset).toBe('stealth');
      expect(payload.vault).toBe('blue');
      expect(payload.rotation).toBe('CCW');
      expect(payload.tail).toEqual([15, 30, 45, 59]);
      expect(payload.epoch13).toBeGreaterThanOrEqual(0);
      expect(payload.epoch13).toBeLessThan(8192);
      expect(payload.nonce14).toBeGreaterThanOrEqual(0);
      expect(payload.nonce14).toBeLessThan(16384);
    });
  });

  describe('regenerateWithPreset', () => {
    it('should generate new HeptaCode with different preset', async () => {
      const stealthDigits = await regenerateWithPreset(mockCrest, 'stealth', hmacKey);
      const radiantDigits = await regenerateWithPreset(mockCrest, 'radiant', hmacKey);

      expect(stealthDigits.length).toBe(42);
      expect(radiantDigits.length).toBe(42);

      // Decode and verify presets
      const stealthDecoded = await heptaDecode42(stealthDigits, hmacKey);
      const radiantDecoded = await heptaDecode42(radiantDigits, hmacKey);

      expect(stealthDecoded!.preset).toBe('stealth');
      expect(radiantDecoded!.preset).toBe('radiant');

      // Stealth should have masked data
      expect(stealthDecoded!.tail).toEqual([0, 0, 0, 0]);

      // Radiant should have real data
      expect(radiantDecoded!.tail).toEqual([15, 30, 45, 59]);
    });
  });

  describe('Full Encode/Decode Roundtrip', () => {
    const presets: PrivacyPreset[] = ['stealth', 'standard', 'radiant'];

    presets.forEach(preset => {
      it(`should roundtrip correctly with ${preset} preset`, async () => {
        const payload = createHeptaPayload(mockCrest, preset);
        const digits = await heptaEncode42(payload, hmacKey);
        const decoded = await heptaDecode42(digits, hmacKey);

        expect(decoded).not.toBeNull();
        expect(decoded!.version).toBe(1);
        expect(decoded!.preset).toBe(preset);
        expect(digits.length).toBe(42);
      });
    });
  });
});

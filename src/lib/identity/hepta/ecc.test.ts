import { describe, it, expect } from 'vitest';
import {
  eccEncode,
  eccDecode,
  isValidHeptaCode,
  normalizeDigits,
  ECC_CONSTANTS,
} from './ecc';

describe('ECC Module', () => {
  describe('eccEncode', () => {
    it('should encode 30 digits to exactly 42 digits', () => {
      const data = new Array(30).fill(0);
      const encoded = eccEncode(data);
      expect(encoded.length).toBe(42);
    });

    it('should always produce 42 digits regardless of input values', () => {
      // Test with all zeros
      const zeros = eccEncode(new Array(30).fill(0));
      expect(zeros.length).toBe(42);

      // Test with all sixes (max value)
      const sixes = eccEncode(new Array(30).fill(6));
      expect(sixes.length).toBe(42);

      // Test with random valid values
      const random = new Array(30).fill(0).map(() => Math.floor(Math.random() * 7));
      const encoded = eccEncode(random);
      expect(encoded.length).toBe(42);
    });

    it('should produce valid base-7 digits only', () => {
      const data = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 1];
      const encoded = eccEncode(data);

      for (const digit of encoded) {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThan(7);
        expect(Number.isInteger(digit)).toBe(true);
      }
    });

    it('should throw on wrong input length', () => {
      expect(() => eccEncode(new Array(29).fill(0))).toThrow();
      expect(() => eccEncode(new Array(31).fill(0))).toThrow();
      expect(() => eccEncode([])).toThrow();
    });

    it('should throw on invalid digit values', () => {
      const withNegative = new Array(30).fill(0);
      withNegative[5] = -1;
      expect(() => eccEncode(withNegative)).toThrow();

      const withTooLarge = new Array(30).fill(0);
      withTooLarge[10] = 7;
      expect(() => eccEncode(withTooLarge)).toThrow();

      const withFloat = new Array(30).fill(0);
      withFloat[15] = 3.5;
      expect(() => eccEncode(withFloat)).toThrow();
    });
  });

  describe('eccDecode', () => {
    it('should decode 42 digits back to 30 digits', () => {
      const original = new Array(30).fill(0).map((_, i) => i % 7);
      const encoded = eccEncode(original);
      const decoded = eccDecode(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded!.length).toBe(30);
      expect(decoded).toEqual(original);
    });

    it('should correct single errors per block', () => {
      const original = new Array(30).fill(0).map((_, i) => i % 7);
      const encoded = eccEncode(original);

      // Introduce one error in block 0 (position 0)
      const corrupted = [...encoded];
      corrupted[0] = (corrupted[0] + 1) % 7;

      const decoded = eccDecode(corrupted);
      expect(decoded).not.toBeNull();
      expect(decoded).toEqual(original);
    });

    it('should return null for invalid length', () => {
      expect(eccDecode(new Array(41).fill(0))).toBeNull();
      expect(eccDecode(new Array(43).fill(0))).toBeNull();
      expect(eccDecode([])).toBeNull();
    });

    it('should return null for invalid digit values', () => {
      const invalid = new Array(42).fill(0);
      invalid[0] = 7;
      expect(eccDecode(invalid)).toBeNull();

      const negative = new Array(42).fill(0);
      negative[10] = -1;
      expect(eccDecode(negative)).toBeNull();
    });

    it('should fail to recover original data with multiple errors per block', () => {
      const original = new Array(30).fill(0);
      const encoded = eccEncode(original);

      // Introduce two errors in the same block
      const corrupted = [...encoded];
      corrupted[0] = 1;
      corrupted[1] = 2;

      const decoded = eccDecode(corrupted);
      // With multiple errors, the simple parity ECC may either:
      // - Return null (uncorrectable)
      // - Return incorrect data (wrong correction)
      // Either way, it should NOT match the original
      if (decoded !== null) {
        expect(decoded).not.toEqual(original);
      }
    });
  });

  describe('isValidHeptaCode', () => {
    it('should return true for valid 42-digit codes', () => {
      const valid = new Array(42).fill(0).map((_, i) => i % 7);
      expect(isValidHeptaCode(valid)).toBe(true);
    });

    it('should return false for wrong length', () => {
      expect(isValidHeptaCode(new Array(41).fill(0))).toBe(false);
      expect(isValidHeptaCode(new Array(43).fill(0))).toBe(false);
      expect(isValidHeptaCode([])).toBe(false);
    });

    it('should return false for invalid digit values', () => {
      const withNegative = new Array(42).fill(0);
      withNegative[0] = -1;
      expect(isValidHeptaCode(withNegative)).toBe(false);

      const withTooLarge = new Array(42).fill(0);
      withTooLarge[0] = 7;
      expect(isValidHeptaCode(withTooLarge)).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isValidHeptaCode(null)).toBe(false);
      expect(isValidHeptaCode(undefined)).toBe(false);
      expect(isValidHeptaCode('012345')).toBe(false);
      expect(isValidHeptaCode(42)).toBe(false);
    });
  });

  describe('normalizeDigits', () => {
    it('should clamp values to valid range', () => {
      const input = [-1, 0, 3, 6, 7, 10];
      const normalized = normalizeDigits(input);
      expect(normalized).toEqual([0, 0, 3, 6, 6, 6]);
    });

    it('should round non-integers', () => {
      const input = [0.4, 2.5, 3.6];
      const normalized = normalizeDigits(input);
      expect(normalized).toEqual([0, 3, 4]);
    });
  });

  describe('ECC_CONSTANTS', () => {
    it('should have correct values', () => {
      expect(ECC_CONSTANTS.BASE).toBe(7);
      expect(ECC_CONSTANTS.DATA_LENGTH).toBe(30);
      expect(ECC_CONSTANTS.PADDED_LENGTH).toBe(36);
      expect(ECC_CONSTANTS.ENCODED_LENGTH).toBe(42);
      expect(ECC_CONSTANTS.BLOCK_COUNT).toBe(6);
      expect(ECC_CONSTANTS.BLOCK_SIZE).toBe(7);
    });
  });

  describe('roundtrip', () => {
    it('should encode and decode multiple times consistently', () => {
      for (let run = 0; run < 10; run++) {
        const original = new Array(30).fill(0).map(() => Math.floor(Math.random() * 7));
        const encoded = eccEncode(original);
        const decoded = eccDecode(encoded);

        expect(encoded.length).toBe(42);
        expect(decoded).toEqual(original);
      }
    });
  });
});

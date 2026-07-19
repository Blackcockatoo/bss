import { describe, expect, it } from 'vitest';

import {
  ECC_V2_CONSTANTS,
  eccDecodeV2,
  eccEncodeV2,
  isValidHeptaCodeV2,
} from './eccV2';

const DATA = Array.from({ length: 30 }, (_, index) => (index * 3 + 1) % 7);

describe('eccEncodeV2', () => {
  it('produces exactly 30 data + 12 parity = 42 digits', () => {
    const encoded = eccEncodeV2(DATA);
    expect(encoded).toHaveLength(ECC_V2_CONSTANTS.ENCODED_LENGTH);
    expect(isValidHeptaCodeV2(encoded)).toBe(true);
    // Systematic: the data symbols appear verbatim inside the blocks.
    for (let block = 0; block < 6; block++) {
      expect(encoded.slice(block * 7, block * 7 + 5)).toEqual(
        DATA.slice(block * 5, block * 5 + 5),
      );
    }
  });

  it('rejects malformed input', () => {
    expect(() => eccEncodeV2([1, 2, 3])).toThrow(/expects 30/);
    expect(() => eccEncodeV2(DATA.map((d, i) => (i === 0 ? 7 : d)))).toThrow();
  });
});

describe('eccDecodeV2', () => {
  it('round-trips clean codes', () => {
    expect(eccDecodeV2(eccEncodeV2(DATA))).toEqual(DATA);
  });

  it('corrects every one of the 252 possible single-symbol corruptions', () => {
    const encoded = eccEncodeV2(DATA);
    let cases = 0;
    for (let position = 0; position < 42; position++) {
      for (let delta = 1; delta < 7; delta++) {
        const corrupted = [...encoded];
        corrupted[position] = (corrupted[position] + delta) % 7;
        expect(eccDecodeV2(corrupted), `position ${position} +${delta}`).toEqual(
          DATA,
        );
        cases++;
      }
    }
    expect(cases).toBe(252);
  });

  it('detects an uncorrectable double corruption instead of inventing digits', () => {
    const encoded = eccEncodeV2(DATA);
    // Corrupt both parity symbols of block 0: s0≠0 and s1≠0 point at data
    // weight s1·s0⁻¹, chosen here to land outside 1..5 (weight 6).
    const corrupted = [...encoded];
    corrupted[5] = (corrupted[5] + 1) % 7; // s0 = 1
    corrupted[6] = (corrupted[6] + 6) % 7; // s1 = 6 → weight 6 → invalid
    expect(eccDecodeV2(corrupted)).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(eccDecodeV2([1, 2, 3])).toBeNull();
    const encoded = eccEncodeV2(DATA);
    expect(eccDecodeV2(encoded.map((d, i) => (i === 0 ? 9 : d)))).toBeNull();
    expect(eccDecodeV2(encoded.map((d, i) => (i === 0 ? -1 : d)))).toBeNull();
  });

  it('works across arbitrary data words, not just one fixture', () => {
    for (let seed = 0; seed < 20; seed++) {
      const data = Array.from(
        { length: 30 },
        (_, index) => (seed * 11 + index * 5 + (seed % 3)) % 7,
      );
      const encoded = eccEncodeV2(data);
      expect(eccDecodeV2(encoded)).toEqual(data);
      // One corruption at a seed-dependent position still decodes exactly.
      const position = (seed * 7 + 3) % 42;
      const corrupted = [...encoded];
      corrupted[position] = (corrupted[position] + 1 + (seed % 6)) % 7;
      expect(eccDecodeV2(corrupted)).toEqual(data);
    }
  });
});

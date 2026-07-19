/**
 * HeptaCode V2 error correction — a systematic single-symbol-correcting code
 * over GF(7) (Phase 2 of the MetaPet pipeline plan).
 *
 * Layout: 6 blocks of 7 symbols, each [d0 d1 d2 d3 d4 p0 p1] with
 *   p0 = Σ dᵢ            (mod 7)
 *   p1 = Σ (i+1)·dᵢ      (mod 7)
 * giving exactly 30 data + 12 parity = 42 digits.
 *
 * Decoding computes the syndromes
 *   s0 = p0′ − Σ rᵢ, s1 = p1′ − Σ (i+1)·rᵢ (mod 7)
 * A single corrupted symbol anywhere in the block produces a unique syndrome
 * signature — (s0≠0, s1≠0) locates data position s1·s0⁻¹ − 1, (s0≠0, s1=0)
 * is p0 itself, (s0=0, s1≠0) is p1 — so every one of the 252 possible
 * single-symbol corruptions of a 42-digit code is corrected exactly. This is
 * what V1's single weighted checksum could not do: it "repaired" any
 * mismatch by rewriting the first digit. V1 (`./ecc`) stays available
 * read-only for codes minted before this ruleset.
 */

const BASE = 7;
const DATA_LENGTH = 30;
const ENCODED_LENGTH = 42;
const BLOCK_COUNT = 6;
const BLOCK_SIZE = 7;
const DATA_PER_BLOCK = 5;

/** Multiplicative inverses over GF(7); index 0 unused. */
const GF7_INVERSE = [0, 1, 4, 5, 2, 3, 6] as const;

const mod7 = (value: number): number => ((value % BASE) + BASE) % BASE;

function isDigitArray(digits: unknown, length: number): digits is number[] {
  return (
    Array.isArray(digits) &&
    digits.length === length &&
    digits.every((d) => Number.isInteger(d) && d >= 0 && d < BASE)
  );
}

function blockParities(data: number[]): [number, number] {
  let p0 = 0;
  let p1 = 0;
  for (let i = 0; i < DATA_PER_BLOCK; i++) {
    p0 += data[i];
    p1 += (i + 1) * data[i];
  }
  return [mod7(p0), mod7(p1)];
}

/** Encode 30 base-7 data digits → 42-digit HeptaCode V2. */
export function eccEncodeV2(data: number[]): number[] {
  const received = Array.isArray(data) ? `${data.length} symbols` : typeof data;
  if (!isDigitArray(data, DATA_LENGTH)) {
    throw new Error(
      `ECC V2 expects ${DATA_LENGTH} base-${BASE} digits, got ${received}`,
    );
  }

  const encoded: number[] = [];
  for (let block = 0; block < BLOCK_COUNT; block++) {
    const chunk = data.slice(block * DATA_PER_BLOCK, (block + 1) * DATA_PER_BLOCK);
    encoded.push(...chunk, ...blockParities(chunk));
  }
  return encoded;
}

/**
 * Decode a 42-digit HeptaCode V2 → 30 data digits, correcting up to one
 * corrupted symbol per block. Returns null when a block is uncorrectable
 * (more than one error detected) or the input is malformed.
 */
export function eccDecodeV2(encoded: number[]): number[] | null {
  if (!isDigitArray(encoded, ENCODED_LENGTH)) return null;

  const data: number[] = [];
  for (let block = 0; block < BLOCK_COUNT; block++) {
    const chunk = encoded.slice(block * BLOCK_SIZE, (block + 1) * BLOCK_SIZE);
    const corrected = correctBlockV2(chunk);
    if (!corrected) return null;
    data.push(...corrected);
  }
  return data;
}

/** Returns the corrected 5 data symbols of one block, or null if uncorrectable. */
function correctBlockV2(block: number[]): number[] | null {
  const received = block.slice(0, DATA_PER_BLOCK);
  const [expectedP0, expectedP1] = blockParities(received);
  const s0 = mod7(block[DATA_PER_BLOCK] - expectedP0);
  const s1 = mod7(block[DATA_PER_BLOCK + 1] - expectedP1);

  if (s0 === 0 && s1 === 0) return received; // clean (or an undetectable multi-error)
  if (s0 !== 0 && s1 === 0) return received; // p0 itself was corrupted; data intact
  if (s0 === 0 && s1 !== 0) return received; // p1 itself was corrupted; data intact

  // Both syndromes non-zero: single data error at weight w = s1·s0⁻¹.
  const weight = mod7(s1 * GF7_INVERSE[s0]);
  if (weight < 1 || weight > DATA_PER_BLOCK) return null; // ≥2 errors detected

  const corrected = [...received];
  corrected[weight - 1] = mod7(corrected[weight - 1] + s0);
  return corrected;
}

export function isValidHeptaCodeV2(digits: unknown): digits is number[] {
  return isDigitArray(digits, ENCODED_LENGTH);
}

export const ECC_V2_CONSTANTS = {
  BASE,
  DATA_LENGTH,
  ENCODED_LENGTH,
  BLOCK_COUNT,
  BLOCK_SIZE,
  DATA_PER_BLOCK,
  PARITY_PER_BLOCK: 2,
} as const;

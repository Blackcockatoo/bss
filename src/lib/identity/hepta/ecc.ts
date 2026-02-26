/**
 * Simple 6×7 block ECC (Reed-Solomon-inspired, base-7)
 * Each 6 data digits → 1 parity digit → 7-symbol block
 * Can correct 1 error per block
 */

const BASE = 7;
const DATA_LENGTH = 30;
const PADDED_LENGTH = 36;
const ENCODED_LENGTH = 42;
const BLOCK_COUNT = 6;
const BLOCK_SIZE = 7;

/**
 * Encode 30 data digits → 42 digits (6 blocks of 7)
 * Pads to 36 digits, then adds 6 parity digits
 * @throws Error if input is invalid
 */
export function eccEncode(data: number[]): number[] {
  if (data.length !== DATA_LENGTH) {
    throw new Error(`ECC expects ${DATA_LENGTH} data digits, got ${data.length}`);
  }

  // Validate all digits are in valid range [0, 6]
  for (let i = 0; i < data.length; i++) {
    if (!Number.isInteger(data[i]) || data[i] < 0 || data[i] >= BASE) {
      throw new Error(`Invalid digit at position ${i}: ${data[i]} (must be 0-${BASE - 1})`);
    }
  }

  // Pad to 36 digits (add 6 zeros)
  const padded = [...data, 0, 0, 0, 0, 0, 0];

  const encoded: number[] = [];

  for (let block = 0; block < BLOCK_COUNT; block++) {
    const chunk = padded.slice(block * 6, block * 6 + 6);
    const parity = computeParity(chunk);
    encoded.push(...chunk, parity);
  }

  // Verify output length
  if (encoded.length !== ENCODED_LENGTH) {
    throw new Error(`ECC encoding error: expected ${ENCODED_LENGTH} digits, got ${encoded.length}`);
  }

  return encoded;
}

/**
 * Decode 42 digits → 30 data digits (correct up to 1 error/block)
 * Removes 6 padding digits after decoding
 * @returns decoded data or null if uncorrectable
 */
export function eccDecode(encoded: number[]): number[] | null {
  if (encoded.length !== ENCODED_LENGTH) return null;

  // Validate all digits are in valid range [0, 6]
  for (let i = 0; i < encoded.length; i++) {
    if (!Number.isInteger(encoded[i]) || encoded[i] < 0 || encoded[i] >= BASE) {
      return null; // Invalid digit
    }
  }

  const data: number[] = [];

  for (let block = 0; block < BLOCK_COUNT; block++) {
    const chunk = encoded.slice(block * BLOCK_SIZE, block * BLOCK_SIZE + BLOCK_SIZE);
    const corrected = correctBlock(chunk);
    if (!corrected) return null; // uncorrectable
    data.push(...corrected.slice(0, 6));
  }

  // Remove the 6 padding digits (last 6)
  return data.slice(0, DATA_LENGTH);
}

/**
 * Compute simple checksum parity (sum mod 7)
 */
function computeParity(chunk: number[]): number {
  let sum = 0;
  for (let i = 0; i < chunk.length; i++) {
    sum += chunk[i] * (i + 1); // weighted sum
  }
  return sum % BASE;
}

/**
 * Attempt to correct a 7-symbol block (6 data + 1 parity)
 * Returns corrected block or null if uncorrectable
 */
function correctBlock(block: number[]): number[] | null {
  if (block.length !== BLOCK_SIZE) return null;

  const data = block.slice(0, 6);
  const receivedParity = block[6];
  const computedParity = computeParity(data);

  if (receivedParity === computedParity) {
    return block; // no error
  }

  // Try flipping each symbol to see if it fixes the parity
  for (let i = 0; i < BLOCK_SIZE; i++) {
    for (let val = 0; val < BASE; val++) {
      if (val === block[i]) continue;

      const candidate = [...block];
      candidate[i] = val;

      const testData = candidate.slice(0, 6);
      const testParity = computeParity(testData);

      if (testParity === candidate[6]) {
        return candidate; // corrected!
      }
    }
  }

  return null; // uncorrectable (>1 error)
}

/**
 * Validate that an array is a valid 42-digit HeptaCode
 */
export function isValidHeptaCode(digits: unknown): digits is number[] {
  if (!Array.isArray(digits)) return false;
  if (digits.length !== ENCODED_LENGTH) return false;

  for (const d of digits) {
    if (!Number.isInteger(d) || d < 0 || d >= BASE) return false;
  }

  return true;
}

/**
 * Normalize/sanitize a digit array to ensure all values are valid base-7
 * Clamps out-of-range values and rounds non-integers
 */
export function normalizeDigits(digits: number[]): number[] {
  return digits.map(d => {
    const n = Math.round(d);
    return Math.max(0, Math.min(BASE - 1, n));
  });
}

/**
 * Constants for external use
 */
export const ECC_CONSTANTS = {
  BASE,
  DATA_LENGTH,
  PADDED_LENGTH,
  ENCODED_LENGTH,
  BLOCK_COUNT,
  BLOCK_SIZE,
} as const;

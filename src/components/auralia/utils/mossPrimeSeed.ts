/**
 * MossPrimeSeed Algorithm
 *
 * Deterministic chaos engine based on three 60-digit sequences
 * Provides PRNG, Fibonacci/Lucas numbers, and cryptographic hash
 */

import type { Field, Bigish } from '../types';

// ===== CONSTANTS =====

export const RED = '113031491493585389543778774590997079619617525721567332336510';
export const BLACK = '011235831459437077415617853819099875279651673033695493257291';
export const BLUE = '012776329785893036118967145479098334781325217074992143965631';

// ===== UTILITIES =====

/**
 * Convert string of digits to number array
 */
function toDigits(s: string): number[] {
  return s.split('').map((ch) => {
    const d = ch.charCodeAt(0) - 48;
    if (d < 0 || d > 9) throw new Error(`Non-digit character: ${ch}`);
    return d;
  });
}

/**
 * 64-bit mixing function (Murmur3-inspired)
 */
function mix64(x0: Bigish): bigint {
  let x = BigInt(x0) ^ 0x9e3779b97f4a7c15n;
  x ^= x >> 30n;
  x *= 0xbf58476d1ce4e5b9n;
  x ^= x >> 27n;
  x *= 0x94d049bb133111ebn;
  x ^= x >> 31n;
  return x & ((1n << 64n) - 1n);
}

/**
 * Interleave three strings character-by-character
 */
function interleave3(a: string, b: string, c: string): string {
  const n = Math.min(a.length, b.length, c.length);
  let out = '';
  for (let i = 0; i < n; i++) {
    out += a[i] + b[i] + c[i];
  }
  return out;
}

/**
 * Convert base-10 digit string to hex using simple mixing
 */
function base10ToHex(digitStr: string): string {
  const table = '0123456789abcdef'.split('');
  let h = '';
  let acc = 0;

  for (let i = 0; i < digitStr.length; i++) {
    acc = ((acc * 17 + (digitStr.charCodeAt(i) - 48)) >>> 0) & 0xffffffff;
    h += table[(acc ^ (i * 7)) & 15];
  }

  return h;
}

/**
 * Fast Fibonacci via doubling algorithm
 */
function fibFast(n: Bigish): [bigint, bigint] {
  const fn = (k: bigint): [bigint, bigint] => {
    if (k === 0n) return [0n, 1n];

    const [a, b] = fn(k >> 1n);
    const c = a * ((b << 1n) - a);
    const d = a * a + b * b;

    if ((k & 1n) === 0n) return [c, d];
    return [d, c + d];
  };

  const index = typeof n === "bigint"
    ? (n < 0n ? 0n : n)
    : BigInt(Math.max(0, Math.floor(n)));
  return fn(index);
}

// ===== MAIN FIELD INITIALIZATION =====

/**
 * Initialize a Field with deterministic PRNG and mathematical functions
 *
 * @param seedName - Guardian's unique identifier
 * @returns Field object with PRNG, hash, fib, lucas functions
 */
export function initField(seedName = 'AURALIA'): Field {
  const red = RED;
  const black = BLACK;
  const blue = BLUE;

  const r = toDigits(red);
  const k = toDigits(black);
  const b = toDigits(blue);

  // Generate pulse sequence (chaotic)
  const pulse = r.map((rv, i) => (rv ^ k[(i * 7) % 60] ^ b[(i * 13) % 60]) % 10);

  // Generate ring sequence (harmonic)
  const ring = Array.from({ length: 60 }, (_, i) => (r[i] + k[i] + b[i]) % 10);

  // Seed initialization
  const seedStr = interleave3(red, black, blue);
  const seedBI = BigInt('0x' + base10ToHex(seedStr + seedName));

  // Xorshift128+ state
  let s0 = mix64(seedBI);
  let s1 = mix64(seedBI ^ 0xa5a5a5a5a5a5a5a5n);

  /**
   * Xorshift128+ PRNG - returns float in [0, 1)
   */
  const prng = (): number => {
    let x = s0;
    const y = s1;

    s0 = y;
    x ^= x << 23n;
    x ^= x >> 17n;
    x ^= y ^ (y >> 26n);
    s1 = x;

    const sum = (s0 + s1) & ((1n << 64n) - 1n);
    return Number(sum) / 18446744073709551616;
  };

  /**
   * Cryptographic-style hash function
   */
  const hash = (msg: string): bigint => {
    let h = seedBI;
    for (let i = 0; i < msg.length; i++) {
      h = mix64(h ^ (BigInt(msg.charCodeAt(i)) + BigInt(i) * 1315423911n));
    }
    return h;
  };

  /**
   * Nth Fibonacci number
   */
  const fib = (n: number): bigint => fibFast(n)[0];

  /**
   * Nth Lucas number
   */
  const lucas = (n: number): bigint => {
    if (n === 0) return 2n;
    const N = Math.max(0, n);
    const [Fn, Fnp1] = fibFast(N);
    return 2n * Fnp1 - Fn;
  };

  return {
    seed: seedName,
    red,
    black,
    blue,
    ring,
    pulse,
    hash,
    prng,
    fib,
    lucas,
  };
}

/**
 * Generate sigil constellation from seed hash
 */
export function generateSigilPoints(
  field: Field,
  seed: string,
  count = 7
): Array<{ x: number; y: number; hash: string }> {
  const h = field.hash(seed);
  const points: Array<{ x: number; y: number; hash: string }> = [];

  for (let i = 0; i < count; i++) {
    const angle = (Number((h >> BigInt(i * 8)) & 0xffn) / 255) * Math.PI * 2;
    const radius = 15 + (Number((h >> BigInt(i * 8 + 4)) & 0xfn) / 15) * 10;

    points.push({
      x: 200 + Math.cos(angle) * radius,
      y: 145 + Math.sin(angle) * radius,
      hash: (h >> BigInt(i * 8)).toString(16).slice(0, 4),
    });
  }

  return points;
}

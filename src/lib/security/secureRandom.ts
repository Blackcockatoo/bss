/**
 * Cryptographically secure random helpers.
 *
 * `Math.random()` is fine for animation jitter and particle positions, but it
 * is predictable and must not be used for nonces, identifiers, or key
 * material. These helpers wrap the Web Crypto API (available in browsers,
 * Node 18+, and the Edge runtime) and use rejection sampling so results are
 * uniform rather than biased by a modulo.
 */

function getCrypto(): Crypto {
  const candidate = (globalThis as { crypto?: Crypto }).crypto;
  if (!candidate || typeof candidate.getRandomValues !== "function") {
    throw new Error("Secure random source (crypto.getRandomValues) is unavailable");
  }
  return candidate;
}

/** Uniform integer in [0, maxExclusive). maxExclusive must be 1..2^32. */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x1_0000_0000) {
    throw new RangeError(`secureRandomInt: invalid bound ${maxExclusive}`);
  }
  if (maxExclusive === 1) return 0;

  const cryptoSource = getCrypto();
  const buffer = new Uint32Array(1);
  const range = 0x1_0000_0000;
  // Largest multiple of maxExclusive that fits in 32 bits; values at or above
  // it are rejected so every result is equally likely.
  const limit = range - (range % maxExclusive);
  for (;;) {
    cryptoSource.getRandomValues(buffer);
    const value = buffer[0];
    if (value < limit) return value % maxExclusive;
  }
}

/** Uniform float in [0, 1) with 32 bits of secure entropy. */
export function secureRandomFloat(): number {
  const buffer = new Uint32Array(1);
  getCrypto().getRandomValues(buffer);
  return buffer[0] / 0x1_0000_0000;
}

/** Lower-case hex string built from `byteLength` secure random bytes. */
export function secureRandomHex(byteLength = 16): string {
  if (!Number.isInteger(byteLength) || byteLength < 1 || byteLength > 1024) {
    throw new RangeError(`secureRandomHex: invalid length ${byteLength}`);
  }
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

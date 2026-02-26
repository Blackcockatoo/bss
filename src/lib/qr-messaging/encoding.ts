/**
 * MOSS60 Base-60 Encoding
 * Compact encoding using a 60-character alphabet
 */

import { MOSS60_PREFIX } from './types';

/**
 * Base-60 alphabet - safe, distinguishable characters
 * Excludes similar-looking characters (I, l, O, o, 0)
 */
export const BASE60_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

/**
 * Convert data to Base-60 encoding
 * @param data - String or Uint8Array to encode
 * @returns Base-60 encoded string
 */
export function toBase60(data: string | Uint8Array): string {
  let bytes: Uint8Array;

  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = data;
  }

  if (bytes.length === 0) {
    return BASE60_ALPHABET[0];
  }

  // Convert bytes to big integer
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]);
  }

  // Convert to base-60
  if (value === 0n) {
    return BASE60_ALPHABET[0];
  }

  let result = '';
  while (value > 0n) {
    result = BASE60_ALPHABET[Number(value % 60n)] + result;
    value = value / 60n;
  }

  return result;
}

/**
 * Decode Base-60 encoded data
 * @param encoded - Base-60 encoded string
 * @returns Decoded bytes as Uint8Array
 */
export function fromBase60(encoded: string): Uint8Array {
  if (!encoded || encoded.length === 0) {
    return new Uint8Array(0);
  }

  let value = 0n;

  for (let i = 0; i < encoded.length; i++) {
    const digit = BASE60_ALPHABET.indexOf(encoded[i]);
    if (digit === -1) {
      throw new Error(`Invalid base-60 character: ${encoded[i]}`);
    }
    value = value * 60n + BigInt(digit);
  }

  // Convert to bytes
  const bytes: number[] = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 0xFFn));
    value = value >> 8n;
  }

  return new Uint8Array(bytes);
}

/**
 * Decode Base-60 to string
 * @param encoded - Base-60 encoded string
 * @returns Decoded string
 */
export function fromBase60ToString(encoded: string): string {
  const bytes = fromBase60(encoded);
  return new TextDecoder().decode(bytes);
}

/**
 * Encode data to MOSS60 QR format with prefix
 * @param data - Data to encode
 * @returns MOSS60-prefixed Base-60 string
 */
export function encodeMoss60(data: string | Uint8Array): string {
  return `${MOSS60_PREFIX}${toBase60(data)}`;
}

/**
 * Decode MOSS60 QR format
 * @param encoded - MOSS60-prefixed string
 * @returns Decoded string
 */
export function decodeMoss60(encoded: string): string {
  if (encoded.startsWith(MOSS60_PREFIX)) {
    return fromBase60ToString(encoded.substring(MOSS60_PREFIX.length));
  }
  // Assume it's plain Base-60
  return fromBase60ToString(encoded);
}

/**
 * Check if a string is valid Base-60
 * @param str - String to check
 * @returns True if valid Base-60
 */
export function isValidBase60(str: string): boolean {
  for (const char of str) {
    if (!BASE60_ALPHABET.includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a string is MOSS60 format
 * @param str - String to check
 * @returns True if MOSS60 format
 */
export function isMoss60Format(str: string): boolean {
  return str.startsWith(MOSS60_PREFIX) && isValidBase60(str.substring(MOSS60_PREFIX.length));
}

/**
 * Convert hex string to Base-60
 * @param hex - Hexadecimal string
 * @returns Base-60 encoded string
 */
export function hexToBase60(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return toBase60(bytes);
}

/**
 * Convert Base-60 to hex string
 * @param base60 - Base-60 encoded string
 * @returns Hexadecimal string
 */
export function base60ToHex(base60: string): string {
  const bytes = fromBase60(base60);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

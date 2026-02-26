import type { KeyPair, EncryptionMode } from '../types';

export const PHI = (1 + Math.sqrt(5)) / 2;

export const R = '113031491493585389543778774590997079619617525721567332336510'.split('').map(Number);
export const K = '011235831459437077415617853819099875279651673033695493257291'.split('').map(Number);
export const B = '012776329785893036118967145479098334781325217074992143965631'.split('').map(Number);

export const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]);
export const LUCAS = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199];

export function moss60Hash(input: string): string {
  let x = 0;

  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    const j = i % 60;
    x ^= c;
    x = ((x << 5) | (x >>> 27)) + R[j];
    x ^= K[j] << 3;
    x = ((x << 7) | (x >>> 25)) + B[j];
    x = (x * 31) & 0x7FFFFFFF;
  }

  return x.toString(16).padStart(8, '0');
}

export function extendedHash(input: string, iterations = 8): string {
  let result = '';

  for (let i = 0; i < iterations; i++) {
    result += moss60Hash(input + i);
  }

  return result;
}

export function generateKeyPair(seed: string): KeyPair {
  const privateSpiral: number[] = [];
  const hash = extendedHash(seed, 8);

  for (let i = 0; i < 60; i++) {
    const hexPair = hash.substr((i * 2) % hash.length, 2);
    privateSpiral.push(parseInt(hexPair, 16) % 60);
  }

  const publicHash = extendedHash(privateSpiral.join(','), 8);

  return {
    private: privateSpiral,
    public: publicHash,
  };
}

export function computeSharedSecret(myPrivate: number[], theirPublic: string): number[] {
  return myPrivate.map((val, i) => {
    const theirVal = parseInt(theirPublic.substr((i * 2) % theirPublic.length, 2), 16);
    if (PRIMES.has(i)) {
      return Math.floor((val * PHI + theirVal) % 60);
    }
    return (val + theirVal) % 60;
  });
}

export function deriveKeys(sharedSecret: number[]): {
  encryptionKey: number[];
  decryptionKey: number[];
} {
  const keyMaterial = extendedHash(sharedSecret.join(','), 16);

  const encryptionKey = keyMaterial
    .substring(0, 64)
    .split('')
    .map(c => c.charCodeAt(0));

  const decryptionKey = keyMaterial
    .substring(64, 128)
    .split('')
    .map(c => c.charCodeAt(0));

  return { encryptionKey, decryptionKey };
}

export function evolveKey(data: number[], count: number): number[] {
  const lucasValue = LUCAS[count % LUCAS.length];
  return data.map((byte, i) => (byte + lucasValue + i) % 256);
}

export function devolveKey(data: number[], count: number): number[] {
  const lucasValue = LUCAS[count % LUCAS.length];
  return data.map((byte, i) => (byte - lucasValue - i + 256) % 256);
}

export function encrypt(
  plaintext: string,
  encryptionKey: number[],
  messageCount = 0,
  mode: EncryptionMode = 'standard'
): string {
  const bytes = new TextEncoder().encode(plaintext);
  let evolved = Array.from(bytes);

  if (mode === 'temporal') {
    evolved = evolveKey(evolved, messageCount);
  }

  const encrypted = evolved.map(
    (byte, i) => byte ^ encryptionKey[i % encryptionKey.length]
  );

  return btoa(String.fromCharCode(...encrypted));
}

export function decrypt(
  ciphertext: string,
  decryptionKey: number[],
  messageCount = 0,
  mode: EncryptionMode = 'standard'
): string {
  const encrypted = atob(ciphertext)
    .split('')
    .map(c => c.charCodeAt(0));

  const decrypted = encrypted.map(
    (byte, i) => byte ^ decryptionKey[i % decryptionKey.length]
  );

  let result = decrypted;

  if (mode === 'temporal') {
    result = devolveKey(decrypted, messageCount);
  }

  return new TextDecoder().decode(new Uint8Array(result));
}

export function generateNonce(): string {
  const values = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i++) {
      values[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(values)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const nonce = generateNonce().substring(0, 8);
  return `msg-${timestamp}-${nonce}`;
}

export function hashData(data: string): string {
  return moss60Hash(data);
}

export function verifyHash(data: string, hash: string): boolean {
  return moss60Hash(data) === hash;
}

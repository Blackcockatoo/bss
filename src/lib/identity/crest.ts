import type { PrimeTailID, Vault, Rotation } from './types';

const STORAGE_KEY = 'metapet-hmac-key';

// Crypto helpers
function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64url(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Mint a PrimeTail ID crest from DNA string
 * DNA stays private; only hashes + tail are exposed
 */
export async function mintPrimeTailId(opts: {
  dna: string;
  vault: Vault;
  rotation: Rotation;
  tail: [number, number, number, number];
  hmacKey: CryptoKey;
}): Promise<PrimeTailID> {
  const enc = new TextEncoder();

  // Hash DNA (forward)
  const dnaHash = bufToHex(
    await crypto.subtle.digest('SHA-256', enc.encode(opts.dna))
  );

  // Hash reversed DNA (mirror)
  const mirrorHash = bufToHex(
    await crypto.subtle.digest('SHA-256', enc.encode([...opts.dna].reverse().join('')))
  );

  const coronatedAt = Date.now();

  // Sign {hashes, tail, vault, rotation, timestamp}
  const payload = JSON.stringify({
    dnaHash,
    mirrorHash,
    tail: opts.tail,
    vault: opts.vault,
    rotation: opts.rotation,
    coronatedAt,
  });

  const mac = await crypto.subtle.sign(
    'HMAC',
    opts.hmacKey,
    enc.encode(payload)
  );

  const signature = b64url(new Uint8Array(mac).slice(0, 32)); // 256-bit

  return {
    vault: opts.vault,
    rotation: opts.rotation,
    tail: opts.tail,
    coronatedAt,
    dnaHash,
    mirrorHash,
    signature,
  };
}

/**
 * Verify a PrimeTail ID crest signature
 */
export async function verifyCrest(
  crest: PrimeTailID,
  hmacKey: CryptoKey
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const payload = JSON.stringify({
      dnaHash: crest.dnaHash,
      mirrorHash: crest.mirrorHash,
      tail: crest.tail,
      vault: crest.vault,
      rotation: crest.rotation,
      coronatedAt: crest.coronatedAt,
    });

    // Decode signature
    const sigBytes = Uint8Array.from(
      atob(crest.signature.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    // Verify
    return await crypto.subtle.verify(
      'HMAC',
      hmacKey,
      sigBytes,
      enc.encode(payload)
    );
  } catch {
    return false;
  }
}

/**
 * Generate or retrieve device HMAC key (persisted in IndexedDB)
 */
export async function getDeviceHmacKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') {
    return crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const raw = base64ToArrayBuffer(stored);
      return await crypto.subtle.importKey(
        'raw',
        raw,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
    }
  } catch (error) {
    console.warn('Failed to load persisted HMAC key, generating new one:', error);
  }

  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );

  let raw: ArrayBuffer;
  try {
    raw = await crypto.subtle.exportKey('raw', key);
    const encoded = arrayBufferToBase64(raw);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, encoded);
    }
  } catch (error) {
    console.warn('Failed to persist HMAC key:', error);
    raw = await crypto.subtle.exportKey('raw', key);
  }

  return await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

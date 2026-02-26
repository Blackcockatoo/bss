/**
 * Cryptographic verification system for addons
 *
 * Uses Web Crypto API for signing and verification
 */

import type { Addon, AddonOwnershipProof, AddonVerificationResult, AddonTransfer } from './types';

/**
 * Generate a new keypair for addon ownership
 */
export async function generateAddonKeypair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyExport = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyExport = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufferToBase64(publicKeyExport),
    privateKey: bufferToBase64(privateKeyExport),
  };
}

/**
 * Import a public key from base64 string
 */
async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  const publicKeyBuffer = base64ToBuffer(publicKeyB64);
  return await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

/**
 * Import a private key from base64 string
 */
async function importPrivateKey(privateKeyB64: string): Promise<CryptoKey> {
  const privateKeyBuffer = base64ToBuffer(privateKeyB64);
  return await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  );
}

/**
 * Create a canonical string representation of addon data for signing
 */
function getAddonSigningPayload(addon: Partial<Addon>, ownerPublicKey: string, nonce: string, issuedAt: number): string {
  const payload = {
    id: addon.id,
    name: addon.name,
    category: addon.category,
    rarity: addon.rarity,
    owner: ownerPublicKey,
    nonce,
    issuedAt,
    expiresAt: addon.ownership?.expiresAt,
  };
  return JSON.stringify(payload, Object.keys(payload).sort());
}

/**
 * Sign addon data with a private key
 */
export async function signAddon(
  addon: Partial<Addon>,
  ownerPublicKey: string,
  privateKey: string,
  nonce: string,
  issuedAt: number
): Promise<string> {
  const payload = getAddonSigningPayload(addon, ownerPublicKey, nonce, issuedAt);
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    key,
    data
  );

  return bufferToBase64(signature);
}

/**
 * Verify addon signature
 */
export async function verifyAddonSignature(
  addon: Addon,
  publicKey: string,
  signature: string
): Promise<boolean> {
  try {
    const payload = getAddonSigningPayload(
      addon,
      addon.ownership.ownerPublicKey,
      addon.ownership.nonce,
      addon.ownership.issuedAt
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const key = await importPublicKey(publicKey);
    const signatureBuffer = base64ToBuffer(signature);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      key,
      signatureBuffer,
      data
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Comprehensive addon verification
 */
export async function verifyAddon(addon: Addon): Promise<AddonVerificationResult> {
  const result: AddonVerificationResult = {
    valid: false,
    errors: [],
    warnings: [],
    details: {
      ownershipValid: false,
      issuerValid: false,
      notExpired: true,
      signatureValid: false,
    },
  };

  // Check expiration
  const now = Date.now();
  if (addon.ownership.expiresAt && addon.ownership.expiresAt < now) {
    result.errors.push('Addon has expired');
    result.details.notExpired = false;
  }

  // Verify owner signature
  try {
    const ownerSigValid = await verifyAddonSignature(
      addon,
      addon.ownership.ownerPublicKey,
      addon.ownership.signature
    );
    result.details.ownershipValid = ownerSigValid;
    if (!ownerSigValid) {
      result.errors.push('Owner signature verification failed');
    }
  } catch (error) {
    result.errors.push(`Owner signature error: ${error}`);
  }

  // Verify issuer signature
  try {
    const issuerSigValid = await verifyAddonSignature(
      addon,
      addon.ownership.issuerPublicKey,
      addon.ownership.issuerSignature
    );
    result.details.issuerValid = issuerSigValid;
    if (!issuerSigValid) {
      result.errors.push('Issuer signature verification failed');
    }
  } catch (error) {
    result.errors.push(`Issuer signature error: ${error}`);
  }

  result.details.signatureValid =
    result.details.ownershipValid && result.details.issuerValid;

  // Overall validity
  result.valid =
    result.details.ownershipValid &&
    result.details.issuerValid &&
    result.details.notExpired;

  // Check edition limits
  if (addon.metadata.edition && addon.metadata.maxEditions) {
    if (addon.metadata.edition > addon.metadata.maxEditions) {
      result.warnings.push(
        `Edition number (${addon.metadata.edition}) exceeds max editions (${addon.metadata.maxEditions})`
      );
    }
  }

  return result;
}

/**
 * Generate a random nonce for preventing replay attacks
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bufferToBase64(array.buffer);
}

/**
 * Create an addon transfer signature
 */
export async function signTransfer(
  transfer: Omit<AddonTransfer, 'signature'>,
  privateKey: string
): Promise<string> {
  const payload = JSON.stringify(
    {
      addonId: transfer.addonId,
      from: transfer.fromPublicKey,
      to: transfer.toPublicKey,
      timestamp: transfer.timestamp,
      nonce: transfer.nonce,
    },
    Object.keys({
      addonId: '',
      from: '',
      to: '',
      timestamp: 0,
      nonce: '',
    }).sort()
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    key,
    data
  );

  return bufferToBase64(signature);
}

/**
 * Verify an addon transfer
 */
export async function verifyTransfer(
  transfer: AddonTransfer
): Promise<boolean> {
  try {
    const payload = JSON.stringify(
      {
        addonId: transfer.addonId,
        from: transfer.fromPublicKey,
        to: transfer.toPublicKey,
        timestamp: transfer.timestamp,
        nonce: transfer.nonce,
      },
      Object.keys({
        addonId: '',
        from: '',
        to: '',
        timestamp: 0,
        nonce: '',
      }).sort()
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const key = await importPublicKey(transfer.fromPublicKey);
    const signatureBuffer = base64ToBuffer(transfer.signature);

    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      key,
      signatureBuffer,
      data
    );
  } catch (error) {
    console.error('Transfer verification failed:', error);
    return false;
  }
}

// Utility functions

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Hash addon data for quick comparison
 */
export async function hashAddon(addon: Addon): Promise<string> {
  const payload = JSON.stringify({
    id: addon.id,
    name: addon.name,
    category: addon.category,
    owner: addon.ownership.ownerPublicKey,
    nonce: addon.ownership.nonce,
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

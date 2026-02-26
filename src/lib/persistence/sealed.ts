/**
 * Sealed Export/Import
 *
 * Cryptographically signed pet exports for secure backup and sharing.
 * Provides tamper-evidence while preserving privacy (DNA never exposed).
 */

import type { PetSaveData } from './indexeddb';
import { exportPetToJSON, importPetFromJSON } from './indexeddb';

const SEALED_VERSION = 1;
const SEALED_SIGNATURE = 'METAPET_SEALED_V1';

export interface SealedExport {
  version: number;
  signature: string;
  payload: string; // base64-encoded JSON
  hmac: string; // HMAC signature for tamper detection
  exportedAt: number;
  petId: string;
  hashes: {
    dnaHash: string;
    mirrorHash: string;
  };
}

/**
 * Create a sealed (signed) export of pet data
 *
 * This provides tamper-evidence without exposing sensitive data.
 * DNA remains private (only hashes are in the export).
 */
export async function createSealedExport(
  petData: PetSaveData,
  hmacKey: CryptoKey
): Promise<string> {
  const enc = new TextEncoder();

  // Export pet to JSON
  const petJson = exportPetToJSON(petData);

  // Base64 encode the payload
  const payload = btoa(petJson);

  // Create metadata
  const exportedAt = Date.now();
  const petId = petData.id;
  const hashes = {
    dnaHash: petData.crest.dnaHash,
    mirrorHash: petData.crest.mirrorHash,
  };

  // Create signature payload (everything except the HMAC itself)
  const signaturePayload = JSON.stringify({
    version: SEALED_VERSION,
    signature: SEALED_SIGNATURE,
    payload,
    exportedAt,
    petId,
    hashes,
  });

  // Generate HMAC signature
  const mac = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    enc.encode(signaturePayload)
  );

  const hmac = arrayBufferToHex(mac);

  // Create final sealed export
  const sealedExport: SealedExport = {
    version: SEALED_VERSION,
    signature: SEALED_SIGNATURE,
    payload,
    hmac,
    exportedAt,
    petId,
    hashes,
  };

  return JSON.stringify(sealedExport, null, 2);
}

/**
 * Import and verify a sealed export
 *
 * Verifies HMAC signature to ensure data hasn't been tampered with.
 */
export async function importSealedExport(
  sealedJson: string,
  hmacKey: CryptoKey
): Promise<PetSaveData> {
  const enc = new TextEncoder();

  // Parse sealed export
  const sealed = JSON.parse(sealedJson) as SealedExport;

  // Validate format
  if (sealed.signature !== SEALED_SIGNATURE) {
    throw new Error('Invalid sealed export: incorrect signature');
  }

  if (sealed.version !== SEALED_VERSION) {
    throw new Error(`Unsupported sealed export version: ${sealed.version}`);
  }

  if (!sealed.payload || !sealed.hmac) {
    throw new Error('Invalid sealed export: missing payload or HMAC');
  }

  if (!sealed.hashes || !sealed.hashes.dnaHash || !sealed.hashes.mirrorHash) {
    throw new Error('Invalid sealed export: missing crest hashes');
  }

  // Decode payload early to compare IDs before HMAC verification
  let petJson: string;
  try {
    petJson = atob(sealed.payload);
  } catch {
    throw new Error('Invalid sealed export: payload is not valid base64');
  }

  const petData = importPetFromJSON(petJson);

  // Verify pet ID matches the sealed metadata before proceeding
  if (petData.id !== sealed.petId) {
    throw new Error('Sealed export verification failed: pet ID mismatch');
  }

  // Verify crest hashes match the sealed metadata
  if (petData.crest.dnaHash !== sealed.hashes.dnaHash) {
    throw new Error('Sealed export verification failed: crest hash mismatch (dnaHash)');
  }
  if (petData.crest.mirrorHash !== sealed.hashes.mirrorHash) {
    throw new Error('Sealed export verification failed: crest hash mismatch (mirrorHash)');
  }

  // Reconstruct signature payload (everything except HMAC)
  const signaturePayload = JSON.stringify({
    version: sealed.version,
    signature: sealed.signature,
    payload: sealed.payload,
    exportedAt: sealed.exportedAt,
    petId: sealed.petId,
    hashes: sealed.hashes,
  });

  // Verify HMAC signature
  const expectedMac = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    enc.encode(signaturePayload)
  );

  const expectedHmac = arrayBufferToHex(expectedMac);

  if (sealed.hmac !== expectedHmac) {
    throw new Error('Sealed export verification failed: HMAC mismatch (data may be tampered)');
  }

  return petData;
}

/**
 * Create a sealed export and download as file
 */
export async function downloadSealedExport(
  petData: PetSaveData,
  hmacKey: CryptoKey,
  filename?: string
): Promise<void> {
  const sealed = await createSealedExport(petData, hmacKey);

  // Create download
  const blob = new Blob([sealed], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `metapet-${petData.id}-sealed.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Verify a sealed export without importing (quick check)
 */
export async function verifySealedExport(
  sealedJson: string,
  hmacKey: CryptoKey
): Promise<{ valid: boolean; petId?: string; exportedAt?: number; error?: string }> {
  try {
    const enc = new TextEncoder();
    const sealed = JSON.parse(sealedJson) as SealedExport;

    if (sealed.signature !== SEALED_SIGNATURE) {
      return { valid: false, error: 'Invalid signature' };
    }

    if (sealed.version !== SEALED_VERSION) {
      return { valid: false, error: `Unsupported version: ${sealed.version}` };
    }

    // Verify HMAC
    const signaturePayload = JSON.stringify({
      version: sealed.version,
      signature: sealed.signature,
      payload: sealed.payload,
      exportedAt: sealed.exportedAt,
      petId: sealed.petId,
      hashes: sealed.hashes ?? { dnaHash: '', mirrorHash: '' },
    });

    const expectedMac = await crypto.subtle.sign(
      'HMAC',
      hmacKey,
      enc.encode(signaturePayload)
    );

    const expectedHmac = arrayBufferToHex(expectedMac);

    if (sealed.hmac !== expectedHmac) {
      return { valid: false, error: 'HMAC mismatch' };
    }

    return {
      valid: true,
      petId: sealed.petId,
      exportedAt: sealed.exportedAt,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper functions

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

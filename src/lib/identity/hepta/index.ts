import type { HeptaPayload, HeptaDigits, PrivacyPreset, PrimeTailID } from '../types';
import { packPayload, unpackPayload } from './codec';
import { eccEncode, eccDecode, isValidHeptaCode, ECC_CONSTANTS } from './ecc';

/**
 * Encode HeptaPayload → 42 base-7 digits (with ECC)
 * @throws Error if encoding fails
 */
export async function heptaEncode42(
  payload: HeptaPayload,
  hmacKey: CryptoKey
): Promise<HeptaDigits> {
  const data30 = await packPayload(payload, hmacKey);

  // Validate data30 before encoding
  if (data30.length !== ECC_CONSTANTS.DATA_LENGTH) {
    throw new Error(`packPayload returned ${data30.length} digits, expected ${ECC_CONSTANTS.DATA_LENGTH}`);
  }

  const digits42 = eccEncode(data30);

  // Final validation
  if (!isValidHeptaCode(digits42)) {
    throw new Error('ECC encoding produced invalid output');
  }

  return Object.freeze(digits42);
}

/**
 * Create a HeptaPayload from a PrimeTailID crest with the specified preset.
 * Generates fresh epoch and nonce values.
 */
export function createHeptaPayload(
  crest: PrimeTailID,
  preset: PrivacyPreset
): HeptaPayload {
  const minutes = Math.floor(Date.now() / 60000) % 8192;
  const nonce = Math.floor(Math.random() * 16384);

  return {
    version: 1,
    preset,
    vault: crest.vault,
    rotation: crest.rotation,
    tail: [...crest.tail] as [number, number, number, number],
    epoch13: minutes,
    nonce14: nonce,
  };
}

/**
 * Regenerate HeptaCode with a new privacy preset.
 * Use this when the user changes their privacy setting.
 */
export async function regenerateWithPreset(
  crest: PrimeTailID,
  newPreset: PrivacyPreset,
  hmacKey: CryptoKey
): Promise<HeptaDigits> {
  const payload = createHeptaPayload(crest, newPreset);
  return heptaEncode42(payload, hmacKey);
}

/**
 * Decode 42 digits → HeptaPayload (with error correction)
 */
export async function heptaDecode42(
  digits: HeptaDigits,
  hmacKey: CryptoKey
): Promise<HeptaPayload | null> {
  const data30 = eccDecode([...digits]);
  if (!data30) return null;
  return await unpackPayload(data30, hmacKey);
}

// Re-export for convenience
export { packPayload, unpackPayload } from './codec';
export { eccEncode, eccDecode, isValidHeptaCode, normalizeDigits, ECC_CONSTANTS } from './ecc';
export { playHepta, stopHepta, heptaDigitsToFrequencies } from './audio';

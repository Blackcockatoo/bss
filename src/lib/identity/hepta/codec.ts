import type { HeptaPayload } from '../types';

/**
 * Pack HeptaPayload into 30 base-7 digits + MAC-20 → total 30 data digits
 *
 * Bit layout:
 * - version: 3 bits (always 1)
 * - preset: 2 bits (stealth=0, standard=1, radiant=2)
 * - vault: 2 bits (red=0, blue=1, black=2)
 * - rotation: 1 bit (CW=0, CCW=1)
 * - tail[0..3]: 6 bits each = 24 bits (0..59)
 * - epoch13: 13 bits
 * - nonce14: 14 bits
 * - mac: 20 bits (from HMAC-SHA256, truncated)
 * Total: 3+2+2+1+24+13+14+20 = 79 bits → pack into base-7
 *
 * Math: 7^30 ≈ 2.25×10^25 > 2^79 ≈ 6.04×10^23 ✓
 * This ensures no data loss during base-7 conversion.
 */

const PRESET_MAP = { stealth: 0, standard: 1, radiant: 2 } as const;
const VAULT_MAP = { red: 0, blue: 1, black: 2 } as const;
const ROTATION_MAP = { CW: 0, CCW: 1 } as const;

/**
 * Privacy masking rules:
 * - stealth: mask vault, rotation, and tail (replace with zeros)
 * - standard: keep vault, mask rotation and tail
 * - radiant: keep all data visible
 */
function applyPrivacyMask(payload: HeptaPayload): {
  vault: number;
  rotation: number;
  tail: [number, number, number, number];
} {
  const preset = payload.preset;

  if (preset === 'stealth') {
    // Stealth: hide everything - use zeros
    return {
      vault: 0, // Masked to 'red' (0)
      rotation: 0, // Masked to 'CW' (0)
      tail: [0, 0, 0, 0], // All zeros
    };
  }

  if (preset === 'standard') {
    // Standard: keep vault, hide rotation and tail
    return {
      vault: VAULT_MAP[payload.vault],
      rotation: 0, // Masked to 'CW' (0)
      tail: [0, 0, 0, 0], // All zeros
    };
  }

  // Radiant: expose all data
  return {
    vault: VAULT_MAP[payload.vault],
    rotation: ROTATION_MAP[payload.rotation],
    tail: payload.tail.map(t => t & 0x3f) as [number, number, number, number],
  };
}

/**
 * Pack payload + compute MAC-20 → 30 base-7 digits
 * Applies privacy masking based on the preset before encoding.
 */
export async function packPayload(
  payload: HeptaPayload,
  hmacKey: CryptoKey
): Promise<number[]> {
  // Apply privacy masking
  const masked = applyPrivacyMask(payload);

  // Encode payload to bits
  let bits = 0n;
  let pos = 0;

  const writeBits = (val: number, width: number) => {
    bits |= BigInt(val) << BigInt(pos);
    pos += width;
  };

  writeBits(payload.version, 3);
  writeBits(PRESET_MAP[payload.preset], 2);
  writeBits(masked.vault, 2);
  writeBits(masked.rotation, 1);
  masked.tail.forEach(t => writeBits(t, 6)); // 6 bits each
  writeBits(payload.epoch13 & 0x1fff, 13);
  writeBits(payload.nonce14 & 0x3fff, 14);

  // Now pos = 59 bits of data

  // Compute MAC-28 from first 59 bits
  const dataBytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    dataBytes[i] = Number((bits >> BigInt(i * 8)) & 0xffn);
  }

  const mac = await crypto.subtle.sign('HMAC', hmacKey, dataBytes);
  const macU8 = new Uint8Array(mac);
  // Use 20 bits of MAC (fits in 30 base-7 digits with headroom)
  const mac20 = (macU8[0] | (macU8[1] << 8) | ((macU8[2] & 0x0f) << 16)) & 0x0fffff;

  writeBits(mac20, 20);

  // Now bits = 79 bits total
  // 7^30 ≈ 2.25×10^25 > 2^79 ≈ 6.04×10^23, so 30 digits is sufficient

  const digits: number[] = [];
  let remaining = bits;

  for (let i = 0; i < 30; i++) {
    digits.push(Number(remaining % 7n));
    remaining /= 7n;
  }

  return digits;
}

/**
 * Unpack 30 base-7 digits → payload (verify MAC)
 */
export async function unpackPayload(
  digits: number[],
  hmacKey: CryptoKey
): Promise<HeptaPayload | null> {
  if (digits.length !== 30) return null;

  // Reconstruct bits from base-7
  let bits = 0n;
  for (let i = 29; i >= 0; i--) {
    bits = bits * 7n + BigInt(digits[i]);
  }

  const readBits = (width: number): number => {
    const val = Number(bits & ((1n << BigInt(width)) - 1n));
    bits >>= BigInt(width);
    return val;
  };

  const version = readBits(3);
  if (version !== 1) return null;

  const presetIdx = readBits(2);
  const vaultIdx = readBits(2);
  const rotBit = readBits(1);
  const tail: [number, number, number, number] = [
    readBits(6),
    readBits(6),
    readBits(6),
    readBits(6),
  ];
  const epoch13 = readBits(13);
  const nonce14 = readBits(14);
  const mac20 = readBits(20);

  // Verify MAC
  const dataBytes = new Uint8Array(8);
  let dataBits = 0n;
  let pos = 0;
  const writeBits = (val: number, width: number) => {
    dataBits |= BigInt(val) << BigInt(pos);
    pos += width;
  };
  writeBits(version, 3);
  writeBits(presetIdx, 2);
  writeBits(vaultIdx, 2);
  writeBits(rotBit, 1);
  tail.forEach(t => writeBits(t, 6));
  writeBits(epoch13, 13);
  writeBits(nonce14, 14);

  for (let i = 0; i < 8; i++) {
    dataBytes[i] = Number((dataBits >> BigInt(i * 8)) & 0xffn);
  }

  const mac = await crypto.subtle.sign('HMAC', hmacKey, dataBytes);
  const macU8 = new Uint8Array(mac);
  const computedMac20 = (macU8[0] | (macU8[1] << 8) | ((macU8[2] & 0x0f) << 16)) & 0x0fffff;

  if (mac20 !== computedMac20) return null; // MAC mismatch

  const presets: PrivacyPreset[] = ['stealth', 'standard', 'radiant'];
  const vaults: Vault[] = ['red', 'blue', 'black'];
  const preset = presets[presetIdx];

  // Determine which fields are actually meaningful based on preset
  // Masked fields will be zeros but we return them anyway for structure consistency
  const isMasked = {
    vault: preset === 'stealth',
    rotation: preset === 'stealth' || preset === 'standard',
    tail: preset === 'stealth' || preset === 'standard',
  };

  return {
    version: 1,
    preset,
    // Return actual decoded values, but consumers should check preset to know if they're meaningful
    vault: vaults[vaultIdx],
    rotation: rotBit === 0 ? 'CW' : 'CCW',
    tail,
    epoch13,
    nonce14,
    // Include masking info for consumers
    _masked: isMasked,
  } as HeptaPayload;
}

type PrivacyPreset = 'stealth' | 'standard' | 'radiant';
type Vault = 'red' | 'blue' | 'black';

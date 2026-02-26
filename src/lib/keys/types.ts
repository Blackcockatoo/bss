/**
 * Digital Key System Types
 *
 * Four key types:
 * 1. Device Key - Local cryptographic identity
 * 2. Unlock Key - Shareable keys to unlock features/cosmetics
 * 3. Pairing Key - Keys for device/user pairing
 * 4. Export Key - Encryption keys for secure backups
 */

export type KeyType = 'device' | 'unlock' | 'pairing' | 'export';

export interface DeviceKey {
  type: 'device';
  id: string;
  fingerprint: string; // First 16 chars of key hash
  createdAt: number;
  lastUsedAt: number;
}

export interface UnlockKey {
  type: 'unlock';
  id: string;
  code: string; // 16-char alphanumeric code
  unlocks: UnlockTarget[];
  createdAt: number;
  expiresAt: number | null; // null = never expires
  maxUses: number | null; // null = unlimited
  usedCount: number;
  createdBy: string; // Device fingerprint that created it
  isRedeemed: boolean;
}

export type UnlockTarget =
  | { type: 'cosmetic'; id: string }
  | { type: 'achievement'; id: string }
  | { type: 'feature'; id: string }
  | { type: 'pet'; petId: string }
  | { type: 'evolution'; stage: string };

export interface PairingKey {
  type: 'pairing';
  id: string;
  code: string; // 8-char pairing code
  deviceFingerprint: string;
  petId: string | null; // Pet to share during pairing
  createdAt: number;
  expiresAt: number; // Pairing keys always expire (5 min default)
  status: 'pending' | 'paired' | 'expired' | 'cancelled';
  pairedWith: string | null; // Fingerprint of paired device
}

export interface ExportKey {
  type: 'export';
  id: string;
  name: string;
  fingerprint: string;
  createdAt: number;
  lastUsedAt: number;
  petIds: string[]; // Pets encrypted with this key
  isDefault: boolean;
}

export type DigitalKey = DeviceKey | UnlockKey | PairingKey | ExportKey;

export interface KeyStore {
  deviceKey: DeviceKey | null;
  unlockKeys: UnlockKey[];
  pairingKeys: PairingKey[];
  exportKeys: ExportKey[];
  redeemedUnlocks: string[]; // IDs of redeemed unlock keys
}

export interface KeyGenerationResult {
  key: DigitalKey;
  secret?: string; // Raw key material (only returned on creation)
  displayCode?: string; // User-friendly code to share
}

export interface KeyVerificationResult {
  valid: boolean;
  key?: DigitalKey;
  error?: string;
}

export interface EncryptedPayload {
  version: 1;
  keyId: string;
  iv: string; // Base64 initialization vector
  ciphertext: string; // Base64 encrypted data
  mac: string; // HMAC for integrity
  createdAt: number;
}

// Unlock codes for special features/cosmetics
export const BUILTIN_UNLOCK_CODES: Record<string, UnlockTarget[]> = {
  'METAPET-ALPHA-01': [{ type: 'cosmetic', id: 'golden-crown' }],
  'GENESIS-PET-2024': [{ type: 'achievement', id: 'genesis' }],
  'VIMANA-EXPLORER': [{ type: 'feature', id: 'vimana-advanced' }],
  'QUANTUM-EVOLVE': [{ type: 'evolution', stage: 'QUANTUM' }],
};

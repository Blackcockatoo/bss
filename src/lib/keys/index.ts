/**
 * Digital Key System
 *
 * Core functionality for:
 * 1. Device Key - Local identity management
 * 2. Unlock Key - Shareable feature/cosmetic unlocks
 * 3. Pairing Key - Device-to-device pairing
 * 4. Export Key - Encrypted backup/restore
 */

import type {
  DeviceKey,
  UnlockKey,
  PairingKey,
  ExportKey,
  KeyStore,
  KeyGenerationResult,
  KeyVerificationResult,
  UnlockTarget,
  EncryptedPayload,
} from './types';
import { BUILTIN_UNLOCK_CODES } from './types';

const KEY_STORE_KEY = 'metapet-key-store';
const DEVICE_KEY_STORAGE = 'metapet-hmac-key';

// ============================================================================
// Utility Functions
// ============================================================================

function bufToHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
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

function generateId(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, v => chars[v % chars.length]).join('');
}

function generateCode(length: number, uppercase = true): string {
  const chars = uppercase
    ? 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    : 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, v => chars[v % chars.length]).join('');
}

async function hashData(data: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufToHex(hash);
}

// ============================================================================
// Key Store Management
// ============================================================================

function getKeyStore(): KeyStore {
  if (typeof window === 'undefined') {
    return {
      deviceKey: null,
      unlockKeys: [],
      pairingKeys: [],
      exportKeys: [],
      redeemedUnlocks: [],
    };
  }

  try {
    const stored = localStorage.getItem(KEY_STORE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.warn('Failed to load key store');
  }

  return {
    deviceKey: null,
    unlockKeys: [],
    pairingKeys: [],
    exportKeys: [],
    redeemedUnlocks: [],
  };
}

function saveKeyStore(store: KeyStore): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(KEY_STORE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Failed to save key store:', error);
  }
}

// ============================================================================
// Device Key
// ============================================================================

export async function getDeviceKey(): Promise<DeviceKey> {
  const store = getKeyStore();

  if (store.deviceKey) {
    // Update last used
    store.deviceKey.lastUsedAt = Date.now();
    saveKeyStore(store);
    return store.deviceKey;
  }

  // Generate new device key
  const rawKey = localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!rawKey) {
    throw new Error('Device HMAC key not initialized');
  }

  const fingerprint = (await hashData(rawKey)).slice(0, 16);
  const now = Date.now();

  const deviceKey: DeviceKey = {
    type: 'device',
    id: `dev-${generateId(8)}`,
    fingerprint,
    createdAt: now,
    lastUsedAt: now,
  };

  store.deviceKey = deviceKey;
  saveKeyStore(store);

  return deviceKey;
}

export async function getDeviceFingerprint(): Promise<string> {
  const deviceKey = await getDeviceKey();
  return deviceKey.fingerprint;
}

export function getDeviceKeyDisplay(): string | null {
  const store = getKeyStore();
  if (!store.deviceKey) return null;

  // Format fingerprint for display: XXXX-XXXX-XXXX-XXXX
  const fp = store.deviceKey.fingerprint.toUpperCase();
  return `${fp.slice(0, 4)}-${fp.slice(4, 8)}-${fp.slice(8, 12)}-${fp.slice(12, 16)}`;
}

// ============================================================================
// Unlock Keys
// ============================================================================

export async function createUnlockKey(options: {
  unlocks: UnlockTarget[];
  expiresIn?: number; // ms from now, null for never
  maxUses?: number; // null for unlimited
}): Promise<KeyGenerationResult> {
  const deviceKey = await getDeviceKey();
  const code = `${generateCode(4)}-${generateCode(4)}-${generateCode(4)}-${generateCode(4)}`;
  const now = Date.now();

  const unlockKey: UnlockKey = {
    type: 'unlock',
    id: `unlk-${generateId(8)}`,
    code,
    unlocks: options.unlocks,
    createdAt: now,
    expiresAt: options.expiresIn ? now + options.expiresIn : null,
    maxUses: options.maxUses ?? null,
    usedCount: 0,
    createdBy: deviceKey.fingerprint,
    isRedeemed: false,
  };

  const store = getKeyStore();
  store.unlockKeys.push(unlockKey);
  saveKeyStore(store);

  return {
    key: unlockKey,
    displayCode: code,
  };
}

export async function redeemUnlockKey(code: string): Promise<KeyVerificationResult> {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const formattedCode = normalizedCode.match(/.{1,4}/g)?.join('-') ?? normalizedCode;

  // Check built-in codes first
  const builtinUnlocks = BUILTIN_UNLOCK_CODES[formattedCode];
  if (builtinUnlocks) {
    const store = getKeyStore();
    if (store.redeemedUnlocks.includes(formattedCode)) {
      return { valid: false, error: 'This code has already been redeemed' };
    }

    store.redeemedUnlocks.push(formattedCode);
    saveKeyStore(store);

    const syntheticKey: UnlockKey = {
      type: 'unlock',
      id: `builtin-${formattedCode}`,
      code: formattedCode,
      unlocks: builtinUnlocks,
      createdAt: Date.now(),
      expiresAt: null,
      maxUses: 1,
      usedCount: 1,
      createdBy: 'system',
      isRedeemed: true,
    };

    return { valid: true, key: syntheticKey };
  }

  // Check user-created codes
  const store = getKeyStore();
  const unlockKey = store.unlockKeys.find(k => k.code === formattedCode);

  if (!unlockKey) {
    return { valid: false, error: 'Invalid unlock code' };
  }

  if (unlockKey.expiresAt && Date.now() > unlockKey.expiresAt) {
    return { valid: false, error: 'This code has expired' };
  }

  if (unlockKey.maxUses !== null && unlockKey.usedCount >= unlockKey.maxUses) {
    return { valid: false, error: 'This code has reached maximum uses' };
  }

  if (store.redeemedUnlocks.includes(unlockKey.id)) {
    return { valid: false, error: 'You have already redeemed this code' };
  }

  // Redeem the key
  unlockKey.usedCount++;
  store.redeemedUnlocks.push(unlockKey.id);
  saveKeyStore(store);

  return { valid: true, key: unlockKey };
}

export function getRedeemedUnlocks(): string[] {
  return getKeyStore().redeemedUnlocks;
}

export function getCreatedUnlockKeys(): UnlockKey[] {
  return getKeyStore().unlockKeys;
}

// ============================================================================
// Pairing Keys
// ============================================================================

const PAIRING_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export async function createPairingKey(petId?: string): Promise<KeyGenerationResult> {
  const deviceKey = await getDeviceKey();
  const code = generateCode(8);
  const now = Date.now();

  const pairingKey: PairingKey = {
    type: 'pairing',
    id: `pair-${generateId(8)}`,
    code,
    deviceFingerprint: deviceKey.fingerprint,
    petId: petId ?? null,
    createdAt: now,
    expiresAt: now + PAIRING_EXPIRY_MS,
    status: 'pending',
    pairedWith: null,
  };

  const store = getKeyStore();
  // Clean up expired pairing keys
  store.pairingKeys = store.pairingKeys.filter(k => k.expiresAt > now || k.status === 'paired');
  store.pairingKeys.push(pairingKey);
  saveKeyStore(store);

  return {
    key: pairingKey,
    displayCode: `${code.slice(0, 4)}-${code.slice(4)}`,
  };
}

export async function acceptPairingKey(code: string): Promise<KeyVerificationResult> {
  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const deviceKey = await getDeviceKey();
  const store = getKeyStore();
  const now = Date.now();

  const pairingKey = store.pairingKeys.find(k => k.code === normalizedCode);

  if (!pairingKey) {
    return { valid: false, error: 'Invalid pairing code' };
  }

  if (pairingKey.expiresAt < now) {
    pairingKey.status = 'expired';
    saveKeyStore(store);
    return { valid: false, error: 'This pairing code has expired' };
  }

  if (pairingKey.status !== 'pending') {
    return { valid: false, error: `Pairing code is ${pairingKey.status}` };
  }

  if (pairingKey.deviceFingerprint === deviceKey.fingerprint) {
    return { valid: false, error: 'Cannot pair with yourself' };
  }

  // Accept pairing
  pairingKey.status = 'paired';
  pairingKey.pairedWith = deviceKey.fingerprint;
  saveKeyStore(store);

  return { valid: true, key: pairingKey };
}

export function cancelPairingKey(keyId: string): boolean {
  const store = getKeyStore();
  const pairingKey = store.pairingKeys.find(k => k.id === keyId);

  if (!pairingKey || pairingKey.status !== 'pending') {
    return false;
  }

  pairingKey.status = 'cancelled';
  saveKeyStore(store);
  return true;
}

export function getActivePairingKeys(): PairingKey[] {
  const store = getKeyStore();
  const now = Date.now();
  return store.pairingKeys.filter(k => k.status === 'pending' && k.expiresAt > now);
}

export function getPairedDevices(): PairingKey[] {
  return getKeyStore().pairingKeys.filter(k => k.status === 'paired');
}

// ============================================================================
// Export Keys
// ============================================================================

export async function createExportKey(name: string): Promise<KeyGenerationResult> {
  // Generate AES-256 key
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const rawKey = await crypto.subtle.exportKey('raw', aesKey);
  const keyHex = bufToHex(rawKey);
  const fingerprint = (await hashData(keyHex)).slice(0, 16);
  const now = Date.now();

  const exportKey: ExportKey = {
    type: 'export',
    id: `exp-${generateId(8)}`,
    name,
    fingerprint,
    createdAt: now,
    lastUsedAt: now,
    petIds: [],
    isDefault: false,
  };

  // Store the raw key separately (encrypted with device key)
  const store = getKeyStore();

  // Set as default if first export key
  if (store.exportKeys.length === 0) {
    exportKey.isDefault = true;
  }

  store.exportKeys.push(exportKey);
  saveKeyStore(store);

  // Store raw key material
  localStorage.setItem(`metapet-export-key-${exportKey.id}`, keyHex);

  return {
    key: exportKey,
    secret: keyHex,
    displayCode: fingerprint.toUpperCase().match(/.{1,4}/g)?.join('-'),
  };
}

export async function encryptWithExportKey(
  keyId: string,
  data: string
): Promise<EncryptedPayload> {
  const store = getKeyStore();
  const exportKey = store.exportKeys.find(k => k.id === keyId);

  if (!exportKey) {
    throw new Error('Export key not found');
  }

  const rawKeyHex = localStorage.getItem(`metapet-export-key-${keyId}`);
  if (!rawKeyHex) {
    throw new Error('Export key material not found');
  }

  // Import AES key
  const rawKey = hexToBuf(rawKeyHex);
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawKey.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(data)
  );

  // Generate MAC
  const macData = `${keyId}:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
  const mac = await hashData(macData);

  // Update last used
  exportKey.lastUsedAt = Date.now();
  saveKeyStore(store);

  return {
    version: 1,
    keyId,
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
    mac: mac.slice(0, 32),
    createdAt: Date.now(),
  };
}

export async function decryptWithExportKey(
  payload: EncryptedPayload
): Promise<string> {
  const rawKeyHex = localStorage.getItem(`metapet-export-key-${payload.keyId}`);
  if (!rawKeyHex) {
    throw new Error('Export key not found - you may need to import it first');
  }

  // Verify MAC
  const macData = `${payload.keyId}:${payload.iv}:${payload.ciphertext}`;
  const expectedMac = (await hashData(macData)).slice(0, 32);
  if (payload.mac !== expectedMac) {
    throw new Error('Data integrity check failed - payload may be corrupted');
  }

  // Import AES key
  const rawKey = hexToBuf(rawKeyHex);
  const aesKey = await crypto.subtle.importKey(
    'raw',
    rawKey.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

export async function importExportKey(name: string, keyHex: string): Promise<ExportKey> {
  // Validate key
  if (keyHex.length !== 64) {
    throw new Error('Invalid key format - must be 64 hex characters');
  }

  const fingerprint = (await hashData(keyHex)).slice(0, 16);
  const now = Date.now();

  // Check if already imported
  const store = getKeyStore();
  const existing = store.exportKeys.find(k => k.fingerprint === fingerprint);
  if (existing) {
    return existing;
  }

  const exportKey: ExportKey = {
    type: 'export',
    id: `exp-${generateId(8)}`,
    name,
    fingerprint,
    createdAt: now,
    lastUsedAt: now,
    petIds: [],
    isDefault: false,
  };

  store.exportKeys.push(exportKey);
  saveKeyStore(store);

  localStorage.setItem(`metapet-export-key-${exportKey.id}`, keyHex);

  return exportKey;
}

export function getExportKeys(): ExportKey[] {
  return getKeyStore().exportKeys;
}

export function setDefaultExportKey(keyId: string): boolean {
  const store = getKeyStore();
  const key = store.exportKeys.find(k => k.id === keyId);
  if (!key) return false;

  store.exportKeys.forEach(k => {
    k.isDefault = k.id === keyId;
  });
  saveKeyStore(store);
  return true;
}

export function deleteExportKey(keyId: string): boolean {
  const store = getKeyStore();
  const index = store.exportKeys.findIndex(k => k.id === keyId);
  if (index === -1) return false;

  store.exportKeys.splice(index, 1);
  saveKeyStore(store);
  localStorage.removeItem(`metapet-export-key-${keyId}`);

  // Set new default if needed
  if (store.exportKeys.length > 0 && !store.exportKeys.some(k => k.isDefault)) {
    store.exportKeys[0].isDefault = true;
    saveKeyStore(store);
  }

  return true;
}

// ============================================================================
// Export raw key for backup
// ============================================================================

export function exportRawKey(keyId: string): string | null {
  return localStorage.getItem(`metapet-export-key-${keyId}`);
}

// ============================================================================
// Convenience exports
// ============================================================================

export type {
  DeviceKey,
  UnlockKey,
  PairingKey,
  ExportKey,
  KeyStore,
  KeyGenerationResult,
  KeyVerificationResult,
  UnlockTarget,
  EncryptedPayload,
} from './types';

export { BUILTIN_UNLOCK_CODES } from './types';

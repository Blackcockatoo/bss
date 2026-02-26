import type { CryptoMode, EncryptionMode } from '../types';
import {
  PHI,
  R,
  K,
  B,
  PRIMES,
  LUCAS,
  moss60Hash,
  extendedHash,
  generateKeyPair,
  computeSharedSecret,
  deriveKeys,
  evolveKey,
  devolveKey,
  encrypt as experimentalEncrypt,
  decrypt as experimentalDecrypt,
  generateNonce,
  generateMessageId,
  hashData,
  verifyHash,
} from './experimentalCore';
import {
  isSecureCryptoAvailable,
  createSecureHandshakeIdentity,
  parseSecureHandshakeEnvelope,
  deriveSecureSharedKey,
  secureEncrypt,
  secureDecrypt,
  generateSigningKeyPair,
  signPayload,
  verifySignature,
} from './secureCore';

export {
  PHI,
  R,
  K,
  B,
  PRIMES,
  LUCAS,
  moss60Hash,
  extendedHash,
  generateKeyPair,
  computeSharedSecret,
  deriveKeys,
  evolveKey,
  devolveKey,
  generateNonce,
  generateMessageId,
  hashData,
  verifyHash,
  experimentalEncrypt,
  experimentalDecrypt,
  isSecureCryptoAvailable,
  createSecureHandshakeIdentity,
  parseSecureHandshakeEnvelope,
  deriveSecureSharedKey,
  secureEncrypt,
  secureDecrypt,
  generateSigningKeyPair,
  signPayload,
  verifySignature,
};

export function encrypt(
  plaintext: string,
  encryptionKey: number[],
  messageCount = 0,
  mode: EncryptionMode = 'standard'
): string {
  return experimentalEncrypt(plaintext, encryptionKey, messageCount, mode);
}

export function decrypt(
  ciphertext: string,
  decryptionKey: number[],
  messageCount = 0,
  mode: EncryptionMode = 'standard'
): string {
  return experimentalDecrypt(ciphertext, decryptionKey, messageCount, mode);
}

export async function encryptMessage(params: {
  plaintext: string;
  cryptoMode: CryptoMode;
  encryptionMode: EncryptionMode;
  encryptionKey?: number[];
  messageCount?: number;
  secureSharedKey?: string;
}): Promise<string> {
  if (params.cryptoMode === 'secure') {
    if (!params.secureSharedKey) {
      throw new Error('Secure shared key is required in secure mode.');
    }
    return secureEncrypt(params.plaintext, params.secureSharedKey);
  }

  if (!params.encryptionKey) {
    throw new Error('Experimental encryption key is missing.');
  }

  return experimentalEncrypt(
    params.plaintext,
    params.encryptionKey,
    params.messageCount ?? 0,
    params.encryptionMode
  );
}

export async function decryptMessage(params: {
  ciphertext: string;
  cryptoMode: CryptoMode;
  encryptionMode: EncryptionMode;
  decryptionKey?: number[];
  messageCount?: number;
  secureSharedKey?: string;
}): Promise<string> {
  if (params.cryptoMode === 'secure') {
    if (!params.secureSharedKey) {
      throw new Error('Secure shared key is required in secure mode.');
    }
    return secureDecrypt(params.ciphertext, params.secureSharedKey);
  }

  if (!params.decryptionKey) {
    throw new Error('Experimental decryption key is missing.');
  }

  return experimentalDecrypt(
    params.ciphertext,
    params.decryptionKey,
    params.messageCount ?? 0,
    params.encryptionMode
  );
}

/**
 * MOSS60 QR Messaging Library
 * Clean exports for QR code generation, scanning, and encrypted messaging
 */

// Types
export type {
  EncodingFormat,
  ErrorCorrectionLevel,
  EncryptionMode,
  CryptoMode,
  KeyPair,
  HandshakeState,
  EncryptedMessage,
  Message,
  QRMessage,
  Conversation,
  QRScanResult,
  QRMessagingState,
  QRMessagingActions,
  QRMessagingStore,
  Moss60Capability,
  Moss60ProtocolEnvelope,
} from './types';

// Protocol constants
export { MOSS60_PREFIX, MOSS60_PROTOCOL_ID, MOSS60_PROTOCOL_VERSION } from './types';

// Encoding utilities
export {
  BASE60_ALPHABET,
  toBase60,
  fromBase60,
  fromBase60ToString,
  encodeMoss60,
  decodeMoss60,
  isValidBase60,
  isMoss60Format,
  hexToBase60,
  base60ToHex,
} from './encoding';

// Cryptographic primitives
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
  encrypt,
  decrypt,
  generateNonce,
  generateMessageId,
  hashData,
  verifyHash,
} from './crypto';

// Zustand store
export {
  useQRMessagingStore,
  getActiveConversation,
  isConnected,
} from './store';


// Protocol envelope helpers
export {
  REQUIRED_PROTOCOL_CAPABILITIES,
  createProtocolEnvelope,
  serializeProtocolEnvelope,
  parseProtocolEnvelope,
  validateProtocolEnvelope,
  decodeProtocolPayload,
} from './protocol';

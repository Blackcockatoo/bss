/**
 * MOSS60 QR Messaging Types
 * TypeScript interfaces for the QR code encrypted messaging system
 */

/** Base-60 encoding formats */
export type EncodingFormat = 'base60' | 'hex' | 'text' | 'json';

/** Canonical protocol identifier used in payload envelopes */
export const MOSS60_PROTOCOL_ID = 'moss60' as const;

/** Prefix for Base-60 payload strings */
export const MOSS60_PREFIX = 'MOSS60:' as const;

/** Protocol version for payload envelope negotiation */
export const MOSS60_PROTOCOL_VERSION = '1.0' as const;

/** Capability flags advertised in payload envelopes */
export type Moss60Capability =
  | 'envelope-v1'
  | 'qr-scan-v1'
  | 'qr-generate-v1'
  | 'encoding-base60'
  | 'encoding-hex'
  | 'encoding-json'
  | 'encoding-text';

/** Versioned protocol envelope used in QR payloads */
export interface Moss60ProtocolEnvelope {
  protocol: typeof MOSS60_PROTOCOL_ID;
  version: typeof MOSS60_PROTOCOL_VERSION;
  capabilities: Moss60Capability[];
  format: EncodingFormat;
  payload: string;
  hash: string;
  createdAt: number;
}

/** QR error correction levels */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** Experimental encryption variants */
export type EncryptionMode = 'standard' | 'temporal' | 'ratchet';

/** Cryptography core mode */
export type CryptoMode = 'secure' | 'experimental';

/** Key pair for cryptographic operations */
export interface KeyPair {
  private: number[];
  public: string;
}

/** Handshake state for a messaging session */
export interface HandshakeState {
  identity: string;
  privateSpiral: number[];
  publicHash: string;
  sharedSecret: number[] | null;
  encryptionKey: number[] | null;
  decryptionKey: number[] | null;
  securePrivateKey?: string | null;
  secureSharedKey?: string | null;
  messageCount: number;
  connected: boolean;
  createdAt: number;
}

/** Encrypted message */
export interface EncryptedMessage {
  id: string;
  ciphertext: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  nonce?: string;
}

/** Decrypted message for display */
export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  direction: 'sent' | 'received';
  encrypted: boolean;
}

/** QR code data with metadata */
export interface QRMessage {
  data: string;
  format: EncodingFormat;
  errorCorrection: ErrorCorrectionLevel;
  createdAt: number;
  hash?: string;
}

/** Conversation between two parties */
export interface Conversation {
  id: string;
  localIdentity: string;
  remoteIdentity: string;
  handshakeState: HandshakeState | null;
  messages: Message[];
  createdAt: number;
  lastMessageAt: number | null;
}

/** QR scan result */
export interface QRScanResult {
  raw: string;
  decoded: string;
  format: EncodingFormat;
  timestamp: number;
  success: boolean;
  error?: string;
}

/** Store state for QR messaging */
export interface QRMessagingState {
  // Local identity for messaging
  localIdentity: string;
  localKeyPair: KeyPair | null;

  // Active conversations
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;

  // QR history
  generatedQRs: QRMessage[];
  scannedQRs: QRScanResult[];

  // Settings
  defaultFormat: EncodingFormat;
  defaultErrorCorrection: ErrorCorrectionLevel;
  cryptoMode: CryptoMode;
  encryptionMode: EncryptionMode;
}

/** Store actions */
export interface QRMessagingActions {
  // Identity management
  setLocalIdentity: (identity: string) => void;
  generateKeyPair: () => Promise<void>;

  // Conversation management
  createConversation: (remoteIdentity: string) => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  // Handshake
  initiateHandshake: (conversationId: string) => Promise<string>;
  completeHandshake: (conversationId: string, remotePublicHash: string) => Promise<void>;

  // Messaging
  sendMessage: (conversationId: string, plaintext: string) => Promise<Message | null>;
  receiveMessage: (conversationId: string, ciphertext: string) => Promise<Message | null>;

  // QR operations
  addGeneratedQR: (qr: QRMessage) => void;
  addScannedQR: (result: QRScanResult) => void;
  clearQRHistory: () => void;

  // Settings
  setDefaultFormat: (format: EncodingFormat) => void;
  setDefaultErrorCorrection: (level: ErrorCorrectionLevel) => void;
  setCryptoMode: (mode: CryptoMode) => void;
  setEncryptionMode: (mode: EncryptionMode) => void;

  // Utilities
  reset: () => void;
}

/** Combined store type */
export type QRMessagingStore = QRMessagingState & QRMessagingActions;

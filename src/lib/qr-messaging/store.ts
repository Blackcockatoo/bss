/**
 * MOSS60 QR Messaging Store
 * Zustand state management with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  QRMessagingStore,
  QRMessagingState,
  EncodingFormat,
  ErrorCorrectionLevel,
  EncryptionMode,
  CryptoMode,
  Conversation,
  Message,
  HandshakeState,
  QRMessage,
  QRScanResult,
} from './types';
import {
  generateKeyPair as generateKeyPairCrypto,
  computeSharedSecret,
  deriveKeys,
  encryptMessage,
  decryptMessage,
  generateMessageId,
  generateNonce,
  isSecureCryptoAvailable,
  createSecureHandshakeIdentity,
  parseSecureHandshakeEnvelope,
  deriveSecureSharedKey,
} from './crypto';
import { getPreferredIdentity, loadIdentityProfile } from '@/lib/identity/profile';

const identityProfile = loadIdentityProfile();
const initialLocalIdentity = getPreferredIdentity(identityProfile);
const defaultCryptoMode: CryptoMode = isSecureCryptoAvailable() ? 'secure' : 'experimental';

const initialState: QRMessagingState = {
  localIdentity: initialLocalIdentity,
  localKeyPair: null,
  conversations: {},
  activeConversationId: null,
  generatedQRs: [],
  scannedQRs: [],
  defaultFormat: 'base60',
  defaultErrorCorrection: 'M',
  cryptoMode: defaultCryptoMode,
  encryptionMode: 'standard',
};

function createConversation(localIdentity: string, remoteIdentity: string): Conversation {
  return {
    id: `conv-${Date.now().toString(36)}-${generateNonce().substring(0, 8)}`,
    localIdentity,
    remoteIdentity,
    handshakeState: null,
    messages: [],
    createdAt: Date.now(),
    lastMessageAt: null,
  };
}

async function createHandshakeState(identity: string, cryptoMode: CryptoMode): Promise<HandshakeState> {
  if (cryptoMode === 'secure') {
    const secureIdentity = await createSecureHandshakeIdentity();
    return {
      identity,
      privateSpiral: [],
      publicHash: secureIdentity.publicEnvelope,
      sharedSecret: null,
      encryptionKey: null,
      decryptionKey: null,
      securePrivateKey: secureIdentity.privateKey,
      secureSharedKey: null,
      messageCount: 0,
      connected: false,
      createdAt: Date.now(),
    };
  }

  const seed = `${identity}-${Date.now()}-${Math.random()}`;
  const keyPair = generateKeyPairCrypto(seed);

  return {
    identity,
    privateSpiral: keyPair.private,
    publicHash: keyPair.public,
    sharedSecret: null,
    encryptionKey: null,
    decryptionKey: null,
    securePrivateKey: null,
    secureSharedKey: null,
    messageCount: 0,
    connected: false,
    createdAt: Date.now(),
  };
}

export const useQRMessagingStore = create<QRMessagingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLocalIdentity: (identity: string) => {
        set({ localIdentity: identity });
      },

      generateKeyPair: async () => {
        const { localIdentity } = get();
        if (!localIdentity) {
          console.warn('Cannot generate key pair without local identity');
          return;
        }

        const seed = `${localIdentity}-${Date.now()}-${Math.random()}`;
        const keyPair = generateKeyPairCrypto(seed);
        set({ localKeyPair: keyPair });
      },

      createConversation: (remoteIdentity: string) => {
        const { localIdentity, conversations } = get();
        if (!localIdentity) {
          console.warn('Cannot create conversation without local identity');
          return '';
        }

        const existing = Object.values(conversations).find(c => c.remoteIdentity === remoteIdentity);
        if (existing) {
          set({ activeConversationId: existing.id });
          return existing.id;
        }

        const conversation = createConversation(localIdentity, remoteIdentity);
        set({
          conversations: { ...conversations, [conversation.id]: conversation },
          activeConversationId: conversation.id,
        });

        return conversation.id;
      },

      selectConversation: (id: string) => {
        const { conversations } = get();
        if (conversations[id]) {
          set({ activeConversationId: id });
        }
      },

      deleteConversation: (id: string) => {
        const { conversations, activeConversationId } = get();
        const { [id]: _deleted, ...rest } = conversations;

        set({
          conversations: rest,
          activeConversationId: activeConversationId === id ? null : activeConversationId,
        });
      },

      initiateHandshake: async (conversationId: string) => {
        const { conversations, localIdentity, cryptoMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation) {
          console.error('Conversation not found:', conversationId);
          return '';
        }

        const handshakeState = await createHandshakeState(localIdentity, cryptoMode);

        set({
          conversations: {
            ...conversations,
            [conversationId]: { ...conversation, handshakeState },
          },
        });

        return handshakeState.publicHash;
      },

      completeHandshake: async (conversationId: string, remotePublicHash: string) => {
        const { conversations, cryptoMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState) {
          console.error('No handshake in progress');
          return;
        }

        const { handshakeState } = conversation;

        if (cryptoMode === 'secure') {
          if (!handshakeState.securePrivateKey) {
            console.error('Missing secure private key');
            return;
          }

          try {
            const remotePayload = parseSecureHandshakeEnvelope(remotePublicHash);
            const secureSharedKey = await deriveSecureSharedKey(
              handshakeState.securePrivateKey,
              remotePayload.pub
            );

            set({
              conversations: {
                ...conversations,
                [conversationId]: {
                  ...conversation,
                  handshakeState: {
                    ...handshakeState,
                    secureSharedKey,
                    connected: true,
                  },
                },
              },
            });
          } catch (error) {
            console.error('Secure handshake failed:', error);
          }

          return;
        }

        const sharedSecret = computeSharedSecret(handshakeState.privateSpiral, remotePublicHash);
        const { encryptionKey, decryptionKey } = deriveKeys(sharedSecret);

        set({
          conversations: {
            ...conversations,
            [conversationId]: {
              ...conversation,
              handshakeState: {
                ...handshakeState,
                sharedSecret,
                encryptionKey,
                decryptionKey,
                connected: true,
              },
            },
          },
        });
      },

      sendMessage: async (conversationId: string, plaintext: string) => {
        const { conversations, encryptionMode, cryptoMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState?.connected) {
          console.error('Not connected');
          return null;
        }

        const { handshakeState } = conversation;

        try {
          const ciphertext = await encryptMessage({
            plaintext,
            cryptoMode,
            encryptionMode,
            encryptionKey: handshakeState.encryptionKey ?? undefined,
            messageCount: handshakeState.messageCount,
            secureSharedKey: handshakeState.secureSharedKey ?? undefined,
          });

          const message: Message = {
            id: generateMessageId(),
            content: plaintext,
            senderId: handshakeState.identity,
            recipientId: conversation.remoteIdentity,
            timestamp: Date.now(),
            direction: 'sent',
            encrypted: true,
          };

          void ciphertext;

          set({
            conversations: {
              ...conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, message],
                handshakeState: {
                  ...handshakeState,
                  messageCount: handshakeState.messageCount + 1,
                },
                lastMessageAt: Date.now(),
              },
            },
          });

          return message;
        } catch (error) {
          console.error('Failed to encrypt message:', error);
          return null;
        }
      },

      receiveMessage: async (conversationId: string, ciphertext: string) => {
        const { conversations, encryptionMode, cryptoMode } = get();
        const conversation = conversations[conversationId];

        if (!conversation?.handshakeState?.connected) {
          console.error('Not connected');
          return null;
        }

        const { handshakeState } = conversation;

        try {
          const plaintext = await decryptMessage({
            ciphertext,
            cryptoMode,
            encryptionMode,
            decryptionKey: handshakeState.decryptionKey ?? undefined,
            messageCount: handshakeState.messageCount,
            secureSharedKey: handshakeState.secureSharedKey ?? undefined,
          });

          const message: Message = {
            id: generateMessageId(),
            content: plaintext,
            senderId: conversation.remoteIdentity,
            recipientId: handshakeState.identity,
            timestamp: Date.now(),
            direction: 'received',
            encrypted: true,
          };

          set({
            conversations: {
              ...conversations,
              [conversationId]: {
                ...conversation,
                messages: [...conversation.messages, message],
                handshakeState: {
                  ...handshakeState,
                  messageCount: handshakeState.messageCount + 1,
                },
                lastMessageAt: Date.now(),
              },
            },
          });

          return message;
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return null;
        }
      },

      addGeneratedQR: (qr: QRMessage) => {
        set(state => ({ generatedQRs: [qr, ...state.generatedQRs].slice(0, 50) }));
      },

      addScannedQR: (result: QRScanResult) => {
        set(state => ({ scannedQRs: [result, ...state.scannedQRs].slice(0, 50) }));
      },

      clearQRHistory: () => {
        set({ generatedQRs: [], scannedQRs: [] });
      },

      setDefaultFormat: (format: EncodingFormat) => {
        set({ defaultFormat: format });
      },

      setDefaultErrorCorrection: (level: ErrorCorrectionLevel) => {
        set({ defaultErrorCorrection: level });
      },

      setCryptoMode: (mode: CryptoMode) => {
        if (mode === 'secure' && !isSecureCryptoAvailable()) {
          console.warn('Secure mode unavailable, forcing experimental mode');
          set({ cryptoMode: 'experimental' });
          return;
        }
        set({ cryptoMode: mode });
      },

      setEncryptionMode: (mode: EncryptionMode) => {
        const { cryptoMode } = get();
        if (cryptoMode === 'secure' && mode !== 'standard') {
          console.warn('Temporal/ratchet experimental modes are disabled in secure mode');
          set({ encryptionMode: 'standard' });
          return;
        }
        set({ encryptionMode: mode });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'moss60-qr-messaging',
      version: 2,
      partialize: state => ({
        localIdentity: state.localIdentity,
        localKeyPair: state.localKeyPair,
        conversations: state.conversations,
        generatedQRs: state.generatedQRs.slice(0, 20),
        scannedQRs: state.scannedQRs.slice(0, 20),
        defaultFormat: state.defaultFormat,
        defaultErrorCorrection: state.defaultErrorCorrection,
        cryptoMode: state.cryptoMode,
        encryptionMode: state.encryptionMode,
      }),
    }
  )
);

export function getActiveConversation(): Conversation | null {
  const state = useQRMessagingStore.getState();
  if (!state.activeConversationId) return null;
  return state.conversations[state.activeConversationId] ?? null;
}

export function isConnected(conversationId: string): boolean {
  const state = useQRMessagingStore.getState();
  const conversation = state.conversations[conversationId];
  return conversation?.handshakeState?.connected ?? false;
}

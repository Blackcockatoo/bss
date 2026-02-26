'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Key,
  Link,
  Send,
  MessageSquare,
  Shield,
  ShieldCheck,
  Trash2,
  Copy,
  Check,
  User,
  Users,
} from 'lucide-react';
import {
  useQRMessagingStore,
  type Message,
  type EncryptionMode,
  type CryptoMode,
} from '@/lib/qr-messaging';

interface MessagingPanelProps {
  compact?: boolean;
}

export function MessagingPanel({ compact = false }: MessagingPanelProps) {
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState('');
  const [remoteIdentity, setRemoteIdentity] = useState('');
  const [remotePublicHash, setRemotePublicHash] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    localIdentity,
    localKeyPair,
    conversations,
    activeConversationId,
    encryptionMode,
    cryptoMode,
    setLocalIdentity,
    generateKeyPair,
    createConversation,
    selectConversation,
    deleteConversation,
    initiateHandshake,
    completeHandshake,
    sendMessage,
    setCryptoMode,
    setEncryptionMode,
  } = useQRMessagingStore();

  const activeConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;
  const isConnected = activeConversation?.handshakeState?.connected ?? false;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleGenerateKeys = useCallback(async () => {
    if (!localIdentity.trim()) {
      setError('Enter your identity first');
      return;
    }
    setError(null);
    await generateKeyPair();
  }, [localIdentity, generateKeyPair]);

  const handleCreateConversation = useCallback(() => {
    if (!remoteIdentity.trim()) {
      setError('Enter remote identity');
      return;
    }
    setError(null);
    createConversation(remoteIdentity.trim());
    setRemoteIdentity('');
  }, [remoteIdentity, createConversation]);

  const handleInitiateHandshake = useCallback(async () => {
    if (!activeConversationId) return;
    setError(null);
    const publicHash = await initiateHandshake(activeConversationId);
    if (publicHash) {
      // Copy to clipboard for sharing
      try {
        await navigator.clipboard.writeText(publicHash);
        setCopied('public');
        setTimeout(() => setCopied(null), 2000);
      } catch {
        // Ignore clipboard errors
      }
    }
  }, [activeConversationId, initiateHandshake]);

  const handleCompleteHandshake = useCallback(async () => {
    if (!activeConversationId || !remotePublicHash.trim()) {
      setError('Enter remote public hash');
      return;
    }
    setError(null);
    await completeHandshake(activeConversationId, remotePublicHash.trim());
    setRemotePublicHash('');
  }, [activeConversationId, remotePublicHash, completeHandshake]);

  const handleSendMessage = useCallback(async () => {
    if (!activeConversationId || !newMessage.trim()) return;

    const result = await sendMessage(activeConversationId, newMessage.trim());
    if (result) {
      setNewMessage('');
      setError(null);
    } else {
      setError('Failed to send message');
    }
  }, [activeConversationId, newMessage, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Failed to copy');
    }
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Quick Status */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-zinc-500'
            }`}
          />
          <span className="text-zinc-400">
            {isConnected
              ? `Connected to ${activeConversation?.remoteIdentity}`
              : 'Not connected'}
          </span>
        </div>

        {/* Quick Message */}
        {isConnected && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type message..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Last message preview */}
        {activeConversation?.messages.length ? (
          <div className="text-xs text-zinc-400 truncate">
            Last: {activeConversation.messages[activeConversation.messages.length - 1].content}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identity Setup */}
      <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-cyan-400" />
          Your Identity
        </h3>

        <div className="space-y-3">
          <input
            type="text"
            value={localIdentity}
            onChange={e => setLocalIdentity(e.target.value)}
            placeholder="Enter your identity (e.g., alice@moss60.io)"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <Button
            onClick={handleGenerateKeys}
            disabled={!localIdentity.trim()}
            className="w-full gap-2"
          >
            <Key className="w-4 h-4" />
            Generate Key Pair
          </Button>

          {localKeyPair && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Public Key:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(localKeyPair.public, 'public')}
                >
                  {copied === 'public' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-cyan-400 font-mono break-all">
                {localKeyPair.public.substring(0, 32)}...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Conversations
        </h3>

        {/* Create new conversation */}
        <div className="flex gap-2">
          <input
            type="text"
            value={remoteIdentity}
            onChange={e => setRemoteIdentity(e.target.value)}
            placeholder="Remote identity..."
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <Button
            onClick={handleCreateConversation}
            disabled={!remoteIdentity.trim() || !localKeyPair}
            size="sm"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>

        {/* Conversation list */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Object.values(conversations).length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-2">
              No conversations yet
            </p>
          ) : (
            Object.values(conversations).map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                onKeyDown={e => e.key === 'Enter' && selectConversation(conv.id)}
                role="button"
                tabIndex={0}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  conv.id === activeConversationId
                    ? 'bg-cyan-500/20 border border-cyan-500/50'
                    : 'bg-slate-900/50 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      conv.handshakeState?.connected ? 'bg-green-400' : 'bg-zinc-500'
                    }`}
                  />
                  <span className="text-sm text-zinc-200">{conv.remoteIdentity}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="w-3 h-3 text-zinc-500 hover:text-rose-400" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Conversation */}
      {activeConversation && (
        <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {isConnected ? (
                <ShieldCheck className="w-4 h-4 text-green-400" />
              ) : (
                <Shield className="w-4 h-4 text-amber-400" />
              )}
              {activeConversation.remoteIdentity}
            </h3>
            <span className="text-xs text-zinc-500">
              {activeConversation.messages.length} messages
            </span>
          </div>

          {/* Handshake Section */}
          {!isConnected && (
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-200">
                Establish an encrypted channel with key exchange
              </p>

              {!activeConversation.handshakeState && (
                <Button onClick={handleInitiateHandshake} className="w-full gap-2">
                  <Link className="w-4 h-4" />
                  Start Handshake
                </Button>
              )}

              {activeConversation.handshakeState && (
                <>
                  <div className="rounded-lg bg-slate-950/60 p-2">
                    <p className="text-xs text-zinc-500 mb-1">
                      Share your public hash:
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="text-xs text-cyan-400 font-mono break-all flex-1">
                        {activeConversation.handshakeState.publicHash.substring(0, 48)}...
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            activeConversation.handshakeState!.publicHash,
                            'handshake'
                          )
                        }
                      >
                        {copied === 'handshake' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={remotePublicHash}
                      onChange={e => setRemotePublicHash(e.target.value)}
                      placeholder="Paste remote public hash..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <Button
                      onClick={handleCompleteHandshake}
                      disabled={!remotePublicHash.trim()}
                      className="w-full gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Complete Handshake
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Cryptography Mode */}
          {isConnected && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Crypto:</span>
              <select
                value={cryptoMode}
                onChange={e => setCryptoMode(e.target.value as CryptoMode)}
                className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
              >
                <option value="secure">Secure (Web Crypto)</option>
                <option value="experimental">Experimental (MOSS60)</option>
              </select>
            </div>
          )}

          {/* Encryption Mode */}
          {isConnected && cryptoMode === 'experimental' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Experimental mode:</span>
              <select
                value={encryptionMode}
                onChange={e => setEncryptionMode(e.target.value as EncryptionMode)}
                className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-zinc-100 focus:outline-none"
              >
                <option value="standard">Standard</option>
                <option value="temporal">Temporal (Lucas)</option>
                <option value="ratchet">Double Ratchet</option>
              </select>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-2 max-h-64 overflow-y-auto rounded-lg bg-slate-950/60 p-3">
            {activeConversation.messages.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">
                {isConnected
                  ? 'No messages yet. Start the conversation!'
                  : 'Complete handshake to start messaging'}
              </p>
            ) : (
              activeConversation.messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.direction === 'sent' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.direction === 'sent'
                        ? 'bg-cyan-600/30 border border-cyan-500/30'
                        : 'bg-purple-600/30 border border-purple-500/30'
                    }`}
                  >
                    <p className="text-sm text-zinc-100">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {formatTime(msg.timestamp)}
                    {msg.encrypted && ' • Encrypted'}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {isConnected && (
            <div className="flex gap-2">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="self-end"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          <strong className="text-purple-400">Encrypted Messaging</strong> uses
          MOSS60 key exchange and XOR stream cipher for end-to-end encryption.
          Messages are encrypted before sending and decrypted on receipt.
        </p>
      </div>
    </div>
  );
}

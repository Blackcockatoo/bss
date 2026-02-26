/**
 * CryptoKeyDisplay - Shows user's crypto keys for the addon system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { generateAddonKeypair } from '@/lib/addons';

interface CryptoKeyDisplayProps {
  compact?: boolean;
  showPrivate?: boolean;
}

export const CryptoKeyDisplay: React.FC<CryptoKeyDisplayProps> = ({
  compact = false,
  showPrivate = false,
}) => {
  const [userKeys, setUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [issuerKeys, setIssuerKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [privateConfirmed, setPrivateConfirmed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Load or generate keys on mount
  useEffect(() => {
    const initKeys = async () => {
      const storedUserKeys = localStorage.getItem('auralia_addon_user_keys');
      const storedIssuerKeys = localStorage.getItem('auralia_addon_issuer_keys');

      if (storedUserKeys && storedIssuerKeys) {
        setUserKeys(JSON.parse(storedUserKeys));
        setIssuerKeys(JSON.parse(storedIssuerKeys));
      } else {
        await regenerateKeys();
      }
    };

    initKeys();
  }, []);

  const regenerateKeys = async () => {
    setRegenerating(true);
    try {
      const newUserKeys = await generateAddonKeypair();
      const newIssuerKeys = await generateAddonKeypair();

      localStorage.setItem('auralia_addon_user_keys', JSON.stringify(newUserKeys));
      localStorage.setItem('auralia_addon_issuer_keys', JSON.stringify(newIssuerKeys));

      setUserKeys(newUserKeys);
      setIssuerKeys(newIssuerKeys);
    } catch (error) {
      console.error('Failed to generate keys:', error);
    }
    setRegenerating(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const truncateKey = (key: string, length: number = 20) => {
    if (key.length <= length) return key;
    return `${key.substring(0, length)}...${key.substring(key.length - 8)}`;
  };

  if (!userKeys) {
    return (
      <div className="text-slate-400 text-sm p-4">
        Loading keys...
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span className="text-slate-300 font-medium">Your Key:</span>{' '}
            <code className="bg-slate-900/50 px-1 rounded">
              {truncateKey(userKeys.publicKey, 16)}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(userKeys.publicKey, 'public')}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {copied === 'public' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🔐</span> Your Crypto Keys
        </h3>
        <button
          onClick={() => {
            setShowKeys((prev) => {
              const next = !prev;
              if (!next) {
                setPrivateConfirmed(false);
              }
              return next;
            });
          }}
          className="text-sm text-slate-400 hover:text-white"
        >
          {showKeys ? 'Hide Keys' : 'Show Keys'}
        </button>
      </div>

      {showKeys && (
        <div className="space-y-4">
          {showPrivate && !privateConfirmed && (
            <div className="bg-red-950/50 border border-red-800/60 rounded-lg p-3">
              <p className="text-sm text-red-200 font-semibold mb-2">Private key hidden</p>
              <p className="text-xs text-red-200/80">
                Revealing your private key can expose control of your addons. Make sure you are in
                a private space before continuing.
              </p>
              <button
                onClick={() => setPrivateConfirmed(true)}
                className="mt-3 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded"
              >
                Reveal Private Key
              </button>
            </div>
          )}

          {/* Public Key */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-400">Public Key (Share this)</span>
              <button
                onClick={() => copyToClipboard(userKeys.publicKey, 'public')}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded"
              >
                {copied === 'public' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="text-xs text-slate-300 break-all block bg-slate-900/50 p-2 rounded">
              {userKeys.publicKey}
            </code>
          </div>

          {/* Private Key */}
          {showPrivate && privateConfirmed && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-red-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-400">Private Key (Keep Secret!)</span>
                <button
                  onClick={() => copyToClipboard(userKeys.privateKey, 'private')}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
                >
                  {copied === 'private' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-xs text-slate-300 break-all block bg-slate-900/50 p-2 rounded">
                {userKeys.privateKey}
              </code>
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Never share your private key! Anyone with this key can control your addons.
              </p>
            </div>
          )}

          {/* Issuer Key */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-400">Issuer Public Key</span>
              <button
                onClick={() => copyToClipboard(issuerKeys?.publicKey || '', 'issuer')}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
              >
                {copied === 'issuer' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="text-xs text-slate-300 break-all block bg-slate-900/50 p-2 rounded">
              {issuerKeys?.publicKey || 'Not available'}
            </code>
          </div>

          {/* Info Section */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">How Keys Work</h4>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>Keys use ECDSA P-256 cryptography</li>
              <li>Your public key identifies your addon ownership</li>
              <li>Your private key signs addon transfers</li>
              <li>Keys are stored locally in your browser</li>
              <li>Backup your keys if you want to transfer to another device</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={regenerateKeys}
              disabled={regenerating}
              className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg transition-colors"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Keys'}
            </button>
            <button
              onClick={() => {
                const exportData = JSON.stringify({
                  userKeys,
                  issuerKeys,
                  exportedAt: new Date().toISOString(),
                }, null, 2);
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'auralia-keys-backup.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-4 rounded-lg transition-colors"
            >
              Export Backup
            </button>
          </div>

          {/* Warning */}
          <p className="text-xs text-yellow-400 text-center">
            ⚠️ Regenerating keys will invalidate all your current addons!
          </p>
        </div>
      )}

      {!showKeys && (
        <div className="text-sm text-slate-400">
          <p className="mb-2">Your unique identifier:</p>
          <code className="bg-slate-800 px-2 py-1 rounded text-xs break-all">
            {truncateKey(userKeys.publicKey, 32)}
          </code>
          <p className="text-xs mt-2 text-slate-500">
            Click "Show Keys" to view full keys and export options
          </p>
        </div>
      )}
    </div>
  );
};

export default CryptoKeyDisplay;

/**
 * Addon System Demo Page
 *
 * Showcases the crypto-secured addon system with wizard hat and staff,
 * coat of arms, crypto keys, and draggable addon positioning
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';
import { AddonRenderer, AddonSVGDefs } from '@/components/addons/AddonRenderer';
import { PetProfilePanel } from '@/components/addons/PetProfilePanel';
import { CryptoKeyDisplay } from '@/components/addons/CryptoKeyDisplay';
import {
  generateAddonKeypair,
  mintAddon,
  useAddonStore,
  initializeAddonStore,
  WIZARD_HAT,
  WIZARD_STAFF,
  CELESTIAL_CROWN,
  SHADOW_CLOAK,
  PRISMATIC_AURA,
  FLOATING_FAMILIAR,
  verifyAddon,
} from '@/lib/addons';

export default function AddonsDemoPage() {
  const [userKeys, setUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(
    null
  );
  const [issuerKeys, setIssuerKeys] = useState<{ publicKey: string; privateKey: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [addonEditMode, setAddonEditMode] = useState(false);

  const { addAddon, getEquippedAddons, getAddonPosition, setAddonPosition, lockAddonPosition, resetAddonPosition, positionOverrides } = useAddonStore();

  // Initialize keys
  useEffect(() => {
    const initKeys = async () => {
      // Check if keys exist in localStorage
      const storedUserKeys = localStorage.getItem('auralia_addon_user_keys');
      const storedIssuerKeys = localStorage.getItem('auralia_addon_issuer_keys');

      if (storedUserKeys && storedIssuerKeys) {
        const userKeysData = JSON.parse(storedUserKeys);
        const issuerKeysData = JSON.parse(storedIssuerKeys);
        setUserKeys(userKeysData);
        setIssuerKeys(issuerKeysData);
        initializeAddonStore(userKeysData.publicKey);
      } else {
        // Generate new keys
        const newUserKeys = await generateAddonKeypair();
        const newIssuerKeys = await generateAddonKeypair();

        setUserKeys(newUserKeys);
        setIssuerKeys(newIssuerKeys);

        // Store keys
        localStorage.setItem('auralia_addon_user_keys', JSON.stringify(newUserKeys));
        localStorage.setItem('auralia_addon_issuer_keys', JSON.stringify(newIssuerKeys));

        initializeAddonStore(newUserKeys.publicKey);
      }
    };

    initKeys();
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setAnimationPhase((prev) => prev + delta);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleMintAddon = async (addonTemplate: typeof WIZARD_HAT) => {
    if (!userKeys || !issuerKeys) {
      alert('Keys not initialized');
      return;
    }

    setLoading(true);

    try {
      // Mint the addon
      const addon = await mintAddon(
        {
          addonTypeId: addonTemplate.id,
          recipientPublicKey: userKeys.publicKey,
          edition: Date.now() % 1000, // Random edition number
        },
        issuerKeys.privateKey,
        issuerKeys.publicKey,
        userKeys.privateKey
      );

      // Verify the addon
      const verification = await verifyAddon(addon);
      console.log('Addon verification:', verification);

      if (!verification.valid) {
        alert('Addon verification failed: ' + verification.errors.join(', '));
        return;
      }

      // Add to inventory
      const success = await addAddon(addon);

      if (success) {
        alert(`Successfully minted ${addon.name}!`);
      } else {
        alert('Failed to add addon to inventory');
      }
    } catch (error) {
      console.error('Failed to mint addon:', error);
      alert('Failed to mint addon: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const equippedAddons = getEquippedAddons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Auralia Addon System</h1>
          <p className="text-slate-300">Crypto-Secured Cosmetic Items with Heraldic Lineage</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Panel */}
          <div className="space-y-6">
            <PetProfilePanel
              petId="demo-auralia"
              petName="Demo Auralia"
              editMode={addonEditMode}
              onEditModeChange={setAddonEditMode}
            />
          </div>

          {/* Center: Preview */}
          <div className="space-y-6">
            {/* Pet Preview with Addons */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Preview</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${addonEditMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                    {addonEditMode ? 'Edit Mode ON' : 'Edit Mode OFF'}
                  </span>
                </div>
              </div>
              <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="auralia-pet-svg w-full h-full">
                  <AddonSVGDefs />

                  {/* Simple Auralia representation */}
                  <g transform="translate(100, 100)">
                    {/* Body */}
                    <ellipse
                      cx="0"
                      cy="8"
                      rx="20"
                      ry="25"
                      fill="url(#bodyGradient)"
                      filter="url(#glow)"
                    />

                    {/* Head */}
                    <ellipse
                      cx="0"
                      cy="-12"
                      rx="15"
                      ry="14"
                      fill="url(#bodyGradient)"
                      filter="url(#glow)"
                    />

                    {/* Eyes */}
                    <ellipse cx="-6" cy="-12" rx="3" ry="3" fill="#4ECDC4" />
                    <ellipse cx="6" cy="-12" rx="3" ry="3" fill="#4ECDC4" />

                    <defs>
                      <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
                      </radialGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                  </g>

                  {/* Render equipped addons */}
                  {equippedAddons.map((addon) => (
                    <AddonRenderer
                      key={addon.id}
                      addon={addon}
                      petSize={40}
                      petPosition={{ x: 100, y: 100 }}
                      animationPhase={animationPhase}
                      positionOverride={positionOverrides?.[addon.id]}
                      draggable={addonEditMode}
                      onPositionChange={(x, y) => setAddonPosition(addon.id, x, y)}
                      onToggleLock={(locked) => lockAddonPosition(addon.id, locked)}
                      onResetPosition={() => resetAddonPosition(addon.id)}
                    />
                  ))}
                </svg>
              </div>

              {/* Edit Mode Instructions */}
              {addonEditMode && (
                <div className="mt-4 bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                  <p className="text-xs text-blue-200">
                    <strong>Edit Mode Active:</strong> Drag addons to reposition. Hover for lock/reset controls.
                  </p>
                </div>
              )}

              {/* Equipped Addons List */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-white mb-2">Equipped:</h3>
                {equippedAddons.length === 0 ? (
                  <p className="text-xs text-slate-400">No addons equipped</p>
                ) : (
                  <div className="space-y-1">
                    {equippedAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1 flex items-center justify-between"
                      >
                        <span>{addon.name} ({addon.category})</span>
                        {positionOverrides?.[addon.id]?.locked && (
                          <span className="text-green-400 text-xs">🔒 Locked</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mint Addons */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Mint Addons</h2>
              <div className="grid grid-cols-2 gap-3">
                <MintButton
                  name="Wizard Hat"
                  rarity="epic"
                  onClick={() => handleMintAddon(WIZARD_HAT)}
                  loading={loading}
                />
                <MintButton
                  name="Wizard Staff"
                  rarity="legendary"
                  onClick={() => handleMintAddon(WIZARD_STAFF)}
                  loading={loading}
                />
                <MintButton
                  name="Celestial Crown"
                  rarity="mythic"
                  onClick={() => handleMintAddon(CELESTIAL_CROWN)}
                  loading={loading}
                />
                <MintButton
                  name="Shadow Cloak"
                  rarity="rare"
                  onClick={() => handleMintAddon(SHADOW_CLOAK)}
                  loading={loading}
                />
                <MintButton
                  name="Prismatic Aura"
                  rarity="epic"
                  onClick={() => handleMintAddon(PRISMATIC_AURA)}
                  loading={loading}
                />
                <MintButton
                  name="Floating Familiar"
                  rarity="legendary"
                  onClick={() => handleMintAddon(FLOATING_FAMILIAR)}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          {/* Right: Inventory */}
          <div>
            <AddonInventoryPanel />
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-blue-200">
          <h3 className="font-bold mb-2">How the System Works:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div>
              <h4 className="font-semibold text-blue-300 mb-1">🔐 Crypto Security</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>ECDSA P-256 signatures</li>
                <li>Dual signatures (owner + issuer)</li>
                <li>Non-copyable ownership proof</li>
                <li>Secure local key storage</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-300 mb-1">🛡️ Coat of Arms</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Unique heraldic identifier</li>
                <li>Encodes pet lineage</li>
                <li>Traditional heraldic symbols</li>
                <li>Breeds combine parent coats</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-300 mb-1">✨ Addon Positioning</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Drag to reposition</li>
                <li>Lock positions in place</li>
                <li>Reset to defaults</li>
                <li>Per-addon customization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MintButtonProps {
  name: string;
  rarity: string;
  onClick: () => void;
  loading: boolean;
}

const MintButton: React.FC<MintButtonProps> = ({ name, rarity, onClick, loading }) => {
  const rarityColors = {
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-orange-600 to-orange-700',
    mythic: 'from-pink-600 to-pink-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`bg-gradient-to-br ${
        rarityColors[rarity as keyof typeof rarityColors]
      } text-white font-medium py-3 px-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="text-sm">{name}</div>
      <div className="text-xs opacity-75 capitalize">{rarity}</div>
    </button>
  );
};

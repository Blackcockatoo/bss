/**
 * PetProfilePanel - Combined panel showing coat of arms, crypto keys, and addon management
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CoatOfArmsRenderer } from '@/components/lineage/CoatOfArmsRenderer';
import { CryptoKeyDisplay } from './CryptoKeyDisplay';
import { generateFounderCoatOfArms, getBlason } from '@/lib/lineage';
import type { CoatOfArms } from '@/lib/lineage';
import { useIdentityProfileStore } from '@/lib/identity/profile';

interface PetProfilePanelProps {
  petId?: string;
  petName?: string;
  onEditModeChange?: (enabled: boolean) => void;
  editMode?: boolean;
}

export const PetProfilePanel: React.FC<PetProfilePanelProps> = ({
  petId = 'auralia-default',
  petName = 'Auralia',
  onEditModeChange,
  editMode = false,
}) => {
  const [coatOfArms, setCoatOfArms] = useState<CoatOfArms | null>(null);
  const [activeTab, setActiveTab] = useState<'coat' | 'keys' | 'addons'>('coat');
  const profile = useIdentityProfileStore(state => state.profile);

  const identityLabel = profile.username.trim() || 'Unnamed Owner';
  const identityEmail = profile.email.trim() || 'Add email on the Identity page';

  // Generate or load coat of arms
  useEffect(() => {
    const storedCoa = localStorage.getItem(`auralia_coat_of_arms_${petId}`);

    if (storedCoa) {
      setCoatOfArms(JSON.parse(storedCoa));
    } else {
      // Generate a new coat based on pet ID as seed
      const seed = hashString(petId);
      const newCoa = generateFounderCoatOfArms(petId, seed);
      localStorage.setItem(`auralia_coat_of_arms_${petId}`, JSON.stringify(newCoa));
      setCoatOfArms(newCoa);
    }
  }, [petId]);

  // Generate blazon description
  const blazon = useMemo(() => {
    if (!coatOfArms) return '';
    return getBlason(coatOfArms);
  }, [coatOfArms]);

  const regenerateCoatOfArms = () => {
    const seed = Date.now();
    const newCoa = generateFounderCoatOfArms(petId, seed);
    localStorage.setItem(`auralia_coat_of_arms_${petId}`, JSON.stringify(newCoa));
    setCoatOfArms(newCoa);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-4 py-3 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          {petName} Profile
        </h2>
        <p className="text-xs text-slate-400 mt-1">Lineage, Identity & Customization</p>
      </div>

      {/* Owner Identity Summary */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/70">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">
          Owner Identity
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
            {profile.avatarDataUrl ? (
              <img
                src={profile.avatarDataUrl}
                alt="Owner avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-400">👤</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{identityLabel}</p>
            <p className="text-xs text-slate-400 truncate">{identityEmail}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('coat')}
          className={`flex-1 px-4 py-3 min-h-[44px] text-sm font-medium transition-colors ${
            activeTab === 'coat'
              ? 'bg-slate-800 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Coat of Arms
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex-1 px-4 py-3 min-h-[44px] text-sm font-medium transition-colors ${
            activeTab === 'keys'
              ? 'bg-slate-800 text-white border-b-2 border-green-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Crypto Keys
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`flex-1 px-4 py-3 min-h-[44px] text-sm font-medium transition-colors ${
            activeTab === 'addons'
              ? 'bg-slate-800 text-white border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          Addons
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Coat of Arms Tab */}
        {activeTab === 'coat' && (
          <div className="space-y-4">
            {/* Coat of Arms Display */}
            <div className="flex justify-center">
              <div className="relative">
                {coatOfArms ? (
                  <CoatOfArmsRenderer
                    coatOfArms={coatOfArms}
                    size={180}
                    showMarkers={true}
                  />
                ) : (
                  <div className="w-44 h-52 bg-slate-800 rounded flex items-center justify-center text-slate-500">
                    Loading...
                  </div>
                )}
              </div>
            </div>

            {/* Blazon Description */}
            {blazon && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-amber-400 mb-1">Heraldic Blazon</h4>
                <p className="text-xs text-slate-300 italic">{blazon}</p>
              </div>
            )}

            {/* Coat Details */}
            {coatOfArms && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-2">Shield Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-400">Division:</span>
                    <span className="text-white ml-1 capitalize">{coatOfArms.division.replace('-', ' ')}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-400">Field:</span>
                    <span className="text-white ml-1 capitalize">{coatOfArms.field}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-400">Generation:</span>
                    <span className="text-white ml-1">{coatOfArms.generation}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-400">Charges:</span>
                    <span className="text-white ml-1">{coatOfArms.charges.length}</span>
                  </div>
                </div>

                {/* Charges List */}
                {coatOfArms.charges.length > 0 && (
                  <div className="mt-2">
                    <span className="text-slate-400 text-xs">Charges: </span>
                    <span className="text-amber-300 text-xs">
                      {coatOfArms.charges.map(c => c.charge).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Regenerate Button */}
            <button
              onClick={regenerateCoatOfArms}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm py-2 px-4 rounded-lg transition-colors"
            >
              Regenerate Coat of Arms
            </button>

            <p className="text-xs text-slate-500 text-center">
              Your coat of arms is a unique heraldic identifier for your pet lineage
            </p>
          </div>
        )}

        {/* Crypto Keys Tab */}
        {activeTab === 'keys' && (
          <CryptoKeyDisplay showPrivate={true} />
        )}

        {/* Addons Tab */}
        {activeTab === 'addons' && (
          <div className="space-y-4">
            {/* Edit Mode Toggle */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Addon Edit Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Enable to drag and reposition addons on your pet
                  </p>
                </div>
                <button
                  onClick={() => onEditModeChange?.(!editMode)}
                  className={`relative w-20 h-11 rounded-full transition-colors ${
                    editMode ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
                  aria-pressed={editMode}
                >
                  <div
                    className={`absolute top-1 left-1 h-9 w-9 rounded-full bg-white transition-transform ${
                      editMode ? 'translate-x-9' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Edit Mode Info */}
            {editMode && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Edit Mode Active</h4>
                <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
                  <li>Hover over addons to see controls</li>
                  <li>Drag addons to reposition them</li>
                  <li>Click the lock icon to fix position</li>
                  <li>Click reset to return to default position</li>
                </ul>
              </div>
            )}

            {/* Quick Links */}
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Manage your addons from the Inventory panel</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🎩</div>
                  <div className="text-xs text-slate-300">Headwear</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">⚔️</div>
                  <div className="text-xs text-slate-300">Weapon</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">✨</div>
                  <div className="text-xs text-slate-300">Aura</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🐾</div>
                  <div className="text-xs text-slate-300">Companion</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default PetProfilePanel;

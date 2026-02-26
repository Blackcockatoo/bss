/**
 * Addon Inventory Panel - UI for managing addons
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAddonStore } from '@/lib/addons';
import type { Addon } from '@/lib/addons';

export const AddonInventoryPanel: React.FC = () => {
  const { addons, equipped, equipAddon, unequipAddon, getAddonsByCategory } =
    useAddonStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);

  const categories = ['all', 'headwear', 'weapon', 'accessory', 'aura', 'companion', 'effect'];

  const displayedAddons =
    selectedCategory === 'all'
      ? Object.values(addons)
      : getAddonsByCategory(selectedCategory);

  const handleEquip = (addon: Addon) => {
    const success = equipAddon(addon.id);
    if (success) {
      console.log(`Equipped ${addon.name}`);
    }
  };

  const handleUnequip = (addon: Addon) => {
    unequipAddon(addon.category as keyof typeof equipped);
    console.log(`Unequipped ${addon.name}`);
  };

  const isEquipped = (addonId: string) => {
    return Object.values(equipped).includes(addonId);
  };

  return (
    <div className="addon-inventory-panel bg-slate-900/90 border border-slate-700 rounded-lg p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Addon Inventory</h2>
        <p className="text-sm text-slate-400">
          {Object.keys(addons).length} addon{Object.keys(addons).length !== 1 ? 's' : ''} owned
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Addon Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {displayedAddons.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            equipped={isEquipped(addon.id)}
            onClick={() => setSelectedAddon(addon)}
            onEquip={() => handleEquip(addon)}
            onUnequip={() => handleUnequip(addon)}
          />
        ))}
      </div>

      {/* Empty State */}
      {displayedAddons.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>No addons in this category</p>
        </div>
      )}

      {/* Selected Addon Detail */}
      {selectedAddon && (
        <AddonDetailModal
          addon={selectedAddon}
          equipped={isEquipped(selectedAddon.id)}
          onClose={() => setSelectedAddon(null)}
          onEquip={() => handleEquip(selectedAddon)}
          onUnequip={() => handleUnequip(selectedAddon)}
        />
      )}
    </div>
  );
};

interface AddonCardProps {
  addon: Addon;
  equipped: boolean;
  onClick: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}

const AddonCard: React.FC<AddonCardProps> = ({
  addon,
  equipped,
  onClick,
  onEquip,
  onUnequip,
}) => {
  const rarityColors = {
    common: 'from-slate-600 to-slate-700',
    uncommon: 'from-green-600 to-green-700',
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-orange-600 to-orange-700',
    mythic: 'from-pink-600 to-pink-700',
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
        equipped ? 'ring-2 ring-yellow-400' : ''
      }`}
      onClick={onClick}
    >
      <div
        className={`bg-gradient-to-br ${rarityColors[addon.rarity]} p-3 aspect-square flex flex-col items-center justify-center`}
      >
        {/* Icon Preview */}
        <div className="w-12 h-12 mb-2">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path
              d={addon.visual.svgPath || 'M 50 50 m -25 0 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0'}
              fill={addon.visual.colors.primary}
              stroke={addon.visual.colors.accent}
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Name */}
        <p className="text-xs text-white font-medium text-center leading-snug break-words">
          {addon.name}
        </p>
      </div>

      {/* Equipped Badge */}
      {equipped && (
        <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
          ✓
        </div>
      )}

      {/* Rarity Badge */}
      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
        {addon.rarity}
      </div>
    </div>
  );
};

interface AddonDetailModalProps {
  addon: Addon;
  equipped: boolean;
  onClose: () => void;
  onEquip: () => void;
  onUnequip: () => void;
}

const AddonDetailModal: React.FC<AddonDetailModalProps> = ({
  addon,
  equipped,
  onClose,
  onEquip,
  onUnequip,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{addon.name}</h3>
            <p className="text-sm text-slate-400 capitalize">
              {addon.rarity} {addon.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview */}
        <div className="mb-4 aspect-square bg-slate-800 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
            <path
              d={addon.visual.svgPath || 'M 50 50 m -25 0 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0'}
              fill={addon.visual.colors.primary}
              stroke={addon.visual.colors.accent}
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Description */}
        <p className="text-slate-300 text-sm mb-4">{addon.description}</p>

        {/* Modifiers */}
        {addon.modifiers && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-2">Stat Bonuses:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(addon.modifiers).map(([stat, value]) => (
                <div key={stat} className="bg-slate-800 rounded px-3 py-1.5">
                  <span className="text-slate-400 text-xs capitalize">{stat}:</span>
                  <span className="text-green-400 text-sm font-bold ml-1">+{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edition Info */}
        {addon.metadata.edition && (
          <div className="mb-4 text-xs text-slate-400">
            Edition {addon.metadata.edition}
            {addon.metadata.maxEditions && ` of ${addon.metadata.maxEditions}`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {equipped ? (
            <button
              onClick={() => {
                onUnequip();
                onClose();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Unequip
            </button>
          ) : (
            <button
              onClick={() => {
                onEquip();
                onClose();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Equip
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

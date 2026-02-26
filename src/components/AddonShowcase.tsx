/**
 * AddonShowcase - Displays and manages all equipped addons on the pet
 * Integrates Aura, Companion, Effect, and Accessory addons
 */

'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Addon, AddonInventory } from '@/lib/addons';
import { CelestialAura, createCelestialAura } from './addons/CelestialAura';
import { SpiritCompanion, createSpiritCompanion, SpiritType } from './addons/SpiritCompanion';
import { AmbientEffect, createAmbientEffect, EffectType } from './addons/AmbientEffect';
import { WearableAccessory, createWearableAccessory, AccessoryType } from './addons/WearableAccessory';
import { AddonSVGDefs } from './addons/AddonRenderer';
import type { Vitals } from '@/vitals';

interface AddonShowcaseProps {
  petPosition?: { x: number; y: number };
  animationPhase?: number;
  consciousness?: number;
  vitals?: Vitals;
  petMood?: 'happy' | 'neutral' | 'tired' | 'excited';
  equippedAddons?: {
    aura?: { variant: 'azure' | 'golden' | 'violet' | 'emerald' };
    companion?: { type: SpiritType };
    effect?: { type: EffectType };
    accessory?: { type: AccessoryType };
  };
  showDemoAddons?: boolean;
}

export const AddonShowcase: React.FC<AddonShowcaseProps> = ({
  petPosition = { x: 200, y: 210 },
  animationPhase = 0,
  consciousness = 70,
  vitals,
  petMood = 'happy',
  equippedAddons,
  showDemoAddons = false,
}) => {
  // Demo mode toggles
  const [demoAura, setDemoAura] = useState<'azure' | 'golden' | 'violet' | 'emerald' | null>(showDemoAddons ? 'azure' : null);
  const [demoCompanion, setDemoCompanion] = useState<SpiritType | null>(showDemoAddons ? 'wisp' : null);
  const [demoEffect, setDemoEffect] = useState<EffectType | null>(showDemoAddons ? 'sparkle' : null);
  const [demoAccessory, setDemoAccessory] = useState<AccessoryType | null>(showDemoAddons ? 'crown' : null);

  // Determine which addons to show
  const activeAura = equippedAddons?.aura?.variant ?? demoAura;
  const activeCompanion = equippedAddons?.companion?.type ?? demoCompanion;
  const activeEffect = equippedAddons?.effect?.type ?? demoEffect;
  const activeAccessory = equippedAddons?.accessory?.type ?? demoAccessory;

  // Create addon definitions
  const auraAddon = useMemo(() => {
    if (!activeAura) return null;
    return createCelestialAura(activeAura) as Addon;
  }, [activeAura]);

  const companionAddon = useMemo(() => {
    if (!activeCompanion) return null;
    return createSpiritCompanion(activeCompanion) as Addon;
  }, [activeCompanion]);

  const effectAddon = useMemo(() => {
    if (!activeEffect) return null;
    return createAmbientEffect(activeEffect) as Addon;
  }, [activeEffect]);

  const accessoryAddon = useMemo(() => {
    if (!activeAccessory) return null;
    return createWearableAccessory(activeAccessory) as Addon;
  }, [activeAccessory]);

  // Calculate intensity based on vitals
  const effectIntensity = useMemo(() => {
    if (!vitals) return 0.8;
    const wellbeing = (
      (100 - vitals.hunger) +
      vitals.hygiene +
      vitals.mood +
      vitals.energy
    ) / 400;
    return 0.4 + wellbeing * 0.6;
  }, [vitals]);

  return (
    <g className="addon-showcase">
      {/* SVG Definitions for addon effects */}
      <AddonSVGDefs />

      {/* Layer 1: Aura (behind pet) */}
      <AnimatePresence>
        {auraAddon && (
          <motion.g
            key="aura"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CelestialAura
              addon={auraAddon}
              petPosition={petPosition}
              animationPhase={animationPhase}
              consciousness={consciousness}
              mood={petMood}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Layer 2: Effects (around pet) */}
      <AnimatePresence>
        {effectAddon && (
          <motion.g
            key="effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AmbientEffect
              addon={effectAddon}
              effectType={activeEffect!}
              petPosition={petPosition}
              animationPhase={animationPhase}
              intensity={effectIntensity}
              petMood={petMood}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Layer 3: Accessory (on pet) */}
      <AnimatePresence>
        {accessoryAddon && (
          <motion.g
            key="accessory"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <WearableAccessory
              addon={accessoryAddon}
              accessoryType={activeAccessory!}
              petPosition={petPosition}
              animationPhase={animationPhase}
              petMood={petMood}
            />
          </motion.g>
        )}
      </AnimatePresence>

      {/* Layer 4: Companion (beside pet) */}
      <AnimatePresence>
        {companionAddon && (
          <motion.g
            key="companion"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5 }}
          >
            <SpiritCompanion
              addon={companionAddon}
              spiritType={activeCompanion!}
              petPosition={petPosition}
              animationPhase={animationPhase}
              petMood={petMood}
              isInteracting={petMood === 'excited'}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
};

// ============================================================================
// Addon Control Panel UI
// ============================================================================

interface AddonControlPanelProps {
  onAuraChange: (variant: 'azure' | 'golden' | 'violet' | 'emerald' | null) => void;
  onCompanionChange: (type: SpiritType | null) => void;
  onEffectChange: (type: EffectType | null) => void;
  onAccessoryChange: (type: AccessoryType | null) => void;
  currentAura: string | null;
  currentCompanion: string | null;
  currentEffect: string | null;
  currentAccessory: string | null;
}

export const AddonControlPanel: React.FC<AddonControlPanelProps> = ({
  onAuraChange,
  onCompanionChange,
  onEffectChange,
  onAccessoryChange,
  currentAura,
  currentCompanion,
  currentEffect,
  currentAccessory,
}) => {
  const auraOptions: Array<'azure' | 'golden' | 'violet' | 'emerald'> = ['azure', 'golden', 'violet', 'emerald'];
  const companionOptions: SpiritType[] = ['wisp', 'sprite', 'phoenix', 'dragon', 'fairy', 'starling'];
  const effectOptions: EffectType[] = ['sparkle', 'firefly', 'bubble', 'petal', 'snowflake', 'stardust', 'ember', 'crystal'];
  const accessoryOptions: AccessoryType[] = ['crown', 'scarf', 'glasses', 'pendant', 'bow', 'halo', 'collar', 'cape'];

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: '#9ca3af',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#f59e0b',
      mythic: '#ef4444',
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="addon-control-panel bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-white mb-4">Customize Addons</h3>

      {/* Aura Selection */}
      <div className="mb-4">
        <div className="text-sm text-slate-300 mb-2 flex items-center gap-2">
          <span>✨</span>
          <span>Aura</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAuraChange(null)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              !currentAura ? 'bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            None
          </button>
          {auraOptions.map((option) => (
            <button
              key={option}
              onClick={() => onAuraChange(option)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                currentAura === option ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Companion Selection */}
      <div className="mb-4">
        <div className="text-sm text-slate-300 mb-2 flex items-center gap-2">
          <span>🐾</span>
          <span>Companion</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCompanionChange(null)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              !currentCompanion ? 'bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            None
          </button>
          {companionOptions.map((option) => (
            <button
              key={option}
              onClick={() => onCompanionChange(option)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                currentCompanion === option ? 'bg-green-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Effect Selection */}
      <div className="mb-4">
        <div className="text-sm text-slate-300 mb-2 flex items-center gap-2">
          <span>🌟</span>
          <span>Effect</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEffectChange(null)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              !currentEffect ? 'bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            None
          </button>
          {effectOptions.map((option) => (
            <button
              key={option}
              onClick={() => onEffectChange(option)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                currentEffect === option ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Accessory Selection */}
      <div className="mb-2">
        <div className="text-sm text-slate-300 mb-2 flex items-center gap-2">
          <span>👑</span>
          <span>Accessory</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onAccessoryChange(null)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              !currentAccessory ? 'bg-slate-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            None
          </button>
          {accessoryOptions.map((option) => (
            <button
              key={option}
              onClick={() => onAccessoryChange(option)}
              className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
                currentAccessory === option ? 'bg-amber-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddonShowcase;

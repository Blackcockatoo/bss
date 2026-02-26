'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from './ui/button';
import { Sparkles, Crown, Eye, Zap } from 'lucide-react';
import {
  COSMETICS_CATALOG,
  getCosmeticsByCategory,
  checkUnlockConditions,
  type Cosmetic,
} from '@/lib/cosmetics';

const CATEGORY_ICONS = {
  accessory: Crown,
  aura: Sparkles,
  pattern: Eye,
  effect: Zap,
};

const RARITY_COLORS = {
  common: 'text-zinc-400 border-zinc-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-amber-400 border-amber-600',
};

export function CosmeticsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<Cosmetic['category']>('accessory');
  const evolution = useStore(s => s.evolution);
  const battle = useStore(s => s.battle);
  const vimana = useStore(s => s.vimana);
  const miniGames = useStore(s => s.miniGames);

  // Mock breeding state (should be in store)
  const breeding = { offspringCount: 0 };

  const unlockedIds = checkUnlockConditions({
    evolution,
    battle,
    vimana: {
      ...vimana,
      totalSamples: 0,
      anomaliesResolved: vimana.anomaliesResolved || 0,
    },
    miniGames: {
      totalPlays: 0,
    },
    breeding,
  });

  const cosmetics = getCosmeticsByCategory(selectedCategory).map(cosmetic => ({
    ...cosmetic,
    unlocked: unlockedIds.includes(cosmetic.id),
  }));

  const categories: Cosmetic['category'][] = ['accessory', 'aura', 'pattern', 'effect'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            Cosmetics Collection
          </h2>
          <p className="text-xs text-zinc-500">
            Customize your pet with items earned through gameplay
          </p>
        </div>
        <div className="text-xs text-zinc-400 text-right">
          <p>
            Unlocked: <span className="text-emerald-300 font-semibold">{unlockedIds.length}</span>
            /{COSMETICS_CATALOG.length}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {categories.map(category => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="capitalize"
            >
              <Icon className="w-4 h-4 mr-1" />
              {category}
            </Button>
          );
        })}
      </div>

      {/* Cosmetics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cosmetics.map(cosmetic => (
          <div
            key={cosmetic.id}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${cosmetic.unlocked ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-60'}
              ${RARITY_COLORS[cosmetic.rarity]}
            `}
          >
            {/* Rarity Badge */}
            <div
              className={`
                absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                ${cosmetic.rarity === 'legendary' ? 'bg-amber-500/20' : ''}
                ${cosmetic.rarity === 'epic' ? 'bg-purple-500/20' : ''}
                ${cosmetic.rarity === 'rare' ? 'bg-blue-500/20' : ''}
                ${cosmetic.rarity === 'common' ? 'bg-zinc-500/20' : ''}
              `}
            >
              {cosmetic.rarity}
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <div
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${cosmetic.unlocked ? 'bg-zinc-700/60' : 'bg-zinc-800/40'}
                `}
              >
                {cosmetic.unlocked ? (
                  <Sparkles className="w-8 h-8" style={{ color: cosmetic.visualData.color }} />
                ) : (
                  <div className="w-8 h-8 rounded bg-zinc-600/40" />
                )}
              </div>
            </div>

            {/* Name & Description */}
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-sm text-white">{cosmetic.name}</h3>
              <p className="text-xs text-zinc-400 line-clamp-2">{cosmetic.description}</p>
            </div>

            {/* Unlock Condition */}
            {!cosmetic.unlocked && (
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-[10px] text-zinc-500 text-center">
                  🔒 {cosmetic.unlockCondition}
                </p>
              </div>
            )}

            {/* Equip Button */}
            {cosmetic.unlocked && (
              <div className="mt-3">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Equip
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

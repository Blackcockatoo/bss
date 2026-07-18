'use client';

import { useStore } from '@/lib/store';
import { useAddonStore } from '@/lib/addons';
import { ACHIEVEMENT_REWARDS, useAchievementRewardsSync } from '@/lib/addons/achievementRewards';
import { Lock, Sparkles } from 'lucide-react';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-zinc-400 border-zinc-600',
  uncommon: 'text-emerald-400 border-emerald-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-amber-400 border-amber-600',
  mythic: 'text-fuchsia-400 border-fuchsia-600',
};

/**
 * Achievement Rewards - shows the real, gameplay-earned wardrobe items
 * (owned/equipped items live in AddonInventoryPanel; this is where players
 * see what's still locked and why).
 */
export function CosmeticsPanel() {
  useAchievementRewardsSync();

  const addons = useAddonStore((state) => state.addons);
  const ownedIds = Object.values(addons).map((addon) => addon.id);
  const isOwned = (templateId: string) =>
    ownedIds.some((id) => id.startsWith(templateId));

  const unlockedCount = ACHIEVEMENT_REWARDS.filter((reward) =>
    isOwned(reward.template.id),
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            Achievement Rewards
          </h2>
          <p className="text-xs text-zinc-500">
            Real wardrobe items, earned through gameplay. Unlocked items
            become owned addons — equip them from your Wardrobe inventory.
          </p>
        </div>
        <div className="text-xs text-zinc-400 text-right">
          <p>
            Unlocked:{' '}
            <span className="text-emerald-300 font-semibold">{unlockedCount}</span>
            /{ACHIEVEMENT_REWARDS.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ACHIEVEMENT_REWARDS.map((reward) => {
          const unlocked = isOwned(reward.template.id);
          const { template } = reward;
          return (
            <div
              key={template.id}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${unlocked ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-60'}
                ${RARITY_COLORS[template.rarity] ?? RARITY_COLORS.common}
              `}
            >
              <div
                className={`
                  absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                  ${template.rarity === 'legendary' ? 'bg-amber-500/20' : ''}
                  ${template.rarity === 'epic' ? 'bg-purple-500/20' : ''}
                  ${template.rarity === 'rare' ? 'bg-blue-500/20' : ''}
                  ${template.rarity === 'uncommon' ? 'bg-emerald-500/20' : ''}
                  ${template.rarity === 'mythic' ? 'bg-fuchsia-500/20' : ''}
                  ${template.rarity === 'common' ? 'bg-zinc-500/20' : ''}
                `}
              >
                {template.rarity}
              </div>

              <div className="flex justify-center mb-3">
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${unlocked ? 'bg-zinc-700/60' : 'bg-zinc-800/40'}
                  `}
                >
                  {unlocked ? (
                    <Sparkles
                      className="w-8 h-8"
                      style={{ color: template.visual.colors.primary }}
                    />
                  ) : (
                    <Lock className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-semibold text-sm text-white">{template.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {template.description}
                </p>
              </div>

              {!unlocked && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <p className="text-[10px] text-zinc-500 text-center">
                    🔒 {reward.condition}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

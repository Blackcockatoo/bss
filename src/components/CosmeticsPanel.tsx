'use client';

/**
 * Wardrobe panel: the player-facing view of the unified wardrobe.
 *
 * Everything shown here is real state — ownership from the persistent
 * wardrobe inventory, progress from the persistent MetaPetProgress record,
 * verified add-ons from the crypto add-on store. There are no mocked
 * counters, and the Equip button performs an actual, persisted equip that
 * renders on the live pet.
 */

import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { BadgeCheck, Crown, Eye, Lock, Sparkles, Zap } from 'lucide-react';
import { useAddonStore } from '@/lib/addons/store';
import { addonToUnifiedEntry } from '@/lib/wardrobe/adapter';
import { WARDROBE_CATALOG, describeUnlockCondition } from '@/lib/wardrobe/catalog';
import { evaluateCondition } from '@/lib/wardrobe/unlockEvaluator';
import { useWardrobeProgressionStore } from '@/lib/wardrobe/store';
import type { UnlockCondition, WardrobeItem, WardrobeSlot } from '@/lib/wardrobe/types';

type PanelCategory = 'accessory' | 'aura' | 'pattern' | 'effect' | 'verified';

/** Legacy display grouping preserved so the panel's tabs stay familiar. */
const CATEGORY_SLOTS: Record<Exclude<PanelCategory, 'verified'>, WardrobeSlot[]> = {
  accessory: ['head', 'face', 'horns', 'back', 'wings', 'held'],
  aura: ['aura', 'environment'],
  pattern: ['bodyPattern'],
  effect: ['trail'],
};

const CATEGORY_ICONS: Record<PanelCategory, typeof Crown> = {
  accessory: Crown,
  aura: Sparkles,
  pattern: Eye,
  effect: Zap,
  verified: BadgeCheck,
};

const RARITY_COLORS = {
  common: 'text-zinc-400 border-zinc-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-amber-400 border-amber-600',
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** "31 / 50 battle wins"-style progress line, generated from the condition. */
function describeProgress(
  condition: UnlockCondition,
  progressValue: number,
  target: number,
): string | null {
  switch (condition.type) {
    case 'battle_wins':
      return `${progressValue} / ${target} battle wins`;
    case 'vimana_samples':
      return `${progressValue} / ${target} Vimana samples`;
    case 'vimana_cells':
    case 'vimana_all_cells':
      return `${progressValue} / ${target} cells explored`;
    case 'offspring_count':
      return `${progressValue} / ${target} offspring`;
    case 'minigames_completed':
      return `${progressValue} / ${target} sessions completed`;
    case 'achievement_set':
      return `${progressValue} / ${target} achievements earned`;
    case 'sustained_stat':
      return `Best duration: ${formatDuration(progressValue)} / ${formatDuration(target)}`;
    default:
      return null;
  }
}

export function CosmeticsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<PanelCategory>('accessory');

  const progress = useWardrobeProgressionStore((s) => s.progress);
  const inventory = useWardrobeProgressionStore((s) => s.inventory);
  const equipWardrobeItem = useWardrobeProgressionStore((s) => s.equipWardrobeItem);
  const unequipWardrobeSlot = useWardrobeProgressionStore((s) => s.unequipWardrobeSlot);

  const addons = useAddonStore((s) => s.addons);
  const addonEquipped = useAddonStore((s) => s.equipped);
  const equipAddon = useAddonStore((s) => s.equipAddon);
  const unequipAddon = useAddonStore((s) => s.unequipAddon);

  const ownedCount = inventory.ownedItemIds.length;
  const newlyUnlocked = inventory.newlyUnlockedItemIds;

  const cosmeticCards = useMemo(() => {
    if (selectedCategory === 'verified') return [];
    const slots = CATEGORY_SLOTS[selectedCategory];
    return WARDROBE_CATALOG.filter((item) => slots.includes(item.category)).map((item) => {
      const owned = inventory.ownedItemIds.includes(item.id);
      const equipped = inventory.equippedBySlot[item.category] === item.id;
      const evaluation = evaluateCondition(item.unlockCondition, progress);
      return {
        item,
        owned,
        equipped,
        isNew: newlyUnlocked.includes(item.id),
        progressText: owned
          ? null
          : describeProgress(item.unlockCondition, evaluation.progress, evaluation.target),
      };
    });
  }, [selectedCategory, inventory, progress, newlyUnlocked]);

  const verifiedEntries = useMemo(
    () =>
      Object.values(addons).map((addon) =>
        addonToUnifiedEntry(addon, {
          equipped: Object.values(addonEquipped).includes(addon.id),
        }),
      ),
    [addons, addonEquipped],
  );

  const categories: PanelCategory[] = ['accessory', 'aura', 'pattern', 'effect', 'verified'];

  const handleToggleEquip = (card: { item: WardrobeItem; equipped: boolean }) => {
    if (card.equipped) {
      unequipWardrobeSlot(card.item.category);
    } else {
      equipWardrobeItem(card.item.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            Wardrobe
          </h2>
          <p className="text-xs text-zinc-500">
            Items earned through play — equipped pieces appear on your live pet
          </p>
        </div>
        <div className="text-xs text-zinc-400 text-right">
          <p>
            Owned: <span className="text-emerald-300 font-semibold">{ownedCount}</span>
            /{WARDROBE_CATALOG.length}
          </p>
          {verifiedEntries.length > 0 && (
            <p className="text-cyan-300/80">{verifiedEntries.length} verified add-ons</p>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              className="capitalize min-h-9"
            >
              <Icon className="w-4 h-4 mr-1" />
              {category}
            </Button>
          );
        })}
      </div>

      {selectedCategory === 'verified' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {verifiedEntries.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-zinc-500">
              No verified add-ons in this inventory yet.
            </p>
          )}
          {verifiedEntries.map((entry) => (
            <div
              key={entry.id}
              className={`relative p-4 rounded-lg border-2 bg-zinc-800/60 ${RARITY_COLORS[entry.rarity]}`}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                <BadgeCheck className="h-3 w-3" /> VERIFIED
              </div>
              <div className="text-center space-y-1 pt-4">
                <h3 className="font-semibold text-sm text-white">{entry.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{entry.description}</p>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  slot: {entry.slot} · transferable
                </p>
              </div>
              <div className="mt-3">
                {entry.equipped ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-amber-500 text-amber-200"
                    onClick={() => {
                      const addon = addons[entry.id];
                      if (addon) unequipAddon(addon.equipSlot ?? addon.category);
                    }}
                  >
                    Unequip
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => equipAddon(entry.id)}
                  >
                    Equip
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {cosmeticCards.map(({ item, owned, equipped, isNew, progressText }) => (
            <div
              key={item.id}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${owned ? 'bg-zinc-800/60' : 'bg-zinc-900/40 opacity-70'}
                ${equipped ? 'ring-2 ring-amber-400/70' : ''}
                ${RARITY_COLORS[item.rarity]}
              `}
            >
              {isNew && (
                <div className="absolute top-2 left-2 rounded bg-fuchsia-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                  NEW
                </div>
              )}
              <div
                className={`
                  absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                  ${item.rarity === 'legendary' ? 'bg-amber-500/20' : ''}
                  ${item.rarity === 'epic' ? 'bg-purple-500/20' : ''}
                  ${item.rarity === 'rare' ? 'bg-blue-500/20' : ''}
                  ${item.rarity === 'common' ? 'bg-zinc-500/20' : ''}
                `}
              >
                {item.rarity}
              </div>

              <div className="flex justify-center mb-3 pt-3">
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${owned ? 'bg-zinc-700/60' : 'bg-zinc-800/40'}
                  `}
                >
                  {owned ? (
                    <Sparkles className="w-8 h-8" style={{ color: item.visualData.color }} />
                  ) : (
                    <Lock className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-semibold text-sm text-white">{item.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
              </div>

              {!owned && (
                <div className="mt-3 pt-3 border-t border-zinc-700 space-y-1 text-center">
                  <p className="text-[10px] text-zinc-500">
                    🔒 {describeUnlockCondition(item.unlockCondition)}
                  </p>
                  {progressText && (
                    <p className="text-[10px] font-semibold text-cyan-300/90">{progressText}</p>
                  )}
                </div>
              )}

              {owned && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={equipped ? 'default' : 'outline'}
                    className={`w-full text-xs min-h-9 ${equipped ? 'bg-amber-500/80 text-amber-950 hover:bg-amber-500' : ''}`}
                    onClick={() => handleToggleEquip({ item, equipped })}
                  >
                    {equipped ? 'Unequip' : 'Equip'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

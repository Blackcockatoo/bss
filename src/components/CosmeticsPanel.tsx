'use client';

/**
 * CosmeticsPanel — the unified Meta-Pet wardrobe.
 *
 * Shows gameplay cosmetics and crypto-verified add-ons in one inventory:
 * locked items with live requirement progress (generated from structured
 * unlock conditions), owned items with real Equip/Unequip actions, and the
 * currently equipped set that renders on the live pet.
 */

import { useAddonStore } from '@/lib/addons';
import {
  WARDROBE_CATALOG_SIZE,
  buildAddonEntries,
  buildCosmeticEntries,
  useWardrobeProgressStore,
  useWardrobeStore,
  type WardrobeEntry,
  type WardrobeSlot,
} from '@/lib/wardrobe';
import { Crown, Eye, Lock, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './ui/button';

type WardrobeTab = 'accessories' | 'auras' | 'patterns' | 'effects' | 'addons';

const TAB_SLOTS: Record<Exclude<WardrobeTab, 'addons'>, WardrobeSlot[]> = {
  accessories: ['head', 'horns', 'face', 'held'],
  auras: ['aura'],
  patterns: ['bodyPattern', 'wings', 'back', 'environment'],
  effects: ['trail'],
};

const TABS: Array<{ id: WardrobeTab; label: string; icon: typeof Crown }> = [
  { id: 'accessories', label: 'Accessories', icon: Crown },
  { id: 'auras', label: 'Auras', icon: Sparkles },
  { id: 'patterns', label: 'Patterns', icon: Eye },
  { id: 'effects', label: 'Effects', icon: Zap },
  { id: 'addons', label: 'Verified', icon: ShieldCheck },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'text-zinc-400 border-zinc-600',
  uncommon: 'text-emerald-400 border-emerald-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-amber-400 border-amber-600',
  mythic: 'text-rose-400 border-rose-600',
};

function EntryPreview({ entry }: { entry: WardrobeEntry }) {
  if (entry.hidden) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900/70">
        <Lock className="h-7 w-7 text-zinc-600" />
      </div>
    );
  }

  const svgPath = entry.item?.visualData.svgPath;
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-full ${
        entry.status === 'locked' ? 'bg-zinc-800/40' : 'bg-zinc-700/60'
      }`}
    >
      {svgPath ? (
        <svg viewBox="-32 -32 64 64" className="h-12 w-12">
          <path
            d={svgPath}
            fill={entry.previewColor}
            stroke={entry.item?.visualData.secondaryColor ?? entry.previewColor}
            strokeWidth="1"
            opacity={entry.status === 'locked' ? 0.45 : 1}
          />
        </svg>
      ) : (
        <Sparkles
          className="h-8 w-8"
          style={{
            color: entry.previewColor,
            opacity: entry.status === 'locked' ? 0.45 : 1,
          }}
        />
      )}
    </div>
  );
}

export function CosmeticsPanel() {
  const [activeTab, setActiveTab] = useState<WardrobeTab>('accessories');

  const ownedItemIds = useWardrobeStore((state) => state.ownedItemIds);
  const equippedBySlot = useWardrobeStore((state) => state.equippedBySlot);
  const newlyUnlockedItemIds = useWardrobeStore(
    (state) => state.newlyUnlockedItemIds,
  );
  const equipWardrobeItem = useWardrobeStore((state) => state.equipWardrobeItem);
  const unequipWardrobeSlot = useWardrobeStore(
    (state) => state.unequipWardrobeSlot,
  );
  const progress = useWardrobeProgressStore((state) => state.progress);

  const addons = useAddonStore((state) => state.addons);
  const addonEquipped = useAddonStore((state) => state.equipped);
  const equipAddon = useAddonStore((state) => state.equipAddon);
  const unequipAddon = useAddonStore((state) => state.unequipAddon);

  const cosmeticEntries = useMemo(
    () =>
      buildCosmeticEntries(
        { ownedItemIds, equippedBySlot, newlyUnlockedItemIds },
        progress,
      ),
    [ownedItemIds, equippedBySlot, newlyUnlockedItemIds, progress],
  );

  const addonEntries = useMemo(
    () => buildAddonEntries(addons, addonEquipped),
    [addons, addonEquipped],
  );

  const visibleEntries = useMemo(() => {
    if (activeTab === 'addons') return addonEntries;
    const slots = new Set<WardrobeSlot>(TAB_SLOTS[activeTab]);
    return cosmeticEntries.filter((entry) => slots.has(entry.slot));
  }, [activeTab, addonEntries, cosmeticEntries]);

  const ownedCosmetics = cosmeticEntries.filter(
    (entry) => entry.status !== 'locked',
  ).length;

  const handleEquipToggle = (entry: WardrobeEntry) => {
    if (entry.kind === 'verified-addon') {
      if (!entry.addonCategory) return;
      if (entry.status === 'equipped') unequipAddon(entry.addonCategory);
      else equipAddon(entry.id);
      return;
    }

    if (entry.status === 'equipped') unequipWardrobeSlot(entry.slot);
    else equipWardrobeItem(entry.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Sparkles className="h-5 w-5 text-amber-300" />
            Wardrobe
          </h2>
          <p className="text-xs text-zinc-500">
            Earn, own, and equip — equipped items appear on your Meta-Pet
          </p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p>
            Owned:{' '}
            <span className="font-semibold text-emerald-300">
              {ownedCosmetics}
            </span>
            /{WARDROBE_CATALOG_SIZE}
          </p>
          <p className="text-zinc-500">
            + {addonEntries.length} verified add-on
            {addonEntries.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Slot tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            onClick={() => setActiveTab(id)}
            variant={activeTab === id ? 'default' : 'outline'}
            size="sm"
            className="touch-manipulation"
          >
            <Icon className="mr-1 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visibleEntries.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-zinc-500">
            {activeTab === 'addons'
              ? 'No verified add-ons in this inventory yet.'
              : 'Nothing in this category yet.'}
          </p>
        )}

        {visibleEntries.map((entry) => (
          <div
            key={`${entry.kind}-${entry.id}`}
            data-testid={`wardrobe-card-${entry.id}`}
            className={`relative rounded-lg border-2 p-4 transition-all ${
              entry.status === 'locked'
                ? 'bg-zinc-900/40 opacity-70'
                : 'bg-zinc-800/60'
            } ${entry.status === 'equipped' ? 'ring-2 ring-cyan-400/60' : ''} ${
              RARITY_COLORS[entry.rarity] ?? RARITY_COLORS.common
            }`}
          >
            {/* Rarity + state badges */}
            <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                  entry.rarity === 'legendary' || entry.rarity === 'mythic'
                    ? 'bg-amber-500/20'
                    : entry.rarity === 'epic'
                      ? 'bg-purple-500/20'
                      : entry.rarity === 'rare'
                        ? 'bg-blue-500/20'
                        : 'bg-zinc-500/20'
                }`}
              >
                {entry.rarity}
              </span>
              {entry.transferable && (
                <span className="flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> verified
                </span>
              )}
            </div>

            {entry.newlyUnlocked && (
              <span className="absolute left-2 top-2 rounded bg-cyan-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-200">
                New
              </span>
            )}

            <div className="mb-3 flex justify-center pt-2">
              <EntryPreview entry={entry} />
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-sm font-semibold text-white">
                {entry.hidden ? '???' : entry.name}
              </h3>
              <p className="line-clamp-2 min-h-[2rem] text-xs text-zinc-400">
                {entry.hidden
                  ? 'A presence stirs in the quantum depths…'
                  : entry.description}
              </p>
            </div>

            {entry.status === 'locked' ? (
              <div className="mt-3 space-y-1.5 border-t border-zinc-700 pt-3">
                <p className="text-center text-[10px] text-zinc-500">
                  🔒 {entry.hidden ? 'Hidden discovery' : entry.requirementText}
                </p>
                {!entry.hidden && entry.progressText && (
                  <>
                    <p className="text-center text-[10px] font-medium text-cyan-300/80">
                      {entry.progressText}
                    </p>
                    <div className="h-1 overflow-hidden rounded bg-zinc-800">
                      <div
                        className="h-full rounded bg-cyan-500/70"
                        style={{
                          width: `${Math.round(entry.progressFraction * 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant={entry.status === 'equipped' ? 'default' : 'outline'}
                  className={`w-full touch-manipulation text-xs ${
                    entry.status === 'equipped'
                      ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                      : ''
                  }`}
                  onClick={() => handleEquipToggle(entry)}
                >
                  {entry.status === 'equipped' ? 'Unequip' : 'Equip'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

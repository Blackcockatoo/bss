/**
 * WardrobeUnlockCeremony — compact, queued celebration for newly unlocked
 * wardrobe items.
 *
 * Consumes entries from the persisted newlyUnlockedItemIds queue one at a
 * time (Equip Now / Continue both consume), so an unlock is celebrated
 * exactly once and never replays after refresh.
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  describeUnlockCondition,
  getWardrobeItem,
  useWardrobeStore,
} from '@/lib/wardrobe';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';

const RARITY_STYLES: Record<string, string> = {
  common: 'border-zinc-500/60 text-zinc-300',
  rare: 'border-blue-400/60 text-blue-300',
  epic: 'border-purple-400/60 text-purple-300',
  legendary: 'border-amber-400/60 text-amber-300',
};

export function WardrobeUnlockCeremony() {
  const newlyUnlockedItemIds = useWardrobeStore(
    (state) => state.newlyUnlockedItemIds,
  );
  const consumeNewlyUnlocked = useWardrobeStore(
    (state) => state.consumeNewlyUnlocked,
  );
  const equipWardrobeItem = useWardrobeStore((state) => state.equipWardrobeItem);

  const currentId = newlyUnlockedItemIds[0];
  const item = currentId ? getWardrobeItem(currentId) : undefined;

  // Unknown ids (e.g. from a future catalogue) are consumed silently so the
  // queue can never wedge the ceremony.
  useEffect(() => {
    if (currentId && !item) consumeNewlyUnlocked(currentId);
  }, [currentId, item, consumeNewlyUnlocked]);

  if (!currentId || !item) return null;

  const remaining = newlyUnlockedItemIds.length;

  return (
    <div
      className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-10"
      role="dialog"
      aria-label={`New wardrobe item unlocked: ${item.name}`}
      data-testid="wardrobe-unlock-ceremony"
    >
      <div className="w-full max-w-sm rounded-2xl border border-cyan-400/25 bg-slate-950/95 p-4 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
            {item.visualData.svgPath ? (
              <svg viewBox="-30 -30 60 60" className="h-11 w-11">
                <path
                  d={item.visualData.svgPath}
                  fill={item.visualData.color}
                  stroke={item.visualData.secondaryColor ?? item.visualData.color}
                  strokeWidth="1"
                />
              </svg>
            ) : (
              <Sparkles
                className="h-7 w-7"
                style={{ color: item.visualData.color }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">
              Wardrobe unlocked{remaining > 1 ? ` · ${remaining} new` : ''}
            </p>
            <p className="truncate text-base font-semibold text-white">
              {item.name}
            </p>
            <span
              className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common}`}
            >
              {item.rarity}
            </span>
          </div>
        </div>

        <p className="mt-2 text-xs text-zinc-400">
          {describeUnlockCondition(item.unlockCondition)} — complete.
        </p>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-cyan-600 text-white hover:bg-cyan-500"
            onClick={() => {
              equipWardrobeItem(item.id);
              consumeNewlyUnlocked(item.id);
            }}
          >
            Equip Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-slate-700 text-zinc-200"
            onClick={() => consumeNewlyUnlocked(item.id)}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

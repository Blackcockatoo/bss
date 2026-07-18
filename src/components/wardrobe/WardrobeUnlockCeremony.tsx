"use client";

/**
 * Unlock ceremony: a compact, queue-consuming event shown once per newly
 * unlocked wardrobe item.
 *
 * Reads the head of `inventory.newlyUnlockedItemIds`; both actions consume
 * the entry through the store (which persists), so a refresh can never
 * replay a ceremony. Multiple simultaneous unlocks queue naturally — the
 * next head renders after the current one is consumed.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { describeUnlockCondition, getWardrobeItemById } from "@/lib/wardrobe/catalog";
import { useWardrobeProgressionStore } from "@/lib/wardrobe/store";

const RARITY_LABELS = {
  common: "text-zinc-300",
  rare: "text-blue-300",
  epic: "text-purple-300",
  legendary: "text-amber-300",
};

export function WardrobeUnlockCeremony() {
  const queue = useWardrobeProgressionStore((s) => s.inventory.newlyUnlockedItemIds);
  const consumeNewlyUnlocked = useWardrobeProgressionStore((s) => s.consumeNewlyUnlocked);
  const equipWardrobeItem = useWardrobeProgressionStore((s) => s.equipWardrobeItem);

  // Ids with no catalogue entry (stale save) are consumed silently in an
  // effect — never during render — so the queue can't wedge.
  const staleId = queue.find((id) => getWardrobeItemById(id) === undefined);
  useEffect(() => {
    if (staleId) consumeNewlyUnlocked(staleId);
  }, [staleId, consumeNewlyUnlocked]);

  const currentId = queue.find((id) => getWardrobeItemById(id) !== undefined);
  const item = currentId ? getWardrobeItemById(currentId) : undefined;
  if (!item) return null;

  const remaining = queue.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={`New wardrobe item unlocked: ${item.name}`}
      >
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl border border-cyan-800/60 bg-[radial-gradient(circle_at_top,_rgba(8,47,73,0.55),_rgba(2,6,23,0.98)_75%)] p-6 text-center shadow-2xl"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
            Wardrobe unlocked
          </p>

          <div className="mx-auto mt-4 flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80">
            <Sparkles className="h-9 w-9" style={{ color: item.visualData.color }} />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-white">{item.name}</h2>
          <p className={`mt-1 text-xs font-bold uppercase tracking-wider ${RARITY_LABELS[item.rarity]}`}>
            {item.rarity}
          </p>
          <p className="mt-2 text-sm text-zinc-300">{item.description}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Earned: {describeUnlockCondition(item.unlockCondition)}
          </p>
          {remaining > 0 && (
            <p className="mt-2 text-[11px] text-cyan-300/70">
              +{remaining} more unlock{remaining === 1 ? "" : "s"} waiting
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                equipWardrobeItem(item.id);
                consumeNewlyUnlocked(item.id);
              }}
              className="min-h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Equip Now
            </button>
            <button
              type="button"
              onClick={() => consumeNewlyUnlocked(item.id)}
              className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

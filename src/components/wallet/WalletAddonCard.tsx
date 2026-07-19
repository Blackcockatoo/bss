"use client";

import { Check, LockKeyhole, Plus, Shirt, X } from "lucide-react";
import type { Addon } from "@/lib/addons/types";
import type { AddonTradeability } from "@/lib/wallet/types";

const RARITY_STYLE: Record<Addon["rarity"], string> = {
  common: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  uncommon: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  rare: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  epic: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  legendary: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  mythic: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200",
};

export function WalletAddonCard({
  addon,
  tradeability,
  selected,
  onToggle,
}: {
  addon: Addon;
  tradeability: AddonTradeability;
  selected: boolean;
  onToggle: (addonId: string) => void;
}) {
  const equipped = tradeability.reason === "equipped";
  const locked = tradeability.reason === "locked";

  return (
    <article
      className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-slate-950/70 transition ${
        selected
          ? "border-cyan-300/70 shadow-lg shadow-cyan-950/40"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-slate-800 bg-[radial-gradient(circle_at_top,#164e6330,#020617)]">
        {addon.visual.previewAsset ? (
          <img
            src={addon.visual.previewAsset}
            alt={addon.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="h-full w-full p-7">
            <path
              d={
                addon.visual.svgPath ||
                "M 50 18 A 32 32 0 1 1 49.99 18 M 50 28 L 72 68 L 28 68 Z"
              }
              fill={addon.visual.colors.primary}
              stroke={addon.visual.colors.accent ?? "#a5f3fc"}
              strokeWidth="2"
            />
          </svg>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${RARITY_STYLE[addon.rarity]}`}
        >
          {addon.rarity}
        </span>
        {selected && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-cyan-300 text-slate-950 shadow-lg">
            <Check className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-white">
            {addon.name}
          </h3>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            {addon.category}
            {addon.metadata.edition
              ? ` · edition ${addon.metadata.edition}${
                  addon.metadata.maxEditions
                    ? `/${addon.metadata.maxEditions}`
                    : ""
                }`
              : ""}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span
            className={`inline-flex min-w-0 items-center gap-1 text-[10px] ${
              tradeability.tradeable ? "text-emerald-300" : "text-slate-400"
            }`}
          >
            {locked ? (
              <LockKeyhole className="h-3 w-3 shrink-0" />
            ) : equipped ? (
              <Shirt className="h-3 w-3 shrink-0" />
            ) : (
              <Check className="h-3 w-3 shrink-0" />
            )}
            <span className="truncate">{tradeability.label}</span>
          </span>
          <button
            type="button"
            onClick={() => onToggle(addon.id)}
            disabled={!tradeability.tradeable && !selected}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
              selected
                ? "border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                : "border-cyan-400/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600"
            }`}
            aria-label={
              selected
                ? `Remove ${addon.name} from trade`
                : `Add ${addon.name} to trade`
            }
          >
            {selected ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
